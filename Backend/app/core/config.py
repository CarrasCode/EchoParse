from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    UPLOAD_DIR: str = f"{BASE_DIR}/data/audios"

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    @computed_field
    @property
    def postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()  # pyright: ignore[reportCallIssue]
