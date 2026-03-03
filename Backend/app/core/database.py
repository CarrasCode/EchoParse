from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from .config import settings

engine = create_async_engine(settings.postgres_url)
SessionLocal = async_sessionmaker(autoflush=False, bind=engine)
