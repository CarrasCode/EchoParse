import uuid

from ...api.dependencies import SessionDep
from .models import TranscriptionJob


async def create_transcription_bd(id: uuid.UUID, db: SessionDep, file_name: str, file_path: str):
    new_trascription = TranscriptionJob(id=id, filename=file_name, file_path=file_path)

    db.add(new_trascription)
    await db.flush()
    await db.refresh(new_trascription)
    return new_trascription
