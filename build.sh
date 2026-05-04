#!/bin/bash
set -e

echo "Installing backend dependencies..."
cd features/dashboard/backend
pip install --prefer-binary -r requirements.txt
cd ../../..

echo "Installing frontend dependencies..."
cd features/dashboard/frontend
npm install --legacy-peer-deps
npm run build
cd ../../..

echo "Build complete!"
