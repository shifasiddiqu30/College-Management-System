import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Starting College Management System (Part 1)');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

// Start Server
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    console.log(`\x1b[33m[SERVER]\x1b[0m ${line}`);
  });
});

server.stderr.on('data', (data) => {
  console.error(`\x1b[31m[SERVER ERROR]\x1b[0m ${data.toString().trim()}`);
});

// Start Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'pipe',
  shell: true
});

client.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    console.log(`\x1b[34m[CLIENT]\x1b[0m ${line}`);
  });
});

client.stderr.on('data', (data) => {
  console.error(`\x1b[31m[CLIENT ERROR]\x1b[0m ${data.toString().trim()}`);
});

const cleanup = () => {
  console.log('\n\x1b[33mShutting down servers...\x1b[0m');
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
