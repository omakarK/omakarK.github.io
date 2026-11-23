import { text } from 'node:stream/consumers';
import { hashPassword } from './auth';
import { atomic, pool, run } from './db';

async function createAdmin() {
  const username = (process.argv[2] || '').trim().toLowerCase();
  const password = (await text(process.stdin)).replace(/\r?\n$/, '');
  if (!/^[a-z0-9][a-z0-9_.-]{2,79}$/.test(username) || password.length < 12 || password.length > 256) {
    throw new Error('Provide a 3–80 character username and send a 12–256 character password on stdin.');
  }

  const hash = await hashPassword(password);
  await atomic(async () => {
    await run(`INSERT INTO admins (username, password_hash) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE password_hash = ?`, username, hash, hash);
    await run('DELETE FROM admin_sessions WHERE username = ?', username);
  }, false)();
  console.log(`Admin "${username}" is ready.`);
}

createAdmin().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
