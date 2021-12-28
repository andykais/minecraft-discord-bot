import * as z from 'https://deno.land/x/zod@v3.11.6/mod.ts'
import * as yaml from "https://deno.land/std@0.119.0/encoding/yaml.ts";


const EnvVars = z.object({
  DISCORD_TOKEN: z.string(),
  CERT: z.string(),
  CERT_KEY: z.string(),
})

const ObjExportVars = z.object({
  name: z.string(),

  chunks: z.object({
    min_x: z.number(),
    min_y: z.number(),
    max_x: z.number(),
    max_y: z.number(),
  }),

  height: z.object({
    min: z.number(),
    max: z.number()
  })
})

const ConfigVars = z.object({
  server_name: z.string(),
  minecraft_server_version: z.string(),
  obj_exports: ObjExportVars.array(),
})

class Config {
  static async read(path: string) {
    const file_contents = await Deno.readTextFile(path)
    const raw_config = await yaml.parse(file_contents)
    const config_data = ConfigVars.parse(raw_config)
    return config_data
  }
}

const config = await Config.read('./sample-config.yaml')
console.log(config)
