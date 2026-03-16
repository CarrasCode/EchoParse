import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.exceptions import RecordNotFoundError
from .models import TranscriptionJob


async def create_transcription_bd(id: uuid.UUID, db: AsyncSession, file_name: str, file_path: str):
    new_trascription = TranscriptionJob(id=id, filename=file_name, file_path=file_path)

    db.add(new_trascription)
    await db.flush()
    await db.refresh(new_trascription)
    return new_trascription


async def get_transcription_bd(id: uuid.UUID, bd: AsyncSession):
    transcription = await bd.get(TranscriptionJob, id)
    if not transcription:
        raise RecordNotFoundError("Transcription not found")
    return transcription


async def delete_transcription_bd(id: uuid.UUID, bd: AsyncSession):
    transcription = await get_transcription_bd(id, bd)
    await bd.delete(transcription)
    await bd.commit()


async def get_all_transcriptions_bd(bd: AsyncSession, limit: int, offset: int):
    transcriptions = await bd.execute(
        select(TranscriptionJob)
        .limit(limit)
        .offset(offset)
        .order_by(TranscriptionJob.created_at.desc())
    )
    count = await bd.execute(select(func.count(TranscriptionJob.id)))
    return transcriptions.scalars().all(), count.scalar_one()
