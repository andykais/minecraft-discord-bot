import { type Config } from './config.ts'
import { MinecraftServer } from './services/minecraft.ts'
import { DiscordBot } from './services/discord.ts'


class App {
  services: {
    minecraft: MinecraftServer
    discord: DiscordBot
  }

  constructor(private config: Config) {
    this.services = {
      minecraft: new MinecraftServer(config),
      discord: new DiscordBot(config),
    }
    this.services.minecraft.on('login', event => {
      const message = `${event.player} has logged in.`
      console.log(`player ${message}`)
      this.services.discord.send(message)
    })
  }

  async start() {
    console.log('Starting discord bot...')
    await this.services.discord.start()
    console.log('Discord bot started.')

    console.log('Starting minecraft server...')
    await this.services.minecraft.start()
    console.log('Minecraft server started.')
  }

  async stop() {
    await this.services.minecraft.stop()
    await this.services.discord.stop()
  }
}

export { App }
