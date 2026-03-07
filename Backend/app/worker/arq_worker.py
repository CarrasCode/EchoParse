from collections.abc import Awaitable, Callable, Sequence
from typing import Any

from arq.connections import RedisSettings
from arq.worker import Function

from ..core.config import settings
from .tasks import process_audio_task

AsyncArqTask = Callable[..., Awaitable[Any]]


class WorkerSettings:
    redis_settings: RedisSettings = settings.arq_redis_settings

    functions: Sequence[AsyncArqTask | Function] = [process_audio_task]

    # on_starup: AsyncArqTask
    # on_shutdown:AsyncArqTask
