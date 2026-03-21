#!/bin/bash
# ═══════════════════════════════════════════════
# Life OS — Export DB data to static JSON
# Runs daily via cron, commits + pushes to GitHub
# ═══════════════════════════════════════════════

set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
LIFEOS_DIR="${HOME}/LifeOS"
OUT="${LIFEOS_DIR}/public/data/all.json"

python3 << 'PYEOF'
import sqlite3, json, os, sys
from datetime import datetime

WORKSPACE = os.path.expanduser("~/.openclaw/workspace")

DBS = {
    "health":     os.path.join(WORKSPACE, "health", "health.db"),
    "finance":    os.path.join(WORKSPACE, "finance", "spending.db"),
    "calendar":   os.path.join(WORKSPACE, "calendar", "calendar.db"),
    "psychology": os.path.join(WORKSPACE, "psychology", "psychology.db"),
}

def query(db_path, sql):
    if not os.path.exists(db_path):
        print(f"⚠️  DB not found: {db_path}", file=sys.stderr)
        return []
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
    except Exception as e:
        print(f"⚠️  Query error on {db_path}: {e}", file=sys.stderr)
        rows = []
    conn.close()
    return rows

data = {
    "health":       query(DBS["health"],     "SELECT * FROM health_metrics ORDER BY date ASC"),
    "nutrition":    query(DBS["health"],     "SELECT * FROM nutrition ORDER BY date ASC, time ASC"),
    "workouts":     query(DBS["health"],     "SELECT * FROM workouts ORDER BY date DESC"),
    "transactions": query(DBS["finance"],    "SELECT * FROM transactions ORDER BY date DESC"),
    "events":       query(DBS["calendar"],   "SELECT * FROM events ORDER BY date ASC"),
    "psychology": {
        "triggers": query(DBS["psychology"], "SELECT * FROM trigger_log ORDER BY date DESC"),
        "sessions": query(DBS["psychology"], "SELECT * FROM reconsolidation_sessions ORDER BY date DESC"),
        "homework": query(DBS["psychology"], "SELECT * FROM homework_log ORDER BY date DESC"),
    },
    "lastUpdated": datetime.utcnow().isoformat() + "Z",
}

out_path = sys.argv[1] if len(sys.argv) > 1 else "public/data/all.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w") as f:
    json.dump(data, f, ensure_ascii=False, default=str)

total = sum(len(v) if isinstance(v, list) else sum(len(x) for x in v.values()) for v in data.values() if isinstance(v, (list, dict)))
print(f"✅ Exported {total} records → {out_path}")
PYEOF

# Run export
python3 -c "
import sqlite3, json, os, sys
from datetime import datetime

WORKSPACE = os.path.expanduser('~/.openclaw/workspace')
DBS = {
    'health':     os.path.join(WORKSPACE, 'health', 'health.db'),
    'finance':    os.path.join(WORKSPACE, 'finance', 'spending.db'),
    'calendar':   os.path.join(WORKSPACE, 'calendar', 'calendar.db'),
    'psychology': os.path.join(WORKSPACE, 'psychology', 'psychology.db'),
}

def query(db_path, sql):
    if not os.path.exists(db_path):
        return []
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
    except:
        rows = []
    conn.close()
    return rows

data = {
    'health':       query(DBS['health'],     'SELECT * FROM health_metrics ORDER BY date ASC'),
    'nutrition':    query(DBS['health'],     'SELECT * FROM nutrition ORDER BY date ASC, time ASC'),
    'workouts':     query(DBS['health'],     'SELECT * FROM workouts ORDER BY date DESC'),
    'transactions': query(DBS['finance'],    'SELECT * FROM transactions ORDER BY date DESC'),
    'events':       query(DBS['calendar'],   'SELECT * FROM events ORDER BY date ASC'),
    'psychology': {
        'triggers': query(DBS['psychology'], 'SELECT * FROM trigger_log ORDER BY date DESC'),
        'sessions': query(DBS['psychology'], 'SELECT * FROM reconsolidation_sessions ORDER BY date DESC'),
        'homework': query(DBS['psychology'], 'SELECT * FROM homework_log ORDER BY date DESC'),
    },
    'lastUpdated': datetime.utcnow().isoformat() + 'Z',
}

with open('${OUT}', 'w') as f:
    json.dump(data, f, ensure_ascii=False, default=str)

total = sum(len(v) if isinstance(v, list) else sum(len(x) for x in v.values()) for v in data.values() if isinstance(v, (list, dict)))
print(f'✅ Exported {total} records → ${OUT}')
"

# Commit + push
cd "${LIFEOS_DIR}"
git add public/data/all.json
if git diff --cached --quiet; then
    echo "📝 No data changes"
else
    git commit -m "📊 Daily data export $(date -u +%Y-%m-%d)"
    git push origin main
    echo "🚀 Pushed to GitHub"
fi
