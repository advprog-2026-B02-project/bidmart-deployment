#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULT_DIR="${RESULT_DIR:-$REPO_DIR/profiling-results}"
PROFILE_ENV="${PROFILE_ENV:-$SCRIPT_DIR/profile.env}"
NETWORK="${NETWORK:-bidmart-deployment_bidmart-network}"
K6_IMAGE="${K6_IMAGE:-grafana/k6:0.50.0}"

mkdir -p "$RESULT_DIR"

env_args=()
if [[ -f "$PROFILE_ENV" ]]; then
  env_args+=(--env-file "$PROFILE_ENV")
fi

docker run --rm \
  --network "$NETWORK" \
  "${env_args[@]}" \
  -v "$SCRIPT_DIR:/profiling:ro" \
  -v "$RESULT_DIR:/results" \
  "$K6_IMAGE" run \
  --summary-export /results/k6-bidmart-summary.json \
  /profiling/bidmart-services-profile.js
