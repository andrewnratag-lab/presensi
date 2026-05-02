#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/presensi}"

if [[ ! -f "${APP_DIR}/docker-compose.yml" ]]; then
  echo "docker-compose.yml tidak ditemukan di ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    echo "File .env dibuat dari .env.example. Edit dulu sebelum deploy ulang."
  else
    echo "File .env tidak ditemukan."
  fi
  exit 1
fi

docker compose up -d --build
docker compose ps

echo "Deploy selesai."
