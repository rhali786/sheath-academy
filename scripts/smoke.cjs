/**
 * After `npm run build`, starts production server briefly and checks /api/health,
 * then verifies a stylesheet linked from /login actually loads (same build id).
 *
 * Default port is an ephemeral free port so this never talks to a stale `next start`
 * left on 3010 (which causes ChunkLoadError / 4xx on /_next/static/*).
 * Pin a port: SMOKE_PORT=3010 npm run smoke — must be free or spawn will fail.
 */
const { spawn } = require('child_process')
const http = require('http')
const net = require('net')
const path = require('path')

const root = path.join(__dirname, '..')
const isWin = process.platform === 'win32'

/** @type {import('child_process').ChildProcess | null} */
let child = null

function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.unref()
    s.listen(0, '127.0.0.1', () => {
      const addr = s.address()
      const p = typeof addr === 'object' && addr ? addr.port : 0
      s.close(() => resolve(String(p)))
    })
    s.on('error', reject)
  })
}

function getJson(port, p) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${p}`, (res) => {
      let body = ''
      res.on('data', (c) => {
        body += c
      })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`${p} HTTP ${res.statusCode}`))
          return
        }
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
  })
}

function getStatusAndBody(port, p) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${p}`, (res) => {
      let body = ''
      res.on('data', (c) => {
        body += c
      })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body })
      })
    })
    req.on('error', reject)
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function shutdown(code) {
  try {
    if (child) child.kill(isWin ? undefined : 'SIGTERM')
  } catch {
    /* ignore */
  }
  process.exit(code)
}

async function main() {
  const port = process.env.SMOKE_PORT || (await getFreePort())

  child = spawn(isWin ? 'npx.cmd' : 'npx', ['next', 'start', '-p', port], {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, PORT: port },
  })

  let ok = false
  for (let i = 0; i < 60; i++) {
    try {
      await getJson(port, '/api/health')
      ok = true
      break
    } catch {
      await sleep(500)
    }
  }
  if (!ok) {
    console.error('Smoke: server did not become ready in time')
    shutdown(1)
    return
  }

  const health = await getJson(port, '/api/health')
  if (health.status !== 'healthy') {
    console.error('Smoke: /api/health unexpected body', health)
    shutdown(1)
    return
  }

  const login = await getStatusAndBody(port, '/login')
  if (login.statusCode !== 200) {
    console.error('Smoke: GET /login expected 200, got', login.statusCode)
    shutdown(1)
    return
  }
  const cssHref = login.body.match(/href="(\/_next\/static\/css\/[^"]+\.css)"/)
  if (!cssHref) {
    console.error('Smoke: no /_next/static/css/*.css link in /login HTML')
    shutdown(1)
    return
  }
  const cssPath = cssHref[1]
  const cssRes = await getStatusAndBody(port, cssPath)
  if (cssRes.statusCode !== 200) {
    console.error(
      `Smoke: GET ${cssPath} returned ${cssRes.statusCode} (stale .next or HTML not from this server?)`,
    )
    shutdown(1)
    return
  }

  const chunkHref = login.body.match(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/)
  if (chunkHref) {
    const chunkPath = chunkHref[1]
    const chunkRes = await getStatusAndBody(port, chunkPath)
    if (chunkRes.statusCode !== 200) {
      console.error(
        `Smoke: GET ${chunkPath} returned ${chunkRes.statusCode} (stale .next or HTML not from this server?)`,
      )
      shutdown(1)
      return
    }
  }

  console.log(`Smoke: OK (health + static assets on port ${port})`)
  shutdown(0)
}

main().catch((err) => {
  console.error(err)
  shutdown(1)
})
