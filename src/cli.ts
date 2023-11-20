import { Command } from 'cliffy/command/mod.ts'
import { App } from './app.ts'
import * as dotenv from "std/dotenv/mod.ts";

const command = new Command()
  .name('minecraft-suite')
  .description('A program that runs a minecraft server, pushes user activity to a discord channel, and backs up minecraft saves')
  .option('--minecraft-server-version <server_version:string>', 'The version of minecraft-server.jar to use.', { default: '1.20.2' })
  .option('--minecraft-world-name <world_name:string>', 'The name of the minecraft world (named worlds have different saves)', { default: 'default' })
  .option('--discord-channel <discord:string>', 'User activity discord channel the bot will send messages to.')
  .action(async (args) => {

    const env_file = await dotenv.load();
    const env_vars = {
      discord_channel: Deno.env.get('DISCORD_CHANNEL') ?? env_file['DISCORD_CHANNEL']
    }

    const app = new App({
      minecraft: {
        version: args.minecraftServerVersion,
        world_name: args.minecraftWorldName
      },
      discord: args.discordChannel
        ? { activity_channel: BigInt(args.discordChannel) }
        : env_vars.discord_channel
          ? { activity_channel: BigInt(env_vars.discord_channel) }
          : undefined
    })
    await app.start()
    await app.status()
    console.log('app is done.')
    // TODO implement app.stop on Ctrl-C
  })

await command.parse()
