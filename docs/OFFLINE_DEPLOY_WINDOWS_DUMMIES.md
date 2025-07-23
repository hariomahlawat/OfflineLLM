# Offline Deployment Guide for Dummies (Windows Server)

This guide explains how to deploy **OfflineLLM** on a Windows Server machine without internet access. It assumes you have a separate computer with internet to prepare all files first.

---

## 1. Prepare on an online PC

1. Install **Docker Desktop** and **Git** on any Windows PC that has internet access.
2. Clone this repository:
   ```powershell
   git clone https://github.com/your-org/OfflineLLM.git
   cd OfflineLLM
   ```
3. Build all Docker images and pull models:
   ```powershell
   docker compose build
   docker compose up -d ollama
   ollama pull llama3:8b-instruct-q3_K_L
   ollama pull nomic-embed-text
   docker compose down
   ```
4. Save the images and models for transfer:
   ```powershell
   docker save ollama/ollama:latest offlinellm-rag-app:latest offlinellm-frontend:latest -o offline_stack.tar

   docker run --rm -v ollama_models:/models -v ${PWD}:/backup busybox tar cf /backup/ollama_models.tar /models
   ```
5. Copy `offline_stack.tar`, `ollama_models.tar`, the `offline_llm_models` folder and the `data` folder to your offline Windows Server (USB drive, etc.).

---

## 2. Install Docker on Windows Server

1. Log in to the offline server with an administrator account.
2. Run the Docker Desktop installer you copied over and complete the installation.
3. Start Docker Desktop once to finish setup. Ensure "WSL 2 based engine" is enabled if prompted.

Possible hurdles:
- **Virtualization disabled** – enable it in BIOS/UEFI if Docker refuses to start.
- **Corporate policy blocks installation** – you might need admin approval.

---

## 3. Load images and models

Open **PowerShell** and run:
```powershell
cd C:\path\to\OfflineLLM
docker load -i .\offline_stack.tar
docker volume create ollama_models
docker run --rm -v ollama_models:/models -v ${PWD}:/backup busybox tar xf /backup/ollama_models.tar -C /
```

This imports the Docker images and the pulled Ollama models.

---

## 4. Adjust `compose.yaml`

In the `compose.yaml` file replace each `build:` section with the prebuilt image names:
```yaml
rag-app:
  image: offlinellm-rag-app:latest
frontend:
  image: offline-llm-frontend:latest
```
This avoids rebuilding images on the offline server.

---

## 5. Start the stack

Run:
```powershell
docker compose up -d
```
The first start may take a minute while volumes are created.

Check that three containers are running:
```powershell
docker ps
```
You should see `ollama`, `rag-app` and `offline-llm-frontend`.

---

## 6. Test it

Open a browser on the server and visit `https://localhost/` (accept the self‑signed certificate). You should see the OfflineLLM UI. Try asking a question or uploading a PDF.

---

## 7. Common issues

- **Blank page in browser** – ensure Docker containers are running and `https://` is used.
- **Port already in use** – change the exposed ports in `compose.yaml`.
- **Models missing** – run `docker exec ollama ollama list` to verify models; if empty, re‑import `ollama_models.tar`.

That's it! Your Windows Server is now running OfflineLLM entirely offline.

