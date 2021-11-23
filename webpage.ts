function create_server() {
  const port = parseInt(Deno.env.get('PORT') ?? '8001')
  if (isNaN(port)) throw new Error('invalid port specified')
  const certFile = Deno.env.get('CERT')
  const keyFile = Deno.env.get('CERT_KEY')

  if (certFile && keyFile) {
    console.log('Spinning up https server')
    return Deno.listenTls({
      port: 443,
      certFile,
      keyFile,
    })
  } else {
    console.log('listening on port', port)
    return Deno.listen({ port })
  }
}

const server = create_server()
for await (const conn of server) {
  handle_conn(conn)
}

async function handle_conn(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  try {
    for await (const requestEvent of httpConn) {
      await requestEvent.respondWith(
        new Response("Come along, with me...", {
          status: 200,
        }),
      )
    }
  } catch (e) {
    if (e instanceof Deno.errors.Http) {}
    throw e
  }
}
