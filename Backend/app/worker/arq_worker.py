from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from arq.connections import RedisSettings
from arq.worker import Function

from ..core.config import settings
from .tasks import process_audio_task

AsyncArqTask = Callable[..., Awaitable[Any]]


async def startup(ctx: dict[str, Any]):
    # Import local: solo se ejecuta cuando se llama a esta función (en el Worker)
    import whisper

    model = whisper.load_model("base")
    ctx["whisper_model"] = model


class WorkerSettings:
    redis_settings: RedisSettings = settings.arq_redis_settings

    functions: Sequence[AsyncArqTask | Function] = [process_audio_task]

    on_startup: AsyncArqTask = startup
    # on_shutdown:AsyncArqTask
