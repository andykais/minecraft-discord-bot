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

  discord: {
    messages_channel: bigint
  }
}


export type { Config }
