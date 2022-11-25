import { type Config } from './config.ts'
import { MinecraftServer } from './services/minecraft.ts'


class App {
  services: {
    minecraft: MinecraftServer
  }

  constructor(private config: Config) {
    this.services = {
      minecraft: new MinecraftServer(config)
    }
  }

  async start() {
    await this.services.minecraft.start()
  }

  async stop() {
    await this.services.minecraft.stop()
  }
}

export { App }
