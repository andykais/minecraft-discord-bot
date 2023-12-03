import * as path from 'std/path/mod.ts'


interface ConfigInput {
  minecraft: {
    version: string
    world_name: string
  }
  discord: {
    token?: string
    activity_channel?: string
    monitor_channel?: string
  }
}


class Config {
  // backups: {
  //   folder: string
  // }
  minecraft: {
    world: {
      name: string
      folder: string
    }
    server: {
      jar_filepath: string
      version: string
    }
    resources: {
      initialization_folder: string
      // backups_folder: string
    }
  }
  discord?: {
    token?: string
    activity_channel?: bigint
    monitor_channel?: bigint
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
      resources: {
        initialization_folder: path.fromFileUrl(import.meta.resolve('../resources/initialization'))
        // backups_folder: path.fromFileUrl(import.meta.resolve('../resources/backups')),
      }
    }
    this.discord = {
      token: config_input.discord.token,
    }
    if (config_input.discord.activity_channel) {
      this.discord.activity_channel = BigInt(config_input.discord.activity_channel)
    }
    if (config_input.discord.monitor_channel) {
      this.discord.monitor_channel = BigInt(config_input.discord.monitor_channel)
    }
  }
}

export type { ConfigInput }
export { Config }
