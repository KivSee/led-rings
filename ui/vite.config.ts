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

/** Saving a song (the editor's Save / Send to LEDs writes src/songs/<name>.json) must not reload the open pages. The
 *  Sequence Player, Song Sync and the Section Lab import the song JSONs, and Vite answers a change to one with a full
 *  reload of every open page, the editor included; those pages read the song when they load, so a reload of their
 *  own picks the change up. */
function quietSongSaves(): Plugin {
  return {
    name: 'quiet-song-saves',
    handleHotUpdate({ file }) {
      if (/[\\/]src[\\/]songs[\\/][^\\/]+\.json$/.test(file)) return []
    },
  }
}

export default defineConfig({
  plugins: [react(), exportSequence(), quietSongSaves()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      // Song Sync, the Sequence Player and the Section Lab are pages next to the main app.
      input: {
        main: 'index.html',
        sync: 'sync.html',
        player: 'player.html',
        lab: 'lab.html',
      },
    },
  },
})
