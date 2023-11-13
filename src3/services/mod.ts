import { type Context } from '../app.ts'


abstract class Service {
  #context: Context | undefined

  get context() {
    if (this.#context) return this.#context
    throw new Error('Uninitialized. Please use the Service::start method to access Service::context')
  }
  set context(context: Context) { this.#context = context }

  abstract start(): Promise<void>
  abstract stop(): Promise<void>
}

export { Service }
