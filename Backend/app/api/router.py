from fastapi import APIRouter

from ..modules.transcriptions.router import router as transcriptions_router

router = APIRouter()

router.include_router(transcriptions_router)


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "EchoParse API is running"}
