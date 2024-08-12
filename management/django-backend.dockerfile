FROM python:3-alpine

COPY django-backend /django-backend
COPY management/.env /django-backend/.env
WORKDIR /django-backend
RUN pip install -r requirements.txt

CMD python manage.py migrate && \
    uvicorn openbook.asgi:application --host 0.0.0.0 \
    --port 3000 --workers 8 --lifespan off     
