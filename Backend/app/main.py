from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api.router import router
from .core import Base
from .core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.include_router(router, prefix="/api/v1")
