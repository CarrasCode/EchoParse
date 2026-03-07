from arq import create_pool

from .config import settings


async def get_redis_pool():
    return await create_pool(settings.arq_redis_settings)
