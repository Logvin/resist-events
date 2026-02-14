-- Resist Events D1 Schema

DROP TABLE IF EXISTS message_replies;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS site_config;

CREATE TABLE site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  website TEXT,
  socials TEXT DEFAULT '{}', -- JSON: { fb, ig, x, rd, sc, sg }
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest', -- admin, organizer, guest
  org_id INTEGER REFERENCES organizations(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT,
  end_time TEXT,
  address TEXT,
  description TEXT,
  parking TEXT,
  flyer_url TEXT,
  website_url TEXT,
  reg_link TEXT,
  reg_required INTEGER DEFAULT 0,
  hide_address INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, review, published, archived
  bring_items TEXT DEFAULT '[]', -- JSON array
  no_bring_items TEXT DEFAULT '[]', -- JSON array
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  org_id INTEGER REFERENCES organizations(id),
  archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE message_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id),
  from_type TEXT NOT NULL, -- 'org' or 'admin'
  text TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_org ON events(org_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_messages_org ON messages(org_id);
CREATE INDEX idx_replies_message ON message_replies(message_id);
