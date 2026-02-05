#!/usr/bin/env sh
set -e

SERVER="rutger@192.168.100.10"
REMOTE_PATH="/data/docker/eetspiratie"

echo "📦 Syncing files..."
rsync -av --delete --exclude node_modules --exclude .next --exclude .git . $SERVER:$REMOTE_PATH

echo "🐳 Building and restarting container..."
ssh $SERVER "cd $REMOTE_PATH && docker compose up -d --build"

echo "✅ Deploy complete!"
