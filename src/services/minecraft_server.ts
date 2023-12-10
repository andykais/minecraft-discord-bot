import * as fs from 'std/fs/mod.ts'
import * as datetime from 'std/datetime/mod.ts'
import { Service } from './mod.ts'
import { JavaServer, JavaEventHandler } from './java_server.ts'
import { Config } from "../config.ts";
import { Context } from "../app.ts";

interface PlayerStats {
  online: boolean
  last_login_at: Date
  playtime: number
}

class MinecraftServerService extends Service {
  #java_server: JavaServer
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
  }

  async service_status() {
    return this.#java_server.status()
  }

  async stop_service(context: Context) {
    this.#java_server.send_command('say', 'Server will shut down momentarily.')
    await this.#java_server.stop(context)
    context.services.discord_bot.send_message('MONITOR_CHANNEL', 'Minecraft server has been turned off.')
  }

  #server_event_handler: JavaEventHandler = async (context, event) => {
    const { discord_bot } = context.services

    switch(event.type) {
      case 'LOGIN': {
        this.#update_player_stats(event.data.username, 'LOGIN')
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
    this.#daily_player_stats[username] = player_stats
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

  async daily_digest_report(context: Context) {
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

    let total_playtime_units = 'seconds'
    const human_readable = {
      total_playtime: total_playtime,
      units: 'seconds'
    }
    if (human_readable.total_playtime > 60) {
      human_readable.total_playtime /= 60
      human_readable.units = 'minutes'
    }
    if (human_readable.total_playtime > 60) {
      human_readable.total_playtime /= 60
      human_readable.units = 'hours'
    }
    this.#daily_player_stats = tomorrows_player_stats

    return { dau, total_playtime: `${human_readable.total_playtime.toFixed(2)} ${human_readable.units}` }
  }

  public async toggle_server_persistance(toggle: 'on' | 'off') {
    if (toggle === 'on') {
      await this.#java_server.save_on()
    } else {
      await this.#java_server.save_off()
      await this.#java_server.save_all()
    }
  }
}

export { MinecraftServerService }
