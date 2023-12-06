#!/bin/bash

if [ -f .env ]
then
  export $(cat .env | grep -v '^#' | xargs)
fi

~/.deno/bin/deno run \
  --allow-read=.,$HOME/.aws \
  --allow-write=. \
  --unstable \
  --allow-run=git,java \
  --allow-env=MODE,HOME,NODE_EXTRA_CA_CERTS,DISCORD_TOKEN,DISCORD_ACTIVITY_CHANNEL,DISCORD_MONITOR_CHANNEL,AWS_REGION,R2_ACCOUNT_ID,R2_BUCKET,R2_ACCESS_KEY_ID,R2_ACCESS_KEY_SECRET \
  --allow-net=discord.com,gateway.discord.gg,gateway-us-east1-a.discord.gg,gateway-us-east1-b.discord.ggi,gateway-us-east1-c.discord.gg,gateway-us-east1-d.discord.gg,${R2_ACCOUNT_ID}.r2.cloudflarestorage.com \
  --check \
  src/cli.ts
