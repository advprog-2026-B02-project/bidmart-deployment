#!/bin/bash

echo "[1/4] Pull image terbaru..."
docker compose pull

echo "[2/4] Restart local containers..."
docker compose up -d

echo "[3/4] Cleanup images..."
docker image prune -f

echo "[4/4] Status container:"
docker compose ps