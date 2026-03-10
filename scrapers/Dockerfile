FROM python:3.12-alpine

RUN apk add --no-cache gcc musl-dev libffi-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

# Default: run the full pipeline (overridden per-service in docker-compose)
CMD ["python", "-m", "src.main"]
