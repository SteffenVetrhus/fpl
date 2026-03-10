FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgtk-3-0 libasound2t64 libx11-xcb1 \
        xvfb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m camoufox fetch

COPY src/ src/

CMD ["python", "-m", "src.main"]
