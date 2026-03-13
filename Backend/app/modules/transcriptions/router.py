import json
import os
import uuid
from typing import Annotated

import aiofiles
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import ValidationError

from ...api.dependencies import ArqDep, SessionDep
from ...core.config import settings
from ..transcriptions.schemas import (
    PaginatedTranscriptions,
    TranscriptionDetail,
    TranscriptionReturn,
    TranscriptionUpdate,
)
from ..transcriptions.service import (
    create_transcription_bd,
    get_all_transcriptions_bd,
    get_transcription_bd,
)
from .models import StatusTranscription

router = APIRouter(prefix="/transcriptions", tags=["Transcriptions"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=TranscriptionReturn)
async def create_transcription(file: UploadFile, db: SessionDep, arq: ArqDep):
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
    _ = await arq.enqueue_job("process_audio_task", new_id)
    return result


@router.get("/", response_model=PaginatedTranscriptions)
async def get_all_transcriptions(
    bd: SessionDep,
    limit: Annotated[int, Query(0, ge=1, le=50)] = 10,
    offset: Annotated[int, Query(0, ge=0)] = 0,
):

    transcriptions, count = await get_all_transcriptions_bd(bd, limit, offset)
    transcriptions_list = [TranscriptionDetail.model_validate(t) for t in transcriptions]
    return PaginatedTranscriptions(
        items=transcriptions_list,
        total=count,
        limit=limit,
        offset=offset,
    )


@router.get("/{id}", response_model=TranscriptionDetail)
async def get_transcription(id: uuid.UUID, bd: SessionDep):
    transcription = await get_transcription_bd(id, bd)
    if not transcription:
        raise HTTPException(404, "Transcripcion no encontrada")
    return transcription


@router.websocket("/ws/{ticket_id}")
async def connect_channel(ticket_id: uuid.UUID, websocket: WebSocket, arq: ArqDep):

    await websocket.accept()
    async with arq.pubsub() as pubsub:  # pyright: ignore[reportUnknownMemberType]
        await pubsub.subscribe(  # pyright: ignore[reportUnknownMemberType]
            f"channel:transcription:{ticket_id}"
        )
        while True:
            try:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    raw_response = message.get("data")
                    assert isinstance(raw_response, bytes), (
                        f"Se esperaba bytes, se obtuvo {type(raw_response)}"
                    )

                    raw_response_str = raw_response.decode("utf-8")
                    await websocket.send_text(raw_response_str)
                    transcription_update = TranscriptionUpdate.model_validate_json(raw_response_str)
                    # si el status es done, se cierra la conexion
                    if transcription_update.status in [
                        StatusTranscription.DONE,
                        StatusTranscription.FAIL,
                    ]:
                        await websocket.close(code=1000, reason="Connection finished")
                        break
            except WebSocketDisconnect:
                break
            except ValidationError:
                await websocket.send_text(json.dumps({"status": StatusTranscription.FAIL.value}))
                await websocket.close(code=1002, reason="Invalid data")
                break
            except Exception:
                await websocket.send_text(json.dumps({"status": StatusTranscription.FAIL.value}))
                await websocket.close(code=1011, reason="Internal error")
                break
