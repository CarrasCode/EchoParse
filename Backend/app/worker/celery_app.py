from celery import Celery

from ..core import settings

app = Celery("echoparse", broker=settings.broker_url, backend=settings.broker_url)
