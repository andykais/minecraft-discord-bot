import type { Bot } from "https://deno.land/x/discordeno/mod.ts";
import { JavaServer } from 'https://deno.land/x/scriptserver@0.0.3-deno/java_server.ts'
import { useEvents } from 'https://deno.land/x/scriptserver@0.0.3-deno/events.ts'

async function create() {
  const java_server = new JavaServer({
    javaServer: {
      path: './minecraft-server',
      jar: 'minecraft_server.1.17.1.jar',
      args: ['-Xmx1024G', '-Xms1024G']
    }
  })
  useEvents(java_server)
  java_server.start()
  java_server.on('login', (event) => {
    console.log(event.player, 'logged in')
  })
  java_server.on('logout', (event) => {
    console.log(event.player, 'logged out')
  })
  return java_server
}

export { create }
