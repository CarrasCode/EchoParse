import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Text, func
from sqlalchemy.orm import Mapped, mapped_column

from ...core.base import Base


class StatusTranscription(StrEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DONE = "DONE"


class TranscriptionJob(Base):
    __tablename__ = "transcripciones"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column()
    status: Mapped[StatusTranscription] = mapped_column(default=StatusTranscription.PENDING)
    transcript: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    file_path: Mapped[str] = mapped_column(unique=True)
