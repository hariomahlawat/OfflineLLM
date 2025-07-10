# OfflineLLM Deployment Guide (Docker + HTTPS + Nginx + React)

This document walks through setting up and running OfflineLLM using Docker, Nginx, and HTTPS, serving a React frontend and FastAPI backend.

---

## 1. Directory Structure (relative to repo root)

```text
OfflineLLM/
├── offline-llm-ui/           # React frontend
│   ├── dist/                 # Vite build output (after `npm run build`)
│   ├── .env                  # Frontend environment variables
│   └── package.json
├── docker/
│   ├── Dockerfile.frontend   # Frontend Dockerfile
│   ├── Dockerfile.backend    # Backend Dockerfile
│   └── nginx.conf            # Nginx configuration
├── certs/
│   ├── server.crt            # SSL certificate
│   └── server.key            # SSL private key
├── docker-compose.yml
└── data/                     # Persistent data (Chroma, models, etc.)
```

---

## 2. Frontend Environment Variables (`offline-llm-ui/.env`)

```env
VITE_API_URL=/api
```

- Points frontend API calls to the Nginx proxy at `/api`.

---

## 3. Frontend Dockerfile (`docker/Dockerfile.frontend`)

```dockerfile
# Stage 1: build React app
FROM node:20 AS build
WORKDIR /app
COPY ../offline-llm-ui/package*.json ./
RUN npm install
COPY ../offline-llm-ui .
RUN npm run build

# Stage 2: serve with Nginx and HTTPS
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY ../certs /etc/nginx/certs
COPY --from=build /app/dist /usr/share/nginx/html
```

---

## 4. Nginx Configuration (`docker/nginx.conf`)

```nginx
worker_processes 1;
events { worker_connections 1024; }
http {
  include       mime.types;
  default_type  application/octet-stream;

  server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;

    root /usr/share/nginx/html;
    index index.html;

    # Proxy API calls to backend
    location /api/ {
      proxy_pass http://rag-app:8000/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }
  }
}
```

---

## 5. Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    networks:
      - rag-net

  rag-app:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: rag-app
    depends_on:
      - ollama
    volumes:
      - chroma_data:/app/data/chroma
      - chroma_persist:/app/data/chroma_persist
      - ./data/persist:/app/data/persist:ro
      - ./offline_llm_models/cross_encoder:/app/models/cross_encoder:ro
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_HOST=http://ollama:11434
      - LANGCHAIN_ENDPOINT=disabled
      - CHROMA_TELEMETRY=FALSE
      - PERSIST_CHROMA_DIR=/app/data/chroma_persist
    networks:
      - rag-net

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    container_name: offline-llm-frontend
    depends_on:
      - rag-app
    ports:
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs:ro
    networks:
      - rag-net

volumes:
  chroma_data:
  chroma_persist:
  ollama_models:

networks:
  rag-net:
```

---

## 6. Build & Deploy

From the repo root:

```bash
# Rebuild images without cache
docker compose build --no-cache
# Start all services
docker compose up -d
```

---

## 7. Verify

- Browse to [**https://localhost/**](https://localhost/) (accept the self-signed cert).
- Frontend should load without errors.
- All API calls go to `/api` and succeed.

---

## 8. Troubleshooting

- **Blank page / MIME errors**: Confirm `nginx.conf` has correct `root` and `index` directives.
- **API 404s**: Ensure `/api/` proxy in Nginx matches the frontend `VITE_API_URL`.
- **Mixed Content**: Frontend must use `https://` and call `/api` (relative URL).

---

## 9. Update & Rebuild

Whenever you change code:

```bash
docker compose build --no-cache
docker compose up -d
```



# Build backend image
docker build \
  -f docker/Dockerfile.backend \
  -t offlinellm-backend:latest \
  .

# Build frontend image
docker build \
  -f docker/Dockerfile.frontend \
  -t offlinellm-frontend:latest \
  .
