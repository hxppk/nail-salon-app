#!/usr/bin/env node
import { execSync } from 'node:child_process';

const port = process.argv[2] || '5225';

function sh(cmd) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }).trim();
}

try {
  const platform = process.platform;
  if (platform === 'win32') {
    const out = sh(`netstat -ano | findstr :${port}`);
    const lines = out.split(/\r?\n/).filter(Boolean);
    const pids = new Set(
      lines
        .map(l => l.trim().split(/\s+/).pop())
        .filter(Boolean)
    );
    if (pids.size === 0) {
      console.log(`No process is listening on port ${port}`);
      process.exit(0);
    }
    for (const pid of pids) {
      console.log(`Killing PID ${pid} on port ${port}...`);
      sh(`taskkill /PID ${pid} /F`);
    }
  } else {
    // macOS / Linux
    const pids = sh(`lsof -ti tcp:${port} || true`)
      .split(/\r?\n/)
      .filter(Boolean);
    if (pids.length === 0) {
      console.log(`No process is listening on port ${port}`);
      process.exit(0);
    }
    console.log(`Killing PIDs [${pids.join(', ')}] on port ${port}...`);
    sh(`kill -9 ${pids.join(' ')}`);
  }
  console.log(`Port ${port} freed.`);
} catch (e) {
  console.error(`Failed to free port ${port}:`, e.message || e);
  process.exit(1);
}
