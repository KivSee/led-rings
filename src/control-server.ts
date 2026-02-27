/**
 * Control server for the Timeline UI: send-sequence, start-song, stop.
 * Run from repo root: npx ts-node-dev src/control-server.ts
 * Set CONTROL_SERVER_PORT (default 3080).
 */
import http from "http";
import path from "path";
import fs from "fs";
import { spawn, execSync } from "child_process";
import { sendSequence } from "./services/sequence";
import { startSong, stop, trigger } from "./services/trigger";

const PORT = parseInt(process.env.CONTROL_SERVER_PORT || "3080", 10);
const ROOT = process.cwd();

/** Find a Python executable that has librosa installed. */
function findPython(): string {
  const candidates = [
    process.env.PYTHON,
    "python",
    "python3",
  ].filter(Boolean) as string[];

  // Also check for virtualenvs in common locations
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const venvGlob = path.join(home, ".virtualenvs");
  try {
    if (fs.existsSync(venvGlob)) {
      for (const dir of fs.readdirSync(venvGlob)) {
        const winPath = path.join(venvGlob, dir, "Scripts", "python.exe");
        const unixPath = path.join(venvGlob, dir, "bin", "python");
        if (fs.existsSync(winPath)) candidates.push(winPath);
        else if (fs.existsSync(unixPath)) candidates.push(unixPath);
      }
    }
  } catch {}

  for (const cmd of candidates) {
    try {
      execSync(`"${cmd}" -c "import librosa"`, { stdio: "ignore", timeout: 10000 });
      return cmd;
    } catch {}
  }
  return "python"; // fallback
}

const PYTHON_CMD = findPython();

