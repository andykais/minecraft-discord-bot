#!/bin/bash

deno run \
  --allow-net=discord.com,gateway.discord.gg \
  --allow-env=DISCORD_TOKEN \
  --allow-run=java \
  src/app.ts
