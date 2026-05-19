@echo off

echo.
echo [1/4] Mengambil image terbaru dari Docker Hub...
docker compose pull

echo.
echo [2/4] Menjalankan ulang container dengan versi terbaru...
docker compose up -d

echo.
echo [3/4] Membersihkan sisa image versi lama agar disk tidak penuh...
docker image prune -f

echo.
echo [4/4] Update selesai! Berikut status container saat ini:
docker compose ps

echo.
pause