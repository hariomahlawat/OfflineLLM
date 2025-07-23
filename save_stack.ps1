# Build and export OfflineLLM images on an online machine

# Pull base images and build the stack
docker pull ollama/ollama:latest
# build backend and frontend
docker compose build

# Save all images to a single archive
docker save -o offline_stack.tar `
    ollama/ollama:latest `
    offlinellm-rag-app:latest `
    offlinellm-frontend:latest

# Archive pulled Ollama models
docker run --rm -v ollama_models:/models -v $PWD:/backup `
    busybox tar cf /backup/ollama_models.tar /models
