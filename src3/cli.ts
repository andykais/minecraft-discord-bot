import { Command } from 'cliffy/command/mod.ts'
import { App } from './app.ts'

const command = new Command()
  .name('minecraft-suite')
  .description('A program that runs a minecraft server, pushes user activity to a discord channel, and backs up minecraft saves')
  .option('--minecraft-server-version <server_version:string>', 'The version of minecraft-server.jar to use.', { default: '1.18.2' })
  .option('--minecraft-world-name <world_name:string>', 'The name of the minecraft world (named worlds have different saves)', { default: 'default' })
  .option('--discord-channel <discord:string>', 'User activity discord channel the bot will send messages to.')
  .action(async (args) => {


    const app = new App({
      minecraft: {
        version: args.minecraftServerVersion,
        world_name: args.minecraftWorldName
      },
      discord: args.discordChannel ? { messages_channel: BigInt(args.discordChannel) } : undefined
    })
    await app.start()
    console.log('app is done.')
    // TODO implement app.stop on Ctrl-C
  })

await command.parse()
