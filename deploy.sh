#!/usr/bin/env sh

echo "We're deploying..."

git pull
npm ci
npm run compile

touch deployed.lock

pm2 reload /app/app.json

echo ""
echo "!!! Deploy finished !!!"