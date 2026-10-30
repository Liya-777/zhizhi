#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

start() {
  if lsof -ti :$PORT &>/dev/null; then
    echo "❌ 端口 $PORT 已被占用，后端可能已在运行。"
    echo "   先执行: bash scripts/server.sh stop"
    exit 1
  fi
  echo "==> 启动后端服务（端口 $PORT）..."
  PYTHONPATH=backend nohup python3 -m uvicorn app.main:app --host "$HOST" --port "$PORT" \
    > /tmp/rag-backend.log 2>&1 &
  sleep 2
  if lsof -ti :$PORT &>/dev/null; then
    echo "✅ 后端已启动: http://localhost:$PORT/"
  else
    echo "❌ 启动失败，查看日志: tail /tmp/rag-backend.log"
    exit 1
  fi
}

stop() {
  if ! lsof -ti :$PORT &>/dev/null; then
    echo "⚠ 端口 $PORT 无后端进程运行。"
    return
  fi
  echo "==> 关闭端口 $PORT 上的后端服务..."
  lsof -ti :$PORT | xargs kill -9 2>/dev/null
  sleep 1
  if lsof -ti :$PORT &>/dev/null; then
    echo "❌ 关闭失败，请手动 kill: lsof -ti :$PORT | xargs kill -9"
  else
    echo "✅ 后端已关闭。"
  fi
}

restart() {
  stop
  start
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) restart ;;
  *)
    echo "用法: bash scripts/server.sh {start|stop|restart}"
    echo ""
    echo "  start   — 启动后端服务 (端口 $PORT)"
    echo "  stop    — 关闭后端服务"
    echo "  restart — 重启后端服务"
    echo ""
    echo "环境变量: PORT=8000 HOST=0.0.0.0"
    exit 1
    ;;
esac
