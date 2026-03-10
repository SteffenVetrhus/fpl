FROM python:3.12-alpine

RUN apk add --no-cache gcc musl-dev libffi-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

# Mount your saved HTML files to /app/data:
#   docker run -v ./data:/app/data scraper-fbref
CMD ["python", "-m", "src.main"]
