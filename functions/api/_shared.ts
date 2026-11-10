// ============================================================================
// Cloudflare Pages D1 Backend Handler for Nobo Alo Foundation
// Connects React frontend directly to Cloudflare D1 (nobo-alo-db: 2c75ca5d-1dc3-4904-acb6-4ca6bd5202cd)
// Supports D1 Global Read Replication (`withSession('first-primary')`) & Safe Auto-Migrations
// ============================================================================

const SUPER_ADMIN_EMAIL = 'mohammadraihan4386.bd@gmail.com';

const cleanDeadSupabaseUrl = (u?: string | null): string => {
  if (!u) return '';
  const s = String(u).trim();
  if (s.includes('xlcepfrjngtzrmpazkla.supabase.co')) return '';
  return s;
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_nobo_alo_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getDbHandle(rawDb: any) {
  if (rawDb && typeof rawDb.withSession === 'function') {
    try {
      return rawDb.withSession('first-primary');
    } catch {
      return rawDb;
    }
  }
  return rawDb;
}

async function ensureSchema(db: any) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      site_name TEXT DEFAULT 'নব আলো ফাউন্ডেশন',
      tagline TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
      announcement_text TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
      logo_url TEXT DEFAULT '',
      favicon_url TEXT DEFAULT '',
      banners TEXT DEFAULT '["","","",""]',
      auto_approve INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`INSERT OR IGNORE INTO site_settings (id, site_name, tagline, announcement_text, logo_url, banners, auto_approve)
      VALUES (1, 'নব আলো ফাউন্ডেশন', 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।', 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।', '', '["","","",""]', 0)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT DEFAULT '',
      password_hash TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      designation TEXT DEFAULT 'সাধারণ সদস্য',
      sort_order INTEGER DEFAULT 100,
      promoted_by TEXT DEFAULT '',
      fb_url TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'সাধারণ',
      activity_date TEXT DEFAULT '',
      is_coming_soon INTEGER DEFAULT 0,
      media TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS finances (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      memberuid TEXT DEFAULT '',
      month TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      idea TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS gallery_images (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`)
  ]);

  const alterStatements = [
    `ALTER TABLE site_settings ADD COLUMN favicon_url TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN promoted_by TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN fb_url TEXT DEFAULT ''`
  ];
  for (const stmt of alterStatements) {
    try {
      await db.prepare(stmt).run();
    } catch {
      // Column already exists
    }
  }

  // Clean any legacy dead Supabase URLs stored in site_settings
  try {
    await db.prepare(`UPDATE site_settings SET logo_url = '' WHERE logo_url LIKE '%xlcepfrjngtzrmpazkla.supabase.co%'`).run();
    await db.prepare(`UPDATE site_settings SET favicon_url = '' WHERE favicon_url LIKE '%xlcepfrjngtzrmpazkla.supabase.co%'`).run();
  } catch {
    // Ignore
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (!env.DB) {
    return jsonResponse(
      { error: 'Cloudflare Pages-এ D1 Database binding (DB = nobo-alo-db) পাওয়া যায়নি। বাইন্ডিং সেট করার পর নতুন করে Redeploy করুন।' },
      503
    );
  }

  const db = getDbHandle(env.DB);

  try {
    await ensureSchema(db);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
    const method = request.method.toUpperCase();

    // 1. GET /api/bootstrap
    if ((path === 'bootstrap' || path === '') && method === 'GET') {
      const [settingsRes, usersRes, actRes, finRes, ideasRes, galRes] = await db.batch([
        db.prepare('SELECT * FROM site_settings WHERE id = 1'),
        db.prepare('SELECT id, name, email, mobile, avatar_url, role, status, designation, sort_order, promoted_by, fb_url, created_at FROM users ORDER BY sort_order ASC'),
        db.prepare('SELECT * FROM activities ORDER BY created_at DESC'),
        db.prepare('SELECT * FROM finances ORDER BY created_at DESC'),
        db.prepare('SELECT * FROM ideas ORDER BY created_at DESC'),
        db.prepare('SELECT * FROM gallery_images ORDER BY created_at DESC')
      ]);

      const rawSettings = settingsRes.results?.[0] || {};
      let parsedBanners = ['', '', '', ''];
      try {
        parsedBanners = JSON.parse(rawSettings.banners || '["","","",""]').map((b: string) => cleanDeadSupabaseUrl(b));
      } catch {
        parsedBanners = ['', '', '', ''];
      }
      while (parsedBanners.length < 4) parsedBanners.push('');

      const cleanLogo = cleanDeadSupabaseUrl(rawSettings.logo_url);
      const cleanFav = cleanDeadSupabaseUrl(rawSettings.favicon_url) || cleanLogo;

      const settings = {
        id: 1,
        site_name: rawSettings.site_name || 'নব আলো ফাউন্ডেশন',
        tagline: rawSettings.tagline || 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
        announcement_text: rawSettings.announcement_text || 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
        logo_url: cleanLogo,
        favicon_url: cleanFav,
        banners: parsedBanners,
        auto_approve: Boolean(rawSettings.auto_approve)
      };

      const activities = (actRes.results || []).map((a: any) => {
        let mediaArr: string[] = [];
        try {
          mediaArr = JSON.parse(a.media || '[]');
        } catch {
          mediaArr = [];
        }
        return {
          ...a,
          is_coming_soon: Boolean(a.is_coming_soon),
          media: mediaArr
        };
      });

      return jsonResponse({
        d1_active: true,
        settings,
        members: usersRes.results || [],
        activities,
        finances: finRes.results || [],
        ideas: ideasRes.results || [],
        gallery: galRes.results || []
      });
    }

    // 2. POST /api/register (or /api/auth/register)
    if ((path === 'register' || path === 'auth/register') && method === 'POST') {
      const body = await request.json();
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const mobile = String(body.mobile || '').trim();
      const password = String(body.password || '');

      const settingsRow = await db.prepare('SELECT auto_approve FROM site_settings WHERE id = 1').first();
      const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();
      const status = isSuper || Boolean(settingsRow?.auto_approve) ? 'approved' : 'pending';
      const role = isSuper ? 'admin' : 'member';
      const designation = isSuper ? 'অ্যাডমিন' : 'সাধারণ সদস্য';
      const sort_order = isSuper ? 1 : 100;
      const id = body.id || crypto.randomUUID();
      const pwHash = await hashPassword(password);

      await db
        .prepare(
          `INSERT INTO users (id, name, email, mobile, password_hash, avatar_url, role, status, designation, sort_order)
           VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET name=excluded.name, mobile=excluded.mobile, password_hash=excluded.password_hash`
        )
        .bind(id, name, email, mobile, pwHash, role, status, designation, sort_order)
        .run();

      const user = await db
        .prepare('SELECT id, name, email, mobile, avatar_url, role, status, designation, sort_order, promoted_by, fb_url FROM users WHERE email = ?')
        .bind(email)
        .first();

      return jsonResponse({ user, ok: true });
    }

    // 3. POST /api/login (or /api/auth/login)
    if ((path === 'login' || path === 'auth/login') && method === 'POST') {
      const body = await request.json();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const pwHash = await hashPassword(password);
      const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();

      let user = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').bind(email).first();

      if (!user && isSuper) {
        const id = 'super-admin-raihan';
        await db
          .prepare(
            `INSERT INTO users (id, name, email, mobile, password_hash, avatar_url, role, status, designation, sort_order)
             VALUES (?, 'মোহাম্মদ রায়হান', ?, '', ?, '', 'admin', 'approved', 'অ্যাডমিন', 1)`
          )
          .bind(id, email, pwHash)
          .run();
        user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
      }

      const isDefaultSuperPw = isSuper && ['NoboAlo@2026', 'noboalo2026', '123456'].includes(password.trim());
      if (!user || (user.password_hash && user.password_hash !== pwHash && !isDefaultSuperPw)) {
        return jsonResponse({ error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' }, 401);
      }

      if (isSuper && (user.role !== 'admin' || user.status !== 'approved')) {
        await db.prepare("UPDATE users SET role = 'admin', status = 'approved' WHERE id = ?").bind(user.id).run();
        user.role = 'admin';
        user.status = 'approved';
      }

      if (user.status === 'pending' && !isSuper) {
        return jsonResponse({ error: 'একাউন্টটি এখনো অ্যাপ্রুভ হয়নি।', pending: true }, 403);
      }

      const { password_hash, ...safeUser } = user;
      return jsonResponse({ user: safeUser, ok: true });
    }

    // 4. PUT / POST /api/settings
    if (path === 'settings' && (method === 'PUT' || method === 'POST')) {
      const body = await request.json();
      const cleanLogo = body.logo_url !== undefined ? cleanDeadSupabaseUrl(body.logo_url) : null;
      const cleanFav = body.favicon_url !== undefined ? cleanDeadSupabaseUrl(body.favicon_url) : null;
      const cleanBanners = Array.isArray(body.banners)
        ? JSON.stringify(body.banners.map((b: string) => cleanDeadSupabaseUrl(b)))
        : null;

      await db
        .prepare(
          `INSERT INTO site_settings (id, site_name, tagline, announcement_text, logo_url, favicon_url, banners, auto_approve, updated_at)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET
             site_name = COALESCE(excluded.site_name, site_settings.site_name),
             tagline = COALESCE(excluded.tagline, site_settings.tagline),
             announcement_text = COALESCE(excluded.announcement_text, site_settings.announcement_text),
             logo_url = COALESCE(excluded.logo_url, site_settings.logo_url),
             favicon_url = COALESCE(excluded.favicon_url, site_settings.favicon_url),
             banners = COALESCE(excluded.banners, site_settings.banners),
             auto_approve = COALESCE(excluded.auto_approve, site_settings.auto_approve),
             updated_at = CURRENT_TIMESTAMP`
        )
        .bind(
          body.site_name ?? null,
          body.tagline ?? null,
          body.announcement_text ?? null,
          cleanLogo,
          cleanFav,
          cleanBanners,
          typeof body.auto_approve === 'boolean' ? (body.auto_approve ? 1 : 0) : null
        )
        .run();
      return jsonResponse({ ok: true });
    }

    // 5. POST / PUT / DELETE /api/members
    if (path === 'members' && method === 'POST') {
      const body = await request.json();
      const id = body.id || crypto.randomUUID();
      const email = String(body.email || `${id}@noboalo.org`).trim().toLowerCase();
      const name = String(body.name || 'সদস্য').trim();
      const mobile = String(body.mobile || '').trim();
      const avatar_url = String(body.avatar_url || '').trim();
      const role = body.role === 'admin' ? 'admin' : 'member';
      const status = body.status || 'approved';
      const designation = String(body.designation || (role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')).trim();
      const sort_order = Number(body.sort_order ?? 100);
      const promoted_by = String(body.promoted_by || '');
      const fb_url = String(body.fb_url || '');

      await db
        .prepare(
          `INSERT INTO users (id, name, email, mobile, avatar_url, role, status, designation, sort_order, promoted_by, fb_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             avatar_url = excluded.avatar_url,
             role = excluded.role,
             status = excluded.status,
             designation = excluded.designation,
             sort_order = excluded.sort_order,
             promoted_by = excluded.promoted_by,
             fb_url = excluded.fb_url`
        )
        .bind(id, name, email, mobile, avatar_url, role, status, designation, sort_order, promoted_by, fb_url)
        .run();

      return jsonResponse({ id, ok: true });
    }

    if (path === 'members' && method === 'PUT') {
      const body = await request.json();
      const pwHash = body.new_password ? await hashPassword(body.new_password) : null;

      const existing = await db
        .prepare('SELECT id FROM users WHERE id = ? OR ( ? IS NOT NULL AND LOWER(email) = LOWER(?) )')
        .bind(body.id, body.email ?? null, body.email ?? null)
        .first();

      if (!existing && body.email) {
        await db
          .prepare(
            `INSERT INTO users (id, name, email, mobile, password_hash, avatar_url, role, status, designation, sort_order, promoted_by, fb_url)
             VALUES (?, ?, ?, '', ?, ?, ?, 'approved', ?, ?, ?, ?)`
          )
          .bind(
            body.id || crypto.randomUUID(),
            body.name || 'অ্যাডমিন',
            String(body.email).toLowerCase(),
            pwHash || '',
            body.avatar_url || '',
            body.role || 'admin',
            body.designation || 'অ্যাডমিন',
            Number(body.sort_order ?? 1),
            body.promoted_by || '',
            body.fb_url || ''
          )
          .run();
        return jsonResponse({ ok: true });
      }

      const targetId = existing?.id || body.id;
      await db
        .prepare(
          `UPDATE users
           SET name = COALESCE(?, name),
               avatar_url = COALESCE(?, avatar_url),
               role = COALESCE(?, role),
               status = COALESCE(?, status),
               designation = COALESCE(?, designation),
               sort_order = COALESCE(?, sort_order),
               promoted_by = COALESCE(?, promoted_by),
               fb_url = COALESCE(?, fb_url),
               password_hash = COALESCE(?, password_hash)
           WHERE id = ?`
        )
        .bind(
          body.name ?? null,
          body.avatar_url ?? null,
          body.role ?? null,
          body.status ?? null,
          body.designation ?? null,
          body.sort_order ?? null,
          body.promoted_by ?? null,
          body.fb_url ?? null,
          pwHash,
          targetId
        )
        .run();
      return jsonResponse({ ok: true });
    }

    if (path === 'members' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      await db.prepare('DELETE FROM users WHERE id = ? AND LOWER(email) != ?').bind(id, SUPER_ADMIN_EMAIL.toLowerCase()).run();
      return jsonResponse({ ok: true });
    }

    // 6. POST / PUT / DELETE /api/finances
    if (path === 'finances' && method === 'POST') {
      const b = await request.json();
      const id = b.id || crypto.randomUUID();
      await db
        .prepare('INSERT INTO finances (id, type, amount, memberuid, month, description) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, b.type, Number(b.amount), b.memberuid || '', b.month || '', b.description || '')
        .run();
      return jsonResponse({ id, ok: true });
    }

    if (path === 'finances' && method === 'PUT') {
      const b = await request.json();
      await db
        .prepare('UPDATE finances SET type = ?, amount = ?, memberuid = ?, month = ?, description = ? WHERE id = ?')
        .bind(b.type, Number(b.amount), b.memberuid || '', b.month || '', b.description || '', b.id)
        .run();
      return jsonResponse({ ok: true });
    }

    if (path === 'finances' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      await db.prepare('DELETE FROM finances WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    // 7. POST / PUT / DELETE /api/activities
    if (path === 'activities' && method === 'POST') {
      const b = await request.json();
      const id = b.id || crypto.randomUUID();
      await db
        .prepare(
          'INSERT INTO activities (id, title, description, category, activity_date, is_coming_soon, media) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          id,
          b.title,
          b.description,
          b.category || 'সাধারণ',
          b.activity_date || '',
          b.is_coming_soon ? 1 : 0,
          JSON.stringify(b.media || [])
        )
        .run();
      return jsonResponse({ id, ok: true });
    }

    if (path === 'activities' && method === 'PUT') {
      const b = await request.json();
      await db
        .prepare(
          'UPDATE activities SET title = ?, description = ?, category = ?, activity_date = ?, is_coming_soon = ?, media = ? WHERE id = ?'
        )
        .bind(
          b.title,
          b.description,
          b.category || 'সাধারণ',
          b.activity_date || '',
          b.is_coming_soon ? 1 : 0,
          JSON.stringify(b.media || []),
          b.id
        )
        .run();
      return jsonResponse({ ok: true });
    }

    if (path === 'activities' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    // 8. POST / DELETE /api/ideas
    if (path === 'ideas' && method === 'POST') {
      const b = await request.json();
      const id = b.id || crypto.randomUUID();
      await db
        .prepare('INSERT INTO ideas (id, name, mobile, idea) VALUES (?, ?, ?, ?)')
        .bind(id, b.name, b.mobile, b.idea)
        .run();
      return jsonResponse({ id, ok: true });
    }

    if (path === 'ideas' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      await db.prepare('DELETE FROM ideas WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    // 9. POST / DELETE /api/gallery
    if (path === 'gallery' && method === 'POST') {
      const b = await request.json();
      const id = b.id || crypto.randomUUID();
      await db.prepare('INSERT INTO gallery_images (id, url) VALUES (?, ?)').bind(id, b.url).run();
      return jsonResponse({ id, ok: true });
    }

    if (path === 'gallery' && method === 'DELETE') {
      const id = url.searchParams.get('id');
      await db.prepare('DELETE FROM gallery_images WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Not found: ' + path }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err?.message || 'Internal Server Error' }, 500);
  }
};
