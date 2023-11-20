import { type Context } from '../app.ts'
import { Config } from "../config.ts";


// TODO possibly overkill, but we could introduce the concept of 'nested services'.
// The App could be a top level service, containing MinecraftService and DiscordService, the MinecraftService continaing the JavaServerService, etc...

abstract class Service {
  #context: Context | undefined

  public constructor(protected config: Config) {}

  get context() {
    if (this.#context) return this.#context
    throw new Error('Uninitialized. Please use the Service::start method to access Service::context')
  }
  set context(context: Context) { this.#context = context }

  abstract start(): Promise<any>
  abstract stop(): Promise<void>
  abstract status(): Promise<any>
}

export { Service }
