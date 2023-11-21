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
    console.log(`Starting minecraft world '${this.config.minecraft.world.name}'`)
    await this.#java_server.start()

    // // errors from scriptserver are pretty bad (just console logs, so we can try to get ahead of errors this way)
    // if (await fs.exists(this.context.config.minecraft.server.jar_filepath) === false) {
    //   throw new Error(`Cannot find server jar ${this.context.config.minecraft.server.jar_filepath}`)
    // }

    // const script_server = new ScriptServer({
    //   javaServer: {
    //     path: this.context.config.minecraft.world.folder,
    //     jar: this.context.config.minecraft.server.jar_filepath,
    //     args: ['-Xmx2G', '-Xms2G']
    //   },
    //   rconConnection: {
    //     port: 25575,
    //     password: 'password',
    //   },
    // })
    // useEvent(script_server.javaServer)
    // script_server.start()
    // script_server.javaServer.on('stop', () => {
    //   console.log('server stopped?')
    // })
    // // this.services.minecraft.on('login', event => {
    // //   const message = `${event.player} has logged in.`
    // //   console.log(`player ${message}`)
    // //   this.services.discord.send(message)
    // // })
  }

  async status() {
    return this.#java_server.status()
  }

  async stop() {
    throw new Error('unimplemented')
  }

  #server_event_handler: JavaEventHandler = async (event) => {
    if (event.type === 'LOGIN') this.context.services.discord_bot.send_message('ACTIVITY_CHANNEL', `${event.data.username} has logged in`)
  }
}

export { MinecraftServerService }
