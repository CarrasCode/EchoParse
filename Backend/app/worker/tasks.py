from __future__ import annotations

import asyncio
import json
import logging
import os
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
    logger.info(f"Iniciando transcripción en hilo: {file_path}")
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

        segments, info = model.transcribe(
            file_path,
            language=settings.WHISPER_LANGUAGE,
            vad_filter=settings.WHISPER_VAD_FILTER,
            beam_size=settings.WHISPER_BEAM_SIZE,
            word_timestamps=settings.WHISPER_WORD_TIMESTAMPS,
            condition_on_previous_text=settings.WHISPER_CONDITION_ON_PREVIOUS_TEXT,
            temperature=settings.whisper_temperature_tuple,
            best_of=settings.WHISPER_BEST_OF,
            no_speech_threshold=settings.WHISPER_NO_SPEECH_THRESHOLD,
            compression_ratio_threshold=settings.WHISPER_COMPRESSION_RATIO_THRESHOLD,
            log_prob_threshold=settings.WHISPER_LOG_PROB_THRESHOLD,
            initial_prompt=settings.WHISPER_INITIAL_PROMPT,
            vad_parameters={
                "min_silence_duration_ms": settings.WHISPER_VAD_MIN_SILENCE_MS,
                "speech_pad_ms": settings.WHISPER_VAD_SPEECH_PAD_MS,
            },
        )

        logger.info("Transcripción iniciada, procesando segmentos...")

        transcript_parts: list[str] = []

        for segment in segments:
            segment_text = segment.text.strip()
            transcript_parts.append(segment_text)

            # Calcular progreso (máx 99.9% hasta finalizar)
            progress = min(round((segment.end / info.duration) * 100, 2), 99.9)

            msg = {"progress": progress, "new_text": segment_text}
            _ = asyncio.run_coroutine_threadsafe(queue.put(msg), loop)

        transcript_text = " ".join(transcript_parts)

        logger.info("Transcripción finalizada")
        _ = asyncio.run_coroutine_threadsafe(
            queue.put({"text": transcript_text, "done": True}), loop
        )

    except Exception as e:
        logger.error(f"Error en hilo de transcripción: {e}")
        _ = asyncio.run_coroutine_threadsafe(queue.put(None), loop)
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
        # Lanzar tarea en hilo separado como tarea de fondo
        worker_coro = asyncio.to_thread(
            transcribe_audio_sync,
            typing.cast("WhisperModel", model),
            job.file_path,
            loop,
            queue,
        )
        worker = asyncio.create_task(worker_coro)

        while True:
            try:
                # Usar wait_for para evitar bloqueos eternos si el worker muere
                data = await asyncio.wait_for(queue.get(), timeout=2.0)

                if data is None:
                    break

                if data.get("done"):
                    transcription_text = data.get("text")
                    break

                # Publicar progreso + texto incremental
                await redis.publish(
                    f"channel:transcription:{job_id}",
                    json.dumps(
                        {
                            "status": StatusTranscription.PROCESSING.value,
                            "id": str(job_id),
                            "progress": data.get("progress"),
                            "new_text": data.get("new_text"),
                        }
                    ),
                )
            except TimeoutError:
                if worker.done():
                    logger.error(f"El worker terminó inesperadamente para el job {job_id}")
                    break

        await (
            worker
        )  # Esperar a que termine realmente la corrutina y propagar excepciones si las hubo

        final_status = StatusTranscription.DONE if transcription_text else StatusTranscription.FAIL
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
            json.dumps(
                {
                    "status": job.status.value,
                    "id": str(job_id),
                    "transcript": job.transcript,
                }
            ),
        )
