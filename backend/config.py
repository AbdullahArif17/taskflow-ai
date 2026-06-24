from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: Literal["development", "production"] = "development"
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    frontend_origin: str = "http://localhost:3000"
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_pro_price_id: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.app_env != "production":
            return self

        required = {
            "GEMINI_API_KEY": self.gemini_api_key,
            "STRIPE_SECRET_KEY": self.stripe_secret_key,
            "STRIPE_WEBHOOK_SECRET": self.stripe_webhook_secret,
            "STRIPE_PRO_PRICE_ID": self.stripe_pro_price_id,
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise ValueError(f"Missing production settings: {', '.join(missing)}")
        if "localhost" in self.frontend_origin:
            raise ValueError("FRONTEND_ORIGIN must be a public URL in production.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
