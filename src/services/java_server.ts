import * as streams from 'std/streams/mod.ts'
import { Config } from '../config.ts'
import { Service } from './mod.ts'

type Entries<T> = {
    [K in keyof T]: [K, T[K]]
}[keyof T][]

interface JavaServerEvents {
  STARTED: { elapsed: string }
  LOGIN: { username: string }
  LOGOUT: { username: string }
  // WARNING: { message: string }
}
type JavaServerEvent = keyof JavaServerEvents
type JavaServerEventParsers = {
  [E in keyof JavaServerEvents]: (line: string) => JavaServerEvents[E] | undefined
}

const java_server_event_regexes: Record<JavaServerEvent, RegExp> = {
  STARTED: /Done \((?<elapsed>\d+\.\d+[a-z]+)\)/,
  LOGIN: / (?<username>[^ ]*?) joined the game/,
  LOGOUT: / (?<username>[^ ]*?) left the game/,
}
const java_server_event_parsers = Object.fromEntries(
  Object.entries(java_server_event_regexes).map(entry => [entry[0], line => line.match(entry[1])?.groups])
) as JavaServerEventParsers


type JavaEventHandler = <T extends JavaServerEvents, E extends keyof T>(event: E, value: T[E]) => Promise<void>
type JavaEventHandler2 = <T extends JavaServerEvents, E extends keyof T>(event: E, fn: (value: T[E]) => void) => void

let foo = {} as JavaEventHandler2
foo('LOGIN', (data) => {
  console.log(data.username)
})
// const foo: JavaEventHandler2 = (event, data) => {
//   if (event === 'LOGIN') {
//     console.log(data.username)
//   }
// }


class JavaServer extends Service {
  #java_process: Deno.ChildProcess | undefined
  #promises: Promise<any>[] = []
  #startup_promise_controller = Promise.withResolvers<{elapsed: string}>()

  get #server() {
    if (this.#java_process) return this.#java_process
    throw new Error('uninitialized')
  }

  constructor(config: Config, event_handler: JavaEventHandler) {
    super(config)
  }

  status() { return Promise.all(this.#promises) }

  async start() {
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
      stderr: 'inherit',
      stdin: 'piped',
    })
    this.#java_process = cmd.spawn()


    const status_promise = this.#java_process.status
      .then(status => {
        if (status.success === false) {
          const command_str = ['java', ...args].join(' ')
          throw new Error(`Java server failed.\n${command_str}`)
        }
      })

    this.#promises.push(status_promise)
    this.#promises.push(this.#parse_stdout())
    // this.#promises.push(this.#parse_stderr())

    const result = await this.#startup_promise_controller.promise
    console.log('Java server is up.')
  }

  async stop() {
    await this.#send_command('stop')
    // this.#java_process.kill('SIGTERM')
  }

  async #parse_stdout() {
    const stdout_stream = this.#server.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new streams.TextDelimiterStream('\n'))

    for await (const line of stdout_stream) {
      console.log(line)
      for (const [event, regex_parser] of Object.entries(java_server_event_parsers) as Entries<JavaServerEventParsers>) {
        const result = regex_parser(line)
        if (result) this.#handle_event(event, result)
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
    // const stderr_output = await streams.toText(
    //   this.#server.stderr
    //     .pipeThrough(new TextDecoderStream())
    // )

  }

  async #handle_event<T extends JavaServerEvents, E extends keyof T>(event: E, value: T[E]) {
    if (event === 'STARTED') this.#startup_promise_controller.resolve(value as JavaServerEvents['STARTED'])
    console.log(event, value)
  }

  async #send_command(command: string) {
    console.log('sending command:', command)
    const stdin_writer = this.#server.stdin.getWriter()
    await stdin_writer.write(new TextEncoder().encode(`/${command}\n`))
    stdin_writer.releaseLock()
  }
}

export { JavaServer, type JavaServerEvents, type JavaEventHandler }
