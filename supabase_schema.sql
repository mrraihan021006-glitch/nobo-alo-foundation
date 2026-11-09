-- ============================================================================
-- নব আলো ফাউন্ডেশন (Nobo Alo Foundation) - Complete Supabase Database Schema
-- ============================================================================

-- 1. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'নব আলো ফাউন্ডেশন',
  tagline TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  announcement_text TEXT DEFAULT 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  logo_url TEXT DEFAULT 'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/1772377523792_Nobo%20Alo%20Logo-03.png',
  banners TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_approve BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (id, site_name, tagline, announcement_text, logo_url, auto_approve)
VALUES (
  1,
  'নব আলো ফাউন্ডেশন',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।',
  'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/1772377523792_Nobo%20Alo%20Logo-03.png',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- 2. USERS / MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending')),
  designation TEXT DEFAULT 'সাধারণ সদস্য',
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'ত্রাণ',
  activity_date DATE,
  is_coming_soon BOOLEAN DEFAULT FALSE,
  media TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FINANCES TABLE (note lowercase memberuid column per TRD)
CREATE TABLE IF NOT EXISTS public.finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  memberuid TEXT,
  month TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  idea TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GALLERY IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
