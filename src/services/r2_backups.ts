import * as streams from 'std/streams/mod.ts'
import * as path from 'std/path/mod.ts'
import * as fs from 'std/fs/mod.ts'
import * as datetime from 'std/datetime/mod.ts'
import { Tar } from 'std/archive/tar.ts'
import * as aws_api from 'aws_api/client/mod.ts'
import { S3 } from 'aws_api/services/s3/mod.ts'

import { type Context } from '../app.ts'
import { Config } from "../config.ts";
import { Service } from "./mod.ts";
import { readableStreamFromReader } from "https://deno.land/std@0.129.0/streams/conversion.ts";

class R2Backups extends Service {
  #s3_client: S3 | undefined
  #backup_promises: Promise<void>[]
  #cron_controller: AbortController
  #cron_promise: Promise<void> | undefined

  constructor(config: Config) {
    super(config)
    this.#backup_promises = []
    this.#cron_controller = new AbortController()
  }

  protected async start_service(context: Context): Promise<any> {
    // // run every day at 8am (thats 1pm UTC)
    this.#cron_promise = Deno.cron('backup', '0 13 * * *', () => this.daily_backup(context), { signal: this.#cron_controller.signal })

    if (context.config.backup.r2) {
      this.#s3_client = new aws_api.ApiFactory({
        credentials: {
          region: 'auto',
          awsAccessKeyId: context.config.backup.r2.credentials.access_key_id,
          awsSecretKey: context.config.backup.r2.credentials.secret_access_key,
        },
        fixedEndpoint: context.config.backup.r2.base_url,
      }).makeNew(S3);

      // simple call to confirm the credentials work
      const objects = await this.#s3.listObjects({Bucket: context.config.backup.r2.bucket })
      if (objects.Name !== context.config.backup.r2.bucket) {
        console.error(objects)
        throw new Error(`Invalid bucket ${objects.Name} retrieved for bucket ${context.config.backup.r2.bucket}`)
      }
    }
  }

  async daily_backup(context: Context) {
    const promise = this.#backup_world(context)
    this.#backup_promises.push(promise)
    await promise
    const promise_index = this.#backup_promises.findIndex(p => p === promise)
    this.#backup_promises.splice(promise_index, 1)
  }

  async #backup_world(context: Context) {
    const start_time = performance.now()

    const backup_datetime = datetime.format(new Date(), 'yyyy-MM-dd HH:mm')
    console.log(`Daily backup triggered ${backup_datetime}`)

    const archive_filepath = path.join(context.config.backup.resources.local_folder, backup_datetime, 'world.tar')
    const r2_key = path.join(context.config.backup.resources.remote_folder, backup_datetime, 'world.tar')

    const daily_digest = await context.services.minecraft_server.daily_digest_report(context)
    if (daily_digest.dau === 0) {
      console.log('No active users today, so skipping backup')
      return
    }

    await context.services.minecraft_server.toggle_server_persistance('off')
    const tar = new Tar()
    for await (const file of fs.walk(this.config.minecraft.world.folder)) {
      if (file.isFile === false) continue
      const relative_path = path.relative(this.config.minecraft.world.folder, file.path)
      tar.append(relative_path, {filePath: file.path})
    }
    await Deno.mkdir(path.dirname(archive_filepath), { recursive: true })
    const archive_file = await Deno.open(archive_filepath, { write: true, create: true })
    await Deno.copy(tar.getReader(), archive_file)
    await context.services.minecraft_server.toggle_server_persistance('on')
    console.log(`Saved ${archive_filepath} to disk.`)

    if (this.#s3_client) {
      const archive_file_stats = await Deno.stat(archive_filepath)
      const archive_file_size = (archive_file_stats.size / 1e6).toFixed(2)
      console.log(`Uploading ${archive_file_size}MB backup to S3`)
      const archive_contents = await Deno.readFile(archive_filepath)
      const put_result = await this.#s3.putObject({
        Bucket: context.config.backup.r2!.bucket,
        Key: r2_key,
        Body: archive_contents,
      })
      console.log(`Uploaded ${r2_key} to R2.`)
    }

    const end_time = performance.now()

    const duration = (end_time - start_time) / 1000
    context.services.discord_bot.send_message('MONITOR_CHANNEL', `Daily backup complete (elapsed time ${Math.ceil(duration)} seconds, dau ${daily_digest.dau}, total playtime ${daily_digest.total_playtime})`)
  }

  protected async stop_service(context: Context): Promise<void> {
    this.#cron_controller.abort('stopped')
  }

  public async status(): Promise<any> {
    return Promise.all([
      this.#cron_promise,
      ...this.#backup_promises,
    ])
  }

  get #s3() {
    if (this.#s3_client) return this.#s3_client
    else throw new Error('uninitialized')
  }
}

export { R2Backups }
