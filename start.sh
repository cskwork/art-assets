#!/bin/bash
# 로컬 서버 시작 스크립트 (Unix/Linux/Mac)

MAIN_PORT="${PORT:-3000}"
ADMIN_PORT_VALUE="${ADMIN_PORT:-3001}"

if [ "${ADMIN_PORT_VALUE}" = "${MAIN_PORT}" ]; then
  if [[ "${MAIN_PORT}" =~ ^[0-9]+$ ]]; then
    ADMIN_PORT_VALUE="$((MAIN_PORT + 1))"
  else
    ADMIN_PORT_VALUE="3001"
  fi
  echo "ADMIN_PORT가 메인 포트와 같아 ${ADMIN_PORT_VALUE}로 조정합니다."
fi

if [ ! -f "api/dist/admin-server.js" ]; then
  echo "Admin 서버 빌드 파일이 없어 빌드를 실행합니다..."
  npm run build --prefix api || exit 1
fi

echo "Starting local servers..."
echo ""
echo "Main server:  http://localhost:${MAIN_PORT}"
echo "3D Viewer:    http://localhost:${MAIN_PORT}/3d/viewer.html"
echo "Gallery:      http://localhost:${MAIN_PORT}/gallery.html"
echo "Admin server: http://localhost:${ADMIN_PORT_VALUE}"
echo "Admin UI:     http://localhost:${ADMIN_PORT_VALUE}/admin"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

PORT="${MAIN_PORT}" node server.js &
SERVER_PID=$!

ADMIN_PORT="${ADMIN_PORT_VALUE}" node api/dist/admin-server.js &
ADMIN_PID=$!

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "${SERVER_PID}" "${ADMIN_PID}" 2>/dev/null
  wait "${SERVER_PID}" "${ADMIN_PID}" 2>/dev/null
}

trap cleanup INT TERM

wait "${SERVER_PID}" "${ADMIN_PID}"
