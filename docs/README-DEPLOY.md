# OfflineLLM Docker HTTPS Deploy

1. Put your backend code in `/app` and React UI in `/offline-llm-ui`
2. Build certs: (see certs/README.md)
3. Run: `docker-compose up --build`
4. Access UI at `https://localhost` (accept browser warning for self-signed cert)
5. Backend API at `http://localhost:8000`

See `docker/nginx.conf` for HTTPS UI config.
