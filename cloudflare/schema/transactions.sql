CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    raw_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, roi_flag TEXT DEFAULT "0", quantity REAL, unit_price REAL, need_type TEXT DEFAULT '', behavior_tag TEXT DEFAULT '');
