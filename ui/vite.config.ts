import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile, spawn, type ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/** POST /api/export-sequence?song=<name>: run src/songs/<name>.ts and save what it sends, for the Sequence Player. */
function exportSequence(): Plugin {
  return {
    name: 'export-sequence',
    configureServer(server) {
      server.middlewares.use('/api/export-sequence', (req, res) => {
        const song = new URL(req.url ?? '', 'http://localhost').searchParams.get('song') ?? ''
        if (req.method !== 'POST' || !/^[\w .-]+$/.test(song)) {
          res.statusCode = 400
          res.end('POST with ?song=<name of a file in src/songs>')
          return
        }
        const root = path.resolve(__dirname, '..')
        execFile('npx', ['ts-node', 'src/export-sequence.ts', `src/songs/${song}.ts`], { cwd: root, timeout: 120000 }, (err, stdout, stderr) => {
          res.statusCode = err ? 500 : 200
          res.end(err ? `${stderr || err.message}` : stdout)
        })
      })
    },
  }
}

/**
 * GET /api/gallery?part=<key>&op=meta, &op=build&indices=<i,j,…>&speed=&hit=&variation=, or
 * &op=overlay&indices=<overlays>&roles=<AAAB>&mix=<the part's picks, JSON>&used=<overlays used per block, JSON>: the option gallery's
 * data (ui/gallery.html). A worker running src/songs/shemesh-gallery-options.ts --serve builds the sequences on
 * request; it is restarted when that file changes, so edits show on the next reload.
 */
function galleryApi(): Plugin {
  const root = path.resolve(__dirname, '..')
  const script = path.join(root, 'src/songs/shemesh-gallery-options.ts')
  let worker: ChildProcess | null = null
  let workerMtime = 0
  let nextId = 1
  const pending = new Map<number, (answer: { result?: unknown; error?: string }) => void>()
  const ensureWorker = () => {
    const mtime = fs.statSync(script).mtimeMs
    if (worker && mtime === workerMtime) return worker
    worker?.kill()
    workerMtime = mtime
    const w = spawn('npx', ['ts-node', '--transpile-only', script, '--serve'], { cwd: root })
    let buffer = ''
    w.stdout!.on('data', chunk => {
      buffer += chunk
      let nl
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 1)
        try {
          const answer = JSON.parse(line)
          pending.get(answer.id)?.(answer)
          pending.delete(answer.id)
        } catch { /* not an answer */ }
      }
    })
    w.stderr!.on('data', chunk => console.error(`[gallery] ${chunk}`))
    w.on('exit', () => {
      if (worker !== w) return
      worker = null
      pending.forEach(reply => reply({ error: 'gallery worker exited' }))
      pending.clear()
    })
    worker = w
    return w
  }
  // The candidates picked in the gallery, per part: saved for shemesh.ts.
  const mixFile = path.join(root, 'src/songs/shemesh-gallery-mix.json')
  return {
    name: 'gallery-api',
    configureServer(server) {
      // POST /api/gallery-mix?part=<key>, body: the part's picks per block ({ option, variation, speed, hit }).
      server.middlewares.use('/api/gallery-mix', (req, res) => {
        const part = new URL(req.url ?? '', 'http://localhost').searchParams.get('part') ?? ''
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const mix = fs.existsSync(mixFile) ? JSON.parse(fs.readFileSync(mixFile, 'utf8')) : {}
            mix[part] = JSON.parse(body)
            fs.writeFileSync(mixFile, JSON.stringify(mix, null, 2) + '\n')
            res.end('saved')
          } catch (e) {
            res.statusCode = 400
            res.end(String(e))
          }
        })
      })
      server.middlewares.use('/api/gallery', (req, res) => {
        const q = new URL(req.url ?? '', 'http://localhost').searchParams
        const id = nextId++
        const request = {
          id, op: q.get('op') ?? 'meta', part: q.get('part') ?? '',
          indices: (q.get('indices') ?? '').split(',').filter(Boolean).map(Number),
          speed: q.get('speed') ?? 'medium', hit: q.get('hit') ?? 'beat', variation: Number(q.get('variation') ?? 0),
          // For op=overlay: the role pattern and the part's mix (picks by block) under the overlays.
          roles: q.get('roles') ?? undefined, mix: q.get('mix') ? JSON.parse(q.get('mix')!) : undefined,
          used: q.get('used') ? JSON.parse(q.get('used')!) : undefined,
        }
        pending.set(id, answer => {
          res.statusCode = answer.error ? 500 : 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(answer.error ? { error: answer.error } : answer.result))
        })
        ensureWorker().stdin!.write(JSON.stringify(request) + '\n')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), exportSequence(), galleryApi()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      // Song Sync and the Sequence Player are pages next to the main app.
      input: {
        main: 'index.html',
        sync: 'sync.html',
        player: 'player.html',
        gallery: 'gallery.html',
      },
    },
  },
})
