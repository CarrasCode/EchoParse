import asyncio
import uuid
from typing import Any


async def process_audio_task(ctx: dict[str, Any], job_id: uuid.UUID):
    print(f"[{job_id}] 🚀 Iniciando simulación de transcripción...")
    # Ahora sí podemos usar asyncio.sleep (bloqueo no destructivo)
    await asyncio.sleep(10)
    print(f"[{job_id}] ✅ Transcripción simulada completada")
