import type { Bot } from "https://deno.land/x/discordeno/mod.ts";
import { JavaServer } from 'https://deno.land/x/scriptserver@0.0.3-deno/java_server.ts'
import { useEvents } from 'https://deno.land/x/scriptserver@0.0.3-deno/events.ts'

async function create() {
  // TODO: Base these on config instead of hardcoding
  const world_dir = './worlds/island';
  const jar_file = '/root/minecraft-discord-bot/dependencies/minecraft-server/minecraft_server.1.18.jar';

  const java_server = new JavaServer({
    javaServer: {
      path: world_dir,
      jar: jar_file,
      args: ['-Xmx3G', '-Xms3G']
    }
  })
  useEvents(java_server)
  java_server.start()
  return java_server
}

export { create }
