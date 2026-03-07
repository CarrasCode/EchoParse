from collections.abc import AsyncGenerator
from typing import Annotated

from arq import ArqRedis
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import SessionLocal
from ..core.redis import get_redis_pool


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()


async def get_arq() -> AsyncGenerator[ArqRedis, None]:
    pool = await get_redis_pool()
    try:
        yield pool
    finally:
        await pool.close()


ArqDep = Annotated[ArqRedis, Depends(get_arq)]
SessionDep = Annotated[AsyncSession, Depends(get_db)]
