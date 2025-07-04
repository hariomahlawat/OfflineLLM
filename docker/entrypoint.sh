# #!/usr/bin/env bash
# exec uvicorn app.api:app --host 0.0.0.0 --port 8000 --workers $(nproc)

# docker/entrypoint.sh
#!/usr/bin/env bash
exec uvicorn app.api:app --host 0.0.0.0 --port 8000 --workers 1
