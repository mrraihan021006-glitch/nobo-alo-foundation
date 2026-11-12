-- ============================================================================
-- নব আলো ফাউন্ডেশন - Cloudflare D1 (SQLite) Database Schema
-- Database Name: nobo-alo-db
-- Database ID: 2c75ca5d-1dc3-4904-acb6-4ca6bd5202cd
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'নব আলো ফাউন্ডেশন',
  tagline TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  announcement_text TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  logo_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  banners TEXT DEFAULT '["","","",""]',
  designations TEXT DEFAULT '',
  campaigns TEXT DEFAULT '[]',
  ui_theme TEXT DEFAULT 'classic_emerald',
  payment_numbers TEXT DEFAULT '[]',
  show_payment_on_home INTEGER DEFAULT 1,
  payment_config TEXT DEFAULT '{}',
  auto_approve INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_settings (
  id, site_name, tagline, announcement_text, logo_url, favicon_url, banners, ui_theme, show_payment_on_home, auto_approve
)
VALUES (
  1,
  'নব আলো ফাউন্ডেশন',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  '',
  '',
  '["","","",""]',
  'classic_emerald',
  1,
  0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT DEFAULT '',
  password_hash TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  designation TEXT DEFAULT 'সাধারণ সদস্য',
  sort_order INTEGER DEFAULT 100,
  promoted_by TEXT DEFAULT '',
  fb_url TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  age TEXT DEFAULT '',
  reminder_status TEXT DEFAULT 'auto',
  reminder_note TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'সাধারণ',
  activity_date TEXT DEFAULT '',
  is_coming_soon INTEGER DEFAULT 0,
  media TEXT DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finances (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  memberuid TEXT DEFAULT '',
  month TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  member_id TEXT DEFAULT '',
  sender_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount REAL NOT NULL,
  sender_number TEXT DEFAULT '',
  receiver_number TEXT DEFAULT '',
  trx_id TEXT DEFAULT '',
  purpose TEXT DEFAULT 'সাধারণ অনুদান',
  month TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  idea TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
