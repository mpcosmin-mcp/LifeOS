// ═══════════════════════════════════════════════
// Life OS — API Server (zero dependencies)
// Read + Write to SQLite DBs
// ═══════════════════════════════════════════════

const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8787;
const WORKSPACE = process.env.LIFEOS_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

const DB_PATHS = {
  health: path.join(WORKSPACE, 'health', 'health.db'),
  finance: path.join(WORKSPACE, 'finance', 'spending.db'),
  calendar: path.join(WORKSPACE, 'calendar', 'calendar.db'),
  psychology: path.join(WORKSPACE, 'psychology', 'psychology.db'),
};

// ── Python SQLite bridge ──
function q(dbKey, sql, params) {
  const dbPath = DB_PATHS[dbKey];
  const paramsJson = params ? JSON.stringify(params) : '[]';
  const pyCode = [
    'import sqlite3, json, sys',
    `conn = sqlite3.connect("${dbPath}")`,
    'conn.row_factory = sqlite3.Row',
    'c = conn.cursor()',
    `params = json.loads('${paramsJson.replace(/'/g, "\\'")}')`,
    `c.execute("""${sql}""", params)`,
    'conn.commit()',
    'try:',
    '  rows = [dict(r) for r in c.fetchall()]',
    'except: rows = []',
    `print(json.dumps({"rows": rows, "lastrowid": c.lastrowid, "changes": conn.total_changes}))`,
    'conn.close()',
  ].join('\n');

  try {
    const result = execSync(`python3 << 'PYEOF'\n${pyCode}\nPYEOF`, {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return JSON.parse(result.trim());
  } catch (e) {
    console.error(`Query error:`, e.message);
    return { rows: [], lastrowid: 0, changes: 0, error: e.message };
  }
}

function qRows(dbKey, sql) {
  return q(dbKey, sql).rows;
}

// ── Read body helper ──
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// ── API Routes ──
function getAllData() {
  return {
    health: qRows('health', 'SELECT * FROM health_metrics ORDER BY date ASC'),
    nutrition: qRows('health', 'SELECT * FROM nutrition ORDER BY date ASC, time ASC'),
    workouts: qRows('health', 'SELECT * FROM workouts ORDER BY date DESC'),
    transactions: qRows('finance', 'SELECT * FROM transactions ORDER BY date DESC'),
    events: qRows('calendar', 'SELECT * FROM events ORDER BY date ASC'),
    psychology: {
      triggers: qRows('psychology', 'SELECT * FROM trigger_log ORDER BY date DESC'),
      sessions: qRows('psychology', 'SELECT * FROM reconsolidation_sessions ORDER BY date DESC'),
      homework: qRows('psychology', 'SELECT * FROM homework_log ORDER BY date DESC'),
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── HTTP Server ──
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // ── GET Routes ──
  if (req.method === 'GET') {
    if (url.pathname === '/api/all') return json(getAllData());
    if (url.pathname === '/api/health') return json(qRows('health', 'SELECT * FROM health_metrics ORDER BY date ASC'));
    if (url.pathname === '/api/nutrition') return json(qRows('health', 'SELECT * FROM nutrition ORDER BY date ASC, time ASC'));
    if (url.pathname === '/api/workouts') return json(qRows('health', 'SELECT * FROM workouts ORDER BY date DESC'));
    if (url.pathname === '/api/transactions') return json(qRows('finance', 'SELECT * FROM transactions ORDER BY date DESC'));
    if (url.pathname === '/api/events') return json(qRows('calendar', 'SELECT * FROM events ORDER BY date ASC'));
    if (url.pathname === '/api/ping') return json({ ok: true, timestamp: new Date().toISOString() });
    if (url.pathname === '/api/nutrition-db') {
      return json(qRows('health', 'SELECT * FROM nutrition_db ORDER BY name ASC'));
    }
  }

  // ── POST Routes (Data Entry) ──
  if (req.method === 'POST') {
    const body = await readBody(req);

    // Log nutrition
    if (url.pathname === '/api/nutrition') {
      const { date, time, item, protein_g, carbs_g, fat_g, calories, water_ml, fiber_g, sugar_g, notes } = body;
      if (!date || !item) return json({ error: 'date and item required' }, 400);
      const result = q('health',
        `INSERT INTO nutrition (date, time, item, protein_g, carbs_g, fat_g, calories, fiber_g, sugar_g, water_ml, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [date, time || null, item, protein_g || 0, carbs_g || 0, fat_g || 0, calories || 0, fiber_g || 0, sugar_g || 0, water_ml || 0, notes || null]
      );
      return json({ ok: true, id: result.lastrowid });
    }

    // Log transaction
    if (url.pathname === '/api/transactions') {
      const { date, description, amount, category, roi_flag, quantity, unit_price } = body;
      if (!date || !description || amount == null) return json({ error: 'date, description, amount required' }, 400);
      const result = q('finance',
        `INSERT INTO transactions (date, description, amount, category, roi_flag, quantity, unit_price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [date, description, amount, category || 'other', roi_flag || '0', quantity || null, unit_price || null]
      );
      return json({ ok: true, id: result.lastrowid });
    }

    // Log workout
    if (url.pathname === '/api/workouts') {
      const { date, type, duration_min, distance_km, pace_min_km, heart_rate_avg, calories, notes, max_hr } = body;
      if (!date || !type) return json({ error: 'date and type required' }, 400);
      const result = q('health',
        `INSERT INTO workouts (date, type, duration_min, distance_km, pace_min_km, heart_rate_avg, calories, notes, max_hr, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [date, type, duration_min || null, distance_km || null, pace_min_km || null, heart_rate_avg || null, calories || null, notes || null, max_hr || null]
      );
      return json({ ok: true, id: result.lastrowid });
    }

    // Log health metrics
    if (url.pathname === '/api/health') {
      const { date, sleep_score, rhr, hrv, weight_kg, body_fat_pct, visceral_fat, steps, water_pct, notes } = body;
      if (!date) return json({ error: 'date required' }, 400);
      // Upsert: update if date exists, insert if not
      const existing = qRows('health', `SELECT id FROM health_metrics WHERE date = '${date}'`);
      if (existing.length) {
        const sets = [];
        const vals = [];
        if (sleep_score != null) { sets.push('sleep_score = ?'); vals.push(sleep_score); }
        if (rhr != null) { sets.push('rhr = ?'); vals.push(rhr); }
        if (hrv != null) { sets.push('hrv = ?'); vals.push(hrv); }
        if (weight_kg != null) { sets.push('weight_kg = ?'); vals.push(weight_kg); }
        if (body_fat_pct != null) { sets.push('body_fat_pct = ?'); vals.push(body_fat_pct); }
        if (visceral_fat != null) { sets.push('visceral_fat = ?'); vals.push(visceral_fat); }
        if (steps != null) { sets.push('steps = ?'); vals.push(steps); }
        if (water_pct != null) { sets.push('water_pct = ?'); vals.push(water_pct); }
        if (notes != null) { sets.push('notes = ?'); vals.push(notes); }
        sets.push("updated_at = datetime('now')");
        vals.push(date);
        if (sets.length > 1) {
          q('health', `UPDATE health_metrics SET ${sets.join(', ')} WHERE date = ?`, vals);
        }
        return json({ ok: true, id: existing[0].id, action: 'updated' });
      } else {
        const result = q('health',
          `INSERT INTO health_metrics (date, sleep_score, rhr, hrv, weight_kg, body_fat_pct, visceral_fat, steps, water_pct, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [date, sleep_score || null, rhr || null, hrv || null, weight_kg || null, body_fat_pct || null, visceral_fat || null, steps || null, water_pct || null, notes || null]
        );
        return json({ ok: true, id: result.lastrowid, action: 'created' });
      }
    }

    // Add calendar event
    if (url.pathname === '/api/events') {
      const { title, date, type, cost, location, notes, recurring } = body;
      if (!title || !date) return json({ error: 'title and date required' }, 400);
      const id = `web-${Date.now()}`;
      q('calendar',
        `INSERT INTO events (id, title, date, type, cost, currency, location, notes, recurring, created_at)
         VALUES (?, ?, ?, ?, ?, 'lei', ?, ?, ?, datetime('now'))`,
        [id, title, date, type || 'event', cost || 0, location || '', notes || '', recurring ? 1 : 0]
      );
      return json({ ok: true, id });
    }
  }

  json({ error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  console.log(`🧬 Life OS API running on http://localhost:${PORT}`);
  console.log(`   Workspace: ${WORKSPACE}`);
});
