import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from .models import TranscriptionJob


async def create_transcription_bd(id: uuid.UUID, db: AsyncSession, file_name: str, file_path: str):
    new_trascription = TranscriptionJob(id=id, filename=file_name, file_path=file_path)

    db.add(new_trascription)
    await db.flush()
    await db.refresh(new_trascription)
    return new_trascription


async def get_transcription_bd(id: uuid.UUID, bd: AsyncSession):
    transcription = await bd.get(TranscriptionJob, id)
    return transcription
