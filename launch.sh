#!/bin/bash

~/.deno/bin/deno run \
  --allow-read=. \
  --allow-write=. \
  --unstable \
  --allow-run=git,java \
  --allow-env=MODE,DISCORD_TOKEN,DISCORD_ACTIVITY_CHANNEL,DISCORD_MONITOR_CHANNEL \
  --allow-net=discord.com,gateway.discord.gg,gateway-us-east1-d.discord.gg \
  --check \
  src/cli.ts
