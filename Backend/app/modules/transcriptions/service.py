from ...api.dependencies import SessionDep
from .models import TranscriptionJob


async def create_transcription_bd(db: SessionDep, file_name: str, file_path: str):
    new_trascription = TranscriptionJob(filename=file_name, file_path=file_path)

    db.add(new_trascription)
    await db.commit()
    await db.refresh(new_trascription)
    return new_trascription
