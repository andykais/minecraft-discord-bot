import { Command } from 'cliffy/command/mod.ts'
import { Config } from './config.ts'
import { App } from './app.ts'
import * as dotenv from "std/dotenv/mod.ts";

const command = new Command()
  .name('minecraft-suite')
  .description('A program that runs a minecraft server, pushes user activity to a discord channel, and backs up minecraft saves')
  .option('--minecraft-server-version <server_version:string>', 'The version of minecraft-server.jar to use.', { default: '1.20.2' })
  .option('--minecraft-world-name <world_name:string>', 'The name of the minecraft world (named worlds have different saves)', { default: 'default' })
  .option('--discord-activity-channel <discord:string>', 'User activity discord channel the bot will send messages to.')
  .option('--discord-monitor-channel <discord:string>', 'Server monitoring discord channel the bot will send messages to.')
  .action(async (args) => {

    interface EnvVars {
      DISCORD_TOKEN?: string
      DISCORD_ACTIVITY_CHANNEL?: string
      DISCORD_MONITOR_CHANNEL?: string
    }

    const env_vars = {
      DISCORD_TOKEN: Deno.env.get('DISCORD_TOKEN'),
      DISCORD_ACTIVITY_CHANNEL: Deno.env.get('DISCORD_ACTIVITY_CHANNEL'),
      DISCORD_MONITOR_CHANNEL: Deno.env.get('DISCORD_MONITOR_CHANNEL'),
    }
    const env_file = await dotenv.load() as typeof env_vars

    const config = new Config({
      minecraft: {
        version: args.minecraftServerVersion,
        world_name: args.minecraftWorldName
      },
      discord: {
        token: env_vars.DISCORD_TOKEN ?? env_file.DISCORD_TOKEN,
        activity_channel: args.discordActivityChannel ?? env_vars.DISCORD_ACTIVITY_CHANNEL ?? env_file.DISCORD_ACTIVITY_CHANNEL,
        monitor_channel: args.discordMonitorChannel ?? env_vars.DISCORD_MONITOR_CHANNEL ?? env_file.DISCORD_MONITOR_CHANNEL,
      }
    })
    const app = new App(config)

    Deno.addSignalListener('SIGINT', async () => {
      console.log('SIGINT signal received. Stopping server...')
      await app.stop()
    })


    await app.start()
    await app.status()
    console.log('app is done.')
  })

await command.parse()
