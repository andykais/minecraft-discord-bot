#!/bin/bash

deno run \
  --allow-read \
  --allow-write \
  --unstable \
  --allow-run=git,java \
  --allow-env=DISCORD_TOKEN,DISCORD_ACTIVITY_CHANNEL,DISCORD_MONITOR_CHANNEL \
  --allow-net=discord.com,gateway.discord.gg \
  --check \
  src/cli.ts
