import { Service } from './mod.ts'
import { Config } from '../config.ts'
import * as discord from 'discordeno'


type DiscordChannelType =
  | 'ACTIVITY_CHANNEL'
  | 'MONITOR_CHANNEL'


class DiscordBotService extends Service {
  #token?: string
  #activity_channel_id?: string
  #monitor_channel_id?: string
  #bot?: discord.Bot
  #discord_client_promise_controller: {resolve: () => void; reject: (e: Error) => void; promise: Promise<void>}

  private get bot() {
    if (this.#bot) return this.#bot
    else throw new Error('uninitialized')
  }

  constructor(config: Config) {
    super(config)
    if (config.discord?.token) {
      this.#token = config.discord.token
      if (config.discord?.activity_channel) {
        this.#activity_channel_id = config.discord.activity_channel.toString()
      }
      if (config.discord?.monitor_channel) {
        this.#monitor_channel_id = config.discord.monitor_channel.toString()
      }
    }

    this.#discord_client_promise_controller = Promise.withResolvers<void>()
  }

  async start_service() {
    if (this.#token === undefined) return

    const startup_promise_controller = Promise.withResolvers<void>()

    this.#bot = discord.createBot({
      token: this.#token,
      events: {
        ready() {
          startup_promise_controller.resolve()
        }
      }
    })

    await discord.startBot(this.#bot);
    await startup_promise_controller.promise
  }

  async stop_service() {
    if (this.#token === undefined) return

    await discord.stopBot(this.bot)
    this.#discord_client_promise_controller.resolve()
  }

  async status() {
    if (this.#token === undefined) return

    if (!this.#bot) throw new Error('uninitialized')
    return this.#discord_client_promise_controller.promise
  }

  async send_message(channel_type: DiscordChannelType, message: string) {
    console.log('DiscordBot::send_message', {channel_type, message})
    switch(channel_type) {
      case 'ACTIVITY_CHANNEL': {
        if (this.#activity_channel_id) {
          return await this.bot.helpers.sendMessage(this.#activity_channel_id, {content: message})
        }
        break
      }
      case 'MONITOR_CHANNEL': {
        if (this.#monitor_channel_id) {
          return await this.bot.helpers.sendMessage(this.#monitor_channel_id, {content: message})
        }
        break
      }
      default: {
        throw new Error(`Unexpected channel_type '${channel_type}'`)
      }
    }

  }
}

export { DiscordBotService }
