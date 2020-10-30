#!/usr/bin/env sh

while [ ! -f /app/deployed.lock ]
do
  sleep 2
done

pm2-runtime /app/app.json