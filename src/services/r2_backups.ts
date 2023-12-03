import * as streams from 'std/streams/mod.ts'
import * as path from 'std/path/mod.ts'
import * as fs from 'std/fs/mod.ts'
import { Tar } from 'std/archive/tar.ts'

// @deno-types="npm:aws-sdk/clients/s3.d.ts"
import aws_sdk_s3 from 'npm:aws-sdk/clients/s3.js';
// @deno-types="npm:@aws-sdk/client-s3/dist-types/index.d.ts"
import * as s3 from 'npm:@aws-sdk/client-s3'

import { type Context } from '../app.ts'
import { Config } from "../config.ts";
import { Service } from "./mod.ts";
import { readableStreamFromReader } from "https://deno.land/std@0.129.0/streams/conversion.ts";


class R2Backups extends Service {
  #base_url: string

  constructor(config: Config) {
    super(config)
    const account_id = '14ae0a54d268af0231edec7f9e6d8cc0'
    this.#base_url = `https://${account_id}.r2.cloudflarestorage.com`
  }

  protected async start_service(context: Context): Promise<any> {


    const start_time = performance.now()

    const tar = new Tar()
    for await (const file of fs.walk(this.config.minecraft.world.folder)) {
      if (file.isFile === false) continue
      const relative_path = path.relative(this.config.minecraft.world.folder, file.path)
      // console.log(relative_path)
      tar.append(relative_path, {filePath: file.path})
    }

    // const tar_file = await Deno.open('out.tar.gz', { write: true, create: true })
    // await streams.readableStreamFromReader(tar.getReader())
    //   .pipeThrough(new CompressionStream('zip'))
    //   .pipeTo(tar_file.writable)

    const tar_file = await Deno.open('out.tar', { write: true, create: true, })
    await Deno.copy(tar.getReader(), tar_file)

    const s3_key = `2023-12-01-${Date.now()}/minecraft-save.tar`
    // const tar_readable_stream = streams.readableStreamFromReader(tar.getReader())
    // const tar_file_2 = await Deno.open('/home/andrew/Code/development/minecraft-discord-bot/sample.txt', { read: true })
    const tar_file_2 = await Deno.open('out.tar', { read: true })
    const file_stats = await tar_file_2.stat()
    await this.#upload(s3_key, tar_file_2.readable, file_stats.size)

    const end_time = performance.now()

    const duration = (end_time - start_time) / 1000 / 60
    console.log('backup took:', duration.toFixed(4))

    // const listing = await fetch(this.#base_url).then(r => r.text())
    // console.log(listing)

    // const foobar: s3.CompletedMultipartUpload = {}
    // foobar.Parts?.at(0)?.ETag
    
    // new s3.CompleteMultipartUploadCommand({
    //   MultipartUpload
    // })

//     const s3_client = new s3.S3Client({
//       region: 'auto',
//       endpoint: backup_config.base_url,
//       credentials: {
//         accessKeyId: backup_config.credentials.accessKeyId,
//         secretAccessKey: backup_config.credentials.secretAccessKey,
//       }
//     })
//     console.log(
//       await s3_client.send(
//         new s3.ListObjectsV2Command({ Bucket: backup_config.bucket })
//       )
//     );


//     const result = await s3_client.send(
//       new s3.CreateMultipartUploadCommand({
//         Bucket: backup_config.bucket,
//         Key: 'minecraft_save.tar',
//       })
//     );
//     console.log({result})


//     const s3_client = new s3.S3({
//       region: 'auto',
//       endpoint: backup_config.base_url,
//       credentials: {
//         accessKeyId: backup_config.credentials.accessKeyId,
//         secretAccessKey: backup_config.credentials.secretAccessKey,
//       }
//     })

//     const tar_readable_stream = streams.readableStreamFromReader(tar.getReader())
//     const result = await s3_client.createMultipartUpload({
//       Bucket: backup_config.bucket,
//       Key: `${Date.now()}`,
//     })
    // ;(tar_readable_stream as any).size = -1
    // const result = await s3_client.putObject({
    //   Bucket: backup_config.bucket,
    //   Key: `${Date.now()}`,
    //   Body: tar_readable_stream,
    // })

    // const result = await s3_client.createMultipartUpload({
    //   Bucket: 'minecraft-world-backups',
    //   Key: '2023-12-01/minecraft_save.tar',
    // })

    // console.log({result})
  }

