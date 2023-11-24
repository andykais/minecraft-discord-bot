import { type Context } from '../app.ts'
import { Config } from "../config.ts";

type ServiceState =
  | 'CREATED'
  | 'STARTING'
  | 'STARTED'
  | 'STOPPING'
  | 'STOPPED'


// TODO possibly overkill, but we could introduce the concept of 'nested services'.
// The App could be a top level service, containing MinecraftService and DiscordService, the MinecraftService continaing the JavaServerService, etc...

// TODO: also possibly overkill, but some kind of state: {} object that is for values that are null when not initialized would be handy in a lot of places

abstract class Service {
  public name: string
  public state: ServiceState

  public constructor(protected config: Config) {
    this.state = 'CREATED'
    this.name = this.constructor.name
  }

  public async start(context: Context) {
    if (this.state !== 'CREATED') {
      throw new Error(`Services can only be started from the CREATED state. Service ${this.name} is currently ${this.state}.`)
    }

    this.#set_state('STARTING')
    await this.start_service(context)
    this.#set_state('STARTED')
  }

  public async stop(context: Context) {
    if (this.state !== 'STARTED') {
      throw new Error(`Cannot stop service unless it is STARTED, service ${this.name} is currently ${this.state}.`)
    }

    this.#set_state('STOPPING')
    await this.stop_service(context)
    this.#set_state('STOPPED')
  }

  public abstract status(): Promise<any>
  protected abstract start_service(context: Context): Promise<any>
  protected abstract stop_service(context: Context): Promise<void>

  #set_state(state: ServiceState) {
    this.state = state
    console.log(`service:${this.name} entered state ${state}`)
  }
}

export { Service }
