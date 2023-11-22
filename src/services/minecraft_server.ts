import { ScriptServer } from '@scriptserver/core'
import * as fs from 'std/fs/mod.ts'
import { useEvent } from '@scriptserver/event'
import { Service } from './mod.ts'
import { JavaServer, JavaEventHandler } from './java_server.ts'
import { Config } from "../config.ts";

class MinecraftServerService extends Service {
  #java_server: JavaServer

  constructor(config: Config) {
    super(config)
    this.#java_server = new JavaServer(config, this.#server_event_handler)
  }

  async start() {
    this.#java_server.context = this.context
    console.log(`Starting minecraft world '${this.config.minecraft.world.name}'`)
    await this.#java_server.start()
  }

  async status() {
    return this.#java_server.status()
  }

  async stop() {
    await this.#java_server.stop()
    this.context.services.discord_bot.send_message('MONITOR_CHANNEL', 'Java server is down.')
  }

  #server_event_handler: JavaEventHandler = async (event) => {
    console.log('event:', event.type, event.data)
    const { discord_bot } = this.context.services

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
        this.context.services.discord_bot.send_message('MONITOR_CHANNEL', `Minecraft server '${this.config.minecraft.world.name}' started in ${event.data.elapsed}.`)
        break
      }
    }
  }
}

export { MinecraftServerService }
