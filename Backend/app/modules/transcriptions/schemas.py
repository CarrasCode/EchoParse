import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from .models import StatusTranscription


class TranscriptionReturn(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    filename: str
    created_at: datetime.datetime
    status: StatusTranscription


class TranscriptionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    filename: str
    status: StatusTranscription
    transcript: str | None
    created_at: datetime.datetime


class TranscriptionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")
    status: StatusTranscription
    id: uuid.UUID | None = None
    transcript: str | None = None
    progress: float | None = None
    new_text: str | None = None


class PaginatedTranscriptions(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    items: list[TranscriptionDetail]
    total: int
    limit: int
    offset: int
