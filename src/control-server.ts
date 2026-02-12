/**
 * Control server for the Timeline UI: send-sequence, start-song, stop.
 * Run from repo root: npx ts-node-dev src/control-server.ts
 * Set CONTROL_SERVER_PORT (default 3080).
 */
import http from "http";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { sendSequence } from "./services/sequence";
import { startSong, stop } from "./services/trigger";

const PORT = parseInt(process.env.CONTROL_SERVER_PORT || "3080", 10);
const ROOT = process.cwd();

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

  send(res, 404, JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`Control server listening on http://localhost:${PORT}`);
});
