import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standalone = path.join(root, ".next", "standalone");
const standaloneStatic = path.join(standalone, ".next", "static");

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  console.error("Missing .next/standalone/server.js. Run `npm run build` first.");
  process.exit(1);
}

fs.rmSync(path.join(standalone, "public"), { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true
});

fs.rmSync(standaloneStatic, { recursive: true, force: true });
fs.mkdirSync(path.dirname(standaloneStatic), { recursive: true });
fs.cpSync(path.join(root, ".next", "static"), standaloneStatic, {
  recursive: true
});

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
    PORT: process.env.PORT ?? "3000"
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
