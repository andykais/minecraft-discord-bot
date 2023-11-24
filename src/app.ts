import { Config } from './config.ts'
import { Service } from "./services/mod.ts"
import { DiscordBotService } from "./services/discord_bot.ts"
import { MinecraftServerService } from "./services/minecraft_server.ts"


interface Context {
  config: Config
  services: {
    discord_bot: DiscordBotService
    minecraft_server: MinecraftServerService
  }
}

class App extends Service {
  context: Context

  constructor(config: Config) {
    super(config)

    this.context = {
      config,
      services: {
        discord_bot: new DiscordBotService(config),
        minecraft_server: new MinecraftServerService(config),
      }
    }
  }

  async start() {
    return await super.start(this.context)
  }

  async stop() {
    return await super.stop(this.context)
  }

  async start_service(context: Context) {
    const promises: Promise<void>[] = []
    for (const service of Object.values(context.services)) {
      promises.push(service.start(this.context))
    }

    await Promise.all(promises)
  }

  status() {
    return Promise.all(Object.values(this.context.services).map(service => service.status()))
  }

  async stop_service(context: Context) {
    for (const service of Object.values(context.services)) {
      await service.stop(context)
    }
  }
}


export type { Config, Context }
export { App }
