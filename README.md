# TaskFlow AI

AI task-planning SaaS built with Next.js, FastAPI, Supabase, Gemini, and Stripe.

## Production Architecture

- Frontend: deploy `frontend/` to Vercel or another Node.js host.
- Backend: deploy `backend/` with its `Dockerfile` or `Procfile`.
- Database and authentication: Supabase.
- Billing: Stripe subscriptions and webhooks.

The frontend and backend must be deployed separately because only `frontend/`
currently contains a Git repository.

## 1. Supabase

Run `supabase/schema.sql` in the production Supabase SQL editor. Rerun it when
upgrading an existing project; it adds:

- Row-level security policies
- Realtime publications
- Profile creation on signup
- Query indexes
- Atomic monthly free-plan quota enforcement and reset

In Supabase Authentication URL settings, configure:

- Site URL: your production frontend URL
- Redirect URL: `https://your-frontend-domain/auth/callback`

## 2. Backend

Deploy the `backend/` directory. The included production commands are:

```text
Procfile: uvicorn main:app --host 0.0.0.0 --port $PORT
Dockerfile: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set these backend environment variables:

```env
APP_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_ORIGIN=https://your-frontend-domain
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

Verify:

```text
GET https://your-backend-domain/health
```

Production API documentation is disabled.

## 3. Stripe

Create the product and recurring price in Stripe live mode. Test and live mode
have separate keys, products, prices, customers, and webhook secrets.

Create a production webhook endpoint:

```text
https://your-backend-domain/webhooks/stripe
```

Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

## 4. Frontend

Deploy the `frontend/` directory and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://your-backend-domain
```

These `NEXT_PUBLIC_*` values are embedded at build time, so redeploy after
changing them.

## Verification

Before release:

```powershell
cd frontend
npm ci
npm run lint
npm run build

cd ..\backend
python -m pip install -r requirements.txt
python -m pip check
python -m compileall -q .
```

Run one complete production-mode test using test credentials first:

1. Sign up and confirm email.
2. Create five free tasks and verify the sixth is blocked.
3. Complete Stripe Checkout.
4. Confirm the webhook changes the profile to `pro`.
5. Create another task.
6. Cancel the subscription and confirm the profile returns to `free`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or
`STRIPE_SECRET_KEY` to the frontend.
