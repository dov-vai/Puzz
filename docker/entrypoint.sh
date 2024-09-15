#!/bin/bash

KEY_PATH="/app/key.pem"

if [ ! -f "$KEY_PATH" ]; then
  echo "Generating 2048-bit RSA key..."
  openssl genrsa -out key.pem 2048
  echo "Key generated at $KEY_PATH"
else
  echo "RSA key already exists at $KEY_PATH"
fi

exec /app/PuzzAPI
