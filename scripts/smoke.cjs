/**
 * After `npm run build`, starts production server briefly and checks /api/health + /api/dashboard/summary.
 * Defaults to port 3010 so it does not collide with `next dev` on 3000. Override: SMOKE_PORT=3005 npm run smoke
 */
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

const port = process.env.SMOKE_PORT || '3010'
const root = path.join(__dirname, '..')
const isWin = process.platform === 'win32'

const child = spawn(isWin ? 'npx.cmd' : 'npx', ['next', 'start', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  shell: isWin,
  env: { ...process.env, PORT: port },
})

function getJson(p) {
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function shutdown(code) {
  try {
    child.kill(isWin ? undefined : 'SIGTERM')
  } catch {
    /* ignore */
  }
  process.exit(code)
}

async function main() {
  let ok = false
  for (let i = 0; i < 60; i++) {
    try {
      await getJson('/api/health')
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

  const health = await getJson('/api/health')
  if (health.status !== 'healthy') {
    console.error('Smoke: /api/health unexpected body', health)
    shutdown(1)
    return
  }

  const summary = await getJson('/api/dashboard/summary')
  if (summary.status !== 'success') {
    console.error('Smoke: /api/dashboard/summary unexpected body', summary)
    shutdown(1)
    return
  }

  console.log('Smoke: OK (health + dashboard/summary)')
  shutdown(0)
}

main().catch((err) => {
  console.error(err)
  shutdown(1)
})
