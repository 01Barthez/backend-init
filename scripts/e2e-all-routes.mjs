#!/usr/bin/env node
/**
 * Full live endpoint suite against a running API (default http://127.0.0.1:3000).
 * Covers system, auth, TOTP, users self+admin, blogs, files, oauth list, audit.
 *
 * Usage:
 *   source /tmp/be-test-env.sh   # optional Basic creds
 *   node scripts/e2e-all-routes.mjs
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const API = `${BASE}/api/v1`;
const BASIC_USER = process.env.ADMIN_BASIC_USER || process.env.SWAGGER_USER || 'admin';
const BASIC_PASS = process.env.ADMIN_BASIC_PASSWORD || process.env.SWAGGER_PASSWORD || 'admin';
const basicHeader = 'Basic ' + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString('base64');

const PASS = 'TestPassw0rd!234';
const stamp = Date.now();
const email = `e2e.${stamp}@example.com`;
const adminEmail = `e2e.admin.${stamp}@example.com`;
const inviteEmail = `e2e.invite.${stamp}@example.com`;

let fail = 0;
let pass = 0;
let access = '';
let refresh = '';
let cookies = '';
let userId = '';
let adminAccess = '';
let adminId = '';
let familyId = '';
let blogId = '';
let blogSlug = '';
let recoveryCode = '';
let totpSecret = '';
let inviteIdFromInvite = '';

const log = (m) => console.log(m);

function mergeCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  const list = raw.length ? raw : [];
  // Node <18 fallback
  const single = res.headers.get('set-cookie');
  const parts = list.length ? list : single ? [single] : [];
  for (const c of parts) {
    const pair = c.split(';')[0];
    const name = pair.split('=')[0];
    const rest = cookies
      .split('; ')
      .filter(Boolean)
      .filter((x) => !x.startsWith(name + '='));
    rest.push(pair);
    cookies = rest.join('; ');
    if (name.toLowerCase().includes('refresh') || name === 'refreshToken') {
      refresh = pair.slice(name.length + 1);
    }
  }
}

async function req(
  method,
  url,
  { expect, name, body, auth = 'none', headers = {}, form, redirect } = {},
) {
  const h = { ...headers };
  if (!form) h['Content-Type'] = h['Content-Type'] || 'application/json';
  if (auth === 'bearer' && access) h.Authorization = `Bearer ${access}`;
  if (auth === 'admin' && adminAccess) h.Authorization = `Bearer ${adminAccess}`;
  if (auth === 'basic') h.Authorization = basicHeader;
  if (cookies) h.Cookie = cookies;

  const init = { method, headers: h };
  if (redirect) init.redirect = redirect;
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  if (form) init.body = form;

  let res;
  let text = '';
  try {
    res = await fetch(url, init);
    mergeCookies(res);
    text = await res.text();
  } catch (e) {
    log(`FAIL [network] ${name} :: ${e.message}`);
    fail++;
    return { status: 0, json: null, text: '' };
  }

  const ok =
    typeof expect === 'number'
      ? res.status === expect
      : Array.isArray(expect)
        ? expect.includes(res.status)
        : false;

  if (ok) {
    log(`OK  [${res.status}] ${name}`);
    pass++;
  } else {
    log(`FAIL [${res.status}!=${expect}] ${name} :: ${text.slice(0, 220)}`);
    fail++;
  }

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function waitOtp(forEmail, tries = 25) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 800));
    const msgs = await fetch('http://127.0.0.1:8025/api/v2/messages').then((r) => r.json());
    for (const m of msgs.items || []) {
      const blob = JSON.stringify(m).toLowerCase();
      if (!blob.includes(forEmail.toLowerCase())) continue;
      let body = m.Content?.Body || '';
      for (const p of m.MIME?.Parts || []) body += p.Body || '';
      const hit = body.match(/\b(\d{4,8})\b/);
      if (hit) return hit[1];
    }
  }
  return '';
}

async function promoteToAdmin(targetUserId) {
  // Use Prisma via mongosh-free approach: call through temporary script using DATABASE_URL
  const { execFileSync } = await import('child_process');
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    (async () => {
      const role = await p.role.findUnique({ where: { slug: 'admin' } });
      if (!role) throw new Error('admin role missing — run seed');
      await p.userRole.upsert({
        where: { userId_roleId: { userId: '${targetUserId}', roleId: role.id } },
        create: { userId: '${targetUserId}', roleId: role.id },
        update: {},
      });
      // drop default user role optional
      console.log('promoted');
      await p.$disconnect();
    })().catch(e => { console.error(e); process.exit(1); });
  `;
  const env = { ...process.env };
  // Prefer localhost mongo for host-side prisma
  if (env.DATABASE_URL?.includes('@mongo:')) {
    env.DATABASE_URL = env.DATABASE_URL.replace('@mongo:', '@127.0.0.1:');
    if (!env.DATABASE_URL.includes('directConnection')) {
      env.DATABASE_URL += (env.DATABASE_URL.includes('?') ? '&' : '?') + 'directConnection=true';
    }
  }
  execFileSync('node', ['-e', script], { env, stdio: 'pipe', cwd: process.cwd() });
}

async function clearRateLimits() {
  const { execFileSync } = await import('child_process');
  try {
    execFileSync(
      'docker',
      [
        'exec',
        'BACKEND_CACHE',
        'sh',
        '-c',
        'redis-cli --scan --pattern \'rl:*\' | while read -r k; do [ -n "$k" ] && redis-cli DEL "$k" >/dev/null; done; true',
      ],
      { stdio: 'ignore' },
    );
  } catch {
    log('WARN clearRateLimits skipped (redis container unavailable)');
  }
}

async function main() {
  await clearRateLimits();
  log('=== SYSTEM ===');
  await req('GET', `${BASE}/health`, { expect: 200, name: 'GET /health' });
  await req('GET', `${BASE}/health/live`, { expect: 200, name: 'GET /health/live' });
  await req('GET', `${BASE}/health/ready`, { expect: 200, name: 'GET /health/ready' });
  await req('GET', `${BASE}/csrf-token`, { expect: 200, name: 'GET /csrf-token' });
  await req('GET', `${BASE}/metrics`, { expect: 401, name: 'GET /metrics no auth', auth: 'none' });
  await req('GET', `${BASE}/metrics`, { expect: 200, name: 'GET /metrics basic', auth: 'basic' });
  await req('POST', `${BASE}/security/csp-violation`, {
    expect: 204,
    name: 'POST /security/csp-violation',
    headers: { 'Content-Type': 'application/csp-report' },
    body: JSON.stringify({
      'csp-report': { 'blocked-uri': 'https://evil.example', 'violated-directive': 'script-src' },
    }),
  });
  await req('GET', `${BASE}/security/csp-violation`, {
    expect: 204,
    name: 'GET /security/csp-violation',
  });
  await req('GET', `${BASE}/api-docs.json`, { expect: 401, name: 'GET /api-docs.json no auth' });
  await req('GET', `${BASE}/api-docs.json`, {
    expect: 200,
    name: 'GET /api-docs.json basic',
    auth: 'basic',
  });

  log('=== AUTH SIGNUP / VERIFY / LOGIN ===');
  await req('POST', `${API}/auth/signup`, {
    expect: 201,
    name: 'POST /auth/signup',
    body: {
      email,
      password: PASS,
      firstName: 'E2E',
      lastName: 'User',
      phone: '+15550001111',
    },
  });
  const otp = await waitOtp(email);
  if (!otp) {
    log('FAIL could not read OTP from MailHog');
    fail++;
  } else {
    log(`OK  OTP ${otp}`);
    pass++;
  }
  await req('POST', `${API}/auth/verify`, {
    expect: 200,
    name: 'POST /auth/verify',
    body: { email, otp },
  });

  {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      body: JSON.stringify({ email, password: PASS }),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
    const json = await res.json().catch(() => null);
    userId = json?.data?.id || '';
    if (res.status === 200 && access) {
      log('OK  [200] POST /auth/login');
      pass++;
    } else {
      log(`FAIL [${res.status}] POST /auth/login :: ${JSON.stringify(json).slice(0, 200)}`);
      fail++;
    }
  }

  await req('GET', `${API}/auth/me`, { expect: 200, name: 'GET /auth/me', auth: 'bearer' });
  {
    const r = await req('GET', `${API}/auth/sessions`, {
      expect: 200,
      name: 'GET /auth/sessions',
      auth: 'bearer',
    });
    familyId = r.json?.data?.[0]?.familyId || '';
  }
  await req('POST', `${API}/auth/refresh`, {
    expect: 200,
    name: 'POST /auth/refresh',
    body: refresh ? { refreshToken: refresh } : {},
  });
  // capture new access from refresh
  {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
      },
      body: JSON.stringify(refresh ? { refreshToken: refresh } : {}),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
  }

  log('=== TOTP ===');
  {
    const r = await req('POST', `${API}/auth/totp/enroll`, {
      expect: 200,
      name: 'POST /auth/totp/enroll',
      auth: 'bearer',
    });
    totpSecret = r.json?.data?.secret || '';
  }
  let totpCode = '';
  if (totpSecret) {
    const { generateSync } = await import('otplib');
    totpCode = generateSync({ secret: totpSecret });
    log('OK  generated totp');
    pass++;
  } else {
    log('FAIL no totp secret');
    fail++;
  }
  await req('POST', `${API}/auth/totp/confirm`, {
    expect: 200,
    name: 'POST /auth/totp/confirm',
    auth: 'bearer',
    body: { totpCode },
  });
  {
    const r = await req('POST', `${API}/auth/totp/recovery-codes`, {
      expect: 200,
      name: 'POST /auth/totp/recovery-codes',
      auth: 'bearer',
    });
    recoveryCode = r.json?.data?.codes?.[0] || '';
  }
  await req('POST', `${API}/auth/login`, {
    expect: [401, 403, 400],
    name: 'POST /auth/login without totp (reject)',
    body: { email, password: PASS },
  });
  {
    const { generateSync } = await import('otplib');
    const code = generateSync({ secret: totpSecret });
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS, totpCode: code }),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
    if (res.status === 200 && access) {
      log('OK  [200] POST /auth/login with totp');
      pass++;
    } else {
      log(`FAIL [${res.status}] login with totp`);
      fail++;
    }
  }
  {
    const res = await fetch(`${API}/auth/totp/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS, recoveryCode }),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
    if (res.status === 200) {
      log('OK  [200] POST /auth/totp/recover');
      pass++;
    } else {
      const t = await res.text();
      log(`FAIL [${res.status}] totp/recover :: ${t.slice(0, 200)}`);
      fail++;
    }
  }
  {
    const { generateSync } = await import('otplib');
    const code = generateSync({ secret: totpSecret });
    await req('POST', `${API}/auth/totp/disable`, {
      expect: 200,
      name: 'POST /auth/totp/disable',
      auth: 'bearer',
      body: { totpCode: code, current_password: PASS },
    });
  }

  log('=== PASSWORD FLOWS ===');
  await req('POST', `${API}/auth/forgot-password`, {
    expect: 200,
    name: 'POST /auth/forgot-password',
    body: { email },
  });
  await req('POST', `${API}/auth/change-password`, {
    expect: 200,
    name: 'POST /auth/change-password',
    auth: 'bearer',
    body: { current_password: PASS, new_password: PASS + 'x' },
  });
  // login with new password
  {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS + 'x' }),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
    if (res.status === 200) {
      log('OK  [200] re-login after change-password');
      pass++;
    } else {
      log(`FAIL [${res.status}] re-login after change-password`);
      fail++;
    }
  }
  // restore password for rest of suite
  await req('POST', `${API}/auth/change-password`, {
    expect: 200,
    name: 'POST /auth/change-password restore',
    auth: 'bearer',
    body: { current_password: PASS + 'x', new_password: PASS },
  });
  {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS }),
    });
    mergeCookies(res);
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) access = auth.slice(7);
  }

  if (familyId) {
    await req('DELETE', `${API}/auth/sessions/${familyId}`, {
      expect: [200, 404],
      name: 'DELETE /auth/sessions/:familyId',
      auth: 'bearer',
    });
  }

  log('=== USERS SELF ===');
  await req('PUT', `${API}/users/profile`, {
    expect: 200,
    name: 'PUT /users/profile',
    auth: 'bearer',
    body: { firstName: 'E2E2', lastName: 'User2', phone: '+15550002222' },
  });
  await req('DELETE', `${API}/users/profile/avatar`, {
    expect: 200,
    name: 'DELETE /users/profile/avatar',
    auth: 'bearer',
  });
  await req('GET', `${API}/auth/oauth/accounts`, {
    expect: 200,
    name: 'GET /auth/oauth/accounts',
    auth: 'bearer',
  });

  log('=== BLOGS ===');
  await clearRateLimits();
  await req('GET', `${API}/blogs`, { expect: 200, name: 'GET /blogs' });
  await req('GET', `${API}/blogs/search?q=test`, { expect: 200, name: 'GET /blogs/search' });
  {
    const r = await req('POST', `${API}/blogs`, {
      expect: 201,
      name: 'POST /blogs',
      auth: 'bearer',
      body: { title: `E2E Post ${stamp}`, content: 'Hello e2e content body', excerpt: 'ex' },
    });
    blogId = r.json?.data?.id || r.json?.data?._id || '';
    blogSlug = r.json?.data?.slug || '';
  }
  if (blogId) {
    await req('PUT', `${API}/blogs/${blogId}`, {
      expect: 200,
      name: 'PUT /blogs/:id',
      auth: 'bearer',
      body: { title: `E2E Post ${stamp} updated`, content: 'Updated content' },
    });
    await req('PATCH', `${API}/blogs/${blogId}/publish`, {
      expect: 200,
      name: 'PATCH /blogs/:id/publish',
      auth: 'bearer',
    });
  }
  if (blogSlug) {
    await req('GET', `${API}/blogs/${blogSlug}`, { expect: 200, name: 'GET /blogs/:slug' });
  }

  log('=== FILES ===');
  await clearRateLimits();
  await req('POST', `${API}/files/presign`, {
    expect: 200,
    name: 'POST /files/presign',
    auth: 'bearer',
    body: { filename: 'e2e.png', contentType: 'image/png', size: 256 },
  });

  log('=== ADMIN USER (promote) ===');
  await clearRateLimits();
  // Create dedicated admin account
  await req('POST', `${API}/auth/signup`, {
    expect: 201,
    name: 'POST /auth/signup admin',
    body: {
      email: adminEmail,
      password: PASS,
      firstName: 'E2E',
      lastName: 'Admin',
      phone: '+15550003333',
    },
  });
  const adminOtp = await waitOtp(adminEmail);
  await req('POST', `${API}/auth/verify`, {
    expect: 200,
    name: 'POST /auth/verify admin',
    body: { email: adminEmail, otp: adminOtp },
  });
  {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: PASS }),
    });
    const json = await res.json();
    adminId = json?.data?.id || '';
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) adminAccess = auth.slice(7);
  }
  try {
    await promoteToAdmin(adminId);
    log('OK  promoted admin via Prisma');
    pass++;
    // re-login for fresh permissions
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: PASS }),
    });
    const auth = res.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) adminAccess = auth.slice(7);
  } catch (e) {
    log(`FAIL promote admin :: ${e.message || e}`);
    fail++;
  }

  await req('GET', `${API}/users?page=1&limit=5`, {
    expect: 200,
    name: 'GET /users',
    auth: 'admin',
  });
  await req('GET', `${API}/users/search?search=e2e`, {
    expect: 200,
    name: 'GET /users/search',
    auth: 'admin',
  });
  await req('GET', `${API}/users/export`, {
    expect: 200,
    name: 'GET /users/export',
    auth: 'admin',
  });
  await req('GET', `${API}/users/${userId}`, {
    expect: 200,
    name: 'GET /users/:userId',
    auth: 'admin',
  });
  await req('GET', `${API}/users/${userId}/sessions`, {
    expect: 200,
    name: 'GET /users/:userId/sessions',
    auth: 'admin',
  });
  {
    const inv = await req('POST', `${API}/users/invite`, {
      expect: 201,
      name: 'POST /users/invite',
      auth: 'admin',
      body: {
        email: inviteEmail,
        firstName: 'Inv',
        lastName: 'Itee',
        phone: '+15550004444',
        role: 'user',
      },
    });
    inviteIdFromInvite = inv.json?.data?.id || inv.json?.data?.user?.id || '';
  }
  await req('PATCH', `${API}/users/${userId}`, {
    expect: 200,
    name: 'PATCH /users/:userId',
    auth: 'admin',
    body: { firstName: 'E2EAdminUpdated' },
  });
  await req('PUT', `${API}/users/${userId}/role`, {
    expect: 200,
    name: 'PUT /users/:userId/role',
    auth: 'admin',
    body: { role: 'user' },
  });
  await req('POST', `${API}/users/${userId}/deactivate`, {
    expect: 200,
    name: 'POST /users/:userId/deactivate',
    auth: 'admin',
  });
  await req('POST', `${API}/users/${userId}/activate`, {
    expect: 200,
    name: 'POST /users/:userId/activate',
    auth: 'admin',
  });
  await req('POST', `${API}/users/${userId}/verify-email`, {
    expect: 200,
    name: 'POST /users/:userId/verify-email',
    auth: 'admin',
  });
  await req('POST', `${API}/users/${userId}/unlock`, {
    expect: 200,
    name: 'POST /users/:userId/unlock',
    auth: 'admin',
  });
  await req('POST', `${API}/users/${userId}/revoke-sessions`, {
    expect: 200,
    name: 'POST /users/:userId/revoke-sessions',
    auth: 'admin',
  });
  await req('DELETE', `${API}/users/${userId}/oauth/google`, {
    expect: [200, 404],
    name: 'DELETE /users/:userId/oauth/google',
    auth: 'admin',
  });
  const auditList = await req('GET', `${API}/admin/audit?page=1&limit=10`, {
    expect: 200,
    name: 'GET /admin/audit',
    auth: 'admin',
  });
  const auditId = auditList.json?.data?.[0]?.id || auditList.json?.data?.items?.[0]?.id || '';
  await req(
    'GET',
    `${API}/admin/audit?from=2020-01-01T00:00:00.000Z&to=2030-01-01T00:00:00.000Z&page=1&limit=5`,
    {
      expect: 200,
      name: 'GET /admin/audit date filters',
      auth: 'admin',
    },
  );
  await req('GET', `${API}/admin/audit/export?format=csv`, {
    expect: 200,
    name: 'GET /admin/audit/export csv',
    auth: 'admin',
  });
  await req('GET', `${API}/admin/audit/export?format=json`, {
    expect: 200,
    name: 'GET /admin/audit/export json',
    auth: 'admin',
  });
  if (auditId) {
    await req('GET', `${API}/admin/audit/${auditId}`, {
      expect: 200,
      name: 'GET /admin/audit/:auditId',
      auth: 'admin',
    });
  } else {
    await req('GET', `${API}/admin/audit/000000000000000000000000`, {
      expect: 404,
      name: 'GET /admin/audit/:auditId missing',
      auth: 'admin',
    });
  }

  // soft delete + restore + permanent on invitee
  let inviteId = inviteIdFromInvite;
  {
    const r = await req('GET', `${API}/users/search?search=${encodeURIComponent(inviteEmail)}`, {
      expect: 200,
      name: 'GET /users/search invitee',
      auth: 'admin',
    });
    inviteId =
      inviteId ||
      r.json?.data?.items?.[0]?.id ||
      r.json?.data?.users?.[0]?.id ||
      r.json?.data?.[0]?.id ||
      '';
  }
  if (inviteId) {
    await req('DELETE', `${API}/users/${inviteId}`, {
      expect: 200,
      name: 'DELETE /users/:userId soft',
      auth: 'admin',
    });
    await req('POST', `${API}/users/${inviteId}/restore`, {
      expect: 200,
      name: 'POST /users/:userId/restore',
      auth: 'admin',
    });
    await req('DELETE', `${API}/users/${inviteId}`, {
      expect: 200,
      name: 'DELETE soft before permanent',
      auth: 'admin',
    });
    await req('DELETE', `${API}/users/${inviteId}/permanent`, {
      expect: 200,
      name: 'DELETE /users/:userId/permanent',
      auth: 'admin',
    });
  } else {
    log('FAIL invitee id not found for lifecycle');
    fail++;
  }

  if (blogId) {
    await req('DELETE', `${API}/blogs/${blogId}`, {
      expect: 200,
      name: 'DELETE /blogs/:id',
      auth: 'bearer',
    });
  }

  await req('POST', `${API}/auth/logout`, {
    expect: 200,
    name: 'POST /auth/logout',
    auth: 'bearer',
  });

  // OAuth redirect smoke (do not follow — Google returns 200 HTML after redirect)
  await req('GET', `${API}/auth/oauth/google`, {
    expect: [302, 301, 303, 307, 308, 400, 404, 501, 503],
    name: 'GET /auth/oauth/google (redirect or disabled)',
    redirect: 'manual',
  });

  log('');
  log(`=== SUMMARY pass=${pass} fail=${fail} ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
