FROM python:3.12-alpine

RUN apk add --no-cache gcc musl-dev libffi-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/
COPY crontab /etc/crontabs/root

RUN touch /var/log/scraper.log

CMD ["crond", "-f", "-l", "2"]
