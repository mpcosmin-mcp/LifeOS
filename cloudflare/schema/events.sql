CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT DEFAULT 'event',
    cost REAL DEFAULT 0,
    currency TEXT DEFAULT 'lei',
    location TEXT,
    notes TEXT,
    recurring INTEGER DEFAULT 0,
    recurring_pattern TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, energy_tag TEXT DEFAULT '', time_tag TEXT DEFAULT '');
