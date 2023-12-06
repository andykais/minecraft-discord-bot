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
  r2_backup: {
    account_id?: string
    bucket?: string
    credentials: {
      access_key_id?: string
      secret_access_key?: string
    }
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
  backup: {
    r2?: {
      account_id: string
      base_url: string
      bucket: string
      credentials: {
        access_key_id: string
        secret_access_key: string
      }
    }
    resources: {
      local_folder: string
      remote_folder: string
    }
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

    const { r2_backup } = config_input
    this.backup = {
      resources: {
        local_folder: path.fromFileUrl(import.meta.resolve('../resources/backups/' + config_input.minecraft.world_name)),
        remote_folder: `worlds/${config_input.minecraft.world_name}`,
      }
    }

    if (r2_backup.account_id && r2_backup.bucket && r2_backup.credentials.access_key_id && r2_backup.credentials.secret_access_key) {
      this.backup.r2 = {
        account_id: r2_backup.account_id,
        base_url: `https://${r2_backup.account_id}.r2.cloudflarestorage.com`,
        bucket: r2_backup.bucket,
        credentials: {
          access_key_id: r2_backup.credentials.access_key_id,
          secret_access_key: r2_backup.credentials.secret_access_key,
        },
      }
    }
  }
}

export type { ConfigInput }
export { Config }
