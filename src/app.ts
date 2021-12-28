import { create as create_discord } from './discord.ts'
import { create as create_minecraft } from './minecraft.ts'

const ACTIVITY_CHANNEL = 909897199649980486n


const bot = await create_discord()
const minecraft_server = await create_minecraft()
minecraft_server.on('login', event => {
  const message = `${event.player} has logged in.`
  console.log(`player ${message}`)
  bot.helpers.sendMessage(ACTIVITY_CHANNEL, message)
})
minecraft_server.on('logout', event => {
  const message = `${event.player} has logged out.`
  console.log(`player ${message}`)
  // I did some thinking and logout messages are noisy and will make people self conscious.
  // Instead we only need to highlight logins
  // bot.helpers.sendMessage(ACTIVITY_CHANNEL, message)
})
