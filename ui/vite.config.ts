import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'child_process'
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

export default defineConfig({
  plugins: [react(), exportSequence()],
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
      },
    },
  },
})
