import os

import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile

from ...api.dependencies import SessionDep
from ...core.config import settings

router = APIRouter(prefix="/transcriptions", tags=["Transcriptions"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def create_transcription(file: UploadFile, session: SessionDep):
    max_size = 50 * 1024 * 1024
    longitud = file.size
    type = file.content_type

    if not longitud or longitud > max_size:
        raise HTTPException(status_code=400, detail="File too big")

    if not type or not type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Only audio")
    file_location = f"{settings.UPLOAD_DIR}/{file.filename}"

    async with aiofiles.open(file_location, "wb") as out_file:
        while content := await file.read(1024 * 1024):
            _ = await out_file.write(content)

    return {
        "file_name": file.filename,
        "file_len": longitud,
        "type": type,
        "location": file_location,
    }
