import * as fs from "https://deno.land/std@0.165.0/fs/mod.ts";
import * as datetime from "https://deno.land/std@0.67.0/datetime/mod.ts";
import * as path from 'https://deno.land/std@0.165.0/path/mod.ts'
import { tgz } from "https://deno.land/x/compress@v0.4.4/mod.ts";
import * as script_server from "npm:@scriptserver/core";
import { type Config } from "../config.ts";
import * as cron from 'https://deno.land/x/deno_cron/cron.ts';


interface ScriptServer {
  javaServer: {
    on: (event: string, fn: () => void) => void
  }
  rconConnection: {
    send: (message: string) => void
    on: (event: string, fn: () => void) => void
  }
  start(): void
  stop(): void
}

const ScriptServer = script_server.ScriptServer

const MINECRAFT_SERVER_FOLDER = path.fromFileUrl(import.meta.resolve('../../dependencies/minecraft-server/'))
const MINECRAFT_WORLDS_FOLDER = path.fromFileUrl(import.meta.resolve('../../resources/worlds'))
const MINECRAFT_INITIALIZATION = path.fromFileUrl(import.meta.resolve('../../resources/initialization'))
const MINECRAFT_BACKUPS_DAILY = path.fromFileUrl(import.meta.resolve('../../resources/backups'))

class MinecraftServer {
  script_server: ScriptServer
  world_directory: string

  constructor(private config: Config) {
    const server_filename = `minecraft_server.${config.minecraft.server_version}.jar`
    this.world_directory = path.join(MINECRAFT_WORLDS_FOLDER, config.minecraft.world_name)
    this.script_server = new ScriptServer({
      javaServer: {
        path: this.world_directory,
        jar: path.join(MINECRAFT_SERVER_FOLDER, server_filename),
        args: ['-Xmx3G', '-Xms3G']
      },
      rconConnection: {
        port: 25575,
        password: 'password',
      },
    })

    // schedule daily backups at 6am. Super helpful cron site: https://crontab.guru/#0_6_*_*_*
    cron.cron('0 6 * * *', () => {
      this.backup()
    })
  }

  async start() {
    await fs.copy(MINECRAFT_INITIALIZATION, this.world_directory)
    this.script_server.start()

    await Promise.all([
      new Promise<void>(resolve => this.script_server.javaServer.on('start', resolve)).then(() => console.log('Minecraft Java Server Started.')),
      new Promise<void>(resolve => this.script_server.rconConnection.on('connected', resolve)).then(() => console.log('RCON Connected.')),
    ])
  }

  async stop() {
    cron.stop()
    // NOTE the stop api requires --allow-run all
    const stopped = Promise.all([
      new Promise<void>(resolve => this.script_server.javaServer.on('stop', resolve)),
      new Promise<void>(resolve => this.script_server.rconConnection.on('disconnected', resolve)),
    ])
    this.script_server.stop()
    await stopped
  }

  async backup() {
    console.log(`Backing up '${this.config.minecraft.world_name}' server...`)
    const now = new Date()
    const daily_backup_folder = path.join(MINECRAFT_BACKUPS_DAILY, this.config.minecraft.world_name)
    await Deno.mkdir(daily_backup_folder, { recursive: true })
    // this.script_server.rconConnection.send('say [§4WARNING§r] Server backup process will begin in 5 minutes.')
    this.script_server.rconConnection.send('say [§4WARNING§r] Server backup process is starting NOW.')
    this.script_server.rconConnection.send('save-off')
    this.script_server.rconConnection.send('save-all')
    const backup_filename = now.toISOString() + '.tar.gz'
    const latest_backup_filepath = path.join(daily_backup_folder, backup_filename)
    await tgz.compress(this.world_directory, latest_backup_filepath)
    this.script_server.rconConnection.send('save-on')
    this.script_server.rconConnection.send('say [§bNOTICE§r] Server backup process is complete. Carry on.')

    // delete backups older than 7 days
    const cutoff_days = 1
    for await (const backup of Deno.readDir(daily_backup_folder)) {
      const backup_date = new Date(backup.name.replace('.tar.gz', ''))
      const backup_age = datetime.difference(backup_date, now, { units: ['days'] })
      if (backup_age.days! > cutoff_days) {
        console.log('Deleting backup from', backup_date)
        const backup_filepath = path.join(daily_backup_folder, backup.name)
        await Deno.remove(backup_filepath)
      }
    }
    // push to github
    await new Deno.Command('git', { args: ['add', daily_backup_folder]}).output()

    await new Deno.Command('git', { args: ['commit', '-m', `Daily backup`]}).output()

    await new Deno.Command('git', { args: ['push']}).output()

    console.log('Backup complete')
  }
}

export { MinecraftServer };
