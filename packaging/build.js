'use strict'
/**
 * Builds the lightweight Windows package: vite-builds the UI, strips any local audio
 * test assets out of the build (they're gitignored but vite still copies whatever's
 * sitting in ui/public on disk), then embeds the build into packaging/static-server.js
 * via pkg's asset snapshot, producing a single self-contained .exe — nothing else to ship.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const UI_DIR = path.join(ROOT, 'ui')
const UI_DIST = path.join(UI_DIR, 'dist')
const PACKAGING_DIR = __dirname
const PACKAGING_DIST = path.join(PACKAGING_DIR, 'dist')
const RELEASE_DIR = path.join(ROOT, 'release')
const EXE_PATH = path.join(RELEASE_DIR, 'kivsee-time-simulator.exe')

const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aac'])

function run(cmd, cwd) {
  console.log(`> ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function stripAudioAssets(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      stripAudioAssets(full)
    } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      console.log(`Stripping audio asset from package: ${path.relative(ROOT, full)}`)
      fs.unlinkSync(full)
    }
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

console.log('--- Building UI (vite build) ---')
run('npm run build', UI_DIR)

console.log('--- Stripping audio assets (kept out of the packaged app on purpose) ---')
stripAudioAssets(UI_DIST)

console.log('--- Staging build for embedding ---')
fs.rmSync(PACKAGING_DIST, { recursive: true, force: true })
copyDir(UI_DIST, PACKAGING_DIST)

try {
  console.log('--- Packaging static server + embedded UI into a single Windows exe (pkg) ---')
  fs.mkdirSync(RELEASE_DIR, { recursive: true })
  // Invoke the locally-installed devDependency directly rather than via `npx`, which
  // doesn't reliably find it from packaging/'s own package.json and re-fetches it instead.
  const pkgBin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'pkg.cmd' : 'pkg')
  run(`"${pkgBin}" . --output "${EXE_PATH}"`, PACKAGING_DIR)
} finally {
  fs.rmSync(PACKAGING_DIST, { recursive: true, force: true })
}

console.log(`\nDone. ${path.relative(ROOT, EXE_PATH)} is fully self-contained — hand out just that file.`)
