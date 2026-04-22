import crypto from 'node:crypto';
import { Client } from 'pg';

const dbConfig = {
  host: process.env.DB_HOST || 'aws-1-eu-central-1.pooler.supabase.com',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.onzbfmwknjuskmwyqtgn',
  password: process.env.DB_PASSWORD || 'Defence02@OpenEx.',
  ssl: { rejectUnauthorized: false },
};

const account = {
  email: 'demo@openex.io',
  displayName: 'OpenEx Demo',
  password: 'OpenEx123!',
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  return `${salt}:${digest}`;
}

function verifyPassword(password, stored) {
  const [saltHex, digestHex] = String(stored || '').split(':');
  if (!saltHex || !digestHex) return false;

  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(digestHex, 'hex');
  if (actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(actual, expected);
}

async function run() {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    const passwordHash = hashPassword(account.password);

    const upsertSql = `
      insert into public.users (email, password_hash, display_name, is_admin)
      values ($1, $2, $3, false)
      on conflict (email)
      do update set
        password_hash = excluded.password_hash,
        display_name = excluded.display_name,
        updated_at = now()
      returning id, email, display_name, created_at, updated_at
    `;

    const createResult = await client.query(upsertSql, [
      account.email,
      passwordHash,
      account.displayName,
    ]);

    const user = createResult.rows[0];

    const loginQuery = await client.query(
      'select id, email, display_name, password_hash from public.users where email = $1',
      [account.email]
    );

    const loginOk =
      loginQuery.rows.length === 1 &&
      verifyPassword(account.password, loginQuery.rows[0].password_hash);

    console.log('ACCOUNT_SAVED=', Boolean(user));
    console.log('LOGIN_OK=', loginOk);
    if (user) {
      console.log('USER_ID=', user.id);
      console.log('USER_EMAIL=', user.email);
      console.log('DISPLAY_NAME=', user.display_name);
    }

    if (!loginOk) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('ERROR=', error.message);
  process.exit(1);
});
