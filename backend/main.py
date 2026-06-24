from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import agent, billing, tasks


settings = get_settings()
app = FastAPI(
    title="TaskFlow AI API",
    docs_url=None if settings.app_env == "production" else "/docs",
    redoc_url=None if settings.app_env == "production" else "/redoc",
)
allowed_origins = {settings.frontend_origin.rstrip("/")}
if settings.app_env == "development":
    allowed_origins.update({"http://localhost:3000", "http://127.0.0.1:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(tasks.router)
app.include_router(agent.router)
app.include_router(billing.router)
