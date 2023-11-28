import * as fs from 'std/fs/mod.ts'
import * as datetime from 'std/datetime/mod.ts'
import { Service } from './mod.ts'
import { JavaServer, JavaEventHandler } from './java_server.ts'
import { Config } from "../config.ts";
import { Context } from "../app.ts";
import { Cron } from 'croner'

interface PlayerStats {
  online: boolean
  last_login_at: Date
  playtime: number
}

class MinecraftServerService extends Service {
  #java_server: JavaServer
  #cron_job: Cron | undefined
  #daily_player_stats: Record<string, PlayerStats>

  constructor(config: Config) {
    super(config)
    this.#java_server = new JavaServer(config, this.#server_event_handler)
    // run every day at 1am
    this.#daily_player_stats = {}

  }

  async start_service(context: Context) {
    await Deno.mkdir(this.config.minecraft.world.folder, { recursive: true })
    await fs.copy(this.config.minecraft.resources.initialization_folder, this.config.minecraft.world.folder, { overwrite: true })
    console.log(`Starting minecraft world '${this.config.minecraft.world.name}'`)
    await this.#java_server.start(context)
    this.#cron_job = new Cron('0 8 * * * *', () => this.#daily_digest_report(context))
  }

  async status() {
    return this.#java_server.status()
  }

  async stop_service(context: Context) {
    await this.#java_server.stop(context)
    context.services.discord_bot.send_message('MONITOR_CHANNEL', 'Java server is down.')
  }

  #server_event_handler: JavaEventHandler = async (context, event) => {
    const { discord_bot } = context.services

    switch(event.type) {
      case 'LOGIN': {
        this.#update_player_stats(event.data.username, 'LOGOUT')
        discord_bot.send_message('ACTIVITY_CHANNEL', `${event.data.username} has logged in`)
        break
      }
      case 'LOGOUT': {
        this.#update_player_stats(event.data.username, 'LOGOUT')
        break
      }
      case 'WARNING': {
        discord_bot.send_message('MONITOR_CHANNEL', `WARNING: ${event.data.message}`)
        break
      }
      case 'STARTED': {
        discord_bot.send_message('MONITOR_CHANNEL', `Minecraft server version ${this.config.minecraft.server.version} started world '${this.config.minecraft.world.name}' in ${event.data.elapsed}.`)
        break
      }
    }
  }

  #update_player_stats(username: string, event: 'LOGIN' | 'LOGOUT') {
    const now = new Date()
    const player_stats = this.#daily_player_stats[username] ?? {online: true, last_login_at: now, playtime: 0}
    switch(event) {
      case 'LOGIN': {
        player_stats.last_login_at = now
        player_stats.online = true
        break
      }
      case 'LOGOUT': {
        const duration = datetime.difference(player_stats.last_login_at, now, {units: ['seconds']})
        player_stats.playtime += duration.seconds!
        player_stats.online = false
        break
      }
    }
  }

  #daily_digest_report = (context: Context) => {
    const tomorrows_player_stats: Record<string, PlayerStats> = {}

    const now = new Date()
    const player_stats_entries = Object.entries(this.#daily_player_stats)
    let dau = 0
    let total_playtime = 0
    for (const [username, player_stats] of Object.entries(this.#daily_player_stats)) {
      dau ++
      // carry over users still active at the rollover time, but reset their accumulated play time
      if (player_stats.online) {
        total_playtime += datetime.difference(player_stats.last_login_at, now, {units:['seconds']}).seconds!
        tomorrows_player_stats[username] = {...player_stats, playtime: 0}
      } else {
        total_playtime += player_stats.playtime
      }
    }

    context.services.discord_bot.send_message('MONITOR_CHANNEL', `Daily server digest - DAU: ${dau}, total playtime: ${total_playtime}`)
    this.#daily_player_stats = tomorrows_player_stats
  }
}

export { MinecraftServerService }
