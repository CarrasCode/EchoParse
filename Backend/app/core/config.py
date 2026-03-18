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

    #  Control de Rendimiento en CPU ---
    WHISPER_CPU_THREADS: int = 4
    WHISPER_NUM_WORKERS: int = 1

    # --- Opciones de Transcripción ---
    WHISPER_VAD_FILTER: bool = True
    WHISPER_BEAM_SIZE: int = 5
    WHISPER_WORD_TIMESTAMPS: bool = False
    WHISPER_CONDITION_ON_PREVIOUS_TEXT: bool = False

    # --- Precisión, Determinismo y Calidad ---
    WHISPER_TEMPERATURE: str = "0.0,0.2,0.4,0.6,0.8,1.0"
    WHISPER_BEST_OF: int = 1
    WHISPER_NO_SPEECH_THRESHOLD: float = 0.6
    WHISPER_COMPRESSION_RATIO_THRESHOLD: float = 2.4
    WHISPER_LOG_PROB_THRESHOLD: float = -1.0
    WHISPER_INITIAL_PROMPT: str | None = None

    # --- VAD (Voice Activity Detection) ---
    WHISPER_VAD_MIN_SILENCE_MS: int = 500
    WHISPER_VAD_SPEECH_PAD_MS: int = 400

    @computed_field
    @property
    def whisper_temperature_tuple(self) -> tuple[float, ...]:
        """Convierte la cadena de temperaturas en una tupla de floats para faster-whisper."""
        return tuple(float(t.strip()) for t in self.WHISPER_TEMPERATURE.split(","))

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
