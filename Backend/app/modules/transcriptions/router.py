import os
import uuid

import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile

from ...api.dependencies import SessionDep
from ...core.config import settings
from ..transcriptions.schemas import TranscriptionReturn
from ..transcriptions.service import create_transcription_bd

router = APIRouter(prefix="/transcriptions", tags=["Transcriptions"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=TranscriptionReturn)
async def create_transcription(file: UploadFile, db: SessionDep):
    max_size = 50 * 1024 * 1024
    longitud = file.size
    type = file.content_type

    if not longitud or longitud > max_size:
        raise HTTPException(status_code=400, detail="File too big")

    if not type or not type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Only audio")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No name found")

    new_id = uuid.uuid4()
    file_location = f"{settings.UPLOAD_DIR}/{new_id}"

    result = await create_transcription_bd(
        id=new_id, db=db, file_name=file.filename, file_path=file_location
    )
    try:
        async with aiofiles.open(file_location, "wb") as out_file:
            while content := await file.read(1024 * 1024):
                _ = await out_file.write(content)

    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo escribir el archivo") from None
    await db.commit()
    return result
