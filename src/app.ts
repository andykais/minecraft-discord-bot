import { Config, type ConfigInput } from './config.ts'
import { DiscordBotService } from "./services/discord_bot.ts"
import { MinecraftServerService } from "./services/minecraft_server.ts"


interface Context {
  config: Config
  services: {
    minecraft_server: MinecraftServerService
    // discord_bot: DiscordBotService
  }
}

class App {
  context: Context

  constructor(config_input: ConfigInput) {
    const config = new Config(config_input)

    this.context = {
      config,
      services: {
        // discord_bot: new DiscordBotService(),
        minecraft_server: new MinecraftServerService(config),
      }
    }
    // dependency injection on context (we cant pass in the thing we are instantiating right away)
    for (const service of Object.values(this.context.services)) service.context = this.context
  }

  async start() {
    const promises: Promise<void>[] = []
    for (const service of Object.values(this.context.services)) {
      // TODO should we pass the context here, rather than this weird getter/setter?
      promises.push(service.start())
    }

    await Promise.all(promises)
    console.log('App is up.')
  }

  status() {
    return Promise.all(Object.values(this.context.services).map(service => service.status()))
  }

  async stop() {
    for (const service of Object.values(this.context.services)) {
      await service.stop()
    }
  }
}


export type { Config, Context }
export { App }
