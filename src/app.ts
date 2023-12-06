import { Config } from './config.ts'
import { Service } from "./services/mod.ts"
import { DiscordBotService } from "./services/discord_bot.ts"
import { MinecraftServerService } from "./services/minecraft_server.ts"
import { R2Backups } from "./services/r2_backups.ts"


interface Context {
  config: Config
  services: {
    discord_bot: DiscordBotService
    minecraft_server: MinecraftServerService
    backups: R2Backups
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
        backups: new R2Backups(config),
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
    // TODO create a more sophisticated system of dependent services
    await context.services.discord_bot.start(context)
    await context.services.minecraft_server.start(context)
    await context.services.backups.start(context)
  }

  status() {
    return Promise.all(Object.values(this.context.services).map(service => service.status()))
  }

  async stop_service(context: Context) {
    await context.services.backups.stop(context)
    await context.services.minecraft_server.stop(context)
    await context.services.discord_bot.stop(context)
  }
}


export type { Config, Context }
export { App }
