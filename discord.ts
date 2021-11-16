import { createBot, setupBot, startBot, createEventHandlers } from "https://deno.land/x/discordeno/mod.ts";

// fwiw, we can probably accomplish everything the bot does with a webhook

const APPLICATION_ID = 909886742599991386n
// const ACTIVITY_CHANNEL = 909897199649980486n


async function create() {
  const token = Deno.env.get('DISCORD_TOKEN')
  if (!token) throw new Error('DISCORD_TOKEN not set')

  const bot = createBot({
    token: token,
    botId: APPLICATION_ID,
    events: createEventHandlers({
      ready: async () => {
        console.log('discord bot has connected.')
      },
      // debug: console.log,
    }),
    intents: [],
    cache: {
      isAsync: false,
    },
  })

  setupBot(bot)
  await startBot(bot)
  return bot
}

export { create }
