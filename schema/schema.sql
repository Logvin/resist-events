-- Resist Events D1 Schema

DROP TABLE IF EXISTS event_published_seen;
DROP TABLE IF EXISTS review_seen;
DROP TABLE IF EXISTS message_reads;
DROP TABLE IF EXISTS user_orgs;
DROP TABLE IF EXISTS message_replies;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS event_flyers;
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
  logo_url TEXT,
  qr_url TEXT,
  city TEXT,
  mission_statement TEXT,
  can_self_publish INTEGER DEFAULT 0,
  can_cross_publish INTEGER DEFAULT 0,
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
  org_id INTEGER REFERENCES organizations(id),
  created_by INTEGER REFERENCES users(id),
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
  event_type TEXT DEFAULT '', -- e.g. 'march', 'protest_gathering', 'signature_gathering', 'community_event', 'virtual', or custom
  status TEXT NOT NULL DEFAULT 'draft', -- draft, review, published, archived
  bring_items TEXT DEFAULT '[]', -- JSON array
  no_bring_items TEXT DEFAULT '[]', -- JSON array
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE event_flyers (
  event_id INTEGER PRIMARY KEY REFERENCES events(id),
  image_data BLOB,              -- D1 fallback storage (base64-encoded PNG)
  r2_key TEXT,                  -- R2 object key if using R2
  storage_type TEXT NOT NULL,   -- 'r2' or 'd1'
  template_name TEXT,           -- e.g. 'rally_bold'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  org_id INTEGER REFERENCES organizations(id),
  event_id INTEGER REFERENCES events(id),
  message_type TEXT NOT NULL DEFAULT 'org',
  user_id INTEGER REFERENCES users(id),
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

CREATE TABLE user_orgs (
  user_id INTEGER NOT NULL REFERENCES users(id),
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, archived
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, org_id)
);

CREATE TABLE message_reads (
  user_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL REFERENCES messages(id),
  last_read_reply_id INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, message_id)
);

CREATE TABLE review_seen (
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL REFERENCES events(id),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE event_published_seen (
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL REFERENCES events(id),
  PRIMARY KEY (user_id, event_id)
);

-- Indexes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_org ON events(org_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_messages_org ON messages(org_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_replies_message ON message_replies(message_id);
