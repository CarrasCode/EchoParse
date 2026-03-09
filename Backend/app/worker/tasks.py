import asyncio
import json
import logging
import typing
import uuid
from typing import Any

from arq.connections import ArqRedis

from ..core.database import SessionLocal
from ..modules.transcriptions.models import (
    StatusTranscription,
    TranscriptionJob,
)

if typing.TYPE_CHECKING:
    import whisper

logger = logging.getLogger(__name__)


# Wrapper para transcribir audio
def transcribe_audio(model: whisper.Whisper, file_path: str, lang: str) -> str:
    result = model.transcribe(file_path, language=lang)
    assert isinstance(result, dict)
    text = result.get("text")
    assert isinstance(text, str)
    return text


async def process_audio_task(ctx: dict[str, Any], job_id: uuid.UUID):
    model = ctx.get("whisper_model")
    assert isinstance(model, whisper.Whisper)
    redis = ctx.get("redis")
    assert isinstance(redis, ArqRedis)

    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            logger.error(f"No se encontró el Job {job_id} en la BD")
            return

        job.status = StatusTranscription.PROCESSING
        await db_session.commit()
        await redis.publish(f"channel:transcription:{job_id}", json.dumps({"status": job.status}))

    transcription_text: str | None = None
    final_status: StatusTranscription = StatusTranscription.FAIL
    try:
        transcription_text = await asyncio.to_thread(transcribe_audio, model, job.file_path, "es")
        final_status = StatusTranscription.DONE
    except Exception as e:
        logger.error(f"No se pudo transcribir el archivo {job_id}: {e}")

    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            logger.error(f"No se encontró el Job {job_id} en la BD")
            return
        job.transcript = transcription_text
        job.status = final_status
        await db_session.commit()
        await redis.publish(
            f"channel:transcription:{job_id}",
            json.dumps({"status": job.status, "transcript": job.transcript}),
        )
