#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DURATION="${1:-180s}"

containers=(
  bidmart-auth-service
  bidmart-bidding-service
  bidmart-catalog-service
  bidmart-wallet-app
  bidmart-order-service
  bidmart-notification-service
)

status=0
pids=()

for container in "${containers[@]}"; do
  "$SCRIPT_DIR/profile-jfr-container.sh" "$container" "$DURATION" &
  pids+=("$!")
done

for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    status=1
  fi
done

exit "$status"
