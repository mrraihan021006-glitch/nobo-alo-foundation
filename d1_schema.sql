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
  logo_url TEXT DEFAULT 'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/1772377523792_Nobo%20Alo%20Logo-03.png',
  favicon_url TEXT DEFAULT 'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/Website%20favicon-03.png',
  banners TEXT DEFAULT '["","","",""]',
  auto_approve INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_settings (id, site_name, tagline, announcement_text, logo_url, favicon_url, banners, auto_approve)
VALUES (
  1,
  'নব আলো ফাউন্ডেশন',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/1772377523792_Nobo%20Alo%20Logo-03.png',
  'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/Website%20favicon-03.png',
  '["","","",""]',
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
