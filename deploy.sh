#!/usr/bin/env sh
set -e

SERVER="rutger@192.168.100.10"
REMOTE_PATH="/data/docker/eetspiratie"

echo "📦 Syncing files..."
# /data holds the database and images on the server: never sync or delete it
rsync -av --delete --exclude node_modules --exclude .next --exclude .git --exclude .env --exclude .env.local --exclude /data . $SERVER:$REMOTE_PATH

echo "🐳 Building and restarting container..."
ssh $SERVER "cd $REMOTE_PATH && mkdir -p data && docker compose up -d --build"

echo "✅ Deploy complete!"
