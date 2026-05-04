#!/bin/bash
set -e

export PIP_NO_CACHE_DIR=1
export PIP_DISABLE_PIP_VERSION_CHECK=1
export CARGO_NET_OFFLINE=true
export CARGO_HTTP_MULTIPLEXING=false
export NPM_CONFIG_CACHE=/tmp/npm-cache
export TMPDIR=/tmp

echo "Installing backend dependencies..."
cd features/dashboard/backend
pip install --no-cache-dir --no-build-isolation -r requirements.txt 2>&1 | grep -v "Uninstalling\|Running setup.py"
cd ../../..

echo "Installing frontend dependencies..."
cd features/dashboard/frontend
npm install --legacy-peer-deps --prefer-offline --no-audit --cache=/tmp/npm-cache 2>&1 | grep -v "npm warn"
npm run build
cd ../../..

echo "Build complete!"
