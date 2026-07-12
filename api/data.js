const { put, head } = require('@vercel/blob');
const crypto = require('crypto');
const fallback = require('../data.json');

const MAX_BODY_BYTES = 4 * 1024 * 1024; // 4MB — stays under Vercel's ~4.5MB function body limit
const DATA_PATHNAME   = 'data.json';

module.exports = async (req, res) => {
  if (req.method === 'GET')  return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method_not_allowed' });
};

/* Reads the current data.json content. Vercel Blob's CDN enforces a hard
   MINIMUM cache time on every blob URL (~60s) that neither a low
   cacheControlMaxAge on put() nor useCache:false on get() actually bypasses
   in practice — confirmed by hitting the raw blob URL directly and seeing
   `cache-control: max-age=60` regardless. A unique cache-busting query
   param is what genuinely forces a fresh origin fetch every time. */
async function readCurrent() {
  let blob;
  try {
    blob = await head(DATA_PATHNAME);
  } catch (e) {
    return null; // no blob written yet
  }
  const bust = Date.now() + '-' + Math.random().toString(36).slice(2);
  const r = await fetch(`${blob.url}?cb=${bust}`, { cache: 'no-store' });
  if (!r.ok) return null;
  return r.text();
}

async function handleGet(req, res) {
  // Never cache this response either — this is a low-traffic personal site,
  // freshness after an edit matters far more than shaving function invocations.
  res.setHeader('Cache-Control', 'no-store');
  try {
    const text = await readCurrent();
    if (text === null) throw new Error('no blob written yet');
    res.setHeader('X-Data-Source', 'blob');
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    // No blob written yet (fresh store) or a transient read failure — serve
    // the bundled seed content instead of erroring out the whole public site.
    res.setHeader('X-Data-Source', 'fallback');
    return res.status(200).json(fallback);
  }
}

async function handlePost(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const expected = process.env.ADMIN_PIN_HASH || '';

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  const isAuthorized =
    expected.length > 0 &&
    providedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(providedBuf, expectedBuf);

  if (!isAuthorized) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const serialized = JSON.stringify(body);
  if (Buffer.byteLength(serialized) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'payload_too_large' });
  }

  // Best-effort backup of whatever's live right now, *before* it gets
  // overwritten below. Started (not awaited) ahead of the put() so it reads
  // the pre-save content, but never adds latency to the response the user
  // is waiting on.
  backupCurrentVersion().catch(() => {});

  await put(DATA_PATHNAME, serialized, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  return res.status(200).json({ ok: true });
}

async function backupCurrentVersion() {
  const currentText = await readCurrent();
  if (currentText === null) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await put(`backups/${stamp}.json`, currentText, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}
