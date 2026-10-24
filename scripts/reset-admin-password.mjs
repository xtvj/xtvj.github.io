import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, writeFile, unlink, rmdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PASSWORD_ITERATIONS, passwordHash, randomHex, validPassword } from '../workers/post-views/auth.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = process.argv.includes('--local');

async function passwords() {
  if (!process.stdin.isTTY) {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const [first, second] = input.split(/\r?\n/);
    return [first, second];
  }
  const hidden = (prompt) => new Promise((resolvePassword, reject) => {
    let value = '';
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const finish = (error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolvePassword(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u0003') return finish(new Error('Cancelled'));
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    process.stdin.on('data', onData);
  });
  return [await hidden('New admin password: '), await hidden('Confirm password: ')];
}

const [password, confirmation] = await passwords();
if (!validPassword(password)) throw new Error('Password must contain 8–128 characters.');
if (password !== confirmation) throw new Error('Passwords do not match.');

const salt = randomHex();
const hash = await passwordHash(password, salt, PASSWORD_ITERATIONS);
const migration = await readFile(join(root, 'workers/post-views/admin-password.sql'), 'utf8');
const sql = `${migration}\nINSERT INTO admin_auth (id, salt, password_hash, iterations, version, updated_at)
VALUES (1, '${salt}', '${hash}', ${PASSWORD_ITERATIONS}, 1, ${Math.floor(Date.now() / 1000)})
ON CONFLICT(id) DO UPDATE SET
  salt = excluded.salt,
  password_hash = excluded.password_hash,
  iterations = excluded.iterations,
  version = admin_auth.version + 1,
  updated_at = excluded.updated_at;\n`;

const directory = await mkdtemp(join(tmpdir(), 'xtvj-admin-reset-'));
const file = join(directory, 'reset.sql');
try {
  await writeFile(file, sql, { mode: 0o600 });
  const args = [
    'wrangler', 'd1', 'execute', 'xtvj-post-views', local ? '--local' : '--remote',
    `--file=${file}`, '--config', 'workers/post-views/wrangler.toml',
  ];
  let executable = 'npx';
  if (process.platform === 'win32') {
    executable = process.execPath;
    const npxCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
    await access(npxCli);
    args.unshift(npxCli);
  }
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler exited with status ${result.status}`);
  console.log(local ? 'Local admin password reset.' : 'Cloudflare admin password reset. Existing sessions are invalid.');
} finally {
  await unlink(file);
  if (!resolve(directory).startsWith(`${resolve(tmpdir())}${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error('Unexpected temporary directory; refusing to remove it.');
  }
  await rmdir(directory);
}
