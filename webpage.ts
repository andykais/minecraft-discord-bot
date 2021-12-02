import { serve, serveTls } from "https://deno.land/std@0.115.1/http/server.ts";
import type { ServeInit } from "https://deno.land/std@0.115.1/http/server.ts"

function handler(request: Request): Response {
	console.log('received request')
  return new Response('Come along, with me...', { status: 200 })
}

async function launch_server() {
  const certFile = Deno.env.get('CERT')
  const keyFile = Deno.env.get('CERT_KEY')
  if (certFile && keyFile) {
    console.log('https server listening on port', 443)
    await serveTls(handler, {certFile, keyFile})
  } else {
    const port = parseInt(Deno.env.get('PORT') ?? '8001')
    if (isNaN(port)) throw new Error('invalid port specified')
    console.log('http server listening on port', port)
    await serve(handler, { addr: `:${port}` })
  }
}


await launch_server()
