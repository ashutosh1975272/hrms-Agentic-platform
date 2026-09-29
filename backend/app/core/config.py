from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from the environment.

    Secrets are never hardcoded here; production values are injected via
    environment variables or a local, git-ignored ``.env`` file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Agentic HRMS API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    api_compat_prefix: str = "/api"
    database_url: str = "sqlite:///./hrms.db"

    # DEV DEFAULT ONLY: this key is public and must never protect a real
    # deployment. Set SECRET_KEY via the environment in every other setting.
    secret_key: str = "dev-only-insecure-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    bcrypt_rounds: int = 12


@lru_cache
def get_settings() -> Settings:
    return Settings()
