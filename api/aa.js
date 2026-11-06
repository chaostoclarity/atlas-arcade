// Atlas Arcade online: players (name + PIN), progress sync, Daily Challenge scores, public leaderboard.
// Storage: one private Vercel Blob file per player at p/<key>.json.
const { put, get, list, del } = require('@vercel/blob');
const crypto = require('crypto');

const PEPPER = process.env.AA_PEPPER || '';
const MODES = ['find', 'label', 'shape', 'hot', 'chain', 'capitals', 'flags', 'nature', 'culture', 'trivia', 'chase'];
const BAD_IN = ['fuck','shit','cunt','nigg','faggot','whore','slut','bitch','twat','wank','asshole','retard','hitler','nazi','porn','kike'];
const BAD_WORD = ['dick','cock','pussy','penis','vagina','sex','cum','anal','tits','boob','rape','fag','spic','chink','piss','crap','bastard','butt','poop'];

const keyOf = n => n.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const hash = (salt, pin) => crypto.createHash('sha256').update(PEPPER + ':' + salt + ':' + pin).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);
const dayDiff = d => Math.abs((Date.parse(d) - Date.parse(today())) / 864e5);

function cleanName(raw) {
  const n = String(raw || '').replace(/\s+/g, ' ').trim();
  if (n.length < 2 || n.length > 16) return [null, 'Names are 2 to 16 characters.'];
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(n)) return [null, 'Use letters, numbers, spaces, dots, dashes or apostrophes.'];
  const flat = keyOf(n).replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's');
  const words = n.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').split(/[^a-z]+/).filter(Boolean);
  if (BAD_IN.some(w => flat.includes(w)) || words.some(w => BAD_WORD.includes(w) || BAD_WORD.includes(w.replace(/s$/, '')))) return [null, 'Please pick a different name.'];
  if (keyOf(n).length < 2) return [null, 'Names need at least two letters or numbers.'];
  return [n, null];
}

async function readPlayer(key) {
  try {
    const r = await get(`p/${key}.json`, { access: 'private', useCache: false });
    if (!r) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) { if (/not.?found/i.test(e.name + e.message)) return null; throw e; }
}
const writePlayer = (key, p) => put(`p/${key}.json`, JSON.stringify(p), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });

async function auth(body) {
  const [name, err] = cleanName(body.name);
  if (err) return [null, null, err];
  if (!/^\d{4}$/.test(String(body.pin || ''))) return [null, null, 'The PIN is 4 digits.'];
  const key = keyOf(name), p = await readPlayer(key);
  return [key, p, null, name];
}

const pub = p => ({ name: p.name, mastery: p.mastery || {}, daily: p.daily || {}, updated: p.updated || 0 });

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const send = (code, obj) => { res.statusCode = code; res.end(JSON.stringify(obj)); };
  try {
    if (req.method === 'GET') {
      // Public leaderboard: every player's name, progress and recent daily scores. No PINs.
      const blobs = [];
      let cursor;
      do { const r = await list({ prefix: 'p/', cursor, limit: 1000 }); blobs.push(...r.blobs); cursor = r.hasMore ? r.cursor : null; } while (cursor);
      const players = (await Promise.all(blobs.map(b => readPlayer(b.pathname.slice(2, -5)).catch(() => null)))).filter(Boolean).map(pub);
      res.setHeader('Cache-Control', 'no-store');
      return send(200, { today: today(), players });
    }
    if (req.method !== 'POST') return send(405, { error: 'Use GET or POST.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // Owner-only: clear one day's Daily Challenge scores for everyone (used after changing that day's questions).
    if (body.op === 'resetday') {
      if (!PEPPER || body.secret !== PEPPER) return send(403, { error: 'Not allowed.' });
      const d = String(body.date || '');
      const blobs = (await list({ prefix: 'p/', limit: 1000 })).blobs; let n = 0;
      for (const b of blobs) { const k = b.pathname.slice(2, -5), pl = await readPlayer(k); if (pl?.daily?.[d]) { delete pl.daily[d]; await writePlayer(k, pl); n++; } }
      return send(200, { ok: true, cleared: n });
    }
    const [key, p, err, name] = await auth(body);
    if (err) return send(400, { error: err });

    if (body.op === 'join') {
      if (!p) {
        const salt = crypto.randomBytes(12).toString('hex');
        const np = { name, salt, hash: hash(salt, body.pin), created: Date.now(), updated: Date.now(), mastery: {}, daily: {} };
        await writePlayer(key, np);
        return send(200, { ok: true, created: true, player: pub(np) });
      }
      if (p.hash !== hash(p.salt, body.pin)) return send(403, { error: 'That name is taken, or the PIN is wrong.' });
      return send(200, { ok: true, created: false, player: pub(p) });
    }

    if (!p) return send(404, { error: 'No player with that name. Join first.' });
    if (p.hash !== hash(p.salt, body.pin)) return send(403, { error: 'Wrong PIN.' });

    if (body.op === 'leave') {
      await del(`p/${key}.json`);
      return send(200, { ok: true });
    }

    if (body.op === 'sync') {
      const m = body.mastery || {}, out = {};
      for (const k of MODES) { const v = Math.floor(Number(m[k])); if (v >= 0 && v < 5000) out[k] = Math.max(v, (p.mastery || {})[k] || 0); }
      p.mastery = { ...(p.mastery || {}), ...out }; p.updated = Date.now();
      await writePlayer(key, p);
      return send(200, { ok: true, player: pub(p) });
    }

    if (body.op === 'daily') {
      const d = String(body.date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || dayDiff(d) > 1) return send(400, { error: 'That challenge has closed.' });
      p.daily = p.daily || {};
      if (p.daily[d]) return send(409, { error: 'You already played this challenge.', result: p.daily[d] });
      const correct = Math.max(0, Math.min(10, Math.floor(Number(body.correct) || 0)));
      const ms = Math.max(5000, Math.min(3600e3, Math.floor(Number(body.ms) || 0)));
      const score = Math.max(0, Math.min(1500, Math.floor(Number(body.score) || 0)));
      const marks = String(body.marks || '').replace(/[^01]/g, '').slice(0, 10);
      p.daily[d] = { score, correct, ms, marks, at: Date.now() };
      const keep = Object.keys(p.daily).sort().slice(-60); p.daily = Object.fromEntries(keep.map(k => [k, p.daily[k]]));
      p.updated = Date.now();
      await writePlayer(key, p);
      return send(200, { ok: true, result: p.daily[d], player: pub(p) });
    }
    return send(400, { error: 'Unknown request.' });
  } catch (e) {
    console.error('aa api error', e);
    return send(500, { error: 'The server had a problem. Try again in a minute.' });
  }
};
