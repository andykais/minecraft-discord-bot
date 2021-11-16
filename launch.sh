#!/bin/bash

deno run --watch --allow-net=discord.com,gateway.discord.gg --allow-env=DISCORD_TOKEN --allow-run=java app.ts
