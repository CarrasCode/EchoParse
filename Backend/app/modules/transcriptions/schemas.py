import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from .models import StatusTranscription


class TranscriptionReturn(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: StatusTranscription


class TranscriptionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    filename: str
    status: StatusTranscription
    transcript: str | None
    created_at: datetime.datetime


class TranscriptionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: StatusTranscription
    transcript: str | None
