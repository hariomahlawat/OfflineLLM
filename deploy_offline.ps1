# Deploy OfflineLLM on a machine without internet access

# Load prebuilt images
docker load -i .\offline_stack.tar

# Restore Ollama models volume
docker volume create ollama_models
docker run --rm -v ollama_models:/models -v $PWD:/backup `
    busybox tar xf /backup/ollama_models.tar -C / --strip-components=1

# Start the stack without pulling or building
docker compose up -d --pull never --no-build
