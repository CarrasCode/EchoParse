from pathlib import Path
from typing import Literal

from arq.connections import RedisSettings
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")
    # --- Bases de Datos y Caché ---
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

    # --- Configuración Base de Whisper ---
    WHISPER_MODEL: Literal[
        "tiny", "base", "small", "medium", "large-v1", "large-v2", "large-v3", "turbo"
    ] = "turbo"
    WHISPER_LANGUAGE: str | None = "es"
    WHISPER_DEVICE: Literal["cpu", "cuda", "auto"] = "auto"
    WHISPER_COMPUTE_TYPE: Literal[
        "default", "auto", "int8", "int8_float16", "int16", "float16", "float32"
    ] = "int8"

    # --- NUEVO: Control de Rendimiento en CPU ---
    WHISPER_CPU_THREADS: int = 4
    WHISPER_NUM_WORKERS: int = 1

    # --- NUEVO: Opciones de Transcripción (Optimizadas para velocidad) ---
    WHISPER_VAD_FILTER: bool = True
    WHISPER_BEAM_SIZE: int = 5
    WHISPER_WORD_TIMESTAMPS: bool = False
    WHISPER_CONDITION_ON_PREVIOUS_TEXT: bool = True

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
