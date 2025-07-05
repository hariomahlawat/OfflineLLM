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

# ---------------- runtime deps ----------------
COPY requirements.lock .
COPY --from=builder /build/wheelhouse /wheelhouse
RUN pip install --no-index --find-links=/wheelhouse -r requirements.lock

# ---------------- entrypoint & util -----------
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh \
 && apt-get update && apt-get install -y --no-install-recommends gosu \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -m llm && chown -R llm /app      # create the unprivileged user

# -----------  runtime env --------------------
ENV CHROMA_DIR=/data/chroma \
    OLLAMA_BASE_URL=http://ollama:11434 \
    PYTHONUNBUFFERED=1

COPY app/ /app/app 

# ❶ **Do NOT switch to llm here** – we need root during entrypoint.sh
# USER llm

ENTRYPOINT ["bash", "/app/entrypoint.sh"]
EXPOSE 8000
