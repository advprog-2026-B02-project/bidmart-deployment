#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <container-name> [duration]"
  exit 2
fi

CONTAINER="$1"
DURATION="${2:-180s}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULT_DIR="${RESULT_DIR:-$REPO_DIR/profiling-results/jfr}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REMOTE_FILE="/tmp/${CONTAINER}-${TIMESTAMP}.jfr"
LOCAL_FILE="$RESULT_DIR/${CONTAINER}-${TIMESTAMP}.jfr"

mkdir -p "$RESULT_DIR"

duration_seconds() {
  case "$1" in
    *m) echo "$((${1%m} * 60))" ;;
    *s) echo "${1%s}" ;;
    *) echo "$1" ;;
  esac
}

PID="$(
  docker exec "$CONTAINER" sh -lc '
    if ! command -v jcmd >/dev/null 2>&1; then
      exit 7
    fi
    jcmd | awk "/JarLauncher|org.springframework.boot|java/ { print \$1; exit }"
  '
)" || {
  echo "jcmd is not available in $CONTAINER. Use a JDK image or start the service with JAVA_TOOL_OPTIONS=-XX:StartFlightRecording=filename=/tmp/profile.jfr,settings=profile,duration=$DURATION"
  exit 7
}

if [[ -z "$PID" ]]; then
  echo "Cannot find Java PID in $CONTAINER"
  exit 8
fi

docker exec "$CONTAINER" sh -lc "jcmd $PID JFR.start name=bidmart-profile settings=profile duration=$DURATION filename=$REMOTE_FILE"
sleep "$(duration_seconds "$DURATION")"
docker cp "$CONTAINER:$REMOTE_FILE" "$LOCAL_FILE"

echo "$LOCAL_FILE"
