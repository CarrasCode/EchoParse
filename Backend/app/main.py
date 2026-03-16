from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import router
from .core.database import engine
from .core.handlers import setup_exception_handlers

permited_origins = [
    "http://localhost",
    "http://localhost:4200",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
setup_exception_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=permited_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api/v1")
