from pathlib import Path

from arq.connections import RedisSettings
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    REDIS_PASSWORD: str
    REDIS_HOST: str = "cache"
    REDIS_PORT: int = 6379
    UPLOAD_DIR: str = f"{BASE_DIR}/data/audios"
    MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500MB
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    @computed_field
    @property
    def postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @computed_field
    @property
    def arq_redis_settings(self) -> RedisSettings:
        return RedisSettings(
            host=self.REDIS_HOST,
            port=self.REDIS_PORT,
            password=self.REDIS_PASSWORD,
            database=0,
        )


settings = Settings()  # pyright: ignore[reportCallIssue]
