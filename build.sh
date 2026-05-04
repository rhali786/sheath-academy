#!/bin/bash
set -e

export PIP_NO_CACHE_DIR=1
export PIP_DISABLE_PIP_VERSION_CHECK=1
export NPM_CONFIG_CACHE=/tmp/npm-cache
export TMPDIR=/tmp

echo "Installing backend dependencies..."
cd features/dashboard/backend
pip install --prefer-binary --no-cache-dir -r requirements.txt 2>&1 | grep -v "Uninstalling\|Running setup.py"
if [ $? -ne 0 ]; then
  echo "ERROR: Backend dependencies failed to install"
  exit 1
fi
cd ../../..

echo "Installing frontend dependencies..."
cd features/dashboard/frontend
npm install --legacy-peer-deps --prefer-offline --no-audit --cache=/tmp/npm-cache 2>&1 | grep -v "npm warn"
npm run build
cd ../../..

echo "Build complete!"
