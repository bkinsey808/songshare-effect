#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/dev/mkcert-setup.sh
# Generates mkcert certificates for localhost and stores them in .certs/

CERT_DIR=".certs"
mkdir -p "$CERT_DIR"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Please install mkcert and run this script again."
  echo "Visit https://github.com/FiloSottile/mkcert for install instructions."
  exit 1
fi

echo "Installing mkcert local CA (if needed) and generating certs..."
mkcert -install
mkcert -cert-file "$CERT_DIR/localhost.pem" -key-file "$CERT_DIR/localhost-key.pem" localhost 127.0.0.1 ::1

echo "Certificates generated in $CERT_DIR"
echo "You can now start Vite dev server with HTTPS enabled."
