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
3. Run the helper script to build the images and archive everything for transfer:
   ```powershell
   .\save_stack.ps1
   ```
4. Copy these items to your offline server:
   - `compose.yaml`
   - the `certs/` directory
   - the `offline_llm_models` folder
   - the `data` folder
   - `offline_stack.tar`
   - `ollama_models.tar`
   Use a USB drive or other removable media for the copy. Copying the entire
   repository is optional when you rely on the prebuilt images; leaving out
   large folders such as `node_modules/` saves space.

   Place everything in a folder like `C:\OfflineLLM` so you can run `docker
   compose` from inside it.

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

## 4. `compose.yaml`

The provided `compose.yaml` already references the prebuilt images and sets
`pull_policy: never` so Docker won't attempt to pull anything. No edits are
required.

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

