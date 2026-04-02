CREATE TABLE health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    sleep_score REAL,
    rhr REAL,
    hrv REAL,
    weight_kg REAL,
    body_fat_pct REAL,
    visceral_fat REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
, protein_g REAL, carbs_g REAL, fat_g REAL, calories REAL, water_pct REAL, steps INTEGER, sleep_hours REAL);
