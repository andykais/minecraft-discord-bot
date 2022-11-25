import { createBot, Intents, startBot } from "https://deno.land/x/discordeno@13.0.0/mod.ts";
import { type Config } from "../config.ts";


class DiscordBot {

  constructor(private config: Config) {
    console.log('constructing discord bot')

  }

  async start() {

  }

  async stop() {

  }
}

export { DiscordBot }
