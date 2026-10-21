import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

// Each invocation owns a new database. Never read, seed, or reset the user's DB.
const directory = mkdtempSync(join(tmpdir(), 'budgeteer-e2e-'));
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const env = { ...process.env, DATABASE_URL: `file:${join(directory, 'test.db')}`, NEXT_TELEMETRY_DISABLED: '1' };
let server;
function cleanup() { rmSync(directory, { recursive: true, force: true }); }
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { if (server) server.kill(signal); else { cleanup(); process.exit(0); } });
}
for (const args of [['prisma', 'generate'], ['prisma', 'migrate', 'deploy'], ['next', 'build']]) {
  const result = spawnSync(npx, args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) { cleanup(); process.exit(result.status ?? 1); }
}
server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3217'], { env, stdio: 'inherit' });
server.on('exit', (code) => { cleanup(); process.exit(code ?? 0); });
