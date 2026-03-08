import asyncio
import typing
import uuid
from typing import Any

from ..core.database import SessionLocal
from ..modules.transcriptions.models import (
    StatusTranscription,
    TranscriptionJob,
)


async def process_audio_task(ctx: dict[str, Any], job_id: uuid.UUID):
    if typing.TYPE_CHECKING:
        import whisper

    model: whisper.Whisper = ctx.get("whisper_model")
    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            print(f"Error: No se encontró el Job {job_id} en la BD")
            return

        job.status = StatusTranscription.PROCESSING
        await db_session.commit()

    try:
        result = await asyncio.to_thread(model.transcribe, job.file_path, language="es")
        transcription_text = str(result.get("text"))
        final_status = StatusTranscription.DONE
    except Exception as e:
        final_status = StatusTranscription.FAIL
        transcription_text = None
        print(f"no se puedo transcribir,{e}")

    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            print(f"Error: No se encontró el Job {job_id} en la BD")
            return
        if transcription_text:
            job.transcript = transcription_text
            job.status = final_status
        await db_session.commit()