function send(res: http.ServerResponse, status: number, body: string, contentType = "application/json") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function cors(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleSendSequence(runnerCode: string, res: http.ServerResponse) {
  const runnerPath = path.join(ROOT, "src", ".tmp-sequence-runner.ts");
  const outPath = path.join(ROOT, ".tmp-sequence-out.json");
  try {
    fs.writeFileSync(runnerPath, runnerCode, "utf8");
  } catch (e) {
    console.error("Failed to write runner file", e);
    send(res, 500, JSON.stringify({ error: "Failed to write runner file" }));
    return;
  }

  // Use same Node as this process; avoid npx (ENOENT on Windows when PATH is minimal)
  const child = spawn(process.execPath, ["-r", "ts-node/register", "src/.tmp-sequence-runner.ts"], {
    cwd: ROOT,
    env: { ...process.env, TMP_SEQUENCE_OUT: outPath },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (d) => { stderr += d.toString(); });
  child.stdout?.on("data", () => {});

  await new Promise<void>((resolve) => child.on("close", (code) => resolve()));

  try {
    fs.unlinkSync(runnerPath);
  } catch (_) {}

  if (child.exitCode !== 0) {
    console.error("Runner failed", stderr);
    send(res, 500, JSON.stringify({ error: "Runner failed", stderr: stderr.slice(0, 500) }));
    return;
  }

  let data: { triggerName: string; sequence: Record<string, unknown> };
  try {
    const raw = fs.readFileSync(outPath, "utf8");
    fs.unlinkSync(outPath);
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read runner output", e);
    send(res, 500, JSON.stringify({ error: "Failed to read runner output" }));
    return;
  }

  try {
    await sendSequence(data.triggerName, data.sequence as any);
    send(res, 200, JSON.stringify({ ok: true, triggerName: data.triggerName }));
  } catch (e) {
    console.error("sendSequence failed", e);
    send(res, 500, JSON.stringify({ error: "sendSequence failed" }));
  }
}

async function handleParseSong(songCode: string, fileName: string, res: http.ServerResponse) {
  // Write to src/songs/ so relative imports (../effects/, ../time/, etc.) resolve
  const safeName = `.tmp-parse-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const songPath = path.join(ROOT, "src", "songs", safeName);
  const outPath = path.join(ROOT, `.tmp-parse-out-${Date.now()}.json`);
  try {
    fs.writeFileSync(songPath, songCode, "utf8");
  } catch (e) {
    console.error("Failed to write temp song file", e);
    send(res, 500, JSON.stringify({ error: "Failed to write temp song file" }));
    return;
  }

  // Run export-song.ts in a child process for isolation
  const child = spawn(process.execPath, ["-r", "ts-node/register", "src/export-song.ts", songPath], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (d) => { stderr += d.toString(); });
  child.stdout?.on("data", () => {});

  await new Promise<void>((resolve) => child.on("close", () => resolve()));

  try { fs.unlinkSync(songPath); } catch (_) {}

  if (child.exitCode !== 0) {
    console.error("Parse song failed", stderr);
    send(res, 500, JSON.stringify({ error: "Parse song failed", stderr: stderr.slice(0, 500) }));
    return;
  }

  // export-song.ts writes to <songPath>.json (replacing .ts with .json)
  const jsonPath = songPath.replace(/\.ts$/, ".json");
  try {
    const raw = fs.readFileSync(jsonPath, "utf8");
    fs.unlinkSync(jsonPath);
    send(res, 200, raw);
  } catch (e) {
    console.error("Failed to read parse output", e);
    send(res, 500, JSON.stringify({ error: "Failed to read parse output" }));
  }
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "";
  const pathname = url.split("?")[0];

  if (req.method === "POST" && pathname === "/api/send-sequence") {
    const body = await parseBody(req);
    let payload: { runnerCode?: string };
    try {
      payload = JSON.parse(body);
    } catch {
      send(res, 400, JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    if (typeof payload.runnerCode !== "string") {
      send(res, 400, JSON.stringify({ error: "Missing runnerCode" }));
      return;
    }
    await handleSendSequence(payload.runnerCode, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/start-song") {
    const body = await parseBody(req);
    let payload: { songName?: string; startOffsetSeconds?: number };
    try {
      payload = JSON.parse(body);
    } catch {
      send(res, 400, JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    if (typeof payload.songName !== "string") {
      send(res, 400, JSON.stringify({ error: "Missing songName" }));
      return;
    }
    try {
      await startSong(payload.songName, payload.startOffsetSeconds);
      send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("startSong failed", e);
      send(res, 500, JSON.stringify({ error: "startSong failed" }));
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/trigger") {
    const body = await parseBody(req);
    let payload: { triggerName?: string };
    try {
      payload = JSON.parse(body);
    } catch {
      send(res, 400, JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    if (typeof payload.triggerName !== "string") {
      send(res, 400, JSON.stringify({ error: "Missing triggerName" }));
      return;
    }
    try {
      await trigger(payload.triggerName);
      send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("trigger failed", e);
      send(res, 500, JSON.stringify({ error: "trigger failed" }));
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/stop") {
    try {
      await stop();
      send(res, 200, JSON.stringify({ ok: true }));
    } catch (e) {
      console.error("stop failed", e);
      send(res, 500, JSON.stringify({ error: "stop failed" }));
    }
    return;
  }

  if (req.method === "POST" && pathname === "/api/parse-song") {
    const body = await parseBody(req);
    let payload: { songCode?: string; fileName?: string };
    try {
      payload = JSON.parse(body);
    } catch {
      send(res, 400, JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    if (typeof payload.songCode !== "string") {
      send(res, 400, JSON.stringify({ error: "Missing songCode" }));
      return;
    }
    await handleParseSong(payload.songCode, payload.fileName || "import.ts", res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/detect-beats") {
    const body = await parseBody(req);
    let payload: { audioFilePath?: string };
    try {
      payload = JSON.parse(body);
    } catch {
      send(res, 400, JSON.stringify({ error: "Invalid JSON" }));
      return;
    }
    if (typeof payload.audioFilePath !== "string") {
      send(res, 400, JSON.stringify({ error: "Missing audioFilePath" }));
      return;
    }
    // Resolve audio path: try as-is first, then check ui/public/ (where audio files live for the UI)
    let audioPath = path.resolve(ROOT, payload.audioFilePath);
    if (!fs.existsSync(audioPath)) {
      const publicPath = path.resolve(ROOT, "ui", "public", payload.audioFilePath);
      if (fs.existsSync(publicPath)) audioPath = publicPath;
    }
    const scriptPath = path.join(ROOT, "scripts", "detect_beats.py");
    const child = spawn(PYTHON_CMD, [scriptPath, audioPath], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.stderr?.on("data", (d) => { stderr += d.toString(); });

    await new Promise<void>((resolve) => child.on("close", () => resolve()));

    if (child.exitCode !== 0) {
      console.error("Beat detection failed", stderr);
      send(res, 500, JSON.stringify({ error: "Beat detection failed", stderr: stderr.slice(0, 500) }));
      return;
    }

    // Read the output .beats.json file
    const beatsPath = audioPath.replace(/\.[^.]+$/, ".beats.json");
    try {
      const raw = fs.readFileSync(beatsPath, "utf8");
      send(res, 200, raw);
    } catch (e) {
      console.error("Failed to read beats file", e);
      send(res, 500, JSON.stringify({ error: "Failed to read beats file" }));
    }
    return;
  }

  send(res, 404, JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`Control server listening on http://localhost:${PORT}`);
  console.log(`Python for beat detection: ${PYTHON_CMD}`);
});
