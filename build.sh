#!/bin/bash
set -e

export PIP_NO_CACHE_DIR=1
export CARGO_NET_OFFLINE=false

echo "Installing backend dependencies..."
cd features/dashboard/backend
pip install --no-cache-dir --prefer-binary -r requirements.txt
cd ../../..

echo "Installing frontend dependencies..."
cd features/dashboard/frontend
npm install --legacy-peer-deps --prefer-offline --no-audit
npm run build
cd ../../..

echo "Build complete!"
