from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application settings, loaded from environment variables / .env.
    See backend/.env.example for the full list of expected variables.
    """

    database_url: str = "postgresql+asyncpg://munshi:munshi@db:5432/munshi"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7

    cors_origins: list[str] = ["http://localhost:3000"]

    seed_demo_data: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
