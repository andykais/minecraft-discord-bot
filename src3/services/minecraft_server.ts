import { ScriptServer } from '@scriptserver/core'
import * as fs from 'std/fs/mod.ts'
import { useEvent } from '@scriptserver/event'
import { Service } from './mod.ts'

class MinecraftServerService extends Service {
  async start() {
    // errors from scriptserver are pretty bad (just console logs, so we can try to get ahead of errors this way)
    if (await fs.exists(this.context.config.minecraft.server.jar_filepath) === false) {
      throw new Error(`Cannot find server jar ${this.context.config.minecraft.server.jar_filepath}`)
    }

    const script_server = new ScriptServer({
      javaServer: {
        path: this.context.config.minecraft.world.folder,
        jar: this.context.config.minecraft.server.jar_filepath,
        args: ['-Xmx2G', '-Xms2G']
      },
      rconConnection: {
        port: 25575,
        password: 'password',
      },
    })
    useEvent(script_server.javaServer)
    script_server.start()
    script_server.javaServer.on('stop', () => {
      console.log('server stopped?')
    })
    // this.services.minecraft.on('login', event => {
    //   const message = `${event.player} has logged in.`
    //   console.log(`player ${message}`)
    //   this.services.discord.send(message)
    // })
  }

  async stop() {
    throw new Error('unimplemented')
  }
}

export { MinecraftServerService }
