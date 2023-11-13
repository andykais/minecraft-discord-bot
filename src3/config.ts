import * as path from 'std/path/mod.ts'


interface ConfigInput {
  minecraft: {
    version: string
    world_name: string
  }
  discord?: {
    messages_channel: bigint
  }
}


class Config {
  minecraft: {
    world: {
      name: string
      folder: string
    }
    server: {
      jar_filepath: string
      version: string
    }
    // resources: {
    //   backups_folder: string
    // }
  }
  discord?: {
    messages_channel: bigint
  }

  constructor(config_input: ConfigInput) {
    const server_jar_name = `minecraft_server.${config_input.minecraft.version}.jar`
    this.minecraft = {
      world: {
        name: config_input.minecraft.world_name,
        folder: path.fromFileUrl(import.meta.resolve('../resources/worlds/' + config_input.minecraft.world_name)),
      },
      server: {
        jar_filepath: path.fromFileUrl(import.meta.resolve('../resources/jars/minecraft-server/' + server_jar_name)),
        version: config_input.minecraft.version
      },
      // resources: {
      //   backups_folder: path.fromFileUrl(import.meta.resolve('../resources/backups')),
      // }
    }
    if (config_input.discord) {
      this.discord = {
        messages_channel: config_input.discord.messages_channel
      }
    }
  }
}

export type { ConfigInput }
export { Config }
