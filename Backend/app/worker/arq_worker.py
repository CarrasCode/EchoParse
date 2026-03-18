import logging
import sys
from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from arq.connections import RedisSettings
from arq.worker import Function

from ..core.config import settings
from .tasks import process_audio_task

AsyncArqTask = Callable[..., Awaitable[Any]]


async def startup(ctx: dict[str, Any]):
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
        force=True,
    )
    logger = logging.getLogger(__name__)
    logger.info("Iniciando Worker y cargando modelo Whisper...")

    # Import local: solo se ejecuta cuando se llama a esta función (en el Worker)
    from faster_whisper import WhisperModel

    model = WhisperModel(
        model_size_or_path=settings.WHISPER_MODEL,
        device=settings.WHISPER_DEVICE,
        compute_type=settings.WHISPER_COMPUTE_TYPE,
        cpu_threads=settings.WHISPER_CPU_THREADS,
        num_workers=settings.WHISPER_NUM_WORKERS,
    )
    ctx["whisper_model"] = model
    logger.info("Modelo Whisper cargado exitosamente.")


class WorkerSettings:
    redis_settings: RedisSettings = settings.arq_redis_settings
    job_timeout = 1800

    functions: Sequence[AsyncArqTask | Function] = [process_audio_task]

    on_startup: AsyncArqTask = startup
    # on_shutdown:AsyncArqTask
