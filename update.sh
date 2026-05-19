#!/bin/bash

echo "[1/4] Mengambil image terbaru dari Docker Hub..."
docker compose pull

echo "[2/4] Menjalankan ulang container dengan versi terbaru..."
docker compose up -d

echo "[3/4] Membersihkan sisa image versi lama agar SSD AWS tidak penuh..."
docker image prune -f

echo "[4/4] Update selesai! Berikut status container saat ini:"
docker compose ps