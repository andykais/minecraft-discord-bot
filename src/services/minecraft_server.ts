import * as fs from 'std/fs/mod.ts'
import { Service } from './mod.ts'
import { JavaServer, JavaEventHandler } from './java_server.ts'
import { Config } from "../config.ts";
import { Context } from "../app.ts";

class MinecraftServerService extends Service {
  #java_server: JavaServer

  constructor(config: Config) {
    super(config)
    this.#java_server = new JavaServer(config, this.#server_event_handler)
  }

  async start_service(context: Context) {
    console.log(`Starting minecraft world '${this.config.minecraft.world.name}'`)
    await this.#java_server.start(context)
  }

  async status() {
    return this.#java_server.status()
  }

  async stop_service(context: Context) {
    await this.#java_server.stop(context)
    context.services.discord_bot.send_message('MONITOR_CHANNEL', 'Java server is down.')
  }

  #server_event_handler: JavaEventHandler = async (context, event) => {
    const { discord_bot } = context.services

    switch(event.type) {
      case 'LOGIN': {
        discord_bot.send_message('ACTIVITY_CHANNEL', `${event.data.username} has logged in`)
        break
      }
      case 'WARNING': {
        discord_bot.send_message('MONITOR_CHANNEL', `WARNING: ${event.data.message}`)
        break
      }
      case 'STARTED': {
        discord_bot.send_message('MONITOR_CHANNEL', `Minecraft server version ${this.config.minecraft.server.version} started world '${this.config.minecraft.world.name}' in ${event.data.elapsed}.`)
        break
      }
    }
  }
}

export { MinecraftServerService }
