import React, { useState, useEffect, useRef, useMemo } from 'react';
// Pure Cloudflare D1 (`nobo-alo-db`) + Cloudinary (`wz8yg950` / `nobo_alo_images`) Architecture
import {
  Users,
  UserPlus,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  Upload,
  Image as ImageIcon,
  Calendar,
  Clock,
  Lightbulb,
  Settings,
  User,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  Lock,
  FileText,
  FolderKanban,
  HeartHandshake,
  Facebook,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Eye,
  Check
} from 'lucide-react';

// ============================================================================
// 1. EXACT CREDENTIALS, API KEYS & LINKS
// ============================================================================
const SUPABASE_URL = 'https://xlcepfrjngtzrmpazkla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY2VwZnJqbmd0enJtcGF6a2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDc5MjEsImV4cCI6MjA4Nzg4MzkyMX0.nDBBOrGPLLsRR85GjtIApbmB9xSo48yBQsLV2M6TJgE';
const D1_DATABASE_NAME = 'nobo-alo-db';
const D1_DATABASE_ID = '2c75ca5d-1dc3-4904-acb6-4ca6bd5202cd';

// Updated Cloudinary Credentials & Folder Name (`wz8yg950` + `nobo_alo_images`)
const CLOUDINARY_ID = 'wz8yg950';
const CLOUDINARY_FALLBACK_CLOUD = 'dbyffzl2n';
const CLOUDINARY_FOLDER_NAME = 'nobo_alo_images';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_ID}/auto/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'wz8yg950';

const SUPER_ADMIN_EMAIL = 'mohammadraihan4386.bd@gmail.com';
const SUPER_ADMIN_DEFAULT_PASSWORDS = ['NoboAlo@2026', 'noboalo2026', '123456'];
const DEFAULT_LOGO_URL = '';
const FAVICON_URL = '';
const DEFAULT_SITE_NAME = 'নব আলো ফাউন্ডেশন';
const DEFAULT_TAGLINE = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const DEFAULT_ANNOUNCEMENT = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const FOUNDATION_FB_URL = 'https://facebook.com/noboalofoundation00';
const DEVELOPER_CREDIT_TEXT = 'DEVELOPED BY MOHAMMAD RAIHAN';
const DEVELOPER_FB_URL = 'https://facebook.com/mohammadraihan3859';

// No external dead Supabase dependency; stubbed safely so zero network calls ever go to xlcepfrjngtzrmpazkla.supabase.co
const supabase: any = {
  from: () => ({
    select: () => ({
      limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      order: async () => ({ data: [], error: null }),
      or: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb)
    }),
    insert: () => ({ select: async () => ({ data: [], error: null }) }),
    update: () => ({ eq: () => ({ select: async () => ({ data: [], error: null }) }) }),
    upsert: () => ({ select: async () => ({ data: [], error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) })
  }),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: new Error('Use D1 Auth') }),
    signOut: async () => ({ error: null })
  }
};

// ============================================================================
// 2. TRD MEDIA OPTIMIZATION & SMART DATE HELPERS
// ============================================================================
const isMediaVideo = (url?: string | null): boolean => {
  return Boolean(url && url.match(/\.(mp4|webm|ogg|mov|avi)$/i));
};

const cleanMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed.includes('xlcepfrjngtzrmpazkla.supabase.co')) return '';
  if (trimmed.startsWith('http://res.cloudinary.com/')) {
    return trimmed.replace('http://', 'https://');
  }
  return trimmed;
};

const optimizeMedia = (url?: string | null): string => {
  const clean = cleanMediaUrl(url);
  if (!clean) return '';
  if (clean.includes('cloudinary.com') && clean.includes('/upload/') && isMediaVideo(clean)) {
    if (!clean.includes('/upload/q_auto')) {
      return clean.replace('/upload/', '/upload/q_auto,f_auto,w_800,c_limit/');
    }
  }
  return clean;
};

// Fast thumbnail helper for Gallery grid loading
const optimizeGalleryThumb = (url?: string | null): string => {
  return cleanMediaUrl(url);
};

// Safe LocalStorage Helpers for Persistent Login Session & Instant Settings Cache
const SESSION_STORAGE_KEY = 'nobo_alo_auth_session_v3';
const SETTINGS_CACHE_KEY = 'nobo_alo_site_settings_v3';
const LOCAL_D1_STORE_KEY = 'nobo_alo_d1_local_store_v3';

const readLocalJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeLocalJson = (key: string, value: unknown): void => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore quota errors
  }
};

const checkIsComingSoon = (is_coming_soon?: boolean, activity_date?: string | null): boolean => {
  if (!is_coming_soon) return false;
  if (activity_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(activity_date);
    targetDate.setHours(0, 0, 0, 0);
    if (!isNaN(targetDate.getTime()) && today >= targetDate) {
      return false;
    }
  }
  return true;
};

// ============================================================================
// 3. INTERFACES & PRODUCTION STATE TYPES
// ============================================================================
const DEFAULT_DESIGNATIONS: string[] = ["সভাপতি", "সহ-সভাপতি", "সাধারণ সম্পাদক", "যুগ্ম সাধারণ সম্পাদক", "সাংগঠনিক সম্পাদক", "সহ-সাংগঠনিক সম্পাদক", "অর্থ সম্পাদক", "সহ-অর্থ সম্পাদক", "প্রচার ও প্রকাশনা সম্পাদক", "দপ্তর সম্পাদক", "সমাজকল্যাণ ও ত্রাণ সম্পাদক", "শিক্ষা ও সাংস্কৃতিক সম্পাদক", "ধর্ম বিষয়ক সম্পাদক", "তথ্য ও প্রযুক্তি সম্পাদক", "কার্যনির্বাহী সদস্য", "উপদেষ্টা", "প্রতিষ্ঠাতা সদস্য", "আজীবন সদস্য", "অ্যাডমিন", "সদস্য", "সাধারণ সদস্য"];

// Bangladeshi Mobile Number Normalizer & Validator (013..019, 11 digits)
const bnToEnDigits = (str: string): string => {
  const map: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return String(str || '').replace(/[০-৯]/g, (d) => map[d] || d);
};

const analyzeBdPhone = (raw: string): {
  cleaned: string;
  normalized: string;
  isValidBd: boolean;
  looksLikePhone: boolean;
  operator: string;
} => {
  const ascii = bnToEnDigits(raw).replace(/[\s\-().]/g, '');
  const looksLikePhone = /^[+0-9০-৯]+$/.test(ascii) && ascii.length >= 3 && !ascii.includes('@');
  const match = ascii.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (!match) {
    return { cleaned: ascii, normalized: ascii, isValidBd: false, looksLikePhone, operator: '' };
  }
  const norm = match[1];
  const prefix = norm.slice(0, 3);
  const opMap: Record<string, string> = {
    '017': 'Grameenphone',
    '013': 'Grameenphone',
    '018': 'Robi',
    '016': 'Airtel',
    '019': 'Banglalink',
    '014': 'Banglalink',
    '015': 'Teletalk'
  };
  return {
    cleaned: ascii,
    normalized: norm,
    isValidBd: true,
    looksLikePhone: true,
    operator: opMap[prefix] || 'BD Operator'
  };
};

// Client-Side Automatic Image Compressor (Resizes & Compresses before Cloudinary Upload)
const compressImageFile = (
  file: File,
  mode: 'avatar' | 'logo' | 'general' = 'general'
): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    const maxDim = mode === 'avatar' ? 480 : mode === 'logo' ? 512 : 1600;
    const quality = mode === 'avatar' ? 0.82 : 0.86;

    // If general image is already small (< 350 KB) and not avatar, skip re-encoding
    if (mode === 'general' && file.size < 350 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (mode === 'avatar') {
          // Square center-crop or proportional fit within 480x480
          const scale = Math.min(1, maxDim / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        } else if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const outType = mode === 'logo' || file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const ext = outType === 'image/png' ? '.png' : '.jpg';
            const cleanBase = file.name.replace(/\.[^.]+$/, '') || 'image';
            const compressedFile = new File([blob], `${cleanBase}${ext}`, {
              type: outType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          outType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = String(ev.target?.result || '');
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

interface FundCampaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  collected_amount: number;
  is_active: boolean;
  created_at?: string;
}

interface SiteSettings {
  id?: number;
  site_name: string;
  tagline: string;
  announcement_text: string;
  logo_url: string;
  favicon_url?: string;
  banners: string[];
  designations?: string[];
  campaigns?: FundCampaign[];
  auto_approve: boolean;
}

interface MemberUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  avatar_url: string;
  role: 'admin' | 'member';
  status: 'approved' | 'pending';
  designation: string;
  sort_order: number;
  promoted_by?: string;
  fb_url?: string;
  blood_group?: string;
  bio?: string;
  reminder_status?: 'auto' | 'paid' | 'due_1m' | 'due_2m';
  reminder_note?: string;
  created_at?: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const formatDisplayEmail = (email?: string): string => {
  if (!email) return '';
  if (email.endsWith('@phone.noboalo.org') || email.endsWith('@noboalo.org')) return '';
  return email;
};

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  activity_date: string;
  is_coming_soon: boolean;
  media: string[];
  created_at?: string;
}

interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  memberuid: string;
  month: string;
  description: string;
  created_at?: string;
}

interface IdeaItem {
  id: string;
  name: string;
  mobile: string;
  idea: string;
  created_at?: string;
}

interface GalleryItem {
  id: string;
  url: string;
  created_at?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  announcement_text: DEFAULT_ANNOUNCEMENT,
  logo_url: DEFAULT_LOGO_URL,
  favicon_url: FAVICON_URL,
  banners: ['', '', '', ''],
  designations: DEFAULT_DESIGNATIONS,
  campaigns: [],
  auto_approve: false
};

const COLUMN_ALIASES: Record<string, string[]> = {
  avatar_url: ['avatar', 'photo_url', 'image_url'],
  avatar: ['avatar_url', 'photo_url', 'image_url'],
  mobile: ['phone', 'phone_number', 'mobile_number'],
  phone: ['mobile', 'phone_number', 'mobile_number'],
  logo_url: ['logo', 'site_logo'],
  logo: ['logo_url', 'site_logo'],
  site_name: ['name', 'title'],
  media: ['images', 'media_urls', 'image_url'],
  images: ['media', 'media_urls', 'image_url'],
  idea: ['plan', 'description', 'message'],
  url: ['image_url', 'media_url']
};

const extractMissingColumn = (errMsg: string): string | null => {
  const m1 = errMsg.match(/Could not find the '([^']+)' column/i);
  if (m1) return m1[1];
  const m2 = errMsg.match(/column "([^"]+)" of relation/i);
  if (m2) return m2[1];
  return null;
};

const smartSupabaseMutation = async (
  tableCandidates: string[],
  op: 'insert' | 'update' | 'upsert',
  payload: Record<string, any>,
  matchCol?: string,
  matchVal?: any
) => {
  let lastError: any = null;

  for (const table of tableCandidates) {
    let currentPayload = { ...payload };
    const triedAliases = new Set<string>();

    for (let attempt = 0; attempt < 6; attempt++) {
      let query: any;
      if (op === 'insert') {
        query = supabase.from(table).insert([currentPayload]).select();
      } else if (op === 'upsert') {
        query = supabase.from(table).upsert(currentPayload).select();
      } else {
        query = supabase.from(table).update(currentPayload).eq(matchCol!, matchVal).select();
      }

      const { data, error } = await query;
      if (!error) {
        return { data, error: null, table };
      }

      lastError = error;
      const msg = String(error.message || '');

      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        (msg.includes('does not exist') && msg.includes('relation')) ||
        msg.includes('Could not find the table')
      ) {
        break;
      }

      const missingCol = extractMissingColumn(msg);
      if (missingCol && missingCol in currentPayload) {
        const val = currentPayload[missingCol];
        delete currentPayload[missingCol];
        const aliases = COLUMN_ALIASES[missingCol] || [];
        const nextAlias = aliases.find(
          (a) => !triedAliases.has(`${missingCol}->${a}`) && !(a in currentPayload)
        );
        if (nextAlias) {
          triedAliases.add(`${missingCol}->${nextAlias}`);
          currentPayload[nextAlias] = val;
        }
        continue;
      }

      break;
    }
  }

  return { data: null, error: lastError, table: tableCandidates[0] };
};

// Local D1 Mirror for Canvas / Offline Preview so zero errors ever occur
const getLocalD1Store = () => {
  const fallback = {
    settings: {
      id: 1,
      site_name: DEFAULT_SITE_NAME,
      tagline: DEFAULT_TAGLINE,
      announcement_text: DEFAULT_ANNOUNCEMENT,
      logo_url: '',
      favicon_url: '',
      banners: ['', '', '', ''],
      auto_approve: false
    },
    members: [
      {
        id: 'super-admin-raihan',
        name: 'মোহাম্মদ রায়হান',
        email: SUPER_ADMIN_EMAIL,
        mobile: '',
        avatar_url: '',
        role: 'admin',
        status: 'approved',
        designation: 'অ্যাডমিন',
        sort_order: 1,
        promoted_by: '',
        fb_url: 'https://facebook.com/mohammadraihan3859'
      }
    ],
    activities: [],
    finances: [],
    ideas: [],
    gallery: []
  };
  const stored = readLocalJson<any>(LOCAL_D1_STORE_KEY, fallback);
  if (stored?.settings) {
    stored.settings.logo_url = cleanMediaUrl(stored.settings.logo_url);
    stored.settings.favicon_url = cleanMediaUrl(stored.settings.favicon_url);
  }
  return stored;
};

const saveLocalD1Store = (store: any) => {
  writeLocalJson(LOCAL_D1_STORE_KEY, store);
};

const runLocalD1Fallback = (endpoint: string, method: string, body?: any) => {
  const store = getLocalD1Store();
  const cleanEp = endpoint.replace(/^\/+/, '');
  const [pathPart, queryPart] = cleanEp.split('?');
  const params = new URLSearchParams(queryPart || '');

  if (pathPart === 'bootstrap' && method === 'GET') {
    return {
      ok: true,
      status: 200,
      notMounted: false,
      liveD1: false,
      data: {
        d1_active: true,
        settings: store.settings,
        members: store.members,
        activities: store.activities,
        finances: store.finances,
        ideas: store.ideas,
        gallery: store.gallery
      }
    };
  }

  if (pathPart === 'settings' && (method === 'PUT' || method === 'POST')) {
    store.settings = {
      ...store.settings,
      ...body,
      logo_url: body?.logo_url !== undefined ? cleanMediaUrl(body.logo_url) : store.settings.logo_url,
      favicon_url: body?.favicon_url !== undefined ? cleanMediaUrl(body.favicon_url) : store.settings.favicon_url
    };
    saveLocalD1Store(store);
    writeLocalJson(SETTINGS_CACHE_KEY, store.settings);
    return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
  }

  if ((pathPart === 'login' || pathPart === 'auth/login') && method === 'POST') {
    const rawId = String(body?.identifier || body?.email || '').trim();
    const email = rawId.toLowerCase();
    const phoneCheck = analyzeBdPhone(rawId);
    const password = String(body?.password || '').trim();
    const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();
    let user = store.members.find(
      (m: any) =>
        String(m.email || '').toLowerCase() === email ||
        (phoneCheck.normalized && analyzeBdPhone(String(m.mobile || '')).normalized === phoneCheck.normalized)
    );
    if (!user && isSuper) {
      user = {
        id: 'super-admin-raihan',
        name: 'মোহাম্মদ রায়হান',
        email: SUPER_ADMIN_EMAIL,
        mobile: '',
        avatar_url: '',
        role: 'admin',
        status: 'approved',
        designation: 'অ্যাডমিন',
        sort_order: 1,
        promoted_by: '',
        fb_url: ''
      };
      store.members.unshift(user);
      saveLocalD1Store(store);
    }
    if (!user) {
      return { ok: false, status: 401, notMounted: false, liveD1: false, data: { error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' } };
    }
    if (isSuper && SUPER_ADMIN_DEFAULT_PASSWORDS.includes(password)) {
      user.role = 'admin';
      user.status = 'approved';
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { user } };
    }
    if (user.password && user.password !== password && !isSuper) {
      return { ok: false, status: 401, notMounted: false, liveD1: false, data: { error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' } };
    }
    if (user.status === 'pending' && !isSuper) {
      return { ok: false, status: 403, notMounted: false, liveD1: false, data: { error: 'একাউন্টটি এখনো অ্যাপ্রুভ হয়নি।' } };
    }
    return { ok: true, status: 200, notMounted: false, liveD1: false, data: { user } };
  }

  if ((pathPart === 'register' || pathPart === 'auth/register') && method === 'POST') {
    const rawId = String(body?.identifier || body?.email || body?.mobile || '').trim();
    const isEmail = rawId.includes('@');
    const phoneCheck = analyzeBdPhone(isEmail ? String(body?.mobile || '') : rawId);
    const mobile = phoneCheck.isValidBd ? phoneCheck.normalized : '';
    const email = isEmail ? rawId.toLowerCase() : `${mobile}@phone.noboalo.org`;
    const isSuper = email === SUPER_ADMIN_EMAIL.toLowerCase();
    const newUser = {
      id: body?.id || `mem-${Date.now()}`,
      name: String(body?.name || '').trim(),
      email,
      mobile,
      password: String(body?.password || ''),
      avatar_url: '',
      role: isSuper ? 'admin' : 'member',
      status: isSuper || store.settings?.auto_approve ? 'approved' : 'pending',
      designation: isSuper ? 'অ্যাডমিন' : 'সাধারণ সদস্য',
      sort_order: isSuper ? 1 : 100,
      promoted_by: '',
      fb_url: '',
      blood_group: '',
      bio: '',
      reminder_status: 'auto',
      reminder_note: ''
    };
    store.members = [...store.members.filter((m: any) => String(m.email).toLowerCase() !== email), newUser];
    saveLocalD1Store(store);
    return { ok: true, status: 200, notMounted: false, liveD1: false, data: { user: newUser } };
  }

  if (pathPart === 'members') {
    if (method === 'POST') {
      const item = { ...body, id: body?.id || `mem-${Date.now()}` };
      store.members = [...store.members.filter((m: any) => m.id !== item.id), item];
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { id: item.id, ok: true } };
    }
    if (method === 'PUT') {
      store.members = store.members.map((m: any) => (m.id === body?.id || (body?.email && String(m.email).toLowerCase() === String(body.email).toLowerCase()) ? { ...m, ...body } : m));
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
    }
    if (method === 'DELETE') {
      const id = params.get('id');
      store.members = store.members.filter((m: any) => m.id !== id);
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
    }
  }

  const listKeyMap: Record<string, string> = {
    finances: 'finances',
    activities: 'activities',
    ideas: 'ideas',
    gallery: 'gallery'
  };
  const targetKey = listKeyMap[pathPart];
  if (targetKey) {
    if (method === 'POST') {
      const item = { ...body, id: body?.id || `${pathPart}-${Date.now()}`, created_at: new Date().toISOString() };
      store[targetKey] = [item, ...(store[targetKey] || [])];
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { id: item.id, ok: true } };
    }
    if (method === 'PUT') {
      store[targetKey] = (store[targetKey] || []).map((x: any) => (x.id === body?.id ? { ...x, ...body } : x));
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
    }
    if (method === 'DELETE') {
      const id = params.get('id');
      store[targetKey] = (store[targetKey] || []).filter((x: any) => x.id !== id);
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
    }
  }

  return { ok: true, status: 200, notMounted: false, liveD1: false, data: { ok: true } };
};

// Cloudflare D1 Pages Function API Helper (Uses bracket-free /api/* endpoints + automatic Local mirror)
const callD1Api = async (endpoint: string, method = 'GET', body?: any) => {
  const normalizedEndpoint = endpoint
    .replace(/^auth\/login$/, 'login')
    .replace(/^auth\/register$/, 'register');

  // Always mirror mutations locally as well for instant persistence
  if (method !== 'GET') {
    runLocalD1Fallback(normalizedEndpoint, method, body);
  }

  try {
    const res = await fetch(`/api/${normalizedEndpoint}`, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return runLocalD1Fallback(normalizedEndpoint, method, body);
    }
    const data = await res.json();
    if (res.status === 503) {
      return runLocalD1Fallback(normalizedEndpoint, method, body);
    }
    // Sync bootstrap payload into local mirror
    if (normalizedEndpoint === 'bootstrap' && res.ok && data?.d1_active) {
      saveLocalD1Store({
        settings: data.settings,
        members: data.members || [],
        activities: data.activities || [],
        finances: data.finances || [],
        ideas: data.ideas || [],
        gallery: data.gallery || []
      });
    }
    return { ok: res.ok, status: res.status, notMounted: false, liveD1: true, data };
  } catch {
    return runLocalD1Fallback(normalizedEndpoint, method, body);
  }
};

// ============================================================================
// 4. CLOUDINARY XHR UPLOAD UTILITY (`wz8yg950` + folder `nobo_alo_images`)
// ============================================================================
const singleXhrUpload = (
  file: File,
  cloudName: string,
  uploadPreset: string,
  folderName: string,
  onProgress: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (folderName) {
      formData.append('folder', folderName);
      formData.append('asset_folder', folderName);
    }

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onProgress(100);
          resolve(data.secure_url || data.url);
        } catch {
          reject(new Error('Invalid JSON response from Cloudinary'));
        }
      } else {
        let errMsg = `Status ${xhr.status}`;
        try {
          const errJson = JSON.parse(xhr.responseText);
          if (errJson?.error?.message) errMsg = errJson.error.message;
        } catch {
          // ignore
        }
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
    xhr.send(formData);
  });
};

