#!/bin/bash
set -e

echo "Installing backend dependencies..."
cd features/dashboard/backend
pip install -r requirements.txt
cd ../../..

echo "Installing frontend dependencies..."
cd features/dashboard/frontend
npm install
npm run build
cd ../../..

echo "Build complete!"
