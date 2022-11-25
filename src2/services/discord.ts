import { createBot, Intents, startBot, type Bot } from "https://deno.land/x/discordeno@13.0.0/mod.ts";
import { type Config } from "../config.ts";


class DiscordBot {
  bot?: Bot

  constructor(private config: Config) {}

  async start() {
    const token = Deno.env.get('DISCORD_TOKEN')
    if (!token) throw new Error('DISCORD_TOKEN not set')

    const bot = createBot({
      token,
      // intents: Intents.Guilds | Intents.GuildMessages,
      events: {
        ready() {
          console.log('Discord bot has connected.')
        },
      },
    })
    bot.events.messageCreate = function (b, message) {
      console.log('discord bot:', { message })
    }
    await startBot(bot)
    this.bot = bot
  }

  async send(message: string) {
    if (this.bot === undefined) throw new Error('Bot is not initialized')
    this.bot.helpers.sendMessage(this.config.discord.messages_channel, { content: message })
  }

  async stop() {

  }
}

export { DiscordBot }
