from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api.router import router
from .core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.include_router(router, prefix="/api/v1")
