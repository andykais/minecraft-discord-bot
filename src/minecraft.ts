import type { Bot } from "https://deno.land/x/discordeno/mod.ts";
import { JavaServer } from 'https://deno.land/x/scriptserver@0.0.3-deno/java_server.ts'
import { useEvents } from 'https://deno.land/x/scriptserver@0.0.3-deno/events.ts'

async function create() {
  const java_server = new JavaServer({
    javaServer: {
      path: './dependencies/minecraft-server',
      jar: 'minecraft_server.1.18.jar',
      args: ['-Xmx3G', '-Xms3G']
    }
  })
  useEvents(java_server)
  java_server.start()
  return java_server
}

export { create }
