from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from oauthlib.oauth2 import OAuth2Error
from starlette.concurrency import run_in_threadpool

from config import get_settings
from dependencies import require_access_token
from models.schemas import (
    DeleteResponse,
    GmailConnectResponse,
    GmailDraftRequest,
    GmailDraftResponse,
    GmailStatusResponse,
)
from services.gmail_service import (
    GmailConfigurationError,
    GmailIntegrationError,
    create_gmail_draft,
    create_oauth_flow,
    decrypt_refresh_token,
    encrypt_refresh_token,
)
from services.supabase_client import SupabaseError, SupabaseRestClient

router = APIRouter(prefix="/integrations/gmail", tags=["integrations"])


def _require_gmail_settings(settings) -> None:
    required = (
        settings.google_client_id,
        settings.google_client_secret,
        settings.integration_encryption_key,
        settings.oauth_state_secret,
    )
    if not all(required):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gmail integration is not configured.",
        )


def _supabase(settings, token: str | None = None) -> SupabaseRestClient:
    return SupabaseRestClient(
        settings.supabase_url,
        settings.supabase_anon_key,
        settings.supabase_service_role_key,
        token,
    )


@router.get("/status", response_model=GmailStatusResponse)
async def gmail_status(
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> GmailStatusResponse:
    if not all(
        (
            settings.google_client_id,
            settings.google_client_secret,
            settings.integration_encryption_key,
            settings.oauth_state_secret,
        )
    ):
        return GmailStatusResponse(configured=False, connected=False)
    user = await _supabase(settings, token).get_user()
    connection = await _supabase(settings).get_gmail_connection(user.id)
    return GmailStatusResponse(
        configured=True,
        connected=connection is not None,
        email=connection.get("email") if connection else None,
    )


@router.post("/connect", response_model=GmailConnectResponse)
async def connect_gmail(
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> GmailConnectResponse:
    _require_gmail_settings(settings)
    user = await _supabase(settings, token).get_user()
    serializer = URLSafeTimedSerializer(settings.oauth_state_secret)
    state = serializer.dumps({"user_id": user.id}, salt="gmail-oauth")
    flow = create_oauth_flow(
        settings.google_client_id,
        settings.google_client_secret,
        settings.google_redirect_uri,
    )
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return GmailConnectResponse(url=url)


@router.get("/callback")
async def gmail_callback(
    code: str = Query(),
    state: str = Query(),
    settings=Depends(get_settings),
):
    _require_gmail_settings(settings)
    serializer = URLSafeTimedSerializer(settings.oauth_state_secret)
    try:
        payload = serializer.loads(state, salt="gmail-oauth", max_age=600)
    except (BadSignature, SignatureExpired) as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state.") from error

    try:
        flow = create_oauth_flow(
            settings.google_client_id,
            settings.google_client_secret,
            settings.google_redirect_uri,
        )
        await run_in_threadpool(flow.fetch_token, code=code)
        credentials = flow.credentials
        if not credentials.refresh_token:
            raise GmailIntegrationError("Google did not return a refresh token.")
        service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
        profile = await run_in_threadpool(service.users().getProfile(userId="me").execute)
        encrypted = encrypt_refresh_token(
            credentials.refresh_token,
            settings.integration_encryption_key,
        )
        await _supabase(settings).upsert_gmail_connection(
            payload["user_id"],
            profile["emailAddress"],
            encrypted,
        )
    except (
        GmailConfigurationError,
        GmailIntegrationError,
        SupabaseError,
        OAuth2Error,
        HttpError,
    ) as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error

    return RedirectResponse(f"{settings.frontend_origin}/dashboard/settings?gmail=connected")


@router.post("/drafts", response_model=GmailDraftResponse)
async def create_draft(
    payload: GmailDraftRequest,
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> GmailDraftResponse:
    _require_gmail_settings(settings)
    supabase = _supabase(settings, token)
    user = await supabase.get_user()
    connection = await _supabase(settings).get_gmail_connection(user.id)
    if not connection:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Connect Gmail first.")

    try:
        refresh_token = decrypt_refresh_token(
            connection["encrypted_refresh_token"],
            settings.integration_encryption_key,
        )
        draft_id = await run_in_threadpool(
            create_gmail_draft,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            refresh_token=refresh_token,
            sender=connection["email"],
            recipient=payload.to,
            subject=payload.subject,
            body=payload.body,
        )
        await supabase.add_activity(user.id, None, f'Gmail draft created for {payload.to}.')
    except (GmailConfigurationError, GmailIntegrationError, SupabaseError) as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
    return GmailDraftResponse(draft_id=draft_id)


@router.delete("", response_model=DeleteResponse)
async def disconnect_gmail(
    token: str = Depends(require_access_token),
    settings=Depends(get_settings),
) -> DeleteResponse:
    _require_gmail_settings(settings)
    user = await _supabase(settings, token).get_user()
    await _supabase(settings).delete_gmail_connection(user.id)
    return DeleteResponse(deleted=True)