// Automatically resolves whether `wz8yg950` is set as Cloud Name or Upload Preset Name,
// and saves directly inside the `nobo_alo_images` folder.
const uploadMediaToCloudinary = async (
  rawFile: File,
  onProgress: (percent: number) => void,
  mode: 'avatar' | 'logo' | 'general' = 'general'
): Promise<string> => {
  const file = await compressImageFile(rawFile, mode);
  const attempts = [
    { cloud: CLOUDINARY_ID, preset: CLOUDINARY_FOLDER_NAME, folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_ID, preset: CLOUDINARY_UPLOAD_PRESET, folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_ID, preset: 'ml_default', folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_ID, preset: 'unsigned', folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_FALLBACK_CLOUD, preset: CLOUDINARY_UPLOAD_PRESET, folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_FALLBACK_CLOUD, preset: CLOUDINARY_FOLDER_NAME, folder: CLOUDINARY_FOLDER_NAME }
  ];

  let lastError: any = null;
  for (const cfg of attempts) {
    try {
      const url = await singleXhrUpload(file, cfg.cloud, cfg.preset, cfg.folder, onProgress);
      return url;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    lastError?.message
      ? `ক্লাউডিনারি আপলোড ত্রুটি: ${lastError.message} (Upload Preset টি Unsigned করা আছে কি না চেক করুন)`
      : 'ক্লাউডিনারিতে ফাইল আপলোড ব্যর্থ হয়েছে।'
  );
};

// ============================================================================
// 5. REUSABLE UI COMPONENTS (MANDALA, CIRCULAR LOGO, ACTIVITY SLIDER, MODALS)
// ============================================================================

// Logo-Matched 8-Pointed Islamic Rub el Hizb Octagram & Arch Crest (Matches Official Nobo Alo Logo)
const IslamicMandala: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 420
}) => (
  <div
    className={`pointer-events-none select-none relative flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="octagramGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F3D568" stopOpacity="0.28" />
          <stop offset="65%" stopColor="#D4AF37" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="112" fill="url(#octagramGlow)" />
      {/* Outer 8-Pointed Rub el Hizb Overlapping Squares (Matching Official Logo Geometry) */}
      <g stroke="#D4AF37" strokeOpacity="0.32" strokeWidth="1.6">
        <rect x="44" y="44" width="152" height="152" rx="6" />
        <rect x="44" y="44" width="152" height="152" rx="6" transform="rotate(45 120 120)" />
      </g>
      {/* Inner Stepped 8-Pointed Octagram */}
      <g stroke="#F3D568" strokeOpacity="0.42" strokeWidth="1.2">
        <rect x="64" y="64" width="112" height="112" rx="4" />
        <rect x="64" y="64" width="112" height="112" rx="4" transform="rotate(45 120 120)" />
      </g>
      {/* Center Dome Silhouette & Crescent */}
      <path
        d="M92 146 L92 122 C92 100 120 88 120 88 C120 88 148 100 148 122 L148 146 Z"
        stroke="#D4AF37"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        fill="#D4AF37"
        fillOpacity="0.06"
      />
    </svg>
  </div>
);

// Ornate Section Divider Matching the 8-Pointed Official Logo Star
const IslamicSectionDivider: React.FC<{ subtitle?: string }> = ({ subtitle }) => (
  <div className="flex flex-col items-center justify-center mb-3 select-none">
    <div className="flex items-center gap-3">
      <div className="w-14 sm:w-24 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-[#0A2F25]" />
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-7 h-7">
          <rect x="8" y="8" width="24" height="24" rx="2" fill="#0A2F25" stroke="#D4AF37" strokeWidth="2" />
          <rect x="8" y="8" width="24" height="24" rx="2" transform="rotate(45 20 20)" fill="#0A2F25" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="20" cy="20" r="4" fill="#F3D568" />
        </svg>
      </div>
      <div className="w-14 sm:w-24 h-[1.5px] bg-gradient-to-l from-transparent via-[#D4AF37] to-[#0A2F25]" />
    </div>
    {subtitle && (
      <span className="mt-1.5 px-4 py-1 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold tracking-wide">
        {subtitle}
      </span>
    )}
  </div>
);

// Official Nobo Alo Foundation Circular Logo (With Exact 8-Pointed Star + Dome + Crescent + Open Book SVG Fallback)
const WhiteCircularLogo: React.FC<{
  logoUrl: string;
  sizeClass?: string;
  imgClass?: string;
}> = ({ logoUrl, sizeClass = 'w-11 h-11', imgClass = 'w-full h-full' }) => {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = cleanMediaUrl(logoUrl);

  useEffect(() => {
    setImgError(false);
  }, [resolvedUrl]);

  return (
    <div className={`bg-white rounded-full p-1 shadow-md flex items-center justify-center shrink-0 overflow-hidden ${sizeClass}`}>
      {!imgError && resolvedUrl ? (
        <img
          key={resolvedUrl}
          src={resolvedUrl}
          alt="নব আলো ফাউন্ডেশন লোগো"
          className={`${imgClass} object-contain rounded-full`}
          onError={() => setImgError(true)}
        />
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="নব আলো ফাউন্ডেশন লোগো">
          {/* Outer Teal-Emerald 8-Pointed Rub el Hizb Star */}
          <g fill="none" stroke="#1E4D43" strokeWidth="5.5" strokeLinejoin="round">
            <rect x="20" y="20" width="60" height="60" rx="2" fill="#FFFFFF" />
            <rect x="20" y="20" width="60" height="60" rx="2" transform="rotate(45 50 50)" fill="#FFFFFF" />
          </g>
          {/* Inner Golden 8-Pointed Star Line */}
          <g fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinejoin="round">
            <rect x="26" y="26" width="48" height="48" rx="1.5" />
            <rect x="26" y="26" width="48" height="48" rx="1.5" transform="rotate(45 50 50)" />
          </g>
          {/* Crescent Moon at Top */}
          <path
            d="M50 27 A4.5 4.5 0 1 0 54.5 31.5 A3.5 3.5 0 1 1 50 27 Z"
            fill="#1E4D43"
          />
          {/* Mosque Dome Centerpiece */}
          <path
            d="M36 56 L36 46 C36 37 50 32 50 32 C50 32 64 37 64 46 L64 56 L50 64 Z"
            fill="#1E4D43"
          />
          {/* Open Book Base below Dome */}
          <path
            d="M34 55 L49 63 L49 69 L34 61 Z M66 55 L51 63 L51 69 L66 61 Z"
            fill="#D4AF37"
          />
        </svg>
      )}
    </div>
  );
};

const ActivitySlider: React.FC<{ mediaList: string[]; title: string }> = ({ mediaList, title }) => {
  const validMedia = useMemo(
    () => (mediaList && mediaList.length > 0 ? mediaList.filter(Boolean) : []),
    [mediaList]
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [validMedia]);

  const currentUrl = validMedia[currentIndex] || '';
  const currentIsVideo = isMediaVideo(currentUrl);

  useEffect(() => {
    if (validMedia.length <= 1) return;
    if (currentIsVideo) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % validMedia.length);
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, validMedia.length, currentIsVideo]);

  if (validMedia.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 bg-[#0A2F25] flex items-center justify-center rounded-2xl border border-[#D4AF37]/30">
        <Sparkles className="w-12 h-12 text-[#D4AF37]/50" />
      </div>
    );
  }

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % validMedia.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + validMedia.length) % validMedia.length);

  return (
    <div className="space-y-3">
      <div className="relative w-full bg-black/95 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl">
        <div className="relative w-full h-64 sm:h-96 flex items-center justify-center bg-[#061D17]">
          {currentIsVideo ? (
            <video
              key={currentUrl}
              src={optimizeMedia(currentUrl)}
              controls
              autoPlay
              preload="auto"
              playsInline
              onEnded={goNext}
              className="w-full h-full max-h-96 object-contain"
            />
          ) : (
            <img
              key={currentUrl}
              src={optimizeMedia(currentUrl)}
              alt={`${title} - ${currentIndex + 1}`}
              className="w-full h-full max-h-96 object-cover transition-all duration-500"
            />
          )}
        </div>

        {validMedia.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="পূর্ববর্তী স্লাইড"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0A2F25]/85 hover:bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="পরবর্তী স্লাইড"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0A2F25]/85 hover:bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#0A2F25]/85 px-3 py-1.5 rounded-full border border-[#D4AF37]/50">
              {validMedia.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`স্লাইড ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Interactive Thumbnail Strip for Multi-Media Activities */}
      {validMedia.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {validMedia.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? 'border-[#D4AF37] scale-105 shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {isMediaVideo(url) ? (
                <video src={optimizeMedia(url)} className="w-full h-full object-cover" muted />
              ) : (
                <img src={optimizeMedia(url)} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Confirmation Modal (`ConfirmModal`)
const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  message,
  confirmLabel = 'হ্যাঁ, নিশ্চিত',
  cancelLabel = 'বাতিল করুন',
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#D4AF37] shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-red-100 text-red-600' : 'bg-[#0A2F25]/10 text-[#0A2F25]'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A2F25]">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-[#0A2F25] to-[#155e4a] hover:opacity-95 border border-[#D4AF37]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};


const EMBEDDED_FALLBACK_CSS = '/* Pre-compiled Tailwind & Theme Stylesheet for Nobo Alo Foundation */\n*, ::before, ::after {\n  box-sizing: border-box;\n  border-width: 0;\n  border-style: solid;\n  border-color: #e5e7eb;\n}\nhtml, body {\n  overflow-x: hidden;\n  width: 100%;\n  max-width: 100vw;\n  scroll-behavior: smooth;\n  background-color: #F4F7F5;\n  background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Cg fill=\'none\' stroke=\'%230A2F25\' stroke-width=\'0.6\' stroke-opacity=\'0.055\'%3E%3Cpath d=\'M40 0 L50 30 L80 40 L50 50 L40 80 L30 50 L0 40 L30 30 Z\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'18\'/%3E%3C/g%3E%3C/svg%3E");\n  font-family: \'Hind Siliguri\', \'Poppins\', sans-serif;\n  color: #0A2F25;\n  margin: 0;\n  padding: 0;\n  line-height: 1.5;\n  -webkit-text-size-adjust: 100%;\n}\nimg, video, svg {\n  display: block;\n  max-width: 100%;\n}\nbutton, input, select, textarea {\n  font-family: inherit;\n  font-size: 100%;\n  line-height: inherit;\n  color: inherit;\n  margin: 0;\n}\nbutton {\n  cursor: pointer;\n  background-color: transparent;\n  background-image: none;\n}\na {\n  color: inherit;\n  text-decoration: inherit;\n}\ntable {\n  text-indent: 0;\n  border-color: inherit;\n  border-collapse: collapse;\n}\n.font-english {\n  font-family: \'Poppins\', \'Hind Siliguri\', sans-serif;\n}\n@keyframes mandalaSpin {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}\n@keyframes mandalaSpinReverse {\n  0% { transform: rotate(360deg); }\n  100% { transform: rotate(0deg); }\n}\n.animate-mandala {\n  animation: mandalaSpin 65s linear infinite;\n}\n.animate-mandala-reverse {\n  animation: mandalaSpinReverse 80s linear infinite;\n}\n@keyframes marqueeScroll {\n  0% { transform: translateX(0%); }\n  100% { transform: translateX(-50%); }\n}\n.animate-marquee {\n  display: inline-flex;\n  white-space: nowrap;\n  animation: marqueeScroll 28s linear infinite;\n}\n.animate-marquee:hover {\n  animation-play-state: paused;\n}\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(6px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n.animate-fadeIn {\n  animation: fadeIn 0.25s ease-out forwards;\n}\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n.animate-spin {\n  animation: spin 1s linear infinite;\n}\n.no-scrollbar::-webkit-scrollbar {\n  display: none;\n}\n.no-scrollbar {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n\n\n/* Glossy 3D Luxury Buttons & Shimmer Animations */\n@keyframes glossySweep {\n  0% { transform: translateX(-130%) skewX(-25deg); }\n  100% { transform: translateX(230%) skewX(-25deg); }\n}\n@keyframes floatSlow {\n  0%, 100% { transform: translateY(0px); }\n  50% { transform: translateY(-6px); }\n}\n.btn-glossy-gold {\n  position: relative;\n  overflow: hidden;\n  background-image: linear-gradient(135deg, #D4AF37 0%, #FFF2A6 48%, #D4AF37 100%);\n  box-shadow: 0 10px 25px -5px rgba(212, 175, 55, 0.52), inset 0 2px 2px rgba(255, 255, 255, 0.75), inset 0 -2px 4px rgba(138, 106, 20, 0.45);\n  border: 1px solid #FFF3B0;\n}\n.btn-glossy-gold::after {\n  content: \'\';\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 45%;\n  height: 100%;\n  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%);\n  transform: translateX(-130%) skewX(-25deg);\n  animation: glossySweep 4.2s ease-in-out infinite;\n  pointer-events: none;\n}\n.btn-glossy-emerald {\n  position: relative;\n  overflow: hidden;\n  background-image: linear-gradient(135deg, #0A2F25 0%, #196B54 50%, #0A2F25 100%);\n  box-shadow: 0 10px 25px -5px rgba(10, 47, 37, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.4);\n  border: 1px solid #D4AF37;\n}\n.btn-glossy-emerald::after {\n  content: \'\';\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 45%;\n  height: 100%;\n  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(243,213,104,0.35) 50%, rgba(255,255,255,0) 100%);\n  transform: translateX(-130%) skewX(-25deg);\n  animation: glossySweep 5s ease-in-out infinite;\n  pointer-events: none;\n}\n.bg-\\[\\#155e4a\\]\\/15 { background-color: rgba(21, 94, 74, 0.15); }\n.hover\\:scale-\\[1\\.03\\]:hover { transform: scale(1.03); }\n\n/* Core Layout & Positioning Utilities */\n.min-h-screen { min-height: 100vh; }\n.min-h-\\[460px\\] { min-height: 460px; }\n.flex { display: flex; }\n.inline-flex { display: inline-flex; }\n.inline-block { display: inline-block; }\n.block { display: block; }\n.grid { display: grid; }\n.hidden { display: none; }\n.flex-col { flex-direction: column; }\n.flex-wrap { flex-wrap: wrap; }\n.flex-1 { flex: 1 1 0%; }\n.shrink-0 { flex-shrink: 0; }\n.items-center { align-items: center; }\n.items-start { align-items: flex-start; }\n.justify-center { justify-content: center; }\n.justify-between { justify-content: space-between; }\n.justify-end { justify-content: flex-end; }\n.self-end { align-self: flex-end; }\n.relative { position: relative; }\n.absolute { position: absolute; }\n.fixed { position: fixed; }\n.sticky { position: sticky; }\n.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }\n.inset-x-0 { left: 0; right: 0; }\n.top-0 { top: 0; }\n.top-1 { top: 0.25rem; }\n.top-2 { top: 0.5rem; }\n.top-3 { top: 0.75rem; }\n.top-16 { top: 4rem; }\n.top-1\\/2 { top: 50%; }\n.bottom-0 { bottom: 0; }\n.bottom-2\\.5 { bottom: 0.625rem; }\n.bottom-3 { bottom: 0.75rem; }\n.bottom-5 { bottom: 1.25rem; }\n.left-0 { left: 0; }\n.left-3 { left: 0.75rem; }\n.left-3\\.5 { left: 0.875rem; }\n.left-1\\/2 { left: 50%; }\n.right-1 { right: 0.25rem; }\n.right-2 { right: 0.5rem; }\n.right-2\\.5 { right: 0.625rem; }\n.right-3 { right: 0.75rem; }\n.right-4 { right: 1rem; }\n.-left-24 { left: -6rem; }\n.-left-28 { left: -7rem; }\n.-right-24 { right: -6rem; }\n.-right-28 { right: -7rem; }\n.-top-24 { top: -6rem; }\n.-top-28 { top: -7rem; }\n.-bottom-24 { bottom: -6rem; }\n.-bottom-28 { bottom: -7rem; }\n.-mt-10 { margin-top: -2.5rem; }\n.-translate-x-1\\/2 { transform: translateX(-50%); }\n.-translate-y-1\\/2 { transform: translateY(-50%); }\n.translate-x-0 { transform: translateX(0px); }\n.translate-x-6 { transform: translateX(1.5rem); }\n.z-10 { z-index: 10; }\n.z-30 { z-index: 30; }\n.z-40 { z-index: 40; }\n.z-50 { z-index: 50; }\n.pointer-events-none { pointer-events: none; }\n.select-none { user-select: none; }\n.cursor-pointer { cursor: pointer; }\n.overflow-hidden { overflow: hidden; }\n.overflow-x-hidden { overflow-x: hidden; }\n.overflow-x-auto { overflow-x: auto; }\n.overflow-y-auto { overflow-y: auto; }\n.break-inside-avoid { break-inside: avoid; }\n.break-words { overflow-wrap: break-word; }\n.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.whitespace-nowrap { white-space: nowrap; }\n.whitespace-pre-line { white-space: pre-line; }\n.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }\n\n/* Sizing */\n.w-2 { width: 0.5rem; }\n.w-3 { width: 0.75rem; }\n.w-3\\.5 { width: 0.875rem; }\n.w-4 { width: 1rem; }\n.w-5 { width: 1.25rem; }\n.w-6 { width: 1.5rem; }\n.w-7 { width: 1.75rem; }\n.w-8 { width: 2rem; }\n.w-9 { width: 2.25rem; }\n.w-10 { width: 2.5rem; }\n.w-11 { width: 2.75rem; }\n.w-12 { width: 3rem; }\n.w-14 { width: 3.5rem; }\n.w-16 { width: 4rem; }\n.w-20 { width: 5rem; }\n.w-24 { width: 6rem; }\n.w-full { width: 100%; }\n.w-\\[92vw\\] { width: 92vw; }\n.min-w-0 { min-width: 0px; }\n.min-w-\\[200px\\] { min-width: 200px; }\n.min-w-\\[600px\\] { min-width: 600px; }\n.max-w-xs { max-width: 20rem; }\n.max-w-sm { max-width: 24rem; }\n.max-w-md { max-width: 28rem; }\n.max-w-lg { max-width: 32rem; }\n.max-w-xl { max-width: 36rem; }\n.max-w-2xl { max-width: 42rem; }\n.max-w-3xl { max-width: 48rem; }\n.max-w-4xl { max-width: 56rem; }\n.max-w-7xl { max-width: 80rem; }\n.max-w-\\[100vw\\] { max-width: 100vw; }\n.h-1 { height: 0.25rem; }\n.h-1\\.5 { height: 0.375rem; }\n.h-2 { height: 0.5rem; }\n.h-3 { height: 0.75rem; }\n.h-3\\.5 { height: 0.875rem; }\n.h-4 { height: 1rem; }\n.h-5 { height: 1.25rem; }\n.h-6 { height: 1.5rem; }\n.h-7 { height: 1.75rem; }\n.h-8 { height: 2rem; }\n.h-9 { height: 2.25rem; }\n.h-10 { height: 2.5rem; }\n.h-11 { height: 2.75rem; }\n.h-12 { height: 3rem; }\n.h-14 { height: 3.5rem; }\n.h-16 { height: 4rem; }\n.h-20 { height: 5rem; }\n.h-24 { height: 6rem; }\n.h-28 { height: 7rem; }\n.h-40 { height: 10rem; }\n.h-44 { height: 11rem; }\n.h-52 { height: 13rem; }\n.h-64 { height: 16rem; }\n.h-full { height: 100%; }\n.max-h-96 { max-height: 24rem; }\n.max-h-\\[82vh\\] { max-height: 82vh; }\n.max-h-\\[92vh\\] { max-height: 92vh; }\n\n/* Grid & Columns */\n.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }\n.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.columns-1 { columns: 1; }\n.gap-1 { gap: 0.25rem; }\n.gap-1\\.5 { gap: 0.375rem; }\n.gap-2 { gap: 0.5rem; }\n.gap-2\\.5 { gap: 0.625rem; }\n.gap-3 { gap: 0.75rem; }\n.gap-3\\.5 { gap: 0.875rem; }\n.gap-4 { gap: 1rem; }\n.gap-5 { gap: 1.25rem; }\n.gap-6 { gap: 1.5rem; }\n.space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }\n.space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.625rem; }\n.space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }\n.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }\n.space-y-5 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem; }\n.space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }\n.divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; border-color: #f3f4f6; }\n\n/* Spacing (Padding & Margin) */\n.p-0\\.5 { padding: 0.125rem; }\n.p-1 { padding: 0.25rem; }\n.p-1\\.5 { padding: 0.375rem; }\n.p-2 { padding: 0.5rem; }\n.p-3 { padding: 0.75rem; }\n.p-3\\.5 { padding: 0.875rem; }\n.p-4 { padding: 1rem; }\n.p-5 { padding: 1.25rem; }\n.p-6 { padding: 1.5rem; }\n.p-12 { padding: 3rem; }\n.px-1\\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }\n.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }\n.px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }\n.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }\n.px-3\\.5 { padding-left: 0.875rem; padding-right: 0.875rem; }\n.px-4 { padding-left: 1rem; padding-right: 1rem; }\n.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }\n.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }\n.px-7 { padding-left: 1.75rem; padding-right: 1.75rem; }\n.py-0\\.2 { padding-top: 0.05rem; padding-bottom: 0.05rem; }\n.py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }\n.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }\n.py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }\n.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }\n.py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }\n.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }\n.py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }\n.py-4 { padding-top: 1rem; padding-bottom: 1rem; }\n.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }\n.py-8 { padding-top: 2rem; padding-bottom: 2rem; }\n.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }\n.py-11 { padding-top: 2.75rem; padding-bottom: 2.75rem; }\n.py-12 { padding-top: 3rem; padding-bottom: 3rem; }\n.py-14 { padding-top: 3.5rem; padding-bottom: 3.5rem; }\n.pl-10 { padding-left: 2.5rem; }\n.pr-4 { padding-right: 1rem; }\n.pt-2 { padding-top: 0.5rem; }\n.pt-3 { padding-top: 0.75rem; }\n.pt-4 { padding-top: 1rem; }\n.pt-5 { padding-top: 1.25rem; }\n.pb-1 { padding-bottom: 0.25rem; }\n.pb-2 { padding-bottom: 0.5rem; }\n.pb-6 { padding-bottom: 1.5rem; }\n.pb-12 { padding-bottom: 3rem; }\n.mx-auto { margin-left: auto; margin-right: auto; }\n.my-auto { margin-top: auto; margin-bottom: auto; }\n.ml-0\\.5 { margin-left: 0.125rem; }\n.ml-1 { margin-left: 0.25rem; }\n.ml-2 { margin-left: 0.5rem; }\n.ml-auto { margin-left: auto; }\n.mt-0\\.5 { margin-top: 0.125rem; }\n.mt-1 { margin-top: 0.25rem; }\n.mt-1\\.5 { margin-top: 0.375rem; }\n.mt-2 { margin-top: 0.5rem; }\n.mt-2\\.5 { margin-top: 0.625rem; }\n.mt-4 { margin-top: 1rem; }\n.mt-5 { margin-top: 1.25rem; }\n.mt-7 { margin-top: 1.75rem; }\n.mt-10 { margin-top: 2.5rem; }\n.mt-auto { margin-top: auto; }\n.mb-1 { margin-bottom: 0.25rem; }\n.mb-1\\.5 { margin-bottom: 0.375rem; }\n.mb-2 { margin-bottom: 0.5rem; }\n.mb-3 { margin-bottom: 0.75rem; }\n.mb-3\\.5 { margin-bottom: 0.875rem; }\n.mb-4 { margin-bottom: 1rem; }\n.mb-5 { margin-bottom: 1.25rem; }\n.mb-6 { margin-bottom: 1.5rem; }\n.mb-8 { margin-bottom: 2rem; }\n.mb-9 { margin-bottom: 2.25rem; }\n\n/* Typography */\n.text-\\[10px\\] { font-size: 10px; }\n.text-\\[11px\\] { font-size: 11px; }\n.text-xs { font-size: 0.75rem; line-height: 1rem; }\n.text-sm { font-size: 0.875rem; line-height: 1.25rem; }\n.text-base { font-size: 1rem; line-height: 1.5rem; }\n.text-lg { font-size: 1.125rem; line-height: 1.75rem; }\n.text-xl { font-size: 1.25rem; line-height: 1.75rem; }\n.text-2xl { font-size: 1.5rem; line-height: 2rem; }\n.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }\n.font-medium { font-weight: 500; }\n.font-semibold { font-weight: 600; }\n.font-bold { font-weight: 700; }\n.leading-tight { line-height: 1.25; }\n.leading-snug { line-height: 1.375; }\n.leading-relaxed { line-height: 1.625; }\n.tracking-wide { letter-spacing: 0.025em; }\n.tracking-wider { letter-spacing: 0.05em; }\n.text-left { text-align: left; }\n.text-center { text-align: center; }\n.text-right { text-align: right; }\n.underline { text-decoration-line: underline; }\n.underline-offset-4 { text-underline-offset: 4px; }\n\n/* Colors & Backgrounds */\n.text-white { color: #ffffff; }\n.text-white\\/70 { color: rgba(255, 255, 255, 0.7); }\n.text-\\[\\#FFFFFF\\] { color: #FFFFFF; }\n.text-\\[\\#0A2F25\\] { color: #0A2F25; }\n.text-\\[\\#155e4a\\] { color: #155e4a; }\n.text-\\[\\#D4AF37\\] { color: #D4AF37; }\n.text-\\[\\#D4AF37\\]\\/50 { color: rgba(212, 175, 55, 0.5); }\n.text-\\[\\#D4AF37\\]\\/60 { color: rgba(212, 175, 55, 0.6); }\n.text-\\[\\#F3D568\\] { color: #F3D568; }\n.text-\\[\\#F3D568\\]\\/85 { color: rgba(243, 213, 104, 0.85); }\n.text-gray-200 { color: #e5e7eb; }\n.text-gray-300 { color: #d1d5db; }\n.text-gray-400 { color: #9ca3af; }\n.text-gray-500 { color: #6b7280; }\n.text-gray-600 { color: #4b5563; }\n.text-gray-700 { color: #374151; }\n.text-emerald-700 { color: #047857; }\n.text-emerald-800 { color: #065f46; }\n.text-amber-700 { color: #b45309; }\n.text-amber-800 { color: #92400e; }\n.text-red-300 { color: #fca5a5; }\n.text-red-600 { color: #dc2626; }\n.text-red-700 { color: #b91c1c; }\n\n.bg-white { background-color: #ffffff; }\n.bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1); }\n.bg-white\\/20 { background-color: rgba(255, 255, 255, 0.2); }\n.bg-white\\/35 { background-color: rgba(255, 255, 255, 0.35); }\n.bg-white\\/50 { background-color: rgba(255, 255, 255, 0.5); }\n.bg-white\\/95 { background-color: rgba(255, 255, 255, 0.95); }\n.bg-black\\/0 { background-color: rgba(0, 0, 0, 0); }\n.bg-black\\/25 { background-color: rgba(0, 0, 0, 0.25); }\n.bg-black\\/40 { background-color: rgba(0, 0, 0, 0.4); }\n.bg-black\\/60 { background-color: rgba(0, 0, 0, 0.6); }\n.bg-black\\/65 { background-color: rgba(0, 0, 0, 0.65); }\n.bg-black\\/75 { background-color: rgba(0, 0, 0, 0.75); }\n.bg-black\\/85 { background-color: rgba(0, 0, 0, 0.85); }\n.bg-black\\/95 { background-color: rgba(0, 0, 0, 0.95); }\n.bg-\\[\\#061D17\\] { background-color: #061D17; }\n.bg-\\[\\#0A2F25\\] { background-color: #0A2F25; }\n.bg-\\[\\#0A2F25\\]\\/5 { background-color: rgba(10, 47, 37, 0.05); }\n.bg-\\[\\#0A2F25\\]\\/10 { background-color: rgba(10, 47, 37, 0.1); }\n.bg-\\[\\#0A2F25\\]\\/85 { background-color: rgba(10, 47, 37, 0.85); }\n.bg-\\[\\#0A2F25\\]\\/90 { background-color: rgba(10, 47, 37, 0.9); }\n.bg-\\[\\#0A2F25\\]\\/95 { background-color: rgba(10, 47, 37, 0.95); }\n.bg-\\[\\#124A3B\\] { background-color: #124A3B; }\n.bg-\\[\\#124A3B\\]\\/90 { background-color: rgba(18, 74, 59, 0.9); }\n.bg-\\[\\#155e4a\\] { background-color: #155e4a; }\n.bg-\\[\\#D4AF37\\] { background-color: #D4AF37; }\n.bg-\\[\\#D4AF37\\]\\/20 { background-color: rgba(212, 175, 55, 0.2); }\n.bg-\\[\\#F3D568\\] { background-color: #F3D568; }\n.bg-\\[\\#F4F7F5\\] { background-color: #F4F7F5; }\n.bg-gray-100 { background-color: #f3f4f6; }\n.bg-gray-200 { background-color: #e5e7eb; }\n.bg-gray-300 { background-color: #d1d5db; }\n.bg-emerald-100 { background-color: #d1fae5; }\n.bg-emerald-600 { background-color: #059669; }\n.bg-amber-100 { background-color: #fef3c7; }\n.bg-red-50 { background-color: #fef2f2; }\n.bg-red-100 { background-color: #fee2e2; }\n.bg-red-600 { background-color: #dc2626; }\n.bg-red-900\\/95 { background-color: rgba(127, 29, 29, 0.95); }\n\n/* Gradients */\n.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }\n.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }\n.bg-gradient-to-tr { background-image: linear-gradient(to top right, var(--tw-gradient-stops)); }\n.from-\\[\\#0A2F25\\] { --tw-gradient-from: #0A2F25; --tw-gradient-to: rgba(10, 47, 37, 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }\n.from-\\[\\#D4AF37\\] { --tw-gradient-from: #D4AF37; --tw-gradient-to: rgba(212, 175, 55, 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }\n.via-\\[\\#124A3B\\] { --tw-gradient-to: rgba(18, 74, 59, 0); --tw-gradient-stops: var(--tw-gradient-from), #124A3B, var(--tw-gradient-to); }\n.via-\\[\\#155e4a\\] { --tw-gradient-to: rgba(21, 94, 74, 0); --tw-gradient-stops: var(--tw-gradient-from), #155e4a, var(--tw-gradient-to); }\n.via-\\[\\#D4AF37\\] { --tw-gradient-to: rgba(212, 175, 55, 0); --tw-gradient-stops: var(--tw-gradient-from), #D4AF37, var(--tw-gradient-to); }\n.via-\\[\\#F3D568\\] { --tw-gradient-to: rgba(243, 213, 104, 0); --tw-gradient-stops: var(--tw-gradient-from), #F3D568, var(--tw-gradient-to); }\n.to-\\[\\#0A2F25\\] { --tw-gradient-to: #0A2F25; }\n.to-\\[\\#124A3B\\] { --tw-gradient-to: #124A3B; }\n.to-\\[\\#155e4a\\] { --tw-gradient-to: #155e4a; }\n.to-\\[\\#D4AF37\\] { --tw-gradient-to: #D4AF37; }\n.to-\\[\\#F3D568\\] { --tw-gradient-to: #F3D568; }\n\n/* Borders & Radius */\n.border { border-width: 1px; }\n.border-2 { border-width: 2px; }\n.border-b { border-bottom-width: 1px; }\n.border-b-2 { border-bottom-width: 2px; }\n.border-b-4 { border-bottom-width: 4px; }\n.border-t { border-top-width: 1px; }\n.border-t-2 { border-top-width: 2px; }\n.border-dashed { border-style: dashed; }\n.border-transparent { border-color: transparent; }\n.border-white { border-color: #ffffff; }\n.border-white\\/10 { border-color: rgba(255, 255, 255, 0.1); }\n.border-gray-100 { border-color: #f3f4f6; }\n.border-gray-200 { border-color: #e5e7eb; }\n.border-gray-300 { border-color: #d1d5db; }\n.border-emerald-200 { border-color: #a7f3d0; }\n.border-red-200 { border-color: #fecaca; }\n.border-red-400 { border-color: #f87171; }\n.border-\\[\\#0A2F25\\]\\/15 { border-color: rgba(10, 47, 37, 0.15); }\n.border-\\[\\#155e4a\\]\\/25 { border-color: rgba(21, 94, 74, 0.25); }\n.border-\\[\\#155e4a\\]\\/40 { border-color: rgba(21, 94, 74, 0.4); }\n.border-\\[\\#D4AF37\\] { border-color: #D4AF37; }\n.border-\\[\\#D4AF37\\]\\/30 { border-color: rgba(212, 175, 55, 0.3); }\n.border-\\[\\#D4AF37\\]\\/35 { border-color: rgba(212, 175, 55, 0.35); }\n.border-\\[\\#D4AF37\\]\\/40 { border-color: rgba(212, 175, 55, 0.4); }\n.border-\\[\\#D4AF37\\]\\/45 { border-color: rgba(212, 175, 55, 0.45); }\n.border-\\[\\#D4AF37\\]\\/50 { border-color: rgba(212, 175, 55, 0.5); }\n.border-\\[\\#D4AF37\\]\\/60 { border-color: rgba(212, 175, 55, 0.6); }\n.border-\\[\\#F3D568\\] { border-color: #F3D568; }\n\n.rounded { border-radius: 0.25rem; }\n.rounded-lg { border-radius: 0.5rem; }\n.rounded-xl { border-radius: 0.75rem; }\n.rounded-2xl { border-radius: 1rem; }\n.rounded-3xl { border-radius: 1.5rem; }\n.rounded-full { border-radius: 9999px; }\n.rounded-tl-xl { border-top-left-radius: 0.75rem; }\n.rounded-tr-xl { border-top-right-radius: 0.75rem; }\n\n/* Shadows, Opacity, Blur & Object Fit */\n.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); }\n.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }\n.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }\n.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }\n.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }\n.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }\n.shadow-\\[0_8px_30px_rgba\\(10\\,47\\,37\\,0\\.28\\)\\] { box-shadow: 0 8px 30px rgba(10, 47, 37, 0.28); }\n.shadow-\\[0_0_40px_rgba\\(212\\,175\\,55\\,0\\.45\\)\\] { box-shadow: 0 0 40px rgba(212, 175, 55, 0.45); }\n.shadow-\\[0_10px_25px_rgba\\(212\\,175\\,55\\,0\\.4\\)\\] { box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4); }\n.drop-shadow-lg { filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1)); }\n.backdrop-blur-sm { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }\n.backdrop-blur-md { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }\n.backdrop-blur-lg { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }\n.backdrop-blur-xl { backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }\n.opacity-0 { opacity: 0; }\n.opacity-35 { opacity: 0.35; }\n.opacity-40 { opacity: 0.4; }\n.opacity-45 { opacity: 0.45; }\n.opacity-60 { opacity: 0.6; }\n.opacity-80 { opacity: 0.8; }\n.object-contain { object-fit: contain; }\n.object-cover { object-fit: cover; }\n.fill-current { fill: currentColor; }\n.accent-\\[\\#0A2F25\\] { accent-color: #0A2F25; }\n.scale-105 { transform: scale(1.05); }\n\n/* Transitions & Interactive States */\n.transition { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }\n.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 200ms; }\n.transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }\n.transition-opacity { transition-property: opacity; transition-duration: 500ms; }\n.transition-transform { transition-property: transform; transition-duration: 300ms; }\n.duration-200 { transition-duration: 200ms; }\n.duration-300 { transition-duration: 300ms; }\n.duration-500 { transition-duration: 500ms; }\n.duration-700 { transition-duration: 700ms; }\n.duration-1000 { transition-duration: 1000ms; }\n\n.hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }\n.hover\\:scale-\\[1\\.02\\]:hover { transform: scale(1.02); }\n.hover\\:brightness-105:hover { filter: brightness(1.05); }\n.hover\\:opacity-95:hover { opacity: 0.95; }\n.hover\\:opacity-100:hover { opacity: 1; }\n.hover\\:underline:hover { text-decoration-line: underline; }\n.hover\\:bg-\\[\\#0A2F25\\]:hover { background-color: #0A2F25; }\n.hover\\:bg-\\[\\#0A2F25\\]\\/5:hover { background-color: rgba(10, 47, 37, 0.05); }\n.hover\\:bg-\\[\\#155e4a\\]:hover { background-color: #155e4a; }\n.hover\\:bg-\\[\\#D4AF37\\]:hover { background-color: #D4AF37; }\n.hover\\:bg-\\[\\#D4AF37\\]\\/20:hover { background-color: rgba(212, 175, 55, 0.2); }\n.hover\\:bg-white:hover { background-color: #ffffff; }\n.hover\\:bg-white\\/20:hover { background-color: rgba(255, 255, 255, 0.2); }\n.hover\\:bg-gray-50:hover { background-color: #f9fafb; }\n.hover\\:bg-gray-50\\/80:hover { background-color: rgba(249, 250, 251, 0.8); }\n.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }\n.hover\\:bg-emerald-700:hover { background-color: #047857; }\n.hover\\:bg-red-600:hover { background-color: #dc2626; }\n.hover\\:bg-red-700:hover { background-color: #b91c1c; }\n.hover\\:text-\\[\\#0A2F25\\]:hover { color: #0A2F25; }\n.hover\\:text-\\[\\#F3D568\\]:hover { color: #F3D568; }\n.hover\\:text-white:hover { color: #ffffff; }\n.hover\\:border-\\[\\#D4AF37\\]:hover { border-color: #D4AF37; }\n.hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }\n.hover\\:shadow-\\[0_20px_40px_-15px_rgba\\(10\\,47\\,37\\,0\\.22\\)\\]:hover { box-shadow: 0 20px 40px -15px rgba(10, 47, 37, 0.22); }\n.group:hover .group-hover\\:scale-105 { transform: scale(1.05); }\n.group:hover .group-hover\\:scale-110 { transform: scale(1.1); }\n.group:hover .group-hover\\:text-\\[\\#F3D568\\] { color: #F3D568; }\n.group:hover .group-hover\\:text-\\[\\#155e4a\\] { color: #155e4a; }\n.group:hover .group-hover\\:bg-\\[\\#0A2F25\\] { background-color: #0A2F25; }\n.group:hover .group-hover\\:bg-black\\/30 { background-color: rgba(0, 0, 0, 0.3); }\n.group:hover .group-hover\\:opacity-100 { opacity: 1; }\n.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }\n.focus\\:border-\\[\\#0A2F25\\]:focus { border-color: #0A2F25; }\n.disabled\\:opacity-30:disabled { opacity: 0.3; }\n.disabled\\:opacity-60:disabled { opacity: 0.6; }\n\n/* Responsive Breakpoints (sm: 640px, md: 768px, lg: 1024px) */\n@media (min-width: 640px) {\n  .sm\\:block { display: block; }\n  .sm\\:flex-row { flex-direction: row; }\n  .sm\\:items-center { align-items: center; }\n  .sm\\:self-center { align-self: center; }\n  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n  .sm\\:col-span-2 { grid-column: span 2 / span 2; }\n  .sm\\:columns-2 { columns: 2; }\n  .sm\\:gap-3 { gap: 0.75rem; }\n  .sm\\:gap-4 { gap: 1rem; }\n  .sm\\:gap-5 { gap: 1.25rem; }\n  .sm\\:w-11 { width: 2.75rem; }\n  .sm\\:w-14 { width: 3.5rem; }\n  .sm\\:w-24 { width: 6rem; }\n  .sm\\:h-11 { height: 2.75rem; }\n  .sm\\:h-14 { height: 3.5rem; }\n  .sm\\:h-24 { height: 6rem; }\n  .sm\\:h-52 { height: 13rem; }\n  .sm\\:h-60 { height: 15rem; }\n  .sm\\:h-80 { height: 20rem; }\n  .sm\\:h-96 { height: 24rem; }\n  .sm\\:min-h-\\[550px\\] { min-height: 550px; }\n  .sm\\:p-4 { padding: 1rem; }\n  .sm\\:p-5 { padding: 1.25rem; }\n  .sm\\:p-6 { padding: 1.5rem; }\n  .sm\\:p-7 { padding: 1.75rem; }\n  .sm\\:p-8 { padding: 2rem; }\n  .sm\\:px-4 { padding-left: 1rem; padding-right: 1rem; }\n  .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }\n  .sm\\:px-9 { padding-left: 2.25rem; padding-right: 2.25rem; }\n  .sm\\:py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }\n  .sm\\:py-12 { padding-top: 3rem; padding-bottom: 3rem; }\n  .sm\\:py-14 { padding-top: 3.5rem; padding-bottom: 3.5rem; }\n  .sm\\:py-16 { padding-top: 4rem; padding-bottom: 4rem; }\n  .sm\\:py-20 { padding-top: 5rem; padding-bottom: 5rem; }\n  .sm\\:pt-5 { padding-top: 1.25rem; }\n  .sm\\:pb-16 { padding-bottom: 4rem; }\n  .sm\\:text-left { text-align: left; }\n  .sm\\:text-xs { font-size: 0.75rem; line-height: 1rem; }\n  .sm\\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }\n  .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; }\n  .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }\n  .sm\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }\n  .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }\n  .sm\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }\n  .sm\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }\n  .sm\\:leading-tight { line-height: 1.25; }\n}\n\n@media (min-width: 768px) {\n  .md\\:inline { display: inline; }\n  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n  .md\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }\n  .md\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }\n  .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }\n  .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }\n  .md\\:text-5xl { font-size: 3rem; line-height: 1.15; }\n}\n\n@media (min-width: 1024px) {\n  .lg\\:columns-3 { columns: 3; }\n  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n}\n';

// ============================================================================
// 6. MAIN PRODUCTION APPLICATION COMPONENT
// ============================================================================
type AppView = 'home' | 'members' | 'join' | 'login' | 'dashboard';

const VIEW_TO_PATH: Record<AppView, string> = {
  home: '/',
  members: '/members',
  join: '/join',
  login: '/login',
  dashboard: '/dashboard'
};

const getViewFromPathname = (pathname: string): AppView => {
  const clean = (pathname || '/').replace(/\/+$/, '').toLowerCase();
  if (clean === '/members' || clean.endsWith('/members')) return 'members';
  if (clean === '/join' || clean.endsWith('/join')) return 'join';
  if (clean === '/login' || clean.endsWith('/login')) return 'login';
  if (clean === '/dashboard' || clean.endsWith('/dashboard') || clean.endsWith('/admin')) return 'dashboard';
  return 'home';
};

export default function App() {
  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      return getViewFromPathname(window.location.pathname);
    }
    return 'home';
  });

  const setCurrentView = (nextView: AppView) => {
    setCurrentViewState(nextView);
    try {
      const targetPath = VIEW_TO_PATH[nextView] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: nextView }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Safe fallback inside sandboxed iframe
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewState(getViewFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const cached = readLocalJson(SETTINGS_CACHE_KEY, DEFAULT_SETTINGS);
    return {
      ...cached,
      logo_url: cleanMediaUrl(cached.logo_url),
      favicon_url: cleanMediaUrl(cached.favicon_url)
    };
  });
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [useD1Backend, setUseD1Backend] = useState<boolean>(true);
  const [d1LiveConnected, setD1LiveConnected] = useState<boolean>(false);
  const lastSettingsSaveRef = useRef<number>(0);
  const activeTabRef = useRef<string>('overview');

  const [membersTable, setMembersTable] = useState<string>('members');
  const [activitiesTable, setActivitiesTable] = useState<string>('activities');

  const [appUser, setAppUser] = useState<MemberUser | null>(() => readLocalJson<MemberUser | null>(SESSION_STORAGE_KEY, null));
  const [activeTab, setActiveTab] = useState<string>('overview');
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Lightbox state for public gallery preview
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);

  // Non-Blocking Cloudinary Upload Toast State
  const [uploadState, setUploadState] = useState<{
    active: boolean;
    percent: number;
    label: string;
  }>({ active: false, percent: 0, label: '' });

  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    isDanger: false,
    onConfirm: () => {}
  });

  // Hero Banner Slideshow Index (cycles every 5s through valid URLs in siteSettings.banners)
  const [bannerIndex, setBannerIndex] = useState(0);
  const validBanners = useMemo(() => {
    return (siteSettings.banners || []).filter((b) => b && b.trim() !== '');
  }, [siteSettings.banners]);

  useEffect(() => {
    if (validBanners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % validBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [validBanners.length]);

  useEffect(() => {
    document.documentElement.lang = 'bn';
    document.documentElement.setAttribute('translate', 'no');
    document.body.classList.add('notranslate');
    const baseTitle = siteSettings.site_name || DEFAULT_SITE_NAME;
    const viewTitles: Record<AppView, string> = {
      home: baseTitle,
      members: `সদস্যবৃন্দ | ${baseTitle}`,
      join: `যুক্ত হোন | ${baseTitle}`,
      login: `লগইন | ${baseTitle}`,
      dashboard: `ড্যাশবোর্ড | ${baseTitle}`
    };
    document.title = viewTitles[currentView] || baseTitle;

    const activeFavicon = optimizeMedia(
      siteSettings.favicon_url || siteSettings.logo_url || FAVICON_URL
    );
    if (activeFavicon) {
      let linkEl = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = 'icon';
        document.head.appendChild(linkEl);
      }
      linkEl.href = activeFavicon;
    }
  }, [siteSettings.site_name, siteSettings.favicon_url, siteSettings.logo_url, currentView]);

  // Persist Login Session in Browser LocalStorage automatically
  useEffect(() => {
    writeLocalJson(SESSION_STORAGE_KEY, appUser);
  }, [appUser]);

  // Persist Site Settings in Browser LocalStorage for instant load
  useEffect(() => {
    writeLocalJson(SETTINGS_CACHE_KEY, siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    if (appUser) {
      if (appUser.role === 'admin') {
        setActiveTab((prev) =>
          ['overview', 'members', 'finances', 'works', 'ideas', 'gallery', 'settings', 'my_profile'].includes(prev)
            ? prev
            : 'overview'
        );
      } else {
        setActiveTab((prev) =>
          ['my_account', 'my_profile', 'foundation_funds', 'expense_history'].includes(prev)
            ? prev
            : 'my_account'
        );
      }
    }
  }, [appUser?.id, appUser?.role]);

  const normalizeMemberRow = (u: any): MemberUser => {
    const emailStr = String(u.email || '').trim();
    const isSuper = emailStr.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const role: 'admin' | 'member' = isSuper ? 'admin' : u.role === 'admin' ? 'admin' : 'member';
    const status: 'approved' | 'pending' = isSuper
      ? 'approved'
      : u.status === 'approved'
      ? 'approved'
      : 'pending';
    return {
      id: String(u.id || u.uid || ''),
      name: u.name || u.full_name || 'সদস্য',
      email: emailStr,
      mobile: u.mobile || u.phone || '',
      avatar_url: u.avatar_url || u.avatar || u.photo_url || '',
      role,
      status,
      designation: u.designation || (role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য'),
      sort_order: Number(u.sort_order ?? 100),
      promoted_by: u.promoted_by ? String(u.promoted_by) : '',
      fb_url: u.fb_url ? String(u.fb_url) : '',
      blood_group: u.blood_group ? String(u.blood_group) : '',
      bio: u.bio ? String(u.bio) : '',
      reminder_status: (['auto', 'paid', 'due_1m', 'due_2m'].includes(u.reminder_status) ? u.reminder_status : 'auto') as any,
      reminder_note: u.reminder_note ? String(u.reminder_note) : '',
      created_at: u.created_at
    };
  };

  // ============================================================================
  // 7. DATA FETCH (CLOUDFLARE D1 PRIMARY + SUPABASE FALLBACK)
  // ============================================================================
  const fetchAllData = async () => {
    try {
      const d1Boot = await callD1Api('bootstrap', 'GET');
      if (d1Boot.ok && d1Boot.data?.d1_active) {
        setUseD1Backend(true);
        if (d1Boot.liveD1) setD1LiveConnected(true);
        if (d1Boot.data.settings) {
          const isEditingSettings = activeTabRef.current === 'settings';
          const recentlySaved = Date.now() - lastSettingsSaveRef.current < 20000;
          if (!recentlySaved && (!isEditingSettings || lastSettingsSaveRef.current === 0)) {
            setSiteSettings({
              ...d1Boot.data.settings,
              logo_url: cleanMediaUrl(d1Boot.data.settings.logo_url),
              favicon_url: cleanMediaUrl(d1Boot.data.settings.favicon_url)
            });
          }
        }
        if (Array.isArray(d1Boot.data.members)) setMembers(d1Boot.data.members.map(normalizeMemberRow));
        if (Array.isArray(d1Boot.data.activities)) setActivities(d1Boot.data.activities);
        if (Array.isArray(d1Boot.data.finances)) setFinances(d1Boot.data.finances);
        if (Array.isArray(d1Boot.data.ideas)) setIdeas(d1Boot.data.ideas);
        if (Array.isArray(d1Boot.data.gallery)) setGallery(d1Boot.data.gallery);
        setLoadingInitial(false);
        return;
      }

      // 1. Site Settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        const paddedBanners = Array.isArray(settingsData.banners)
          ? [...settingsData.banners]
          : [];
        while (paddedBanners.length < 4) paddedBanners.push('');
        setSiteSettings({
          id: settingsData.id ?? 1,
          site_name: settingsData.site_name || settingsData.name || DEFAULT_SITE_NAME,
          tagline: settingsData.tagline || DEFAULT_TAGLINE,
          announcement_text: settingsData.announcement_text || DEFAULT_ANNOUNCEMENT,
          logo_url: settingsData.logo_url || settingsData.logo || DEFAULT_LOGO_URL,
          favicon_url: settingsData.favicon_url || settingsData.logo_url || settingsData.logo || FAVICON_URL,
          banners: paddedBanners,
          auto_approve: Boolean(settingsData.auto_approve)
        });
      }

      // 2. Members
      for (const candidate of ['members', 'users', 'profiles']) {
        const { data, error } = await supabase.from(candidate).select('*');
        if (!error && Array.isArray(data)) {
          setMembersTable(candidate);
          setMembers(data.map(normalizeMemberRow));
          break;
        }
      }

      // 3. Activities
      for (const candidate of ['activities', 'works']) {
        const { data, error } = await supabase
          .from(candidate)
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          setActivitiesTable(candidate);
          setActivities(
            data.map((a: any) => ({
              id: String(a.id),
              title: a.title || '',
              description: a.description || '',
              category: a.category || 'সাধারণ',
              activity_date: a.activity_date || a.date || '',
              is_coming_soon: Boolean(a.is_coming_soon),
              media: Array.isArray(a.media)
                ? a.media
                : Array.isArray(a.images)
                ? a.images
                : a.image_url
                ? [a.image_url]
                : [],
              created_at: a.created_at
            }))
          );
          break;
        }
      }

      // 4. Finances
      const { data: finData, error: finErr } = await supabase
        .from('finances')
        .select('*')
        .order('created_at', { ascending: false });

      if (!finErr && Array.isArray(finData)) {
        setFinances(
          finData.map((f: any) => ({
            id: String(f.id),
            type: f.type === 'expense' ? 'expense' : 'income',
            amount: Number(f.amount || 0),
            memberuid: String(f.memberuid || f.member_uid || f.member_id || ''),
            month: f.month || '',
            description: f.description || '',
            created_at: f.created_at
          }))
        );
      }

      // 5. Ideas
      const { data: ideasData, error: ideasErr } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ideasErr && Array.isArray(ideasData)) {
        setIdeas(
          ideasData.map((i: any) => ({
            id: String(i.id),
            name: i.name || '',
            mobile: i.mobile || i.phone || '',
            idea: i.idea || i.plan || i.description || '',
            created_at: i.created_at
          }))
        );
      }

      // 6. Gallery Images
      const { data: galData, error: galErr } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (!galErr && Array.isArray(galData)) {
        setGallery(
          galData.map((g: any) => ({
            id: String(g.id),
            url: g.url || g.image_url || '',
            created_at: g.created_at
          }))
        );
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  const syncAuthUserProfile = async (authUser: any) => {
    if (!authUser) {
      setAppUser(null);
      return;
    }
    const cleanEmail = String(authUser.email || '').trim().toLowerCase();
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    let foundRow: any = null;
    for (const table of ['members', 'users', 'profiles']) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .or(`id.eq.${authUser.id},email.ilike.${cleanEmail}`)
        .limit(1)
        .maybeSingle();
      if (data) {
        foundRow = data;
        setMembersTable(table);
        break;
      }
    }

    if (foundRow) {
      const normalized = normalizeMemberRow(foundRow);
      if (isSuperAdmin && (foundRow.role !== 'admin' || foundRow.status !== 'approved')) {
        await smartSupabaseMutation(
          [membersTable, 'members', 'users', 'profiles'],
          'update',
          { role: 'admin', status: 'approved' },
          'id',
          foundRow.id
        );
      }
      if (normalized.status === 'pending' && !isSuperAdmin) {
        await supabase.auth.signOut();
        setAppUser(null);
        showNotice('একাউন্টটি এখনো অ্যাপ্রুভ হয়নি।', 'error');
        return;
      }
      setAppUser(normalized);
    } else if (isSuperAdmin) {
      const superProfile: MemberUser = {
        id: authUser.id,
        name: authUser.user_metadata?.name || 'মোহাম্মদ রায়হান',
        email: SUPER_ADMIN_EMAIL,
        mobile: authUser.user_metadata?.mobile || '',
        avatar_url: '',
        role: 'admin',
        status: 'approved',
        designation: 'অ্যাডমিন',
        sort_order: 1
      };
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'upsert',
        superProfile
      );
      setAppUser(superProfile);
    }
  };

  useEffect(() => {
    fetchAllData();
    const syncTimer = setInterval(() => {
      fetchAllData();
    }, 15000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncAuthUserProfile(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncAuthUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setAppUser(null);
      }
    });

    return () => {
      clearInterval(syncTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ============================================================================
  // 8. COMPUTED FINANCIAL TOTALS & FILTERED LISTS
  // ============================================================================
  const { totalIncome, totalExpense, currentBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const item of finances) {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') inc += amt;
      else if (item.type === 'expense') exp += amt;
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      currentBalance: inc - exp
    };
  }, [finances]);

  // Keep logged-in user's profile synced with latest DB row
  useEffect(() => {
    if (!appUser || members.length === 0) return;
    const latest = members.find(
      (m) => m.id === appUser.id || m.email.toLowerCase() === appUser.email.toLowerCase()
    );
    if (latest) {
      if (latest.status === 'pending' && latest.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setAppUser(null);
        return;
      }
      if (
        latest.name !== appUser.name ||
        latest.role !== appUser.role ||
        latest.avatar_url !== appUser.avatar_url ||
        latest.designation !== appUser.designation ||
        latest.promoted_by !== appUser.promoted_by
      ) {
        setAppUser(latest);
      }
    }
  }, [members]);

  // Unified All-Website Media List for fast Gallery display (combines gallery_images + activities + banners + logo)
  const allWebsiteMedia = useMemo(() => {
    const seen = new Set<string>();
    const combined: GalleryItem[] = [];
    const pushUrl = (url?: string, idPrefix = 'media', created?: string) => {
      if (!url || !url.trim() || url.startsWith('data:image/svg')) return;
      const clean = url.trim();
      if (seen.has(clean)) return;
      seen.add(clean);
      combined.push({
        id: `${idPrefix}-${combined.length}`,
        url: clean,
        created_at: created || new Date().toISOString()
      });
    };

    for (const g of gallery) {
      if (g.url && !seen.has(g.url.trim())) {
        seen.add(g.url.trim());
        combined.push(g);
      }
    }
    for (const act of activities) {
      for (const mUrl of act.media || []) {
        pushUrl(mUrl, `act-${act.id}`, act.created_at);
      }
    }
    for (const bUrl of siteSettings.banners || []) {
      pushUrl(bUrl, 'banner');
    }
    if (siteSettings.logo_url) {
      pushUrl(siteSettings.logo_url, 'logo');
    }
    if (siteSettings.favicon_url && siteSettings.favicon_url !== siteSettings.logo_url) {
      pushUrl(siteSettings.favicon_url, 'favicon');
    }
    for (const mem of members) {
      if (mem.avatar_url && !mem.avatar_url.includes('unavatar.io')) {
        pushUrl(mem.avatar_url, `mem-${mem.id}`, mem.created_at);
      }
    }
    return combined;
  }, [gallery, activities, siteSettings.banners, siteSettings.logo_url, siteSettings.favicon_url, members]);

  const approvedMembers = useMemo(
    () =>
      members
        .filter((m) => m.status === 'approved')
        .sort((a, b) => (Number(a.sort_order ?? 100) || 100) - (Number(b.sort_order ?? 100) || 100)),
    [members]
  );

  const pendingMembers = useMemo(
    () => members.filter((m) => m.status === 'pending'),
    [members]
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [selectedActivityModal, setSelectedActivityModal] = useState<ActivityItem | null>(null);

  const activityCategories = useMemo(() => {
    const unique = Array.from(
      new Set(activities.map((a) => (a.category || '').trim()).filter(Boolean))
    );
    return ['সব', ...unique];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'সব') return activities;
    return activities.filter((a) => (a.category || '').trim() === selectedCategory);
  }, [activities, selectedCategory]);

  // ============================================================================
  // 9. PUBLIC SHARE IDEA FORM STATE & HANDLER
  // ============================================================================
  const [ideaForm, setIdeaForm] = useState({ name: '', mobile: '', idea: '' });
  const [ideaSubmitting, setIdeaSubmitting] = useState(false);

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaForm.name.trim() || !ideaForm.mobile.trim() || !ideaForm.idea.trim()) {
      showNotice('অনুগ্রহ করে নাম, মোবাইল নাম্বার এবং আপনার পরিকল্পনা পূরণ করুন।', 'error');
      return;
    }
    setIdeaSubmitting(true);

    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idea-${Date.now()}`;
    const newIdea: IdeaItem = {
      id: tempId,
      name: ideaForm.name.trim(),
      mobile: ideaForm.mobile.trim(),
      idea: ideaForm.idea.trim(),
      created_at: new Date().toISOString()
    };

    setIdeas((prev) => [newIdea, ...prev]);
    setIdeaForm({ name: '', mobile: '', idea: '' });

    if (useD1Backend) {
      await callD1Api('ideas', 'POST', newIdea);
      setIdeaSubmitting(false);
      showNotice('আপনার মূল্যবান পরিকল্পনা সফলভাবে জমা হয়েছে! ধন্যবাদ।', 'success');
      return;
    }

    const { data, error } = await smartSupabaseMutation(['ideas'], 'insert', {
      name: newIdea.name,
      mobile: newIdea.mobile,
      idea: newIdea.idea
    });

    setIdeaSubmitting(false);

    if (error) {
      showNotice('পরিকল্পনা জমা দিতে সমস্যা হয়েছে: ' + error.message, 'error');
      return;
    }

    if (Array.isArray(data) && data[0]?.id) {
      setIdeas((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, id: String(data[0].id) } : item))
      );
    }
    showNotice('আপনার মূল্যবান পরিকল্পনা সফলভাবে জমা হয়েছে! ধন্যবাদ।', 'success');
  };

  // ============================================================================
  // 10. AUTHENTICATION: JOIN (REGISTER) & LOGIN HANDLERS
  // ============================================================================
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    mobile: '',
    fb_url: '',
    password: ''
  });
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [headerProfileMenuOpen, setHeaderProfileMenuOpen] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement | null>(null);
  const [showSettingsLinkBox, setShowSettingsLinkBox] = useState<Record<string, boolean>>({});
  const [newDesignationInput, setNewDesignationInput] = useState('');
  const [editingDesignationIdx, setEditingDesignationIdx] = useState<number | null>(null);
  const [editingDesignationText, setEditingDesignationText] = useState('');
  const [showDesignationManager, setShowDesignationManager] = useState(false);
  const [showAllDesignations, setShowAllDesignations] = useState(false);
  const [selectedMemberModal, setSelectedMemberModal] = useState<MemberUser | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedBloodFilter, setSelectedBloodFilter] = useState('সব');
  const [campaignForm, setCampaignForm] = useState<{
    id: string;
    title: string;
    description: string;
    target_amount: string;
    collected_amount: string;
    is_active: boolean;
  }>({
    id: '',
    title: '',
    description: '',
    target_amount: '',
    collected_amount: '',
    is_active: true
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Close Header Profile Popover automatically when clicking outside OR scrolling the page
  useEffect(() => {
    if (!headerProfileMenuOpen) return;
    const handleOutsideClick = (ev: MouseEvent | TouchEvent) => {
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(ev.target as Node)) {
        setHeaderProfileMenuOpen(false);
      }
    };
    const handleWindowScroll = () => {
      setHeaderProfileMenuOpen(false);
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setHeaderProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [headerProfileMenuOpen]);

  // Active Homepage Target Fund Campaigns
  const allCampaigns = useMemo(() => {
    return Array.isArray(siteSettings.campaigns) ? siteSettings.campaigns : [];
  }, [siteSettings.campaigns]);

  const activeHomepageCampaigns = useMemo(() => {
    return allCampaigns.filter((c) => c && c.is_active);
  }, [allCampaigns]);

  // Filtered Public Members (by search query + blood group)
  const filteredPublicMembers = useMemo(() => {
    return approvedMembers.filter((m) => {
      const q = memberSearchQuery.trim().toLowerCase();
      const matchNameOrDesig =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.designation || '').toLowerCase().includes(q) ||
        (m.bio || '').toLowerCase().includes(q);
      const matchBlood =
        selectedBloodFilter === 'সব' ||
        (m.blood_group || '').toUpperCase() === selectedBloodFilter.toUpperCase();
      return matchNameOrDesig && matchBlood;
    });
  }, [approvedMembers, memberSearchQuery, selectedBloodFilter]);

  // Monthly Contribution Reminder Calculator for Each Member
  const getMemberMonthlyReminder = (member: MemberUser) => {
    const manualStatus = member.reminder_status || 'auto';
    if (manualStatus === 'paid') {
      return {
        status: 'paid' as const,
        label: 'এই মাসের ফান্ড জমা হয়েছে',
        message: 'আলহামদুলিল্লাহ, এই মাসে ফাউন্ডেশনে আপনার ফান্ড জমা হয়েছে। মানবিক কাজে আপনার অংশগ্রহণের জন্য আন্তরিক ধন্যবাদ!'
      };
    }
    if (manualStatus === 'due_1m') {
      return {
        status: 'due_1m' as const,
        label: 'এই মাসের ফান্ড বাকি (১ মাস)',
        message:
          member.reminder_note ||
          'ভাই, ফাউন্ডেশনে আপনার এই মাসের ফান্ডটা এখনো দেওয়া হয়নি। আপনার সামর্থ্য অনুযায়ী এই মাসের ফান্ডটি দিয়ে দিলে ভালো হবে।'
      };
    }
    if (manualStatus === 'due_2m') {
      return {
        status: 'due_2m' as const,
        label: 'গত ২ মাসের ফান্ড বাকি',
        message:
          member.reminder_note ||
          'ভাই, আপনার গত দুই মাসের ফান্ডের টাকা ফাউন্ডেশনে এখনো দেওয়া হয়নি। সুবিধাজনক সময়ে আপনার সামর্থ্য অনুযায়ী ফান্ডটি দেওয়ার জন্য আন্তরিকভাবে অনুরোধ করা হচ্ছে।'
      };
    }

    // Automatic calculation based on member's deposit records
    const memberDeposits = finances.filter(
      (f) => f.type === 'income' && f.memberuid === member.id
    );
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const bnMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const currentBnMonth = bnMonths[curMonth];
    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevBnMonth = bnMonths[prevMonthDate.getMonth()];

    const hasCurrentMonthDeposit = memberDeposits.some((d) => {
      if (d.month && d.month.includes(currentBnMonth)) return true;
      if (d.created_at) {
        const dt = new Date(d.created_at);
        if (dt.getFullYear() === curYear && dt.getMonth() === curMonth) return true;
      }
      return false;
    });

    if (hasCurrentMonthDeposit) {
      return {
        status: 'paid' as const,
        label: 'এই মাসের ফান্ড জমা হয়েছে',
        message: 'আলহামদুলিল্লাহ, এই মাসে ফাউন্ডেশনে আপনার ফান্ড জমা হয়েছে। মানবিক কাজে আপনার অংশগ্রহণের জন্য আন্তরিক ধন্যবাদ!'
      };
    }

    const hasPrevMonthDeposit = memberDeposits.some((d) => {
      if (d.month && d.month.includes(prevBnMonth)) return true;
      if (d.created_at) {
        const dt = new Date(d.created_at);
        if (dt.getFullYear() === prevMonthDate.getFullYear() && dt.getMonth() === prevMonthDate.getMonth()) {
          return true;
        }
      }
      return false;
    });

    if (hasPrevMonthDeposit || memberDeposits.length === 0) {
      return {
        status: 'due_1m' as const,
        label: 'এই মাসের ফান্ড দেওয়া হয়নি',
        message:
          'ভাই, ফাউন্ডেশনে আপনার এই মাসের ফান্ডটা এখনো দেওয়া হয়নি। আপনার সামর্থ্য অনুযায়ী এই মাসের ফান্ডটি দিয়ে দিলে ভালো হবে।'
      };
    }

    return {
      status: 'due_2m' as const,
      label: 'গত ২ মাসের ফান্ড দেওয়া হয়নি',
      message:
        'ভাই, আপনার গত দুই মাসের ফান্ডের টাকা ফাউন্ডেশনে এখনো দেওয়া হয়নি। সুবিধাজনক সময়ে আপনার সামর্থ্য অনুযায়ী ফান্ডটি দেওয়ার জন্য আন্তরিকভাবে অনুরোধ করা হচ্ছে।'
    };
  };

  const handleSetMemberReminderStatus = async (
    member: MemberUser,
    nextStatus: 'auto' | 'paid' | 'due_1m' | 'due_2m'
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, reminder_status: nextStatus } : m))
    );
    if (appUser?.id === member.id) {
      setAppUser((prev) => (prev ? { ...prev, reminder_status: nextStatus } : null));
    }
    showNotice(`${member.name}-এর ফান্ড রিমাইন্ডার স্ট্যাটাস আপডেট করা হয়েছে!`, 'success');
    await callD1Api('members', 'PUT', {
      id: member.id,
      email: member.email,
      reminder_status: nextStatus
    });
  };

  // Campaign CRUD Handlers (Admin Target Fund Progress Bars)
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Number(campaignForm.target_amount);
    const collectedNum = Number(campaignForm.collected_amount || 0);
    if (!campaignForm.title.trim() || !targetNum || targetNum <= 0) {
      showNotice('প্রজেক্টের নাম এবং লক্ষ্যমাত্রা (কত টাকা লাগবে) সঠিকভাবে পূরণ করুন।', 'error');
      return;
    }

    let nextCampaigns: FundCampaign[];
    if (campaignForm.id) {
      nextCampaigns = allCampaigns.map((c) =>
        c.id === campaignForm.id
          ? {
              ...c,
              title: campaignForm.title.trim(),
              description: campaignForm.description.trim(),
              target_amount: targetNum,
              collected_amount: collectedNum,
              is_active: campaignForm.is_active
            }
          : c
      );
      showNotice('প্রজেক্ট ফান্ড ক্যাম্পেইন আপডেট করা হয়েছে!', 'success');
    } else {
      const newCamp: FundCampaign = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `camp-${Date.now()}`,
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim(),
        target_amount: targetNum,
        collected_amount: collectedNum,
        is_active: campaignForm.is_active,
        created_at: new Date().toISOString()
      };
      nextCampaigns = [newCamp, ...allCampaigns];
      showNotice('নতুন প্রজেক্ট টার্গেট ফান্ড প্রোগ্রেস বার যুক্ত হয়েছে!', 'success');
    }

    setCampaignForm({
      id: '',
      title: '',
      description: '',
      target_amount: '',
      collected_amount: '',
      is_active: true
    });
    await persistSettingsInstant({ ...siteSettings, campaigns: nextCampaigns });
  };

  const handleToggleCampaignActive = async (camp: FundCampaign) => {
    const nextCampaigns = allCampaigns.map((c) =>
      c.id === camp.id ? { ...c, is_active: !c.is_active } : c
    );
    await persistSettingsInstant({ ...siteSettings, campaigns: nextCampaigns });
    showNotice(
      !camp.is_active
        ? `"${camp.title}" হোমপেজে শো করা হয়েছে!`
        : `"${camp.title}" হোমপেজ থেকে হাইড করা হয়েছে।`,
      'success'
    );
  };

  const handleDeleteCampaign = async (campId: string) => {
    const nextCampaigns = allCampaigns.filter((c) => c.id !== campId);
    await persistSettingsInstant({ ...siteSettings, campaigns: nextCampaigns });
    showNotice('প্রজেক্ট ক্যাম্পেইনটি মুছে ফেলা হয়েছে।', 'success');
  };

  const activeDesignations = useMemo(() => {
    const list = siteSettings.designations && siteSettings.designations.length > 0
      ? siteSettings.designations
      : DEFAULT_DESIGNATIONS;
    return Array.from(new Set(list));
  }, [siteSettings.designations]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawContact = joinForm.email.trim();
    if (!joinForm.name.trim() || !rawContact) {
      showNotice('আপনার পূর্ণ নাম এবং ইমেইল অথবা মোবাইল নাম্বার দিন।', 'error');
      return;
    }
    if (joinForm.password.length < 6) {
      showNotice('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    const isEmailInput = rawContact.includes('@');
    const bdCheck = analyzeBdPhone(rawContact);

    if (isEmailInput) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawContact.toLowerCase())) {
        showNotice('সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।', 'error');
        return;
      }
    } else {
      if (!bdCheck.isValidBd) {
        showNotice('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX) অথবা সঠিক ইমেইল দিন।', 'error');
        return;
      }
    }

    const resolvedEmail = isEmailInput
      ? rawContact.toLowerCase()
      : `${bdCheck.normalized}@phone.noboalo.org`;
    const resolvedMobile = isEmailInput ? '' : bdCheck.normalized;

    setAuthLoading(true);
    const isSuperAdmin = resolvedEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const assignedStatus: 'approved' | 'pending' =
      isSuperAdmin || siteSettings.auto_approve === true ? 'approved' : 'pending';
    const assignedRole: 'admin' | 'member' = isSuperAdmin ? 'admin' : 'member';
    const assignedDesignation = isSuperAdmin ? 'অ্যাডমিন' : 'সাধারণ সদস্য';

    if (useD1Backend) {
      const regRes = await callD1Api('auth/register', 'POST', {
        name: joinForm.name.trim(),
        identifier: isEmailInput ? resolvedEmail : resolvedMobile,
        email: resolvedEmail,
        mobile: resolvedMobile,
        password: joinForm.password
      });
      setAuthLoading(false);
      if (!regRes.ok || !regRes.data?.user) {
        showNotice(regRes.data?.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।', 'error');
        return;
      }
      const createdUser = normalizeMemberRow(regRes.data.user);
      setMembers((prev) => [...prev.filter((m) => m.email.toLowerCase() !== cleanEmail), createdUser]);
      setJoinForm({ name: '', email: '', mobile: '', fb_url: '', password: '' });
      if (createdUser.status === 'approved') {
        setAppUser(createdUser);
        showNotice('অভিনন্দন! আপনার একাউন্টটি অনুমোদিত হয়েছে।', 'success');
        setCurrentView('dashboard');
      } else {
        showNotice('রেজিস্ট্রেশন সম্পন্ন হয়েছে! অ্যাডমিন অ্যাপ্রুভালের জন্য অপেক্ষা করুন।', 'success');
        setCurrentView('login');
      }
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: joinForm.password,
      options: {
        data: {
          name: joinForm.name.trim(),
          mobile: joinForm.mobile.trim()
        }
      }
    });

    if (signUpError) {
      setAuthLoading(false);
      showNotice(signUpError.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।', 'error');
      return;
    }

    const userId =
      signUpData?.user?.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `uid-${Date.now()}`);

    const newMember: MemberUser = {
      id: userId,
      name: joinForm.name.trim(),
      email: cleanEmail,
      mobile: joinForm.mobile.trim(),
      avatar_url: '',
      role: assignedRole,
      status: assignedStatus,
      designation: assignedDesignation,
      sort_order: isSuperAdmin ? 1 : 100
    };

    await smartSupabaseMutation([membersTable, 'members', 'users', 'profiles'], 'upsert', {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      mobile: newMember.mobile,
      avatar_url: '',
      role: newMember.role,
      status: newMember.status,
      designation: newMember.designation,
      sort_order: newMember.sort_order
    });

    setMembers((prev) => {
      const withoutDup = prev.filter((m) => m.email.toLowerCase() !== cleanEmail);
      return [...withoutDup, newMember];
    });

    setAuthLoading(false);
    setJoinForm({ name: '', email: '', mobile: '', password: '' });

    if (assignedStatus === 'approved') {
      setAppUser(newMember);
      showNotice('অভিনন্দন! আপনার একাউন্টটি অনুমোদিত হয়েছে।', 'success');
      setCurrentView('dashboard');
    } else {
      await supabase.auth.signOut();
      setAppUser(null);
      showNotice('রেজিস্ট্রেশন সম্পন্ন হয়েছে! অ্যাডমিন অ্যাপ্রুভালের জন্য অপেক্ষা করুন।', 'success');
      setCurrentView('login');
    }
  };

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawIdentifier = loginForm.email.trim();
    if (!rawIdentifier || !loginForm.password) {
      showNotice('ইমেইল অথবা মোবাইল নাম্বার এবং পাসওয়ার্ড প্রদান করুন।', 'error');
      return;
    }

    const bdCheck = analyzeBdPhone(rawIdentifier);
    if (bdCheck.looksLikePhone && !bdCheck.isValidBd) {
      showNotice('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।', 'error');
      return;
    }

    const cleanIdentifier = bdCheck.isValidBd ? bdCheck.normalized : rawIdentifier.toLowerCase();
    setAuthLoading(true);
    const isSuperAdmin = cleanIdentifier === SUPER_ADMIN_EMAIL.toLowerCase();

    if (useD1Backend) {
      const logRes = await callD1Api('auth/login', 'POST', {
        identifier: cleanIdentifier,
        email: cleanIdentifier,
        password: loginForm.password
      });
      setAuthLoading(false);
      if (!logRes.ok) {
        showNotice(logRes.data?.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।', 'error');
        return;
      }
      const loggedUser = normalizeMemberRow(logRes.data.user);
      setAppUser(loggedUser);
      setLoginForm({ email: '', password: '' });
      showNotice(`স্বাগতম, ${loggedUser.name}!`, 'success');
      setCurrentView('dashboard');
      return;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: loginForm.password
    });

    if (signInError || !signInData?.user) {
      // Allow Super Admin immediate access with default password (NoboAlo@2026 or 123456)
      if (isSuperAdmin && SUPER_ADMIN_DEFAULT_PASSWORDS.includes(loginForm.password.trim())) {
        const superAdminProfile: MemberUser = {
          id: 'super-admin-raihan',
          name: 'মোহাম্মদ রায়হান',
          email: SUPER_ADMIN_EMAIL,
          mobile: '',
          avatar_url: '',
          role: 'admin',
          status: 'approved',
          designation: 'অ্যাডমিন',
          sort_order: 1
        };
        setAuthLoading(false);
        setAppUser(superAdminProfile);
        setLoginForm({ email: '', password: '' });
        showNotice('সুপার অ্যাডমিন হিসেবে স্বাগতম, মোহাম্মদ রায়হান!', 'success');
        setCurrentView('dashboard');
        return;
      }
      setAuthLoading(false);
      showNotice('ইমেইল বা পাসওয়ার্ড সঠিক নয়।', 'error');
      return;
    }

    const uid = signInData.user.id;
    let dbUser: any = null;
    for (const table of [membersTable, 'members', 'users', 'profiles']) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .or(`id.eq.${uid},email.ilike.${cleanEmail}`)
        .limit(1)
        .maybeSingle();
      if (data) {
        dbUser = data;
        setMembersTable(table);
        break;
      }
    }

    let profile: MemberUser;
    if (dbUser) {
      profile = normalizeMemberRow(dbUser);
    } else {
      profile = {
        id: uid,
        name: signInData.user.user_metadata?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        mobile: signInData.user.user_metadata?.mobile || '',
        avatar_url: '',
        role: isSuperAdmin ? 'admin' : 'member',
        status: isSuperAdmin || siteSettings.auto_approve ? 'approved' : 'pending',
        designation: isSuperAdmin ? 'অ্যাডমিন' : 'সাধারণ সদস্য',
        sort_order: isSuperAdmin ? 1 : 100
      };
    }

    if (isSuperAdmin) {
      profile.role = 'admin';
      profile.status = 'approved';
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'upsert',
        {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
          role: 'admin',
          status: 'approved',
          designation: profile.designation || 'অ্যাডমিন',
          sort_order: profile.sort_order ?? 1
        }
      );
    }

    setAuthLoading(false);

    if (profile.status === 'pending' && !isSuperAdmin) {
      await supabase.auth.signOut();
      setAppUser(null);
      showNotice('একাউন্টটি এখনো অ্যাপ্রুভ হয়নি।', 'error');
      return;
    }

    setAppUser(profile);
    setLoginForm({ email: '', password: '' });
    showNotice(`স্বাগতম, ${profile.name}!`, 'success');
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAppUser(null);
    setCurrentView('home');
    showNotice('সফলভাবে লগআউট করা হয়েছে।', 'success');
  };

  // ============================================================================
  // 11. ADMIN DASHBOARD HANDLERS (MEMBERS, FINANCES, WORKS, IDEAS, GALLERY, SETTINGS)
  // ============================================================================

  // Admin Hierarchy Rule:
  // 1. Nobody can remove or demote SUPER_ADMIN_EMAIL.
  // 2. If Admin A promoted Member B to Admin (`B.promoted_by === A.id`), Admin B CANNOT remove or demote Admin A!
  // 3. Promoted admins also cannot remove/demote other senior admins who were not promoted by them.
  const canActorManageMember = (actor: MemberUser | null, target: MemberUser): boolean => {
    if (!actor || actor.role !== 'admin') return false;
    const actorIsSuper = actor.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const targetIsSuper = target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (targetIsSuper) return false;
    if (actorIsSuper) return true;
    if (target.id === actor.id) return false;
    // If target is the Admin who promoted actor -> strictly protected!
    if (actor.promoted_by && target.id === actor.promoted_by) return false;
    // If target is already an admin and was NOT promoted by actor -> protected!
    if (target.role === 'admin' && target.promoted_by !== actor.id) return false;
    return true;
  };

  // Auto-register any uploaded Cloudinary media into gallery_images so all uploaded site media shows in Admin Gallery
  const autoRecordInGallery = async (uploadedUrl: string) => {
    if (!uploadedUrl) return;
    const exists = gallery.some((g) => g.url === uploadedUrl);
    if (exists) return;
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gal-${Date.now()}`;
    const newGal: GalleryItem = {
      id: tempId,
      url: uploadedUrl,
      created_at: new Date().toISOString()
    };
    setGallery((prev) => (prev.some((g) => g.url === uploadedUrl) ? prev : [newGal, ...prev]));
    if (useD1Backend) {
      await callD1Api('gallery', 'POST', newGal);
    } else {
      const { data } = await smartSupabaseMutation(['gallery_images'], 'insert', { url: uploadedUrl });
      if (Array.isArray(data) && data[0]?.id) {
        setGallery((prev) =>
          prev.map((g) => (g.id === tempId ? { ...g, id: String(data[0].id) } : g))
        );
      }
    }
  };

  // Instant Database Persist Helper for Site Settings (Logo, Favicon, Site Name, Tagline, Announcement, Banners)
  const persistSettingsInstant = async (nextSettings: SiteSettings) => {
    lastSettingsSaveRef.current = Date.now();
    const cleaned: SiteSettings = {
      ...nextSettings,
      logo_url: cleanMediaUrl(nextSettings.logo_url),
      favicon_url: cleanMediaUrl(nextSettings.favicon_url || nextSettings.logo_url),
      banners: (nextSettings.banners || ['', '', '', '']).map((b) => cleanMediaUrl(b))
    };
    setSiteSettings(cleaned);
    writeLocalJson(SETTINGS_CACHE_KEY, cleaned);
    const res = await callD1Api('settings', 'PUT', cleaned);
    if (res.liveD1) setD1LiveConnected(true);
    return res;
  };

  const handleToggleAutoApprove = async () => {
    const nextVal = !siteSettings.auto_approve;
    setSiteSettings((prev) => ({ ...prev, auto_approve: nextVal }));
    showNotice(
      nextVal ? 'অটো-অ্যাপ্রুভাল চালু করা হয়েছে।' : 'অটো-অ্যাপ্রুভাল বন্ধ করা হয়েছে।',
      'success'
    );
    if (useD1Backend) {
      await callD1Api('settings', 'PUT', { auto_approve: nextVal });
    } else {
      await smartSupabaseMutation(
        ['site_settings'],
        'update',
        { auto_approve: nextVal },
        'id',
        siteSettings.id || 1
      );
    }
  };

  const handleApproveMember = (member: MemberUser) => {
    setConfirmDialog({
      open: true,
      title: 'সদস্য অনুমোদন নিশ্চিত করুন',
      message: `আপনি কি "${member.name}" (${member.email})-কে নব আলো ফাউন্ডেশনের অনুমোদিত সদস্য হিসেবে যুক্ত করতে চান?`,
      isDanger: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: 'approved' } : m))
        );
        showNotice(`${member.name}-কে সফলভাবে অনুমোদন দেওয়া হয়েছে!`, 'success');
        if (useD1Backend) {
          await callD1Api('members', 'PUT', { id: member.id, status: 'approved' });
        } else {
          await smartSupabaseMutation(
            [membersTable, 'members', 'users', 'profiles'],
            'update',
            { status: 'approved' },
            'id',
            member.id
          );
        }
      }
    });
  };

  const handleDeleteMember = (member: MemberUser) => {
    if (!canActorManageMember(appUser, member)) {
      showNotice('যিনি আপনাকে অ্যাডমিন বানিয়েছেন বা সিনিয়র অ্যাডমিনকে আপনি রিমুভ করতে পারবেন না!', 'error');
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'সদস্য ডিলিট নিশ্চিত করুন',
      message: `আপনি কি নিশ্চিতভাবে "${member.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        showNotice(`${member.name}-কে তালিকা থেকে মুছে ফেলা হয়েছে।`, 'success');
        if (useD1Backend) {
          await callD1Api(`members?id=${encodeURIComponent(member.id)}`, 'DELETE');
        } else {
          for (const table of [membersTable, 'members', 'users', 'profiles']) {
            const { error } = await supabase.from(table).delete().eq('id', member.id);
            if (!error) break;
          }
        }
      }
    });
  };

  const handleRoleChange = async (member: MemberUser, newRole: 'admin' | 'member') => {
    if (!canActorManageMember(appUser, member)) {
      showNotice('যিনি আপনাকে অ্যাডমিন বানিয়েছেন বা সিনিয়র অ্যাডমিনের রোল আপনি পরিবর্তন করতে পারবেন না!', 'error');
      return;
    }
    const updatedDesignation =
      member.designation === 'সাধারণ সদস্য' && newRole === 'admin'
        ? 'অ্যাডমিন'
        : member.designation === 'অ্যাডমিন' && newRole === 'member'
        ? 'সাধারণ সদস্য'
        : member.designation;
    const promotedByVal = newRole === 'admin' ? (appUser?.id || '') : '';

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, role: newRole, designation: updatedDesignation, promoted_by: promotedByVal }
          : m
      )
    );
    showNotice(
      newRole === 'admin'
        ? `${member.name}-কে অ্যাডমিন বানানো হয়েছে!`
        : `${member.name}-এর রোল সাধারণ সদস্য করা হয়েছে।`,
      'success'
    );

    if (useD1Backend) {
      await callD1Api('members', 'PUT', {
        id: member.id,
        role: newRole,
        designation: updatedDesignation,
        promoted_by: promotedByVal
      });
    } else {
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'update',
        { role: newRole, designation: updatedDesignation, promoted_by: promotedByVal },
        'id',
        member.id
      );
    }
  };

  // Quick Add Member via Facebook URL / Direct Admin Entry
  const [quickMemberForm, setQuickMemberForm] = useState<{
    fb_url: string;
    name: string;
    avatar_url: string;
    designation: string;
    role: 'member' | 'admin';
    sort_order: number;
  }>({
    fb_url: '',
    name: '',
    avatar_url: '',
    designation: 'সাধারণ সদস্য',
    role: 'member',
    sort_order: 100
  });
  const [fetchingFbInfo, setFetchingFbInfo] = useState(false);

  const extractFbNameFromUrl = (rawUrl: string): string => {
    try {
      const u = new URL(rawUrl.trim());
      const seg = u.pathname.split('/').filter(Boolean)[0] || '';
      if (!seg || seg === 'profile.php' || seg === 'people' || seg === 'share') return '';
      return seg
        .replace(/[._-]+/g, ' ')
        .replace(/\d+$/g, '')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      return '';
    }
  };

  // Admin Designation Change Handler (Any Admin can change any Member's or Admin's designation)
  const handleDesignationChange = async (member: MemberUser, nextDesignation: string) => {
    if (!appUser || appUser.role !== 'admin') return;
    const cleanDesig = nextDesignation.trim() || 'সাধারণ সদস্য';
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, designation: cleanDesig } : m))
    );
    if (appUser.id === member.id) {
      setAppUser((prev) => (prev ? { ...prev, designation: cleanDesig } : null));
    }
    showNotice(`${member.name}-এর পদবি "${cleanDesig}" হিসেবে আপডেট করা হয়েছে!`, 'success');
    await callD1Api('members', 'PUT', {
      id: member.id,
      email: member.email,
      designation: cleanDesig
    });
  };

  // Designation CRUD Handlers (Add / Edit / Delete Designations in siteSettings.designations)
  const handleAddDesignation = async () => {
    const clean = newDesignationInput.trim();
    if (!clean) {
      showNotice('পদবির নাম লিখুন।', 'error');
      return;
    }
    if (activeDesignations.includes(clean)) {
      showNotice('এই পদবিটি ইতিমধ্যে তালিকায় রয়েছে।', 'error');
      return;
    }
    const nextList = [...activeDesignations, clean];
    setNewDesignationInput('');
    await persistSettingsInstant({ ...siteSettings, designations: nextList });
    showNotice(`"${clean}" নতুন পদবি হিসেবে যুক্ত হয়েছে!`, 'success');
  };

  const handleSaveEditedDesignation = async (idx: number) => {
    const oldVal = activeDesignations[idx];
    const clean = editingDesignationText.trim();
    if (!clean) return;
    const nextList = activeDesignations.map((d, i) => (i === idx ? clean : d));
    setEditingDesignationIdx(null);
    setEditingDesignationText('');
    await persistSettingsInstant({ ...siteSettings, designations: nextList });

    // Also update any members currently holding the old designation
    if (oldVal && oldVal !== clean) {
      const affected = members.filter((m) => m.designation === oldVal);
      if (affected.length > 0) {
        setMembers((prev) =>
          prev.map((m) => (m.designation === oldVal ? { ...m, designation: clean } : m))
        );
        for (const m of affected) {
          await callD1Api('members', 'PUT', { id: m.id, designation: clean });
        }
      }
    }
    showNotice(`পদবি "${clean}" সফলভাবে আপডেট হয়েছে!`, 'success');
  };

  const handleDeleteDesignation = async (desigToRemove: string) => {
    if (activeDesignations.length <= 1) {
      showNotice('কমপক্ষে একটি পদবি থাকতে হবে।', 'error');
      return;
    }
    const nextList = activeDesignations.filter((d) => d !== desigToRemove);
    await persistSettingsInstant({ ...siteSettings, designations: nextList });
    showNotice(`"${desigToRemove}" পদবিটি তালিকা থেকে মুছে ফেলা হয়েছে।`, 'success');
  };

  const extractFbUsername = (rawUrl: string): string => {
    try {
      const u = new URL(rawUrl.trim());
      const seg = u.pathname.split('/').filter(Boolean)[0] || '';
      if (seg && !['profile.php', 'people', 'share', 'login', 'watch', 'groups'].includes(seg.toLowerCase())) {
        return seg;
      }
      return u.searchParams.get('id') || '';
    } catch {
      return '';
    }
  };

  const handleFetchFromFacebookUrl = async (inputUrl?: string) => {
    const targetUrl = (inputUrl ?? quickMemberForm.fb_url).trim();
    if (!targetUrl) {
      showNotice('প্রথমে ফেসবুক প্রোফাইল লিংক পেস্ট করুন।', 'error');
      return;
    }
    setFetchingFbInfo(true);
    try {
      // 1. Try Cloudflare Edge Server-Side OpenGraph Resolver (/api/fb-profile)
      const edgeRes = await callD1Api(`fb-profile?url=${encodeURIComponent(targetUrl)}`, 'GET');
      if (edgeRes.ok && edgeRes.data?.ok && (edgeRes.data.name || edgeRes.data.avatar_url)) {
        const fetchedName = edgeRes.data.name || extractFbNameFromUrl(edgeRes.data.resolved_url || targetUrl);
        const fetchedAvatar = edgeRes.data.avatar_url || edgeRes.data.dynamic_avatar_url || '';
        setQuickMemberForm((prev) => ({
          ...prev,
          fb_url: targetUrl,
          name: fetchedName || prev.name,
          avatar_url: fetchedAvatar || prev.avatar_url
        }));
        showNotice(
          fetchedName
            ? `ফেসবুক থেকে "${fetchedName}"-এর তথ্য সংযুক্ত হয়েছে!`
            : 'ফেসবুক প্রোফাইল লিংক ও ছবি সংযুক্ত হয়েছে! এবার সদস্যের নাম লিখে অ্যাড করুন।',
          'success'
        );
        return;
      }

      // 2. Fallback to Microlink + Unavatar Dynamic Facebook Profile Picture
      const fbUser = extractFbUsername(targetUrl);
      const dynamicAvatar = fbUser ? `https://unavatar.io/facebook/${encodeURIComponent(fbUser)}` : '';
      const fallbackName = extractFbNameFromUrl(targetUrl);

      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const json = await res.json();
        const rawTitle = String(json?.data?.title || '');
        const cleanTitle = rawTitle
          .replace(/\s*[-|•]\s*Facebook.*$/i, '')
          .replace(/\s*\|\s*Facebook.*$/i, '')
          .trim();
        const imgUrl = String(json?.data?.image?.url || json?.data?.logo?.url || '');
        const isGenericFbTitle =
          !cleanTitle ||
          cleanTitle.toLowerCase() === 'facebook' ||
          cleanTitle.toLowerCase().includes('log in') ||
          cleanTitle.toLowerCase().includes('লগ ইন');

        const resolvedName = !isGenericFbTitle ? cleanTitle : fallbackName;
        const resolvedAvatar =
          imgUrl && !imgUrl.includes('static.xx.fbcdn.net') ? imgUrl : dynamicAvatar;

        setQuickMemberForm((prev) => ({
          ...prev,
          fb_url: targetUrl,
          name: resolvedName || prev.name,
          avatar_url: resolvedAvatar || prev.avatar_url
        }));

        if (resolvedName) {
          showNotice('ফেসবুক প্রোফাইল থেকে নাম ও ডাইনামিক ছবি সংযুক্ত হয়েছে!', 'success');
        } else {
          showNotice('ফেসবুক প্রোফাইলটি লক থাকায় শুধু নাম ও ছবি দিয়ে "সদস্য তালিকায় যুক্ত করুন" বাটনে ক্লিক করুন।', 'success');
        }
      } else {
        setQuickMemberForm((prev) => ({
          ...prev,
          fb_url: targetUrl,
          name: prev.name || fallbackName,
          avatar_url: prev.avatar_url || dynamicAvatar
        }));
        showNotice('লিংকটি যুক্ত হয়েছে। সদস্যের নাম লিখে অ্যাড করুন।', 'success');
      }
    } catch {
      const fbUser = extractFbUsername(targetUrl);
      const dynamicAvatar = fbUser ? `https://unavatar.io/facebook/${encodeURIComponent(fbUser)}` : '';
      const fallbackName = extractFbNameFromUrl(targetUrl);
      setQuickMemberForm((prev) => ({
        ...prev,
        fb_url: targetUrl,
        name: prev.name || fallbackName,
        avatar_url: prev.avatar_url || dynamicAvatar
      }));
    } finally {
      setFetchingFbInfo(false);
    }
  };

  const handleQuickMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ active: true, percent: 0, label: 'নতুন সদস্যের ছবি আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'নতুন সদস্যের ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
      }, 'avatar');
      setQuickMemberForm((prev) => ({ ...prev, avatar_url: uploadedUrl }));
      await autoRecordInGallery(uploadedUrl);
      showNotice('সদস্যের ছবি ক্লাউডিনারিতে আপলোড হয়েছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'ছবি আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleQuickMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedName =
      quickMemberForm.name.trim() ||
      extractFbNameFromUrl(quickMemberForm.fb_url);
    if (!resolvedName) {
      showNotice('অনুগ্রহ করে সদস্যের নাম বক্সে নাম লিখুন।', 'error');
      return;
    }
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem-${Date.now()}`;
    const newMember: MemberUser = {
      id: newId,
      name: resolvedName,
      email: `member.${Date.now()}@noboalo.org`,
      mobile: '',
      avatar_url: quickMemberForm.avatar_url.trim(),
      role: quickMemberForm.role,
      status: 'approved',
      designation:
        quickMemberForm.designation.trim() ||
        (quickMemberForm.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য'),
      sort_order: Number(quickMemberForm.sort_order ?? 100),
      promoted_by: quickMemberForm.role === 'admin' ? (appUser?.id || '') : '',
      fb_url: quickMemberForm.fb_url.trim(),
      created_at: new Date().toISOString()
    };

    setMembers((prev) => [...prev, newMember]);
    setQuickMemberForm({
      fb_url: '',
      name: '',
      avatar_url: '',
      designation: 'সাধারণ সদস্য',
      role: 'member',
      sort_order: 100
    });
    showNotice(`${newMember.name}-কে সফলভাবে সদস্য তালিকায় যুক্ত করা হয়েছে!`, 'success');

    if (useD1Backend) {
      await callD1Api('members', 'POST', newMember);
    } else {
      await smartSupabaseMutation([membersTable, 'members', 'users', 'profiles'], 'insert', newMember);
    }
  };

  const [editingMember, setEditingMember] = useState<MemberUser | null>(null);

  const handleEditMemberAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;
    setUploadState({ active: true, percent: 0, label: 'সদস্যের ছবি আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'সদস্যের ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
      }, 'avatar');
      setEditingMember((prev) => (prev ? { ...prev, avatar_url: uploadedUrl } : null));
      await autoRecordInGallery(uploadedUrl);
      showNotice('ছবি সফলভাবে ক্লাউডিনারিতে আপলোড হয়েছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'ছবি আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleSaveEditedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const updated: MemberUser = {
      ...editingMember,
      sort_order: Number(editingMember.sort_order ?? 100)
    };
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (appUser?.id === updated.id) {
      setAppUser(updated);
    }
    setEditingMember(null);
    showNotice('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!', 'success');

    if (useD1Backend) {
      await callD1Api('members', 'PUT', {
        id: updated.id,
        name: updated.name,
        mobile: updated.mobile,
        avatar_url: updated.avatar_url,
        designation: updated.designation,
        sort_order: updated.sort_order,
        blood_group: updated.blood_group,
        bio: updated.bio,
        fb_url: updated.fb_url
      });
    } else {
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'update',
        {
          name: updated.name,
          avatar_url: updated.avatar_url,
          designation: updated.designation,
          sort_order: updated.sort_order
        },
        'id',
        updated.id
      );
    }
  };

  const [financeForm, setFinanceForm] = useState<{
    id: string;
    type: 'income' | 'expense';
    amount: string;
    memberuid: string;
    month: string;
    description: string;
  }>({
    id: '',
    type: 'income',
    amount: '',
    memberuid: '',
    month: '',
    description: ''
  });

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(financeForm.amount);
    if (!numericAmount || numericAmount <= 0) {
      showNotice('সঠিক টাকার পরিমাণ উল্লেখ করুন।', 'error');
      return;
    }

    if (financeForm.id) {
      const updatedRecord: FinanceRecord = {
        id: financeForm.id,
        type: financeForm.type,
        amount: numericAmount,
        memberuid: financeForm.type === 'income' ? financeForm.memberuid : '',
        month: financeForm.month.trim(),
        description: financeForm.description.trim(),
        created_at: new Date().toISOString()
      };
      setFinances((prev) => prev.map((f) => (f.id === updatedRecord.id ? updatedRecord : f)));
      setFinanceForm({ id: '', type: 'income', amount: '', memberuid: '', month: '', description: '' });
      showNotice('হিসাবটি সফলভাবে আপডেট করা হয়েছে!', 'success');

      if (useD1Backend) {
        await callD1Api('finances', 'PUT', updatedRecord);
      } else {
        await smartSupabaseMutation(
          ['finances'],
          'update',
          {
            type: updatedRecord.type,
            amount: updatedRecord.amount,
            memberuid: updatedRecord.memberuid || null,
            month: updatedRecord.month,
            description: updatedRecord.description
          },
          'id',
          updatedRecord.id
        );
      }
    } else {
      const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fin-${Date.now()}`;
      const newRecord: FinanceRecord = {
        id: tempId,
        type: financeForm.type,
        amount: numericAmount,
        memberuid: financeForm.type === 'income' ? financeForm.memberuid : '',
        month: financeForm.month.trim(),
        description: financeForm.description.trim(),
        created_at: new Date().toISOString()
      };
      setFinances((prev) => [newRecord, ...prev]);
      setFinanceForm({ id: '', type: 'income', amount: '', memberuid: '', month: '', description: '' });
      showNotice('নতুন হিসাব সফলভাবে যুক্ত হয়েছে!', 'success');

      if (useD1Backend) {
        await callD1Api('finances', 'POST', newRecord);
        return;
      }

      const { data } = await smartSupabaseMutation(['finances'], 'insert', {
        type: newRecord.type,
        amount: newRecord.amount,
        memberuid: newRecord.memberuid || null,
        month: newRecord.month,
        description: newRecord.description
      });
      if (Array.isArray(data) && data[0]?.id) {
        setFinances((prev) =>
          prev.map((f) => (f.id === tempId ? { ...f, id: String(data[0].id) } : f))
        );
      }
    }
  };

  const handleDeleteFinance = (record: FinanceRecord) => {
    setConfirmDialog({
      open: true,
      title: 'হিসাব ডিলিট নিশ্চিত করুন',
      message: `আপনি কি নিশ্চিতভাবে ৳${record.amount}-এর এই হিসাবটি মুছে ফেলতে চান?`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setFinances((prev) => prev.filter((f) => f.id !== record.id));
        showNotice('হিসাবটি মুছে ফেলা হয়েছে।', 'success');
        if (useD1Backend) {
          await callD1Api(`finances?id=${encodeURIComponent(record.id)}`, 'DELETE');
        } else {
          await supabase.from('finances').delete().eq('id', record.id);
        }
      }
    });
  };

  const worksFormRef = useRef<HTMLFormElement | null>(null);
  const [workForm, setWorkForm] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    activity_date: string;
    is_coming_soon: boolean;
    media: string[];
  }>({
    id: '',
    title: '',
    description: '',
    category: '',
    activity_date: '',
    is_coming_soon: false,
    media: []
  });

  const handleWorkMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadState({
        active: true,
        percent: 0,
        label: `ক্লাউডিনারিতে আপলোড হচ্ছে (${i + 1}/${fileArray.length})...`
      });
      try {
        const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
          setUploadState({
            active: true,
            percent,
            label: `ক্লাউডিনারিতে আপলোড হচ্ছে (${i + 1}/${fileArray.length})...`
          });
        });
        setWorkForm((prev) => ({
          ...prev,
          media: [...prev.media, uploadedUrl]
        }));
        await autoRecordInGallery(uploadedUrl);
      } catch (err: any) {
        showNotice(err?.message || 'মিডিয়া আপলোড ব্যর্থ হয়েছে।', 'error');
      }
    }
    setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    showNotice('মিডিয়া সফলভাবে ক্লাউডিনারিতে যুক্ত হয়েছে!', 'success');
    e.target.value = '';
  };

  const moveWorkMedia = (index: number, direction: -1 | 1) => {
    setWorkForm((prev) => {
      const copy = [...prev.media];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, media: copy };
    });
  };

  const removeWorkMedia = (index: number) => {
    setWorkForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, idx) => idx !== index)
    }));
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workForm.title.trim() || !workForm.description.trim()) {
      showNotice('শিরোনাম এবং বিস্তারিত বিবরণ পূরণ করুন।', 'error');
      return;
    }

    if (workForm.id) {
      const updatedAct: ActivityItem = {
        id: workForm.id,
        title: workForm.title.trim(),
        description: workForm.description.trim(),
        category: workForm.category.trim() || 'সাধারণ',
        activity_date: workForm.activity_date,
        is_coming_soon: workForm.is_coming_soon,
        media: workForm.media,
        created_at: new Date().toISOString()
      };
      setActivities((prev) => prev.map((a) => (a.id === updatedAct.id ? updatedAct : a)));
      setWorkForm({
        id: '',
        title: '',
        description: '',
        category: '',
        activity_date: '',
        is_coming_soon: false,
        media: []
      });
      showNotice('কার্যক্রমটি সফলভাবে আপডেট করা হয়েছে!', 'success');

      if (useD1Backend) {
        await callD1Api('activities', 'PUT', updatedAct);
      } else {
        await smartSupabaseMutation(
          [activitiesTable, 'activities', 'works'],
          'update',
          {
            title: updatedAct.title,
            description: updatedAct.description,
            category: updatedAct.category,
            activity_date: updatedAct.activity_date || null,
            is_coming_soon: updatedAct.is_coming_soon,
            media: updatedAct.media
          },
          'id',
          updatedAct.id
        );
      }
    } else {
      const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`;
      const newAct: ActivityItem = {
        id: tempId,
        title: workForm.title.trim(),
        description: workForm.description.trim(),
        category: workForm.category.trim() || 'সাধারণ',
        activity_date: workForm.activity_date,
        is_coming_soon: workForm.is_coming_soon,
        media: workForm.media,
        created_at: new Date().toISOString()
      };
      setActivities((prev) => [newAct, ...prev]);
      setWorkForm({
        id: '',
        title: '',
        description: '',
        category: '',
        activity_date: '',
        is_coming_soon: false,
        media: []
      });
      showNotice('নতুন কার্যক্রম সফলভাবে প্রকাশিত হয়েছে!', 'success');

      if (useD1Backend) {
        await callD1Api('activities', 'POST', newAct);
        return;
      }

      const { data } = await smartSupabaseMutation(
        [activitiesTable, 'activities', 'works'],
        'insert',
        {
          title: newAct.title,
          description: newAct.description,
          category: newAct.category,
          activity_date: newAct.activity_date || null,
          is_coming_soon: newAct.is_coming_soon,
          media: newAct.media
        }
      );
      if (Array.isArray(data) && data[0]?.id) {
        setActivities((prev) =>
          prev.map((a) => (a.id === tempId ? { ...a, id: String(data[0].id) } : a))
        );
      }
    }
  };

  const handleEditActivityClick = (act: ActivityItem) => {
    setWorkForm({
      id: act.id,
      title: act.title,
      description: act.description,
      category: act.category,
      activity_date: act.activity_date || '',
      is_coming_soon: Boolean(act.is_coming_soon),
      media: Array.isArray(act.media) ? [...act.media] : []
    });
    if (worksFormRef.current) {
      worksFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteActivity = (act: ActivityItem) => {
    setConfirmDialog({
      open: true,
      title: 'কার্যক্রম ডিলিট নিশ্চিত করুন',
      message: `আপনি কি "${act.title}" কার্যক্রমটি মুছে ফেলতে চান?`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setActivities((prev) => prev.filter((a) => a.id !== act.id));
        showNotice('কার্যক্রমটি মুছে ফেলা হয়েছে।', 'success');
        if (useD1Backend) {
          await callD1Api(`activities?id=${encodeURIComponent(act.id)}`, 'DELETE');
        } else {
          for (const table of [activitiesTable, 'activities', 'works']) {
            const { error } = await supabase.from(table).delete().eq('id', act.id);
            if (!error) break;
          }
        }
      }
    });
  };

  const handleDeleteIdea = (item: IdeaItem) => {
    setConfirmDialog({
      open: true,
      title: 'পরিকল্পনা ডিলিট নিশ্চিত করুন',
      message: `আপনি কি "${item.name}"-এর পাঠানো পরিকল্পনাটি মুছে ফেলতে চান?`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setIdeas((prev) => prev.filter((i) => i.id !== item.id));
        showNotice('পরিকল্পনাটি মুছে ফেলা হয়েছে।', 'success');
        if (useD1Backend) {
          await callD1Api(`ideas?id=${encodeURIComponent(item.id)}`, 'DELETE');
        } else {
          await supabase.from('ideas').delete().eq('id', item.id);
        }
      }
    });
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadState({
        active: true,
        percent: 0,
        label: `গ্যালারি মিডিয়া আপলোড হচ্ছে (${i + 1}/${fileArray.length})...`
      });
      try {
        const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
          setUploadState({
            active: true,
            percent,
            label: `গ্যালারি মিডিয়া আপলোড হচ্ছে (${i + 1}/${fileArray.length})...`
          });
        });
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gal-${Date.now()}-${i}`;
        const newGal: GalleryItem = {
          id: tempId,
          url: uploadedUrl,
          created_at: new Date().toISOString()
        };
        setGallery((prev) => [newGal, ...prev]);

        if (useD1Backend) {
          await callD1Api('gallery', 'POST', newGal);
          continue;
        }

        const { data } = await smartSupabaseMutation(['gallery_images'], 'insert', {
          url: uploadedUrl
        });
        if (Array.isArray(data) && data[0]?.id) {
          setGallery((prev) =>
            prev.map((g) => (g.id === tempId ? { ...g, id: String(data[0].id) } : g))
          );
        }
      } catch (err: any) {
        showNotice(err?.message || 'গ্যালারি আপলোড ব্যর্থ হয়েছে।', 'error');
      }
    }
    setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    showNotice('গ্যালারিতে নতুন মিডিয়া যুক্ত হয়েছে!', 'success');
    e.target.value = '';
  };

  const handleDeleteGalleryItem = (item: GalleryItem) => {
    setConfirmDialog({
      open: true,
      title: 'গ্যালারি মিডিয়া ডিলিট',
      message: 'আপনি কি নিশ্চিতভাবে এই ছবিটি/ভিডিওটি গ্যালারি থেকে মুছে ফেলতে চান?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setGallery((prev) => prev.filter((g) => g.id !== item.id));
        showNotice('গ্যালারি থেকে মুছে ফেলা হয়েছে।', 'success');
        if (useD1Backend) {
          await callD1Api(`gallery?id=${encodeURIComponent(item.id)}`, 'DELETE');
        } else {
          await supabase.from('gallery_images').delete().eq('id', item.id);
        }
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ active: true, percent: 0, label: 'সাইট লোগো ও ফেভিকন আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'সাইট লোগো ও ফেভিকন আপলোড হচ্ছে...' });
      }, 'logo');
      const nextSettings = {
        ...siteSettings,
        logo_url: uploadedUrl,
        favicon_url: uploadedUrl
      };
      await persistSettingsInstant(nextSettings);
      await autoRecordInGallery(uploadedUrl);
      showNotice('নতুন লোগো ও ফেভিকন পুরো ওয়েবসাইটে সাথে সাথে সেট হয়ে গেছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'লোগো আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ active: true, percent: 0, label: 'ফেভিকন (Favicon) আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'ফেভিকন (Favicon) আপলোড হচ্ছে...' });
      }, 'logo');
      const nextSettings = { ...siteSettings, favicon_url: uploadedUrl };
      await persistSettingsInstant(nextSettings);
      await autoRecordInGallery(uploadedUrl);
      showNotice('নতুন ফেভিকন পুরো ওয়েবসাইটে সাথে সাথে সেট হয়ে গেছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'ফেভিকন আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleBannerUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({
      active: true,
      percent: 0,
      label: `হোমপেজ ব্যানার #${slotIndex + 1} আপলোড হচ্ছে...`
    });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({
          active: true,
          percent,
          label: `হোমপেজ ব্যানার #${slotIndex + 1} আপলোড হচ্ছে...`
        });
      });
      const nextBanners = [...(siteSettings.banners || ['', '', '', ''])];
      while (nextBanners.length < 4) nextBanners.push('');
      nextBanners[slotIndex] = uploadedUrl;
      const nextSettings = { ...siteSettings, banners: nextBanners };
      await persistSettingsInstant(nextSettings);
      await autoRecordInGallery(uploadedUrl);
      showNotice(`ব্যানার #${slotIndex + 1} পুরো ওয়েবসাইটে সাথে সাথে আপডেট হয়ে গেছে!`, 'success');
    } catch (err: any) {
      showNotice(err?.message || 'ব্যানার আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await persistSettingsInstant(siteSettings);
    if (!res.ok && res.data?.error) {
      showNotice('সেটিংস সংরক্ষণে ত্রুটি: ' + res.data.error, 'error');
      return;
    }
    showNotice('সাইট সেটিংস সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!', 'success');
  };

  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('');
  const [profileFbUrl, setProfileFbUrl] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');

  useEffect(() => {
    if (appUser) {
      setProfileName(appUser.name || '');
      setProfileMobile(appUser.mobile || '');
      setProfileEmail(formatDisplayEmail(appUser.email));
      setProfileBloodGroup(appUser.blood_group || '');
      setProfileFbUrl(appUser.fb_url || '');
      setProfileBio(appUser.bio || '');
    }
  }, [appUser]);

  const handleMyProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appUser) return;
    setUploadState({ active: true, percent: 0, label: 'প্রোফাইল ছবি আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'প্রোফাইল ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
      }, 'avatar');
      const updatedUser = { ...appUser, avatar_url: uploadedUrl };
      setAppUser(updatedUser);
      setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));
      await autoRecordInGallery(uploadedUrl);
      if (useD1Backend) {
        await callD1Api('members', 'PUT', {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          designation: updatedUser.designation,
          avatar_url: uploadedUrl
        });
      } else {
        await smartSupabaseMutation(
          [membersTable, 'members', 'users', 'profiles'],
          'update',
          { avatar_url: uploadedUrl },
          'id',
          updatedUser.id
        );
      }
      showNotice('প্রোফাইল ছবি আপডেট হয়েছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'প্রোফাইল ছবি আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleSaveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    if (!profileName.trim()) {
      showNotice('নাম খালি রাখা যাবে না।', 'error');
      return;
    }
    if (profileMobile.trim()) {
      const bd = analyzeBdPhone(profileMobile);
      if (!bd.isValidBd) {
        showNotice('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।', 'error');
        return;
      }
    }
    if (profileNewPassword && profileNewPassword.length < 6) {
      showNotice('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    const cleanMob = profileMobile.trim() ? analyzeBdPhone(profileMobile).normalized : '';
    const cleanEm = profileEmail.trim()
      ? profileEmail.trim().toLowerCase()
      : appUser.email;

    const updatedUser: MemberUser = {
      ...appUser,
      name: profileName.trim(),
      mobile: cleanMob,
      email: cleanEm,
      blood_group: profileBloodGroup,
      fb_url: profileFbUrl.trim(),
      bio: profileBio.trim()
    };
    setAppUser(updatedUser);
    setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));

    if (useD1Backend) {
      await callD1Api('members', 'PUT', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        designation: updatedUser.designation,
        avatar_url: updatedUser.avatar_url,
        blood_group: updatedUser.blood_group,
        fb_url: updatedUser.fb_url,
        bio: updatedUser.bio,
        new_password: profileNewPassword || undefined
      });
    } else {
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'update',
        { name: updatedUser.name },
        'id',
        updatedUser.id
      );
      if (profileNewPassword) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: profileNewPassword });
        if (pwErr) {
          showNotice('পাসওয়ার্ড আপডেটে সমস্যা হয়েছে: ' + pwErr.message, 'error');
          return;
        }
      }
    }

    setProfileNewPassword('');
    showNotice('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', 'success');
  };

  const getMemberNameByUid = (uid?: string) => {
    if (!uid) return 'সাধারণ তহবিল';
    const found = members.find((m) => m.id === uid);
    return found ? found.name : 'সদস্য';
  };

  // ============================================================================
  // 12. RENDER LUXURY ISLAMIC UI
  // ============================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-[#0A2F25] overflow-x-hidden w-full max-w-[100vw] selection:bg-[#D4AF37] selection:text-[#0A2F25]">
      {/* 1. TOP MARQUEE ANNOUNCEMENT BAR (PURE SVG ICONS, EDITABLE BY ADMIN) */}
      <div
        className="w-full overflow-hidden py-1.5 border-b border-[#D4AF37]/40 text-[#FFFFFF]"
        style={{ background: 'linear-gradient(90deg, #0A2F25, #155e4a, #0A2F25)' }}
      >
        <div className="animate-marquee flex items-center gap-8 text-xs sm:text-sm font-medium text-[#FFFFFF]">
          {[0, 1, 2, 3].map((repeatIdx) => (
            <span key={repeatIdx} className="inline-flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-[#FFFFFF] tracking-wide">
                {siteSettings.announcement_text || DEFAULT_ANNOUNCEMENT}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-[#F3D568] tracking-wide font-semibold">
                {siteSettings.site_name || DEFAULT_SITE_NAME} — {siteSettings.tagline || DEFAULT_TAGLINE}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. MOBILE-FIRST HEADER / NAVBAR WITH MODERN PROFILE AVATAR POPUP */}
      <header className="sticky top-0 z-30 bg-[#0A2F25]/95 backdrop-blur-lg border-b border-[#D4AF37]/45 shadow-[0_8px_30px_rgba(10,47,37,0.28)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 relative">
          {/* Left Side: Circular White-BG Logo + Site Name */}
          <button
            type="button"
            onClick={() => {
              setHeaderProfileMenuOpen(false);
              setCurrentView('home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none min-w-0"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-md group-hover:scale-105 transition-transform">
              <WhiteCircularLogo
                logoUrl={siteSettings.logo_url}
                sizeClass="w-10 h-10 sm:w-11 sm:h-11"
              />
            </div>
            <div className="min-w-0">
              <span className="block text-base sm:text-xl md:text-2xl font-bold text-white leading-tight break-words group-hover:text-[#F3D568] transition-colors">
                {siteSettings.site_name || DEFAULT_SITE_NAME}
              </span>
              <span className="hidden sm:block text-[11px] text-[#F3D568]/85 truncate max-w-xs">
                {siteSettings.tagline || DEFAULT_TAGLINE}
              </span>
            </div>
          </button>

          {/* Right Side Navigation Buttons + Modern Profile Avatar Button */}
          <nav className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setHeaderProfileMenuOpen(false);
                setCurrentView('members');
              }}
              className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
                currentView === 'members'
                  ? 'bg-[#D4AF37] text-[#0A2F25] border-[#F3D568] shadow-md'
                  : 'bg-[#124A3B]/90 text-white border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#155e4a]'
              }`}
            >
              <Users className="w-4 h-4 text-[#F3D568] shrink-0" />
              <span>সদস্য</span>
            </button>

            {!appUser ? (
              <button
                type="button"
                onClick={() => setCurrentView('join')}
                aria-label="যুক্ত হোন"
                className={`inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md border ${
                  currentView === 'join' || currentView === 'login'
                    ? 'bg-[#F3D568] text-[#0A2F25] border-white'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] hover:brightness-105'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">যুক্ত হোন</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderProfileMenuOpen(false);
                    setCurrentView('dashboard');
                  }}
                  aria-label="ড্যাশবোর্ড"
                  className={`inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md border ${
                    currentView === 'dashboard'
                      ? 'bg-[#F3D568] text-[#0A2F25] border-white'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] hover:brightness-105'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">ড্যাশবোর্ড</span>
                </button>

                {/* Modern Circular Profile Avatar Button Next to Dashboard */}
                <div className="relative" ref={profilePopoverRef}>
                  <button
                    type="button"
                    onClick={() => setHeaderProfileMenuOpen((prev) => !prev)}
                    aria-label="প্রোফাইল মেনু"
                    className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-md hover:scale-105 transition-transform focus:outline-none"
                  >
                    <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold text-sm overflow-hidden">
                      {appUser.avatar_url ? (
                        <img
                          src={optimizeMedia(appUser.avatar_url)}
                          alt={appUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{appUser.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A2F25]" />
                  </button>

                  {/* Modern Profile Popover Menu */}
                  {headerProfileMenuOpen && (
                    <>

                      <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-3xl bg-white text-[#0A2F25] border-2 border-[#D4AF37]/60 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                        <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] p-4 text-white">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F3D568] shrink-0">
                              <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-lg font-bold overflow-hidden">
                                {appUser.avatar_url ? (
                                  <img
                                    src={optimizeMedia(appUser.avatar_url)}
                                    alt={appUser.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{appUser.name.charAt(0)}</span>
                                )}
                              </div>
                              <label
                                title="প্রোফাইল ছবি পরিবর্তন করুন"
                                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D4AF37] text-[#0A2F25] flex items-center justify-center shadow cursor-pointer hover:scale-110 transition-transform"
                              >
                                <Upload className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMyProfileAvatarUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm sm:text-base text-white truncate">
                                {appUser.name}
                              </p>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#0A2F25] mt-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{appUser.designation || (appUser.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-2.5 text-xs border-b border-gray-100 bg-[#F4F7F5]/60">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                            <span className="font-english truncate">{appUser.email}</span>
                          </div>
                          {appUser.mobile && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                              <span className="font-english">{appUser.mobile}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setHeaderProfileMenuOpen(false);
                              setActiveTab('my_profile');
                              setCurrentView('dashboard');
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#0A2F25] hover:bg-[#0A2F25]/10 transition"
                          >
                            <User className="w-4 h-4 text-[#155e4a]" />
                            <span>প্রোফাইল ও পাসওয়ার্ড আপডেট</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHeaderProfileMenuOpen(false);
                              setActiveTab(appUser.role === 'admin' ? 'overview' : 'my_account');
                              setCurrentView('dashboard');
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#0A2F25] hover:bg-[#0A2F25]/10 transition"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#155e4a]" />
                            <span>ড্যাশবোর্ডে যান</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHeaderProfileMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>লগআউট করুন</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* GLOBAL FEEDBACK NOTICE BANNER */}
      {notice && (
        <div className="fixed top-16 right-4 z-50 max-w-sm animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-medium ${
              notice.type === 'error'
                ? 'bg-red-900/95 text-white border-red-400'
                : 'bg-[#0A2F25]/95 text-white border-[#D4AF37]'
            }`}
          >
            {notice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            )}
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-auto text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* NON-BLOCKING CLOUDINARY UPLOAD TOAST BAR (Bottom Center) */}
      {uploadState.active && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md pointer-events-none">
          <div className="bg-gradient-to-r from-[#0A2F25] to-[#124A3B] border-2 border-[#D4AF37] text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="truncate text-[#F3D568]">{uploadState.label}</span>
                <span className="font-english text-white ml-2">{uploadState.percent}%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D568] transition-all duration-200"
                  style={{ width: `${uploadState.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN CONTENT VIEWS                                                */}
      {/* ==================================================================== */}
      <main className="flex-1 w-full">
        {/* ================================================================== */}
        {/* VIEW 1: HOME VIEW (`home`)                                         */}
        {/* ================================================================== */}
        {currentView === 'home' && (
          <div>
            {/* A. CLEAN LUXURY EMERALD & GOLD HERO SECTION (PURE SVG, ZERO EMOJIS/MOSQUE SHAPES) */}
            <section className="relative overflow-hidden bg-[#0A2F25] text-white min-h-[470px] sm:min-h-[540px] flex flex-col items-center justify-center py-14 sm:py-20 px-4 border-b-4 border-[#D4AF37]">
              {/* Fading Background Banner Slideshow */}
              {validBanners.map((bannerUrl, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === bannerIndex ? 'opacity-45' : 'opacity-0'
                  }`}
                  style={{
                    backgroundImage: `url("${optimizeMedia(bannerUrl)}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              ))}

              {/* Deep Emerald Sanctuary Vignette & Soft Golden Radial Aura */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 42%, rgba(21,94,74,0.65) 0%, rgba(10,47,37,0.92) 70%, rgba(5,24,19,0.98) 100%)'
                }}
              />

              {/* Subtle Corner Rotating SVG Geometric Rosettes */}
              <div className="absolute -left-28 -top-28 opacity-35">
                <IslamicMandala className="animate-mandala" size={400} />
              </div>
              <div className="absolute -right-28 -bottom-28 opacity-35">
                <IslamicMandala className="animate-mandala-reverse" size={440} />
              </div>

              {/* Hero Center Content */}
              <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
                {/* Floating Circular White-BG Logo with Soft Golden Halo */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#D4AF37]/30 via-[#F3D568]/20 to-[#D4AF37]/30 blur-md" />
                  <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.45)]">
                    <WhiteCircularLogo
                      logoUrl={siteSettings.logo_url}
                      sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                    />
                  </div>
                </div>

                {/* Golden Filigree Pill Badge (100% Pure SVG Icons) */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/55 text-[#F3D568] text-xs sm:text-sm font-semibold mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>মানবতা, ভ্রাতৃত্ব ও কল্যাণের অঙ্গীকার</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-snug sm:leading-tight mb-4 drop-shadow-lg">
                  মানবতার সেবায় {siteSettings.site_name || DEFAULT_SITE_NAME}
                </h1>

                <p className="text-sm sm:text-lg md:text-xl text-gray-200 max-w-2xl mb-8 leading-relaxed">
                  {siteSettings.tagline || DEFAULT_TAGLINE}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setCurrentView('join')}
                    className="btn-glossy-gold inline-flex items-center gap-2 px-7 sm:px-9 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-sm sm:text-base shadow-[0_10px_25px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>সদস্য হিসেবে যুক্ত হোন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('members')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-[#D4AF37]/60 font-semibold text-sm sm:text-base transition-all"
                  >
                    <Users className="w-4 h-4 text-[#F3D568]" />
                    <span>সদস্যবৃন্দ দেখুন</span>
                  </button>
                </div>

                {validBanners.length > 1 && (
                  <div className="mt-7 flex items-center gap-2">
                    {validBanners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setBannerIndex(i)}
                        aria-label={`ব্যানার ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === bannerIndex ? 'w-7 bg-[#D4AF37]' : 'w-2 bg-white/35'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* A2. REAL-TIME PROJECT TARGET FUND PROGRESS BARS (ADMIN CONTROLLED) */}
            {activeHomepageCampaigns.length > 0 && (
              <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-10 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeHomepageCampaigns.map((camp) => {
                    const target = Math.max(1, Number(camp.target_amount) || 1);
                    const collected = Math.max(0, Number(camp.collected_amount) || 0);
                    const remaining = Math.max(0, target - collected);
                    const percent = Math.min(100, Math.round((collected / target) * 100));

                    return (
                      <div
                        key={camp.id}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2F25] via-[#104033] to-[#0A2F25] text-white p-5 sm:p-6 border-2 border-[#D4AF37]/70 shadow-xl"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3D568] text-[11px] font-bold mb-1.5">
                              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                              <span>চলমান ফান্ড প্রজেক্ট</span>
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                              {camp.title}
                            </h3>
                          </div>
                          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] font-english font-bold text-xs sm:text-sm shadow">
                            {percent}% সম্পন্ন
                          </span>
                        </div>

                        {camp.description && (
                          <p className="text-xs sm:text-sm text-gray-200 mb-4 leading-relaxed">
                            {camp.description}
                          </p>
                        )}

                        {/* Animated Gold & Emerald Progress Bar */}
                        <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/40 mb-4">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-emerald-400 transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center bg-white/5 rounded-2xl p-3 border border-white/10">
                          <div>
                            <span className="block text-[11px] text-gray-300">লক্ষ্যমাত্রা</span>
                            <span className="text-xs sm:text-sm font-bold text-[#F3D568] font-english">
                              ৳ {target.toLocaleString('en-US')}
                            </span>
                          </div>
                          <div className="border-x border-white/10">
                            <span className="block text-[11px] text-gray-300">সংগৃহীত ফান্ড</span>
                            <span className="text-xs sm:text-sm font-bold text-emerald-300 font-english">
                              ৳ {collected.toLocaleString('en-US')}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[11px] text-gray-300">আরও প্রয়োজন</span>
                            <span className="text-xs sm:text-sm font-bold text-white font-english">
                              ৳ {remaining.toLocaleString('en-US')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* B. ACTIVITIES SECTION (`আমাদের কার্যক্রম`) */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 py-11 sm:py-16">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <IslamicSectionDivider subtitle="মানবতার কল্যাণে আমাদের পদক্ষেপ" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2F25]">
                  আমাদের কার্যক্রম
                </h2>
                <div className="w-28 h-1 bg-gradient-to-r from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] mx-auto mt-2.5 rounded-full" />
              </div>

              {/* Dynamic Category Filter Buttons */}
              <div className="flex items-center justify-center flex-wrap gap-2 mb-9">
                {activityCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border-[#D4AF37] shadow-lg scale-105'
                        : 'bg-white text-[#0A2F25] border-[#0A2F25]/15 hover:border-[#D4AF37] hover:bg-[#0A2F25]/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Responsive Masonry Grid displaying Activity Cards */}
              {loadingInitial ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-[#0A2F25] animate-spin" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#D4AF37]/35 shadow-sm max-w-lg mx-auto">
                  <HeartHandshake className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 opacity-80" />
                  <p className="text-gray-600 text-sm sm:text-base font-medium">
                    এখনো কোনো কার্যক্রম যুক্ত হয়নি।
                  </p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                  {filteredActivities.map((act) => {
                    const firstMedia = act.media && act.media.length > 0 ? act.media[0] : '';
                    const isVideo = isMediaVideo(firstMedia);
                    const showComingSoon = checkIsComingSoon(act.is_coming_soon, act.activity_date);

                    return (
                      <article
                        key={act.id}
                        onClick={() => setSelectedActivityModal(act)}
                        className="break-inside-avoid group cursor-pointer bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/35 shadow-md hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(10,47,37,0.22)] transition-all duration-300 flex flex-col"
                      >
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#0A2F25] via-[#D4AF37] to-[#155e4a]" />

                        {/* Media Thumbnail Container */}
                        <div className="relative w-full overflow-hidden bg-[#0A2F25]">
                          {firstMedia ? (
                            isVideo ? (
                              <div className="relative w-full h-52 sm:h-60">
                                <video
                                  src={optimizeMedia(firstMedia)}
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-[#0A2F25]/90 border-2 border-[#D4AF37] text-[#F3D568] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={optimizeMedia(firstMedia)}
                                alt={act.title}
                                loading="lazy"
                                className="w-full h-52 sm:h-60 object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            )
                          ) : (
                            <div className="w-full h-44 bg-gradient-to-br from-[#0A2F25] to-[#155e4a] flex items-center justify-center">
                              <HeartHandshake className="w-12 h-12 text-[#D4AF37]/60" />
                            </div>
                          )}

                          {/* Category Badge */}
                          <span className="absolute top-3 left-3 px-3.5 py-1 rounded-full text-xs font-bold bg-[#0A2F25]/90 text-[#F3D568] border border-[#D4AF37]/60 backdrop-blur-sm shadow">
                            {act.category || 'সাধারণ'}
                          </span>

                          {/* Smart "Coming Soon" & Date Badge Logic */}
                          <div className="absolute top-3 right-3">
                            {showComingSoon ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] shadow-md">
                                <Clock className="w-3.5 h-3.5" />
                                <span>শীঘ্রই আসছে</span>
                              </span>
                            ) : act.activity_date ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#0A2F25] border border-[#D4AF37]/50 shadow font-english">
                                <Calendar className="w-3.5 h-3.5 text-[#155e4a]" />
                                <span>{act.activity_date}</span>
                              </span>
                            ) : null}
                          </div>

                          {act.media && act.media.length > 1 && (
                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-english font-semibold bg-black/75 text-[#F3D568] border border-[#D4AF37]/40 backdrop-blur-sm">
                              1/{act.media.length}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] group-hover:text-[#155e4a] transition-colors mb-2 leading-snug">
                              {act.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                              {act.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0A2F25]">
                            <span className="inline-flex items-center gap-1.5 group-hover:text-[#155e4a] transition-colors">
                              <Eye className="w-4 h-4 text-[#D4AF37]" />
                              <span>বিস্তারিত ও মিডিয়া দেখুন</span>
                            </span>
                            <span className="w-7 h-7 rounded-full bg-[#0A2F25]/5 group-hover:bg-[#0A2F25] group-hover:text-[#F3D568] flex items-center justify-center transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>



            {/* D. SHARE YOUR IDEA SECTION (`আপনার পরিকল্পনা শেয়ার করুন`) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2F25] via-[#124A3B] to-[#0A2F25] text-white py-14 sm:py-20 px-4 border-t-2 border-[#D4AF37]/60">
              {/* Animated Islamic Mandalas in Idea Section Background */}
              <div className="absolute -right-24 -top-24 opacity-35">
                <IslamicMandala className="animate-mandala" size={360} />
              </div>
              <div className="absolute -left-24 -bottom-24 opacity-35">
                <IslamicMandala className="animate-mandala-reverse" size={360} />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-3.5 text-[#F3D568] shadow-lg">
                    <Lightbulb className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    আপনার পরিকল্পনা শেয়ার করুন
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-200 max-w-md mx-auto leading-relaxed">
                    সমাজসেবা ও মানবিক কাজে আপনার যেকোনো সুন্দর পরামর্শ বা পরিকল্পনা আমাদের জানান।
                  </p>
                </div>

                <form
                  onSubmit={handleIdeaSubmit}
                  className="bg-white/10 backdrop-blur-xl border-2 border-[#D4AF37]/45 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#F3D568] mb-1.5">
                        আপনার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={ideaForm.name}
                        onChange={(e) => setIdeaForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="আপনার পূর্ণ নাম লিখুন"
                        className="w-full px-4 py-3 rounded-xl bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#F3D568] mb-1.5">
                        মোবাইল নাম্বার *
                      </label>
                      <input
                        type="tel"
                        required
                        value={ideaForm.mobile}
                        onChange={(e) => setIdeaForm((p) => ({ ...p, mobile: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 rounded-xl bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm font-english focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#F3D568] mb-1.5">
                      আপনার পরিকল্পনা / পরামর্শ *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={ideaForm.idea}
                      onChange={(e) => setIdeaForm((p) => ({ ...p, idea: e.target.value }))}
                      placeholder="মানবতার সেবায় আপনার সুন্দর আইডিয়া বা পরিকল্পনা বিস্তারিত লিখুন..."
                      className="w-full px-4 py-3 rounded-xl bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ideaSubmitting}
                    className="btn-glossy-gold w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-sm sm:text-base shadow-xl hover:brightness-105 transition disabled:opacity-60"
                  >
                    {ideaSubmitting ? 'জমা হচ্ছে...' : 'পরিকল্পনা জমা দিন'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: PUBLIC MEMBERS VIEW (`members`)                            */}
        {/* ================================================================== */}
        {currentView === 'members' && (
          <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
            <div className="text-center max-w-2xl mx-auto mb-7">
              <IslamicSectionDivider subtitle="আমাদের মানবিক পরিবার" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2F25]">
                নব আলো ফাউন্ডেশনের সদস্যবৃন্দ
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
                যেকোনো সদস্যের কার্ডে ক্লিক করে তার রক্তের গ্রুপ ও বিস্তারিত পরিচয় দেখুন
              </p>
            </div>

            {/* Search & Blood Group Filter Bar */}
            <div className="bg-white rounded-3xl p-4 border border-[#D4AF37]/40 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Users className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="নাম বা পদবি দিয়ে সদস্য খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                <span className="text-xs font-bold text-[#0A2F25] mr-1 shrink-0">রক্তের গ্রুপ:</span>
                {['সব', ...BLOOD_GROUPS].map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedBloodFilter(bg)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border ${
                      selectedBloodFilter === bg
                        ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow'
                        : 'bg-[#F4F7F5] text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {filteredPublicMembers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#D4AF37]/30 shadow-sm max-w-md mx-auto">
                <Users className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-gray-500 text-sm">কোনো সদস্য খুঁজে পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredPublicMembers.map((member) => {
                  // On public members page, everyone is equal — never expose 'অ্যাডমিন' role or shield icon!
                  const rawDesig = (member.designation || '').trim();
                  const publicDesignation =
                    !rawDesig || rawDesig === 'অ্যাডমিন' ? 'সাধারণ সদস্য' : rawDesig;
                  const avatarSrc = optimizeMedia(member.avatar_url);

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMemberModal(member)}
                      className="cursor-pointer group bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col items-center text-center relative"
                    >
                      {/* Decorative Emerald & Gold Header */}
                      <div className="w-full h-16 bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] border-b-2 border-[#D4AF37] relative" />

                      {/* Blood Group Pill on Top Right if available */}
                      {member.blood_group && (
                        <span className="absolute top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-english font-bold text-[11px] shadow-md">
                          {member.blood_group}
                        </span>
                      )}

                      {/* Circular Profile Photo or Initial */}
                      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#0A2F25] shadow-lg -mt-10 mb-3 relative z-10 group-hover:scale-105 transition-transform">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={member.name}
                            loading="lazy"
                            className="w-full h-full rounded-full object-cover bg-white"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-2xl font-bold">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="px-5 pb-5 flex-1 flex flex-col items-center justify-between w-full">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] group-hover:text-[#155e4a] transition-colors leading-snug">
                            {member.name}
                          </h3>

                          {/* Uniform Designation Badge for All Members (No Admin Shield) */}
                          <span className="mt-2 inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-bold bg-[#F4F7F5] text-[#0A2F25] border border-[#D4AF37]/50">
                            <span>{publicDesignation}</span>
                          </span>

                          {member.bio && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                              {member.bio}
                            </p>
                          )}
                        </div>

                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#155e4a] group-hover:text-[#0A2F25]">
                          <span>বিস্তারিত দেখুন</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ================================================================== */}
        {/* VIEW 3: JOIN VIEW (`join` — Modern Sign Up with BD Phone Detection) */}
        {/* ================================================================== */}
        {currentView === 'join' && (
          <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/55 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] p-6 text-center text-white border-b border-[#D4AF37]/40">
                <div className="flex justify-center mb-3">
                  <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-16 h-16" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">সদস্য হিসেবে যুক্ত হোন</h2>
                <p className="text-xs text-[#F3D568] mt-1">
                  মাত্র ৩টি তথ্য দিয়ে সহজেই আপনার একাউন্ট তৈরি করুন
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="p-5 sm:p-7 space-y-4">
                {/* BOX 1: Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                    ১. আপনার পূর্ণ নাম *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={joinForm.name}
                      onChange={(e) => setJoinForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                {/* BOX 2: Email OR Bangladeshi Mobile Number (Single Unified Smart Box) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                    ২. ইমেইল অথবা মোবাইল নাম্বার *
                  </label>
                  <div className="relative">
                    {analyzeBdPhone(joinForm.email).looksLikePhone ? (
                      <Phone className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Mail className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    )}
                    <input
                      type="text"
                      required
                      value={joinForm.email}
                      onChange={(e) => setJoinForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="017XXXXXXXX অথবা example@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                  {joinForm.email.trim().length > 0 && (() => {
                    const raw = joinForm.email.trim();
                    const bd = analyzeBdPhone(raw);
                    if (bd.looksLikePhone) {
                      return bd.isValidBd ? (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>সঠিক বাংলাদেশি নাম্বার ({bd.normalized} • {bd.operator})</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>০১ দিয়ে শুরু ১১ ডিজিটের সঠিক নাম্বার দিন</span>
                        </div>
                      );
                    }
                    if (raw.includes('@')) {
                      return (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2F25] bg-[#0A2F25]/5 border border-[#D4AF37]/40 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                          <span>ইমেইল অ্যাড্রেস শনাক্ত হয়েছে</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* BOX 3: Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                    ৩. পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showJoinPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={joinForm.password}
                      onChange={(e) => setJoinForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowJoinPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0A2F25]"
                      aria-label="পাসওয়ার্ড দেখুন"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-glossy-emerald w-full py-3 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm sm:text-base shadow-lg hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{authLoading ? 'প্রসেসিং হচ্ছে...' : 'সাইন আপ সম্পন্ন করুন'}</span>
                </button>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className="text-xs sm:text-sm font-bold text-[#155e4a] hover:text-[#0A2F25] underline underline-offset-4 transition"
                  >
                    আগেই একাউন্ট করা থাকলে এখানে লগইন করুন
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* VIEW 4: LOGIN VIEW (`login` — Email OR Bangladeshi Mobile Number)  */}
        {/* ================================================================== */}
        {(currentView === 'login' || (currentView === 'dashboard' && !appUser)) && (
          <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/55 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] p-6 sm:p-7 text-center text-white border-b border-[#D4AF37]/40">
                <div className="flex justify-center mb-3">
                  <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-16 h-16" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">সদস্য ও অ্যাডমিন লগইন</h2>
                <p className="text-xs sm:text-sm text-[#F3D568] mt-1">
                  আপনার ইমেইল অথবা বাংলাদেশি মোবাইল নাম্বার ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="p-5 sm:p-7 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                    ইমেইল অ্যাড্রেস অথবা মোবাইল নাম্বার *
                  </label>
                  <div className="relative">
                    {analyzeBdPhone(loginForm.email).looksLikePhone ? (
                      <Phone className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Mail className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    )}
                    <input
                      type="text"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="example@gmail.com অথবা 017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                  {loginForm.email.trim().length > 0 && (() => {
                    const raw = loginForm.email.trim();
                    const bd = analyzeBdPhone(raw);
                    if (bd.looksLikePhone) {
                      return bd.isValidBd ? (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>বাংলাদেশি মোবাইল নাম্বার শনাক্ত হয়েছে ({bd.normalized})</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>১১ ডিজিটের সঠিক বাংলাদেশি মোবাইল নাম্বার দিন (01XXXXXXXXX)</span>
                        </div>
                      );
                    }
                    if (raw.includes('@')) {
                      return (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A2F25] bg-[#0A2F25]/5 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                          <span>ইমেইল অ্যাড্রেস শনাক্ত হয়েছে</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0A2F25]"
                      aria-label="পাসওয়ার্ড দেখুন"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-glossy-emerald w-full py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm sm:text-base shadow-lg hover:opacity-95 transition disabled:opacity-60"
                >
                  {authLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
                </button>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('join')}
                    className="text-xs sm:text-sm font-bold text-[#155e4a] hover:text-[#0A2F25] underline underline-offset-4 transition"
                  >
                    নতুন সদস্য হতে চাইলে এখানে রেজিস্ট্রেশন করুন
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* VIEW 5: DASHBOARD VIEW (`dashboard`)                               */}
        {/* ================================================================== */}
        {currentView === 'dashboard' && appUser && (
          <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
            {/* Authenticated User Header Banner */}
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] rounded-3xl p-4 sm:p-6 text-white border-2 border-[#D4AF37]/60 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F3D568] shrink-0">
                  {appUser.avatar_url ? (
                    <img
                      src={optimizeMedia(appUser.avatar_url)}
                      alt={appUser.name}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-xl font-bold">
                      {appUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold">{appUser.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#0A2F25]">
                      {appUser.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-english">{appUser.email}</p>
                </div>
              </div>
            </div>

            {/* DASHBOARD NAVIGATION TABS */}
            {appUser.role === 'admin' ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                {[
                  { id: 'overview', label: 'ওভারভিউ', icon: LayoutDashboard },
                  { id: 'members', label: 'সদস্য পরিচালনা', icon: Users },
                  { id: 'finances', label: 'জমা/খরচের হিসাব', icon: Wallet },
                  { id: 'works', label: 'কার্যক্রম আপডেট', icon: FolderKanban },
                  { id: 'ideas', label: 'পরিকল্পনা সমূহ', icon: Lightbulb },
                  { id: 'gallery', label: 'গ্যালারি', icon: ImageIcon },
                  { id: 'settings', label: 'সেটিংস', icon: Settings },
                  { id: 'my_profile', label: 'আমার প্রোফাইল', icon: User }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${
                        active
                          ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-md'
                          : 'bg-white text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.id === 'members' && pendingMembers.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-english">
                          {pendingMembers.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
                {[
                  { id: 'my_account', label: 'আমার জমা', icon: Wallet },
                  { id: 'my_profile', label: 'প্রোফাইল আপডেট', icon: User },
                  { id: 'foundation_funds', label: 'ফান্ড', icon: TrendingUp },
                  { id: 'expense_history', label: 'খরচ', icon: FileText }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${
                        active
                          ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-md'
                          : 'bg-white text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 1: ওভারভিউ (`overview`)                              */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-6 border-2 border-[#D4AF37] shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[#F3D568]">বর্তমান ফান্ড</span>
                    <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#F3D568]">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold font-english">
                    ৳ {currentBalance.toLocaleString('en-US')}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-emerald-800">মোট কালেকশন</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-english">
                    ৳ {totalIncome.toLocaleString('en-US')}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-red-700">মোট খরচ</span>
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 font-english">
                    ৳ {totalExpense.toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 2: সদস্য পরিচালনা (`members`)                        */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'members' && (
              <div className="space-y-6">
                {/* Quick Add Member via Facebook URL or Direct Form */}
                <form
                  onSubmit={handleQuickMemberSubmit}
                  className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D4AF37]/50 shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#0A2F25] text-[#F3D568] flex items-center justify-center shadow">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                          সরাসরি নতুন সদস্য যুক্ত করুন (Facebook URL / Quick Add)
                        </h3>
                        <p className="text-xs text-gray-500">
                          ফেসবুক প্রোফাইল লিংক পেস্ট করে অথবা সরাসরি নাম, ছবি ও পদবী দিয়ে সদস্য যুক্ত করুন
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Facebook URL Input + Auto-Fetch Button */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Facebook className="w-4 h-4 text-[#155e4a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={quickMemberForm.fb_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuickMemberForm((p) => ({ ...p, fb_url: val }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value.includes('facebook.com') && !quickMemberForm.name) {
                            handleFetchFromFacebookUrl(e.target.value);
                          }
                        }}
                        placeholder="ফেসবুক প্রোফাইল লিংক পেস্ট করুন (যেমন: https://facebook.com/username)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={fetchingFbInfo}
                      onClick={() => handleFetchFromFacebookUrl()}
                      className="px-4 py-2.5 rounded-xl bg-[#124A3B] hover:bg-[#155e4a] text-[#F3D568] border border-[#D4AF37]/50 text-xs sm:text-sm font-bold shrink-0 transition"
                    >
                      {fetchingFbInfo ? 'আনা হচ্ছে...' : 'ফেসবুক থেকে নাম/ছবি আনুন'}
                    </button>
                  </div>

                  {/* Name, Designation, Role, Sort Order & Photo Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        সদস্যের নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickMemberForm.name}
                        onChange={(e) =>
                          setQuickMemberForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="সদস্যের পূর্ণ নাম"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        পদবি / ক্যাটাগরি নির্বাচন করুন *
                      </label>
                      <select
                        value={quickMemberForm.designation}
                        onChange={(e) =>
                          setQuickMemberForm((p) => ({ ...p, designation: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
                      >
                        {activeDesignations.map((desig) => (
                          <option key={desig} value={desig}>
                            {desig}
                          </option>
                        ))}
                      </select>
                      <datalist id="member-designations-datalist">
                        {activeDesignations.map((desig) => (
                          <option key={desig} value={desig} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        রোল ও ক্রমিক নং
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={quickMemberForm.role}
                          onChange={(e) => {
                            const nextRole = e.target.value === 'admin' ? 'admin' : 'member';
                            setQuickMemberForm((p) => ({
                              ...p,
                              role: nextRole,
                              designation:
                                p.designation === 'সাধারণ সদস্য' && nextRole === 'admin'
                                  ? 'অ্যাডমিন'
                                  : p.designation
                            }));
                          }}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0A2F25]"
                        >
                          <option value="member">সদস্য</option>
                          <option value="admin">অ্যাডমিন</option>
                        </select>
                        <input
                          type="number"
                          value={quickMemberForm.sort_order}
                          onChange={(e) =>
                            setQuickMemberForm((p) => ({
                              ...p,
                              sort_order: Number(e.target.value)
                            }))
                          }
                          title="ক্রমিক নাম্বার"
                          className="w-20 px-2.5 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold overflow-hidden border border-[#D4AF37] shrink-0">
                        {quickMemberForm.avatar_url ? (
                          <img
                            src={optimizeMedia(quickMemberForm.avatar_url)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F4F7F5] hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] border border-[#D4AF37]/60 text-xs font-bold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQuickMemberPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>সদস্য তালিকায় যুক্ত করুন</span>
                  </button>
                </form>

                {/* Compact Collapsible Designation / Category CRUD Manager */}
                <div className="bg-white rounded-2xl p-4 border border-[#D4AF37]/45 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                        পদবি ও ক্যাটাগরি ব্যবস্থাপনা ({activeDesignations.length}টি)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDesignationManager((p) => !p)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] text-xs font-bold transition"
                    >
                      <span>{showDesignationManager ? 'সংক্ষিপ্ত করুন' : 'পদবি অ্যাড / এডিট করুন'}</span>
                    </button>
                  </div>

                  {showDesignationManager && (
                    <div className="mt-3.5 pt-3.5 border-t border-gray-100 space-y-3 animate-fadeIn">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDesignationInput}
                          onChange={(e) => setNewDesignationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDesignation();
                            }
                          }}
                          placeholder="নতুন পদবির নাম লিখুন..."
                          className="flex-1 px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                        />
                        <button
                          type="button"
                          onClick={handleAddDesignation}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>যুক্ত করুন</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(showAllDesignations ? activeDesignations : activeDesignations.slice(0, 6)).map(
                          (desig, idx) => (
                            <div
                              key={`${desig}-${idx}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4F7F5] border border-[#D4AF37]/40 text-xs font-semibold text-[#0A2F25]"
                            >
                              {editingDesignationIdx === idx ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingDesignationText}
                                    onChange={(e) => setEditingDesignationText(e.target.value)}
                                    className="w-28 px-2 py-0.5 rounded-full border border-[#0A2F25] bg-white text-xs focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedDesignation(idx)}
                                    className="p-0.5 rounded-full bg-emerald-600 text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingDesignationIdx(null)}
                                    className="p-0.5 rounded-full bg-gray-300 text-gray-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span>{desig}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingDesignationIdx(idx);
                                      setEditingDesignationText(desig);
                                    }}
                                    className="p-0.5 rounded-full hover:bg-[#0A2F25]/10 text-[#155e4a]"
                                    title="এডিট"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDesignation(desig)}
                                    className="p-0.5 rounded-full hover:bg-red-50 text-red-600"
                                    title="ডিলিট"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )
                        )}

                        {activeDesignations.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllDesignations((p) => !p)}
                            className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold hover:bg-[#D4AF37]/30 transition"
                          >
                            {showAllDesignations
                              ? 'কম দেখুন (See Less)'
                              : `আরও দেখুন (+${activeDesignations.length - 6}টি)`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#D4AF37]/50 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      অটো-অ্যাপ্রুভাল
                    </h3>
                    <p className="text-xs text-gray-600">
                      চালু থাকলে নতুন রেজিস্ট্রেশনকৃত সদস্যরা সাথে সাথে অনুমোদিত হয়ে যাবেন।
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={siteSettings.auto_approve}
                    onClick={handleToggleAutoApprove}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      siteSettings.auto_approve ? 'bg-[#155e4a]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        siteSettings.auto_approve ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Pending Requests */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4 flex items-center gap-2">
                    <span>পেন্ডিং রিকোয়েস্ট</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-english">
                      {pendingMembers.length}
                    </span>
                  </h3>

                  {pendingMembers.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 py-4 text-center">
                      কোনো পেন্ডিং রিকোয়েস্ট নেই।
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingMembers.map((pm) => (
                        <div
                          key={pm.id}
                          className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-sm sm:text-base text-[#0A2F25]">{pm.name}</p>
                            <p className="text-xs text-gray-600 font-english">
                              {pm.email} • {pm.mobile}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveMember(pm)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>অ্যাপ্রুভ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(pm)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ডিলিট</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Members Table */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                    অনুমোদিত সদস্য তালিকা ({approvedMembers.length})
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 bg-[#F4F7F5]">
                          <th className="py-3 px-3 rounded-tl-xl">সদস্য</th>
                          <th className="py-3 px-3">পদবী</th>
                          <th className="py-3 px-3">ক্রমিক</th>
                          <th className="py-3 px-3">রোল</th>
                          <th className="py-3 px-3 text-right rounded-tr-xl">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                        {approvedMembers.map((m) => {
                          const isSuper =
                            m.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                          const canManage = canActorManageMember(appUser, m);
                          return (
                            <tr key={m.id} className="hover:bg-gray-50/80">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold overflow-hidden shrink-0">
                                    {m.avatar_url ? (
                                      <img
                                        src={optimizeMedia(m.avatar_url)}
                                        alt={m.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      m.name.charAt(0)
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#0A2F25]">{m.name}</p>
                                    <p className="text-[11px] text-gray-500 font-english">{m.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-medium">
                                <select
                                  value={m.designation || (m.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}
                                  onChange={(e) => handleDesignationChange(m, e.target.value)}
                                  className="px-2.5 py-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#F4F7F5] hover:bg-white text-xs font-bold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25] transition cursor-pointer"
                                >
                                  {!activeDesignations.includes(
                                    m.designation || (m.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')
                                  ) && (
                                    <option value={m.designation}>
                                      {m.designation}
                                    </option>
                                  )}
                                  {activeDesignations.map((desig) => (
                                    <option key={desig} value={desig}>
                                      {desig}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-3 font-english">{m.sort_order ?? 100}</td>
                              <td className="py-3 px-3">
                                {isSuper ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>সুপার অ্যাডমিন</span>
                                  </span>
                                ) : !canManage ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#155e4a]/15 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#155e4a]" />
                                    <span>{m.role === 'admin' ? 'সিনিয়র অ্যাডমিন (সুরক্ষিত)' : 'সদস্য'}</span>
                                  </span>
                                ) : (
                                  <select
                                    value={m.role}
                                    onChange={(e) =>
                                      handleRoleChange(
                                        m,
                                        e.target.value === 'admin' ? 'admin' : 'member'
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#0A2F25]"
                                  >
                                    <option value="member">member</option>
                                    <option value="admin">admin</option>
                                  </select>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMember({ ...m })}
                                    className="p-2 rounded-xl bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] transition"
                                    title="সম্পাদনা"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {canManage && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMember(m)}
                                      className="p-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
                                      title="ডিলিট"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 3: জমা/খরচের হিসাব (`finances`)                       */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'finances' && (
              <div className="space-y-6">
                {/* 1. PROJECT-BASED TARGET FUND PROGRESS BAR CONTROLLER */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D4AF37]/55 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                        প্রজেক্ট ভিত্তিক টার্গেট ফান্ড প্রোগ্রেস বার কন্ট্রোলার
                      </h3>
                      <p className="text-xs text-gray-500">
                        হোমপেজে রিয়েল-টাইম প্রজেক্ট ফান্ড প্রোগ্রেস বার যুক্ত, এডিট বা অন/অফ (Show/Hide) করুন
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCampaignSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        প্রজেক্টের নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="যেমন: শীতবস্ত্র বিতরণ প্রজেক্ট ২০২৬"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        কত টাকা লাগবে (লক্ষ্যমাত্রা ৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={campaignForm.target_amount}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, target_amount: e.target.value }))}
                        placeholder="50000"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        জমা আছে / সংগৃহীত ফান্ড (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={campaignForm.collected_amount}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, collected_amount: e.target.value }))}
                        placeholder="25000"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold shadow hover:opacity-95 transition"
                      >
                        {campaignForm.id ? 'আপডেট করুন' : 'প্রজেক্ট যুক্ত করুন'}
                      </button>
                      {campaignForm.id && (
                        <button
                          type="button"
                          onClick={() =>
                            setCampaignForm({
                              id: '',
                              title: '',
                              description: '',
                              target_amount: '',
                              collected_amount: '',
                              is_active: true
                            })
                          }
                          className="px-3 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold"
                        >
                          বাতিল
                        </button>
                      )}
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক, যেমন: অসহায় মানুষদের মাঝে শীতবস্ত্র বিতরণের লক্ষ্যে বিশেষ তহবিল)"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                  </form>

                  {allCampaigns.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      {allCampaigns.map((camp) => {
                        const target = Math.max(1, Number(camp.target_amount) || 1);
                        const collected = Math.max(0, Number(camp.collected_amount) || 0);
                        const pct = Math.min(100, Math.round((collected / target) * 100));
                        return (
                          <div
                            key={camp.id}
                            className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#0A2F25]">{camp.title}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-english font-bold bg-[#0A2F25] text-[#F3D568]">
                                  {pct}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 font-english mt-0.5">
                                সংগৃহীত: ৳ {collected.toLocaleString('en-US')} / লক্ষ্যমাত্রা: ৳ {target.toLocaleString('en-US')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCampaignActive(camp)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                                  camp.is_active
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-gray-200 text-gray-700 border-gray-300'
                                }`}
                              >
                                {camp.is_active ? 'হোমপেজে চালু (On)' : 'হাইড করা (Off)'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCampaignForm({
                                    id: camp.id,
                                    title: camp.title,
                                    description: camp.description || '',
                                    target_amount: String(camp.target_amount),
                                    collected_amount: String(camp.collected_amount),
                                    is_active: camp.is_active
                                  })
                                }
                                className="p-1.5 rounded-full bg-white border border-gray-300 text-[#0A2F25] hover:border-[#D4AF37]"
                                title="এডিট"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                                title="ডিলিট"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. MONTHLY MEMBER CONTRIBUTION REMINDER MANAGER */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/45 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      সদস্যদের মাসিক ফান্ড রিমাইন্ডার তালিকা
                    </h3>
                    <p className="text-xs text-gray-500">
                      নির্দিষ্ট টাকার বাধ্যবাধকতা ছাড়াই সদস্যদের মাসিক ফান্ড প্রদানের আন্তরিক রিমাইন্ডার স্ট্যাটাস এখান থেকে নিয়ন্ত্রণ করুন
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[560px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 bg-[#F4F7F5]">
                          <th className="py-2.5 px-3 rounded-tl-xl">সদস্যের নাম</th>
                          <th className="py-2.5 px-3">বর্তমান অবস্থা</th>
                          <th className="py-2.5 px-3">রিমাইন্ডার সেট করুন</th>
                          <th className="py-2.5 px-3 text-right rounded-tr-xl">বার্তা কপি</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {approvedMembers.map((m) => {
                          const rem = getMemberMonthlyReminder(m);
                          return (
                            <tr key={m.id} className="hover:bg-gray-50/70">
                              <td className="py-2.5 px-3 font-bold text-[#0A2F25]">{m.name}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    rem.status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : rem.status === 'due_2m'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  <span>{rem.label}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={m.reminder_status || 'auto'}
                                  onChange={(e) =>
                                    handleSetMemberReminderStatus(m, e.target.value as any)
                                  }
                                  className="px-2.5 py-1 rounded-full border border-gray-300 bg-white text-xs font-semibold text-[#0A2F25]"
                                >
                                  <option value="auto">অটোমেটিক (হিসাব অনুযায়ী)</option>
                                  <option value="paid">এই মাসে দিয়েছেন</option>
                                  <option value="due_1m">১ মাসের রিমাইন্ডার</option>
                                  <option value="due_2m">গত ২ মাসের রিমাইন্ডার</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      navigator.clipboard.writeText(`${m.name} ${rem.message}`);
                                      showNotice('রিমাইন্ডার মেসেজটি কপি করা হয়েছে!', 'success');
                                    } catch {
                                      showNotice(rem.message, 'success');
                                    }
                                  }}
                                  className="px-3 py-1 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] font-bold text-[11px] transition"
                                >
                                  মেসেজ কপি করুন
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <form
                  onSubmit={handleFinanceSubmit}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      {financeForm.id ? 'হিসাব সম্পাদনা করুন' : 'নতুন জমা / খরচের হিসাব যুক্ত করুন'}
                    </h3>
                    {financeForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setFinanceForm({
                            id: '',
                            type: 'income',
                            amount: '',
                            memberuid: '',
                            month: '',
                            description: ''
                          })
                        }
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        সম্পাদনা বাতিল করুন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">ধরন *</label>
                      <select
                        value={financeForm.type}
                        onChange={(e) =>
                          setFinanceForm((p) => ({
                            ...p,
                            type: e.target.value === 'expense' ? 'expense' : 'income'
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-[#0A2F25]"
                      >
                        <option value="income">ফান্ড কালেকশন (+)</option>
                        <option value="expense">মানবিক খরচ (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        পরিমাণ (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={financeForm.amount}
                        onChange={(e) => setFinanceForm((p) => ({ ...p, amount: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    {financeForm.type === 'income' && (
                      <div>
                        <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                          সদস্য নির্বাচন করুন
                        </label>
                        <select
                          value={financeForm.memberuid}
                          onChange={(e) =>
                            setFinanceForm((p) => ({ ...p, memberuid: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                        >
                          <option value="">-- সদস্য নির্বাচন করুন --</option>
                          {approvedMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        মাস (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={financeForm.month}
                        onChange={(e) => setFinanceForm((p) => ({ ...p, month: e.target.value }))}
                        placeholder="মাসের নাম"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">বিবরণ *</label>
                    <input
                      type="text"
                      required
                      value={financeForm.description}
                      onChange={(e) =>
                        setFinanceForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="বিবরণ লিখুন..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{financeForm.id ? 'আপডেট সংরক্ষণ করুন' : 'হিসাব যুক্ত করুন'}</span>
                  </button>
                </form>

                {/* Finances Table */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                    জমা ও খরচের তালিকা ({finances.length})
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 bg-[#F4F7F5]">
                          <th className="py-3 px-3 rounded-tl-xl">ধরন</th>
                          <th className="py-3 px-3">বিবরণ ও সদস্য</th>
                          <th className="py-3 px-3">মাস</th>
                          <th className="py-3 px-3 text-right">পরিমাণ (৳)</th>
                          <th className="py-3 px-3 text-right rounded-tr-xl">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                        {finances.map((f) => (
                          <tr key={f.id} className="hover:bg-gray-50">
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  f.type === 'income'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {f.type === 'income' ? 'জমা (+)' : 'খরচ (-)'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#0A2F25]">{f.description}</p>
                              {f.type === 'income' && f.memberuid && (
                                <p className="text-[11px] text-gray-500">
                                  সদস্য: {getMemberNameByUid(f.memberuid)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-600">{f.month || '—'}</td>
                            <td
                              className={`py-3 px-3 text-right font-bold font-english ${
                                f.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {f.type === 'income' ? '+' : '-'} ৳{' '}
                              {Number(f.amount).toLocaleString('en-US')}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFinanceForm({
                                      id: f.id,
                                      type: f.type,
                                      amount: String(f.amount),
                                      memberuid: f.memberuid || '',
                                      month: f.month || '',
                                      description: f.description || ''
                                    })
                                  }
                                  className="p-2 rounded-xl bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] transition"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFinance(f)}
                                  className="p-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 4: কার্যক্রম আপডেট (`works`)                          */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'works' && (
              <div className="space-y-6">
                <form
                  ref={worksFormRef}
                  onSubmit={handleWorkSubmit}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      {workForm.id ? 'কার্যক্রম সম্পাদনা করুন' : 'নতুন কার্যক্রম যুক্ত করুন'}
                    </h3>
                    {workForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setWorkForm({
                            id: '',
                            title: '',
                            description: '',
                            category: '',
                            activity_date: '',
                            is_coming_soon: false,
                            media: []
                          })
                        }
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        সম্পাদনা বাতিল করুন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        কার্যক্রমের শিরোনাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={workForm.title}
                        onChange={(e) => setWorkForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="কার্যক্রমের শিরোনাম লিখুন"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        ক্যাটাগরি *
                      </label>
                      <input
                        type="text"
                        list="activity-categories-datalist"
                        required
                        value={workForm.category}
                        onChange={(e) => setWorkForm((p) => ({ ...p, category: e.target.value }))}
                        placeholder="শিক্ষা, স্বাস্থ্য, ত্রাণ"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                      <datalist id="activity-categories-datalist">
                        <option value="শিক্ষা" />
                        <option value="স্বাস্থ্য" />
                        <option value="ত্রাণ" />
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        কার্যক্রমের তারিখ
                      </label>
                      <input
                        type="date"
                        value={workForm.activity_date}
                        onChange={(e) =>
                          setWorkForm((p) => ({ ...p, activity_date: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div className="pt-2 sm:pt-5">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-[#F4F7F5] px-4 py-2.5 rounded-xl border border-[#D4AF37]/50">
                        <input
                          type="checkbox"
                          checked={workForm.is_coming_soon}
                          onChange={(e) =>
                            setWorkForm((p) => ({ ...p, is_coming_soon: e.target.checked }))
                          }
                          className="w-4 h-4 accent-[#0A2F25] rounded"
                        />
                        <span className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                          শীঘ্রই আসছে (Coming Soon)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      বিস্তারিত বিবরণ *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={workForm.description}
                      onChange={(e) =>
                        setWorkForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="কার্যক্রমের বিস্তারিত বিবরণ লিখুন..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  {/* Multi-file Image & Video Upload */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1.5">
                      ছবি ও ভিডিও আপলোড করুন (Cloudinary Folder: {CLOUDINARY_FOLDER_NAME})
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#155e4a]/40 hover:border-[#D4AF37] rounded-2xl p-5 bg-[#F4F7F5] cursor-pointer transition">
                      <Upload className="w-6 h-6 text-[#155e4a] mb-1.5" />
                      <span className="text-xs sm:text-sm font-semibold text-[#0A2F25]">
                        ছবি বা ভিডিও সিলেক্ট করুন
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleWorkMediaUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Uploaded Media Thumbnails with SVG Reorder Arrows and Remove */}
                    {workForm.media.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {workForm.media.map((url, idx) => (
                          <div
                            key={`${url}-${idx}`}
                            className="relative rounded-xl overflow-hidden border-2 border-[#D4AF37]/50 bg-[#0A2F25] h-28 flex flex-col justify-between"
                          >
                            {isMediaVideo(url) ? (
                              <video
                                src={optimizeMedia(url)}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={optimizeMedia(url)}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => removeWorkMedia(idx)}
                              aria-label="মুছে ফেলুন"
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 flex items-center justify-between text-white text-xs">
                              <button
                                type="button"
                                onClick={() => moveWorkMedia(idx, -1)}
                                disabled={idx === 0}
                                className="p-1 rounded bg-white/20 hover:bg-[#D4AF37] hover:text-[#0A2F25] disabled:opacity-30"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-english text-[11px]">#{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => moveWorkMedia(idx, 1)}
                                disabled={idx === workForm.media.length - 1}
                                className="p-1 rounded bg-white/20 hover:bg-[#D4AF37] hover:text-[#0A2F25] disabled:opacity-30"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{workForm.id ? 'কার্যক্রম আপডেট করুন' : 'কার্যক্রম প্রকাশ করুন'}</span>
                  </button>
                </form>

                {/* Existing Activities List */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                    প্রকাশিত কার্যক্রম সমূহ ({activities.length})
                  </h3>
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A2F25] shrink-0">
                            {act.media?.[0] ? (
                              isMediaVideo(act.media[0]) ? (
                                <video
                                  src={optimizeMedia(act.media[0])}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              ) : (
                                <img
                                  src={optimizeMedia(act.media[0])}
                                  alt={act.title}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#0A2F25] truncate">{act.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-white border text-[#155e4a] font-semibold">
                                {act.category}
                              </span>
                              {checkIsComingSoon(act.is_coming_soon, act.activity_date) ? (
                                <span className="text-amber-700 font-bold">শীঘ্রই আসছে</span>
                              ) : act.activity_date ? (
                                <span className="font-english">{act.activity_date}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditActivityClick(act)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold shadow"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>এডিট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ডিলিট</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 5: পরিকল্পনা সমূহ (`ideas`)                           */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'ideas' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                  জনসাধারণের পাঠানো পরিকল্পনা সমূহ ({ideas.length})
                </h3>
                {ideas.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">
                    এখনো কোনো পরিকল্পনা জমা পড়েনি।
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ideas.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-[#F4F7F5] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-[#0A2F25]">
                              {item.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white border border-gray-200 font-english text-[#155e4a]">
                              {item.mobile}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                            {item.idea}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(item)}
                          className="self-end sm:self-center inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ডিলিট</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 6: গ্যালারি (`gallery`)                               */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'gallery' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-3">
                    গ্যালারিতে নতুন ছবি বা ভিডিও আপলোড করুন
                  </h3>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#155e4a]/40 hover:border-[#D4AF37] rounded-2xl p-6 bg-[#F4F7F5] cursor-pointer transition">
                    <Upload className="w-7 h-7 text-[#155e4a] mb-2" />
                    <span className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                      এখানে ক্লিক করে ছবি বা ভিডিও সিলেক্ট করুন
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                    ওয়েবসাইটের সকল আপলোডকৃত গ্যালারি মিডিয়া ({allWebsiteMedia.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allWebsiteMedia.map((g) => (
                      <div
                        key={g.id}
                        className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 bg-[#0A2F25] h-40 group"
                      >
                        {isMediaVideo(g.url) ? (
                          <video
                            src={optimizeMedia(g.url)}
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={optimizeGalleryThumb(g.url)}
                            alt="গ্যালারি"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(g)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 7: সেটিংস (`settings`)                                */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'settings' && (
              <form
                onSubmit={handleSaveSiteSettings}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      সাইট সেটিংস ও ব্র্যান্ডিং
                    </h3>
                    <p className="text-xs text-gray-500">
                      লোগো, ফেভিকন, ট্যাগলাইন এবং হোমপেজ ব্যানার এখান থেকে আপলোড ও পরিবর্তন করুন
                    </p>
                  </div>
                </div>

                {/* Compact Upload-First Logo & Favicon Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foundation Logo Card */}
                  <div className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 space-y-2.5">
                    <div className="flex items-center gap-3.5">
                      <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-14 h-14" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                          ফাউন্ডেশন লোগো
                        </p>
                        <p className="text-[11px] text-gray-500 mb-2">
                          সরাসরি ছবি সিলেক্ট করে আপলোড করুন
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer hover:opacity-95 transition shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>লোগো আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setShowSettingsLinkBox((p) => ({ ...p, logo: !p.logo }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-600 hover:text-[#0A2F25] text-[11px] font-semibold transition"
                          >
                            লিংক অপশন
                          </button>
                        </div>
                      </div>
                    </div>
                    {showSettingsLinkBox.logo && (
                      <input
                        type="url"
                        placeholder="ইমেজ লিংক পেস্ট করুন (ঐচ্ছিক)"
                        value={siteSettings.logo_url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          lastSettingsSaveRef.current = Date.now();
                          setSiteSettings((p) => ({
                            ...p,
                            logo_url: val,
                            favicon_url: p.favicon_url || val
                          }));
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    )}
                  </div>

                  {/* Browser Favicon Card */}
                  <div className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 space-y-2.5">
                    <div className="flex items-center gap-3.5">
                      <WhiteCircularLogo
                        logoUrl={siteSettings.favicon_url || siteSettings.logo_url}
                        sizeClass="w-14 h-14"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                          ব্রাউজার ফেভিকন
                        </p>
                        <p className="text-[11px] text-gray-500 mb-2">
                          ব্রাউজার ট্যাবের আইকন পরিবর্তন করুন
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#155e4a] text-white text-xs font-bold cursor-pointer hover:opacity-95 transition shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>ফেভিকন আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFaviconUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...siteSettings, favicon_url: siteSettings.logo_url };
                              persistSettingsInstant(next);
                              showNotice('লোগোটিকেই ফেভিকন হিসেবে সেট করা হয়েছে!', 'success');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D4AF37] text-[#0A2F25] text-[11px] font-bold hover:bg-[#D4AF37]/20 transition"
                          >
                            লোগো ব্যবহার করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Site Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      সাইটের নাম
                    </label>
                    <input
                      type="text"
                      value={siteSettings.site_name}
                      onChange={(e) => {
                        lastSettingsSaveRef.current = Date.now();
                        setSiteSettings((p) => ({ ...p, site_name: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      ট্যাগলাইন
                    </label>
                    <input
                      type="text"
                      value={siteSettings.tagline}
                      onChange={(e) => {
                        lastSettingsSaveRef.current = Date.now();
                        setSiteSettings((p) => ({ ...p, tagline: e.target.value }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                    উপরের স্ক্রলিং টপ বার টেক্সট
                  </label>
                  <input
                    type="text"
                    value={siteSettings.announcement_text}
                    onChange={(e) => {
                      lastSettingsSaveRef.current = Date.now();
                      setSiteSettings((p) => ({ ...p, announcement_text: e.target.value }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                  />
                </div>

                {/* Compact 4 Homepage Banner Upload Cards */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-2">
                    হোমপেজ ব্যানার (৪টি স্লট)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const currentBanner = siteSettings.banners?.[slotIdx] || '';
                      return (
                        <div
                          key={slotIdx}
                          className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0A2F25]">
                              ব্যানার #{slotIdx + 1}
                            </span>
                            {currentBanner && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextBanners = [...(siteSettings.banners || ['', '', '', ''])];
                                  nextBanners[slotIdx] = '';
                                  persistSettingsInstant({ ...siteSettings, banners: nextBanners });
                                }}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {currentBanner ? (
                            <div className="w-full h-20 rounded-xl overflow-hidden bg-[#0A2F25] border border-[#D4AF37]/40">
                              <img
                                key={currentBanner}
                                src={optimizeMedia(currentBanner)}
                                alt={`Banner ${slotIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-20 rounded-xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}

                          <label className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#155e4a] hover:bg-[#0A2F25] text-white text-xs font-semibold cursor-pointer transition">
                            <Upload className="w-3 h-3" />
                            <span>{currentBanner ? 'পরিবর্তন' : 'আপলোড'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleBannerUpload(slotIdx, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সেটিংস সংরক্ষণ করুন</span>
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 1: আমার জমা (`my_account`)                  */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'my_account' && (
              <div className="space-y-6">
                {(() => {
                  const myDeposits = finances.filter(
                    (f) => f.type === 'income' && f.memberuid === appUser.id
                  );
                  const myTotal = myDeposits.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                  return (
                    <>
                      {(() => {
                        const myRem = getMemberMonthlyReminder(appUser);
                        return (
                          <div
                            className={`rounded-3xl p-4 sm:p-5 border-2 shadow-sm flex items-start gap-3 ${
                              myRem.status === 'paid'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : myRem.status === 'due_2m'
                                ? 'bg-red-50 border-red-300 text-red-900'
                                : 'bg-amber-50 border-[#D4AF37] text-[#0A2F25]'
                            }`}
                          >
                            {myRem.status === 'paid' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs sm:text-sm font-bold mb-0.5">{myRem.label}</p>
                              <p className="text-xs sm:text-sm leading-relaxed">{myRem.message}</p>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-6 border-2 border-[#D4AF37] shadow-lg">
                        <span className="text-xs sm:text-sm font-semibold text-[#F3D568]">
                          আমার মোট জমা
                        </span>
                        <p className="text-3xl sm:text-4xl font-bold font-english mt-1">
                          ৳ {myTotal.toLocaleString('en-US')}
                        </p>
                      </div>

                      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm overflow-hidden">
                        <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                          আমার জমার তালিকা
                        </h3>
                        {myDeposits.length === 0 ? (
                          <p className="text-sm text-gray-500 py-6 text-center">
                            আপনার নামে এখনো কোনো জমার রেকর্ড যুক্ত হয়নি।
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 bg-[#F4F7F5]">
                                  <th className="py-3 px-3 rounded-tl-xl">মাস</th>
                                  <th className="py-3 px-3">বিবরণ</th>
                                  <th className="py-3 px-3 text-right rounded-tr-xl">পরিমাণ (৳)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                                {myDeposits.map((d) => (
                                  <tr key={d.id}>
                                    <td className="py-3 px-3 font-medium">{d.month || '—'}</td>
                                    <td className="py-3 px-3">{d.description}</td>
                                    <td className="py-3 px-3 text-right font-bold text-emerald-700 font-english">
                                      + ৳ {Number(d.amount).toLocaleString('en-US')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 3: ফান্ড (`foundation_funds`)                */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'foundation_funds' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-6 border-2 border-[#D4AF37] shadow-lg">
                  <span className="text-sm font-semibold text-[#F3D568]">বর্তমান ফান্ড</span>
                  <p className="text-2xl sm:text-3xl font-bold font-english mt-2">
                    ৳ {currentBalance.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm">
                  <span className="text-sm font-bold text-emerald-800">মোট কালেকশন</span>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-english mt-2">
                    ৳ {totalIncome.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-sm">
                  <span className="text-sm font-bold text-red-700">মোট খরচ</span>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 font-english mt-2">
                    ৳ {totalExpense.toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 4: খরচ (`expense_history`)                  */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'expense_history' && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm overflow-hidden">
                <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                  ফাউন্ডেশনের খরচের তালিকা
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-gray-600 bg-[#F4F7F5]">
                        <th className="py-3 px-3 rounded-tl-xl">মাস</th>
                        <th className="py-3 px-3">খরচের বিবরণ</th>
                        <th className="py-3 px-3 text-right rounded-tr-xl">পরিমাণ (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                      {finances
                        .filter((f) => f.type === 'expense')
                        .map((exp) => (
                          <tr key={exp.id}>
                            <td className="py-3 px-3">{exp.month || '—'}</td>
                            <td className="py-3 px-3 font-medium text-[#0A2F25]">
                              {exp.description}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-red-600 font-english">
                              - ৳ {Number(exp.amount).toLocaleString('en-US')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SHARED TAB: আমার প্রোফাইল / প্রোফাইল আপডেট (`my_profile`)       */}
            {/* ============================================================== */}
            {activeTab === 'my_profile' && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-5 sm:p-7 border border-[#D4AF37]/40 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2F25]">আমার প্রোফাইল ও বিস্তারিত তথ্য</h3>
                  <p className="text-xs text-gray-500">
                    আপনার প্রোফাইল ছবি, রক্তের গ্রুপ, মোবাইল নাম্বার, ইমেইল ও পরিচয় এখান থেকে যুক্ত বা আপডেট করুন
                  </p>
                </div>

                <form onSubmit={handleSaveMyProfile} className="space-y-4">
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-[#D4AF37] shrink-0">
                      {appUser.avatar_url ? (
                        <img
                          src={optimizeMedia(appUser.avatar_url)}
                          alt={appUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        appUser.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0A2F25] mb-1">প্রোফাইল ছবি (অটো-কম্প্রেসড)</p>
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer hover:opacity-95 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি পরিবর্তন করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMyProfileAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">পূর্ণ নাম *</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        রক্তের গ্রুপ (Blood Group)
                      </label>
                      <select
                        value={profileBloodGroup}
                        onChange={(e) => setProfileBloodGroup(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 bg-white text-sm font-bold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        বাংলাদেশি মোবাইল নাম্বার
                      </label>
                      <input
                        type="tel"
                        value={profileMobile}
                        onChange={(e) => setProfileMobile(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        ইমেইল অ্যাড্রেস
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      সংক্ষিপ্ত পরিচয় / পেশা / ঠিকানা
                    </label>
                    <input
                      type="text"
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      placeholder="যেমন: শিক্ষার্থী / ব্যবসায়ী, চট্টগ্রাম"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)
                    </label>
                    <input
                      type="url"
                      value={profileFbUrl}
                      onChange={(e) => setProfileFbUrl(e.target.value)}
                      placeholder="https://facebook.com/username"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে দিন)
                    </label>
                    <input
                      type="password"
                      value={profileNewPassword}
                      onChange={(e) => setProfileNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    প্রোফাইল তথ্য সংরক্ষণ করুন
                  </button>
                </form>

                {/* Red Logout Button at the bottom */}
                <div className="pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>একাউন্ট থেকে লগআউট করুন</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 4. ACTIVITY DETAIL GLASSMORPHISM MODAL (`ActivitySlider`)            */}
      {/* ==================================================================== */}
      {selectedActivityModal && (
        <div
          onClick={() => setSelectedActivityModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0A2F25]/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full p-4 sm:p-6 border-2 border-[#D4AF37] shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#0A2F25] text-[#F3D568]">
                  {selectedActivityModal.category}
                </span>
                {checkIsComingSoon(
                  selectedActivityModal.is_coming_soon,
                  selectedActivityModal.activity_date
                ) ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-[#0A2F25]">
                    শীঘ্রই আসছে
                  </span>
                ) : selectedActivityModal.activity_date ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[#0A2F25] font-english">
                    {selectedActivityModal.activity_date}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivityModal(null)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-600 hover:text-white flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ActivitySlider
              mediaList={selectedActivityModal.media}
              title={selectedActivityModal.title}
            />

            <h3 className="text-lg sm:text-2xl font-bold text-[#0A2F25] mt-5 mb-2 leading-snug">
              {selectedActivityModal.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {selectedActivityModal.description}
            </p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. GALLERY LIGHTBOX MODAL                                            */}
      {/* ==================================================================== */}
      {lightboxMediaUrl && (
        <div
          onClick={() => setLightboxMediaUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-3xl overflow-hidden border-2 border-[#D4AF37] bg-[#061D17] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxMediaUrl(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            {isMediaVideo(lightboxMediaUrl) ? (
              <video
                src={optimizeMedia(lightboxMediaUrl)}
                controls
                autoPlay
                className="w-full max-h-[82vh] object-contain"
              />
            ) : (
              <img
                src={optimizeMedia(lightboxMediaUrl)}
                alt="গ্যালারি প্রিভিউ"
                className="w-full max-h-[82vh] object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. EDIT MEMBER MODAL (ADMIN)                                         */}
      {/* ==================================================================== */}
            {/* PUBLIC MEMBER DETAIL POPUP MODAL (`selectedMemberModal`) */}
      {selectedMemberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMemberModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-[#D4AF37] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] p-6 text-center text-white relative">
              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] mx-auto mb-3 shadow-xl">
                {selectedMemberModal.avatar_url ? (
                  <img
                    src={optimizeMedia(selectedMemberModal.avatar_url)}
                    alt={selectedMemberModal.name}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-3xl font-bold">
                    {selectedMemberModal.name.charAt(0)}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white">{selectedMemberModal.name}</h3>
              <span className="mt-1.5 inline-flex items-center px-4 py-1 rounded-full bg-[#D4AF37] text-[#0A2F25] text-xs font-bold">
                {!selectedMemberModal.designation || selectedMemberModal.designation === 'অ্যাডমিন'
                  ? 'সাধারণ সদস্য'
                  : selectedMemberModal.designation}
              </span>
            </div>

            <div className="p-6 space-y-3.5 text-sm">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                <span className="text-xs font-bold text-gray-600">রক্তের গ্রুপ (Blood Group)</span>
                {selectedMemberModal.blood_group ? (
                  <span className="px-3 py-0.5 rounded-full bg-red-600 text-white font-english font-bold text-xs">
                    {selectedMemberModal.blood_group}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">যুক্ত করা হয়নি</span>
                )}
              </div>

              {selectedMemberModal.bio && (
                <div className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                  <span className="block text-xs font-bold text-gray-600 mb-1">পরিচয় ও ঠিকানা</span>
                  <p className="text-xs sm:text-sm font-medium text-[#0A2F25]">
                    {selectedMemberModal.bio}
                  </p>
                </div>
              )}

              {selectedMemberModal.mobile && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                  <span className="text-xs font-bold text-gray-600">মোবাইল</span>
                  <span className="font-english font-semibold text-xs text-[#0A2F25]">
                    {selectedMemberModal.mobile}
                  </span>
                </div>
              )}

              {formatDisplayEmail(selectedMemberModal.email) && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                  <span className="text-xs font-bold text-gray-600">ইমেইল</span>
                  <span className="font-english font-semibold text-xs text-[#0A2F25] truncate max-w-[200px]">
                    {formatDisplayEmail(selectedMemberModal.email)}
                  </span>
                </div>
              )}

              {selectedMemberModal.fb_url && (
                <a
                  href={selectedMemberModal.fb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-full bg-[#0A2F25] text-[#F3D568] font-bold text-xs flex items-center justify-center gap-2 shadow hover:opacity-95 transition"
                >
                  <Facebook className="w-4 h-4" />
                  <span>ফেসবুক প্রোফাইল দেখুন</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                className="w-full py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0A2F25] font-bold text-xs transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEditedMember}
            className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#D4AF37] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0A2F25]">সদস্যের তথ্য সম্পাদনা</h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold overflow-hidden border border-[#D4AF37]">
                {editingMember.avatar_url ? (
                  <img
                    src={optimizeMedia(editingMember.avatar_url)}
                    alt={editingMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  editingMember.name.charAt(0)
                )}
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer">
                <span>ছবি আপলোড করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditMemberAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">নাম</label>
              <input
                type="text"
                required
                value={editingMember.name}
                onChange={(e) =>
                  setEditingMember((prev) => (prev ? { ...prev, name: e.target.value } : null))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">পদবি / ক্যাটাগরি নির্বাচন করুন</label>
              <select
                value={editingMember.designation || 'সাধারণ সদস্য'}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, designation: e.target.value } : null
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-[#0A2F25]"
              >
                {activeDesignations.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  রক্তের গ্রুপ
                </label>
                <select
                  value={editingMember.blood_group || ''}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, blood_group: e.target.value } : null
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-[#0A2F25]"
                >
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  ক্রমিক নাম্বার
                </label>
                <input
                  type="number"
                  value={editingMember.sort_order}
                  onChange={(e) =>
                    setEditingMember((prev) =>
                      prev ? { ...prev, sort_order: Number(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-english"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                সংক্ষিপ্ত পরিচয় / পেশা / ঠিকানা
              </label>
              <input
                type="text"
                value={editingMember.bio || ''}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, bio: e.target.value } : null
                  )
                }
                placeholder="যেমন: সমাজসেবক, চট্টগ্রাম"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* ==================================================================== */}
      {/* 7. FOOTER (White Circular Logo + FB Link + Developer Credit)         */}
      {/* ==================================================================== */}
      <footer className="bg-[#0A2F25] text-white border-t-2 border-[#D4AF37] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-12 h-12" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#F3D568]">
                  {siteSettings.site_name || DEFAULT_SITE_NAME}
                </h3>
                <p className="text-xs text-gray-300">{siteSettings.tagline || DEFAULT_TAGLINE}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={FOUNDATION_FB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#124A3B] hover:bg-[#155e4a] text-[#F3D568] border border-[#D4AF37]/50 text-xs sm:text-sm font-semibold transition shadow"
              >
                <Facebook className="w-4 h-4" />
                <span>অফিসিয়াল ফেসবুক পেজ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300 text-center">
            <p>
              © {new Date().getFullYear()} {siteSettings.site_name || DEFAULT_SITE_NAME}। সর্বস্বত্ব
              সংরক্ষিত।
            </p>
            <a
              href={DEVELOPER_FB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-english font-bold tracking-wider text-[#D4AF37] hover:text-[#F3D568] inline-flex items-center gap-1.5 transition"
            >
              <span>{DEVELOPER_CREDIT_TEXT}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
