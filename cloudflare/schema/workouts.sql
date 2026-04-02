CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    duration_min REAL,
    distance_km REAL,
    pace_min_km REAL,
    heart_rate_avg INTEGER,
    calories REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, hr_zone1_min REAL, hr_zone2_min REAL, hr_zone3_min REAL, hr_zone4_min REAL, hr_zone5_min REAL, max_hr REAL);