  protected async stop_service(context: Context): Promise<void> {}

  public async status(): Promise<any> {}


  async #upload(s3_key: string, readable: ReadableStream<Uint8Array>, size: number) {
    const r2_account_id = '14ae0a54d268af0231edec7f9e6d8cc0'
    const backup_config = {
      account_id: r2_account_id,
      base_url: `https://${r2_account_id}.r2.cloudflarestorage.com`,
      bucket: 'minecraft-world-backups',
      credentials: {
        accessKeyId: '83453bf644e5a5a56f06d42f4c5b0d7f',
        secretAccessKey: 'cf248a5270acc7ab891a37c2c54904139d3e330b57da59527a15c0d1aacc56c1',
      }
    }

    const s3_client = new aws_sdk_s3({
      accessKeyId: backup_config.credentials.accessKeyId,
      secretAccessKey: backup_config.credentials.secretAccessKey,
      endpoint: backup_config.base_url,
    })

    // const uploads = await s3_client.listMultipartUploads({Bucket: backup_config.bucket }).promise()
    // for (const upload of uploads.Uploads!) {
    //   upload.Key
    //   await s3_client.abortMultipartUpload({
    //     Bucket: backup_config.bucket,
    //     Key: upload.Key!,
    //     UploadId: upload.UploadId!,
    //   }).promise()
    // }


    const multipart_upload = await s3_client.createMultipartUpload({
      Bucket: backup_config.bucket,
      Key: s3_key
    }).promise()

    console.log({multipart_upload})

    const chunk_size = 1024 * 1024 * 1 / 2 // 0.5Mb chunks

    // const streamy = readableStreamFromReader(readable.getReader(), {chunkSize: 1024})
    // const readable_stream = new ReadableStream(readable, new ByteLengthQueuingStrategy({ highWaterMark: 1024 }))

    // const strategy = new ByteLengthQueuingStrategy({ highWaterMark: 2 })
    // const reader = readable.getReader()
    // const readable_stream = new ReadableStream({
    //   async pull(controller) {
    //     console.log('PULL desired size:', controller.desiredSize)
    //     const { done, value } = await reader.read()
    //     if (done) {
    //       controller.close()
    //     } else {
    //       controller.enqueue(value)
    //     }
    //   },
    // }, strategy);


    // throw new Error('eeee')



    let uploaded_size = 0
    let part_number = 1
    let chunk_queue: Uint8Array[] = []
    let queue_size = 0
    const multipart_complete_info: s3.CompletedMultipartUpload = {Parts: []}

    async function upload_chunk() {
      let upload_chunk_position = 0
      const upload_chunk = new Uint8Array(queue_size)
      for (const chunk of chunk_queue) {
        upload_chunk.set(chunk, upload_chunk_position)
        upload_chunk_position += chunk.length
      }
      const result = await s3_client.uploadPart({
        Bucket: backup_config.bucket,
        Key: s3_key,
        PartNumber: part_number,
        UploadId: multipart_upload.UploadId!,
        Body: upload_chunk,
        ContentLength: upload_chunk.length,
      }).promise()
      multipart_complete_info.Parts!.push({PartNumber: part_number, ETag: result.ETag})

      uploaded_size += upload_chunk.length
      part_number += 1
      console.log({chunk_size_mb: upload_chunk.length / 1024 / 1024, part_number, uploaded_size, percentage: uploaded_size / size })

    }
    for await (const chunk of readable) {
      chunk_queue.push(chunk)
      queue_size += chunk.length

      if (queue_size > chunk_size) {
        await upload_chunk()
        queue_size = 0
        chunk_queue = []
      }
      console.log({ queue_size_mb: queue_size / 1024 / 1024 })
    }

    if (queue_size) {
      await upload_chunk()
    }

    console.log('complete multipart...', multipart_upload)
    console.log('for key', s3_key)
    console.log({multipart_complete_info})
    const complete_result = await s3_client.completeMultipartUpload({
      Bucket: backup_config.bucket,
      Key: s3_key,
      UploadId: multipart_upload.UploadId!,
      MultipartUpload: multipart_complete_info
    }).promise()

    console.log({complete_result})
    // const result = await s3_client.listObjects({Bucket: 'minecraft-world-backups'}).promise()

  }
}

export { R2Backups }
