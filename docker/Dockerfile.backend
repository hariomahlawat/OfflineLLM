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

# ---------- Python deps ----------
COPY requirements.lock .
COPY --from=builder /build/wheelhouse /wheelhouse
RUN pip install --no-index --find-links=/wheelhouse -r requirements.lock

# ---------- entrypoint + utilities ----------
COPY docker/entrypoint.sh /app/entrypoint.sh

# one RUN = fewer layers, easier cache
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends gosu dos2unix; \
    dos2unix /app/entrypoint.sh; \
    chmod +x  /app/entrypoint.sh; \
    useradd -m llm; \
    chown -R llm:llm /app; \
    rm -rf /var/lib/apt/lists/*

# ---------- env ----------
ENV CHROMA_DIR=/data/chroma \
    OLLAMA_BASE_URL=http://ollama:11434 \
    PYTHONUNBUFFERED=1

# code last → better rebuild times while iterating
COPY app/ /app/app

# keep root so entrypoint can chown volumes & then gosu llm
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
EXPOSE 8000
