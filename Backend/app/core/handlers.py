from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .exceptions import RecordNotFoundError


async def record_not_found_handler(request: Request, exc: RecordNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": exc.message},
    )


def setup_exception_handlers(app: FastAPI):
    app.add_exception_handler(RecordNotFoundError, record_not_found_handler)
