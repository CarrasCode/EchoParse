# 🎙️ EchoParse

![Status](https://img.shields.io/badge/Status-Work_in_Progress-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)
![License](https://img.shields.io/badge/License-MIT-green)

> **Tu propia API de transcripción y análisis de audio privada, contenerizada y asíncrona.**

**EchoParse** es una solución de código abierto diseñada para transcribir y analizar archivos de audio (reuniones, podcasts, notas de voz) utilizando el modelo de IA **Whisper** de forma local.

A diferencia de las APIs comerciales que cobran por minuto y requieren enviar tus datos a la nube, EchoParse corre en tu propia infraestructura (o en tu portátil) gracias a **Docker**, garantizando **privacidad total** y **coste cero** por uso.

# Registro de Tareas - WhisperDock

Este documento mantiene el estado global del proyecto.

## Fase 0: Setup y Fundamentos

- [x] Estructura de carpetas del monorepo (`/backend`, `/frontend`).
- [x] Configuración de `.gitignore` (múltiples niveles).
- [x] Gestión de dependencias modernas (`pyproject.toml` con Ruff y pytest).

## Fase 1: Infraestructura Base (Orquestación)

- [x] Crear el `docker-compose.yml` en la raíz.
- [x] Levantar el servicio de base de datos (PostgreSQL).
- [x] Levantar el servicio de colas de mensajes (Redis).
- [x] Crear un `Dockerfile.api` básico y levantar un "Hola Mundo" en FastAPI que se conecte a la BD.

## Fase 2: El Esqueleto de la API (Síncrono)

- [x] Configurar SQLAlchemy 2.0 y crear el modelo de base de datos (Tabla `TranscriptionJob` con estados `PENDING`, `PROCESSING`, etc.).
- [x] Crear el endpoint `POST /api/v1/transcriptions/` usando `UploadFile` de FastAPI.
- [x] Guardar el archivo de audio físicamente en un volumen de Docker.
- [x] Devolver al usuario un ID de seguimiento (Ticket).
- [x] Integrar **Alembic** para migraciones de base de datos (reemplazar `create_all`).
  - [x] Configurar `env.py` asíncrono para funcionar con `asyncpg`.
  - [x] Crear registro centralizado de modelos (`all_models.py`).
  - [x] Inyectar `DATABASE_URL` desde `pydantic-settings` (sin hardcodear).
  - [x] Actualizar `Dockerfile` (`COPY . .`) y `docker-compose.yml` (volume mount completo con protección de `.venv`).

## Fase 3: El Músculo Asíncrono (ARQ + Redis)

- [x] Crear el contenedor del Worker (ARQ) en el `docker-compose.yml`.
- [x] Configurar ARQ en el backend (WorkerSettings y redis pool).
- [x] Hacer que el endpoint de la Fase 2 encole un trabajo (`enqueue_job`) en Redis.
- [x] El Worker debe recoger el mensaje, simular trabajo con `asyncio.sleep(10)` y procesarlo de forma asíncrona.

## Fase 4: El Cerebro (IA - OpenAI Whisper)

- [ ] Ajustar el `Dockerfile` del Worker para instalar dependencias de sistema (FFmpeg).
- [ ] Integrar la librería `openai-whisper` en la tarea de Celery.
- [ ] Procesar el archivo de audio real y guardar el texto generado en la base de datos.
- [ ] Implementar manejo de errores (bloques `try/except`) para que si la IA falla, la BD cambie a estado `FAILED`.

## Fase 5: El Rostro (Frontend e Integración)

- [ ] Crear un endpoint `GET /api/v1/transcriptions/{id}` para consultar el estado.
- [ ] (Opcional) Crear un endpoint de WebSockets para enviar el progreso en tiempo real.
- [ ] Desarrollar el frontend (Angular) que suba el archivo y muestre el texto al terminar.
