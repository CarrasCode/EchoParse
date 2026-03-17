from __future__ import annotations

import asyncio
import json
import logging
import typing
import uuid
from typing import Any

from arq.connections import ArqRedis

from ..core.config import settings
from ..core.database import SessionLocal
from ..modules.transcriptions.models import (
    StatusTranscription,
    TranscriptionJob,
)

if typing.TYPE_CHECKING:
    from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


# Wrapper para transcribir audio enviando progreso a una cola
def transcribe_audio_sync(
    model: WhisperModel,
    file_path: str,
    loop: asyncio.AbstractEventLoop,
    queue: asyncio.Queue[dict[str, Any] | None],
):
    try:
        segments, info = model.transcribe(
            file_path,
            language=settings.WHISPER_LANGUAGE,
            vad_filter=settings.WHISPER_VAD_FILTER,
            beam_size=settings.WHISPER_BEAM_SIZE,
            word_timestamps=settings.WHISPER_WORD_TIMESTAMPS,
            condition_on_previous_text=settings.WHISPER_CONDITION_ON_PREVIOUS_TEXT,
        )

        for segment in segments:
            # Calcular progreso
            progress = (segment.end / info.duration) * 100

            # Poner el texto y el progreso en la cola
            _ = asyncio.run_coroutine_threadsafe(
                queue.put({"text": segment.text, "progress": round(progress, 2)}), loop
            )

        # Avisar que finalizó
        asyncio.run_coroutine_threadsafe(queue.put(None), loop)

    except Exception as e:
        logger.error(f"Error en hilo de transcripción: {e}")
        asyncio.run_coroutine_threadsafe(queue.put(None), loop)
        raise e


async def process_audio_task(ctx: dict[str, Any], job_id: uuid.UUID):
    model = ctx.get("whisper_model")
    assert model is not None, "Whisper model not initialized"
    redis = ctx.get("redis")
    assert isinstance(redis, ArqRedis)

    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            logger.error(f"No se encontró el Job {job_id} en la BD")
            return

        job.status = StatusTranscription.PROCESSING
        await db_session.commit()
        await redis.publish(
            f"channel:transcription:{job_id}",
            json.dumps({"status": job.status, "id": str(job_id)}),
        )

    transcription_text: str | None = None
    final_status: StatusTranscription = StatusTranscription.FAIL

    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    try:
        # Lanzar tarea en hilo separado
        worker = asyncio.to_thread(
            transcribe_audio_sync,
            typing.cast("WhisperModel", model),
            job.file_path,
            loop,
            queue,
        )

        transcript_parts = []

        while True:
            data = await queue.get()
            if data is None:
                break

            transcript_parts.append(data["text"])

            # Publicar progreso y texto parcial
            logger.info(f"Publishing to redis: channel:transcription:{job_id} data: {data}")
            await redis.publish(
                f"channel:transcription:{job_id}",
                json.dumps(
                    {
                        "status": StatusTranscription.PROCESSING,
                        "id": str(job_id),
                        "progress": data["progress"],
                        "new_text": data["text"],
                    }
                ),
            )

        await worker  # Esperar a que termine realmente la corrutina

        transcription_text = "".join(transcript_parts)
        final_status = StatusTranscription.DONE
    except Exception as e:
        logger.error(f"No se pudo transcribir el archivo {job_id}: {e}")

    async with SessionLocal() as db_session:
        job = await db_session.get(TranscriptionJob, job_id)
        if not job:
            logger.error(f"No se encontró el Job {job_id} en la BD")
            return

        if final_status == StatusTranscription.DONE:
            job.transcript = transcription_text

        job.status = final_status
        await db_session.commit()

        await redis.publish(
            f"channel:transcription:{job_id}",
            json.dumps({"status": job.status, "id": str(job_id), "transcript": job.transcript}),
        )
