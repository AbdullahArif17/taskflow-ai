import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from starlette.concurrency import run_in_threadpool

from config import get_settings
from dependencies import require_access_token
from models.schemas import CheckoutSessionResponse
from services.supabase_client import SupabaseError, SupabaseRestClient

router = APIRouter(tags=["billing"])


def _require_stripe_settings(settings) -> None:
    if not settings.stripe_secret_key or not settings.stripe_pro_price_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe checkout is not configured.",
        )


@router.get("/billing/health")
async def billing_health() -> dict[str, str]:
    return {"status": "ready"}


@router.post("/billing/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> CheckoutSessionResponse:
    _require_stripe_settings(settings)
    supabase = SupabaseRestClient(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_service_role_key,
        token,
    )

    try:
        user = await supabase.get_user()
        profile = await supabase.get_or_create_profile(user)
    except SupabaseError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error))

    if profile.get("plan") == "pro":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account is already on the Pro plan.",
        )

    try:
        stripe.api_key = settings.stripe_secret_key
        customer_id = profile.get("stripe_customer_id")

        if not customer_id:
            customer = await run_in_threadpool(
                stripe.Customer.create,
                email=user.email,
                metadata={"user_id": user.id},
            )
            customer_id = customer.id
            await supabase.update_profile_billing(user.id, stripe_customer_id=customer_id)

        session = await run_in_threadpool(
            stripe.checkout.Session.create,
            mode="subscription",
            customer=customer_id,
            client_reference_id=user.id,
            line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
            success_url=f"{settings.frontend_origin}/dashboard/billing?checkout=success",
            cancel_url=f"{settings.frontend_origin}/dashboard/billing?checkout=cancelled",
            metadata={"user_id": user.id},
            subscription_data={"metadata": {"user_id": user.id}},
        )
    except stripe.StripeError as error:
        detail = getattr(error, "user_message", None) or "Stripe checkout could not be started."
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from error

    if not session.url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe did not return a checkout URL.",
        )

    return CheckoutSessionResponse(url=session.url)


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    settings=Depends(get_settings),
) -> dict[str, bool]:
    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook is not configured.",
        )
    if not stripe_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature.")

    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload.") from error
    except stripe.SignatureVerificationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature.") from error

    supabase = SupabaseRestClient(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_service_role_key,
    )

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id") or session.get("metadata", {}).get("user_id")
        customer_id = session.get("customer")
        if user_id and customer_id:
            await supabase.update_profile_billing(user_id, plan="pro", stripe_customer_id=customer_id)

    if event["type"] in {"customer.subscription.updated", "customer.subscription.deleted"}:
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        if customer_id:
            profile = await supabase.get_profile_by_stripe_customer(customer_id)
            if profile:
                active_statuses = {"active", "trialing"}
                plan = "pro" if subscription.get("status") in active_statuses else "free"
                await supabase.update_profile_billing(profile["id"], plan=plan)

    return {"received": True}
