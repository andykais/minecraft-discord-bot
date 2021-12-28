import { serveTls } from "https://deno.land/std@0.119.0/http/server.ts";

function handler(request: Request): Response {
  console.log('received request')
  return new Response('Come along, with me...', { status: 200 })
}

const certFile = Deno.env.get('CERT')
const keyFile = Deno.env.get('CERT_KEY')
if (!certFile || !keyFile) throw new Error('keys must be provided')
const port_str = Deno.env.get('PORT')
const port = port_str ? parseInt(port_str) : 8443
console.log('https server listening on port', port)
await serveTls(handler, { certFile, keyFile, port });
