# SSL Certificate

The `server.crt` and `server.key` files bundled in this repository are **example certificates** for development and testing only. They should not be used in production.

For a real deployment, generate a fresh self‑signed certificate:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt
```

Place the resulting `server.crt` and `server.key` under the `certs/` directory before building the Docker images or starting Nginx.
