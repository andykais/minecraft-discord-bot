import * as path from 'https://deno.land/std@0.165.0/path/mod.ts'
import * as flags from 'https://deno.land/std@0.165.0/flags/mod.ts';
import { App } from './mod.ts'
import type { Config } from './config.ts'

const args = flags.parse(Deno.args)
const minecraft_server_version = args.minecraft_server_version ?? '1.18.2'
const world_name = args.world_name ?? 'default'

const config: Config = {
  minecraft: {
    world_name,
    server_version: minecraft_server_version,
  },
  discord: {
    messages_channel: 909897199649980486n,
  }
}

const app = new App(config)
await app.start()
