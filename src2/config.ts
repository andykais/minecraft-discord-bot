import { z } from "https://deno.land/x/zod/mod.ts";
import { exactly } from 'npm:@detachhead/ts-helpers/dist/utilityFunctions/misc'

interface Config {
  minecraft: {
    world_name: string
    server_version: string
    // server properties values, tbd
    world_seed?: string
    world_description?: string
  }
}


const ConfigParser = z.object({
  minecraft: z.object({
    version: z.string(),
  })
})


// exactly({} as z.input<typeof Template>, {} as t.Template)

export { ConfigParser }
export type { Config }
