#!/bin/bash

echo "[1/4] Pull image terbaru..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

echo "[2/4] Restart production containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "[3/4] Cleanup images..."
docker image prune -f

echo "[4/4] Status container:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps