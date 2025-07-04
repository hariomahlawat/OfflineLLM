########################  builder  ########################
FROM python:3.11-slim AS builder
WORKDIR /build

COPY requirements.lock .
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
 && pip install --upgrade pip \
 && pip download -d wheelhouse -r requirements.lock \
 && apt-get purge -y build-essential && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

########################  runtime  ########################
FROM python:3.11-slim
WORKDIR /app

COPY requirements.lock .
COPY --from=builder /build/wheelhouse /wheelhouse
RUN pip install --no-index --find-links=/wheelhouse -r requirements.lock 

# copy the script FIRST …
COPY docker/entrypoint.sh /app/entrypoint.sh

# … then in the SAME RUN do chmod + add user + chown
RUN chmod +x /app/entrypoint.sh \
 && useradd -m llm \
 && chown -R llm /app


USER llm

COPY app/ /app/app

ENV CHROMA_DIR=/data/chroma \
    OLLAMA_BASE_URL=http://ollama:11434 \
    PYTHONUNBUFFERED=1

ENTRYPOINT ["bash", "/app/entrypoint.sh"]
EXPOSE 8000
