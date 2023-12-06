import * as streams from 'std/streams/mod.ts'
import { EventEmitter } from 'event'
import { Config } from '../config.ts'
import { Context } from '../app.ts'
import { Service } from './mod.ts'

type Entries<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T][]

type Mapper<T> = {
  [K in keyof T]: { type: K; data: T[K]}
}
type ValueOf<T> = T extends Record<string, infer V> ? V : never

interface JavaServerEvents {
  STARTED: { elapsed: string }
  LOGIN: { username: string }
  LOGOUT: { username: string }
  WARNING: { message: string }
  SAVE_ON: {}
  SAVE_OFF: {}
  SAVE_ALL: {}
}
type EventPayload = ValueOf<Mapper<JavaServerEvents>>

const java_server_event_regexes: Record<keyof JavaServerEvents, RegExp> = {
  STARTED: /Done \((?<elapsed>\d+\.\d+[a-z]+)\)/,
  LOGIN: / (?<username>[^ ]*?) joined the game/,
  LOGOUT: / (?<username>[^ ]*?) left the game/,
  WARNING: /WARN.: (?<message>.*)/,
  SAVE_OFF: /Automatic saving is now disabled|Saving is already turned off/,
  SAVE_ALL: /Saved the game/,
  SAVE_ON: /Automatic saving is now enabled|Saving is already turned on/
}

type JavaServerEventEmitterType = {
  [K in keyof JavaServerEvents]: [JavaServerEvents[K]]
}

class JavaServerEventEmitter extends EventEmitter<JavaServerEventEmitterType> {}


type JavaEventHandler = (context: Context, event: EventPayload) => void


class JavaServer extends Service {
  #java_process: Deno.ChildProcess | undefined
  #stdin_encoder = new TextEncoder()
  #promises: Promise<any>[] = []
  #startup_promise_controller = Promise.withResolvers<{elapsed: string}>()
  #emitter: JavaServerEventEmitter
  #parent_event_handler: JavaEventHandler

  get #server() {
    if (this.#java_process) return this.#java_process
    throw new Error('uninitialized')
  }

  constructor(config: Config, event_handler: JavaEventHandler) {
    super(config)
    this.#parent_event_handler = event_handler
    this.#emitter = new JavaServerEventEmitter()
  }

  status() { return Promise.all(this.#promises) }

  async start_service(context: Context) {
    const java_config = {
      version: this.config.minecraft.server.version,
      jar: this.config.minecraft.server.jar_filepath,
      cwd: this.config.minecraft.world.folder,
    }

    const args = ['-Xmx2G', '-Xms2G', '-jar', java_config.jar, 'nogui']
    const command_str = ['java', ...args].join(' ')
    console.log('Launching java server:', command_str)
    console.log('                     :', java_config.cwd)

    await Deno.mkdir(java_config.cwd, { recursive: true })
    const cmd = new Deno.Command('java', {
      args,
      cwd: java_config.cwd,
      stdout: 'piped',
      stderr: 'piped',
      stdin: 'piped',
    })
    this.#java_process = cmd.spawn()


    const status_promise = this.#java_process.status
      .then(status => {
        console.log('Java process exit data:', status)

        if (status.code === 130 && ['STOPPING', 'STOPPED'].includes(this.state)) {
          console.log('Java service gracefully shutdown via SIGINT.')
        }
        else if (status.success === false) {
          const command_str = ['java', ...args].join(' ')
          throw new Error(`Java server failed.\n${command_str}`)
        }
      })

    this.#promises.push(status_promise)
    this.#promises.push(this.#parse_stdout(context))
    this.#promises.push(this.#parse_stderr())

    const result = await this.#startup_promise_controller.promise
  }

  async stop_service() {
    await this.send_command('stop')
    await this.status()
  }

  async #parse_stdout(context: Context) {
    const stdout_stream = this.#server.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new streams.TextDelimiterStream('\n'))

    for await (const line of stdout_stream) {
      console.log(line)
      for (const [event, regex] of Object.entries(java_server_event_regexes)) {
        const match = line.match(regex)
        if (match) {
          const result = match.groups ?? {}
          this.#handle_event(context, { type: event, data: result } as EventPayload)
        }
      }
    }
  }
  async #parse_stderr() {
    const stderr_stream = this.#server.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new streams.TextDelimiterStream('\n'))

    for await (const line of stderr_stream) {
      console.error(line)
    }
  }

  async #handle_event(context: Context, event: EventPayload) {
    console.log('JavaServer event', event)
    this.#emitter.emit(event.type, event.data)
    if (event.type === 'STARTED') this.#startup_promise_controller.resolve(event.data)
    await this.#parent_event_handler(context, event)
  }

  async send_command(command: string) {
    console.log('JavaServer::send_command', {command})
    const stdin_writer = this.#server.stdin.getWriter()
    stdin_writer.write(this.#stdin_encoder.encode(`/${command}\n`))
    stdin_writer.releaseLock()
  }

  async save_on() {
    await this.send_command('save-on')
    await new Promise(resolve => {
      this.#emitter.once('SAVE_ON', resolve)
    })
  }

  async save_off() {
    await this.send_command('save-off')
    await new Promise(resolve => {
      this.#emitter.once('SAVE_OFF', resolve)
    })
  }

  async save_all() {
    await this.send_command('save-all')
    await new Promise(resolve => {
      this.#emitter.once('SAVE_ALL', resolve)
    })
  }
}

export { JavaServer, type JavaServerEvents, type JavaEventHandler }
