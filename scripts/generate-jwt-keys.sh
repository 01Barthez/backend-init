#!/usr/bin/env bash
# Generate RS256 JWT key pairs into ./keys (gitignored).
# Never bake these files into the Docker image — mount them at runtime.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY_DIR="${ROOT}/keys"
mkdir -p "${KEY_DIR}"

generate_pair() {
  local private_path="$1"
  local public_path="$2"
  if [[ -f "${private_path}" && -f "${public_path}" ]]; then
    echo "Keeping existing $(basename "${private_path}")"
    return
  fi
  openssl genrsa -out "${private_path}" 2048 >/dev/null 2>&1
  openssl rsa -in "${private_path}" -pubout -out "${public_path}" >/dev/null 2>&1
  chmod 600 "${private_path}"
  chmod 644 "${public_path}"
  echo "Wrote $(basename "${private_path}") / $(basename "${public_path}")"
}

generate_pair "${KEY_DIR}/jwt-access-private.pem" "${KEY_DIR}/jwt-access-public.pem"
generate_pair "${KEY_DIR}/jwt-refresh-private.pem" "${KEY_DIR}/jwt-refresh-public.pem"

echo "JWT keys ready under ${KEY_DIR}"
