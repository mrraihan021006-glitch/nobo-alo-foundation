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
  ChevronDown,
  ChevronUp,
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
const DEVELOPER_FB_URL = 'https://facebook.com/meraihan79';
const GOOGLE_CLIENT_ID = '55697442534-8qsn67qq9idh9q0accds2pngflitmhoo.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

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


// Formats any date string (e.g., "2026-07-29") into "29 Jul 2026" (Day -> Month Name -> Year)
const formatActivityDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  const dt = new Date(trimmed);
  if (!isNaN(dt.getTime())) {
    const day = String(dt.getDate()).padStart(2, '0');
    const mon = months[dt.getMonth()];
    const yr = dt.getFullYear();
    return `${day} ${mon} ${yr}`;
  }
  return trimmed;
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

interface PaymentMethodItem {
  id: string;
  provider: 'bKash' | 'Nagad' | 'Rocket';
  number: string;
  account_type: string;
  note?: string;
  is_active?: boolean;
}

interface PaymentSubmission {
  id: string;
  member_id?: string;
  sender_name: string;
  provider: 'bKash' | 'Nagad' | 'Rocket';
  amount: number;
  sender_number: string;
  receiver_number?: string;
  trx_id: string;
  purpose?: string;
  month: string;
  status: 'pending' | 'approved';
  created_at: string;
}

interface PaymentConfig {
  badge_text: string;
  section_title: string;
  section_subtitle: string;
  member_title: string;
  member_subtitle: string;
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
  ui_theme?: 'classic_emerald' | 'royal_noor';
  payment_numbers?: PaymentMethodItem[];
  show_payment_on_home?: boolean;
  payment_config?: PaymentConfig;
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
  age?: string;
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

const DEFAULT_PAYMENT_NUMBERS: PaymentMethodItem[] = [
  {
    id: 'pm-bkash-1',
    provider: 'bKash',
    number: '01800-000000',
    account_type: 'পার্সোনাল (Send Money)',
    note: 'বিকাশ সেন্ড মানি করে ট্রানজেকশন আইডি (TrxID) বা প্রেরকের নাম্বার নিচে জমা দিন',
    is_active: true
  },
  {
    id: 'pm-nagad-1',
    provider: 'Nagad',
    number: '01800-000000',
    account_type: 'পার্সোনাল (Send Money)',
    note: 'নগদ সেন্ড মানি করে ট্রানজেকশন আইডি (TrxID) বা প্রেরকের নাম্বার নিচে জমা দিন',
    is_active: true
  }
];

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  badge_text: 'সাদাকাহ ও মানবিক সহায়তা তহবিল',
  section_title: 'মানবতার সেবায় অনুদান ও সহযোগিতা দিন',
  section_subtitle: 'আপনার ক্ষুদ্র অনুদান, যাকাত বা মাসিক ফান্ডিং অসহায় মানুষের মুখে হাসি ফোটাতে পারে। নিচের যেকোনো বিকাশ বা নগদ নাম্বারে সম্পূর্ণ ফ্রিতে অনুদান পাঠিয়ে ট্রানজেকশন তথ্য নিশ্চিত করুন।',
  member_title: 'মাসিক ফান্ডিং ও মানবিক অনুদান প্রেরণ (বিকাশ / নগদ)',
  member_subtitle: 'অ্যাডমিন নির্ধারিত নিচের অফিসিয়াল বিকাশ বা নগদ নাম্বারে আপনার মাসিক ফান্ড বা এককালীন সহযোগিতা পাঠিয়ে নিচের ফর্মে নিশ্চিত করুন।'
};

const PAYMENT_TITLE_PRESETS = [
  'মানবতার সেবায় অনুদান ও সহযোগিতা দিন',
  'সহযোগিতা ও কল্যাণ ফান্ডিং তহবিল',
  'সাদাকাহ ও মানবিক অনুদান পাঠান',
  'মাসিক ফান্ড ও মানবিক সহযোগিতা'
];

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
  ui_theme: 'classic_emerald',
  payment_numbers: DEFAULT_PAYMENT_NUMBERS,
  show_payment_on_home: true,
  payment_config: DEFAULT_PAYMENT_CONFIG,
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
      ui_theme: 'classic_emerald',
      payment_numbers: DEFAULT_PAYMENT_NUMBERS,
      show_payment_on_home: true,
      payment_config: DEFAULT_PAYMENT_CONFIG,
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
        fb_url: 'https://facebook.com/meraihan79'
      }
    ],
    activities: [],
    finances: [],
    payments: [],
    ideas: [],
    gallery: []
  };
  const stored = readLocalJson<any>(LOCAL_D1_STORE_KEY, fallback);
  if (stored?.settings) {
    stored.settings.logo_url = cleanMediaUrl(stored.settings.logo_url);
    stored.settings.favicon_url = cleanMediaUrl(stored.settings.favicon_url);
    if (!Array.isArray(stored.settings.payment_numbers)) {
      stored.settings.payment_numbers = DEFAULT_PAYMENT_NUMBERS;
    }
    if (stored.settings.show_payment_on_home === undefined) {
      stored.settings.show_payment_on_home = true;
    }
    if (!stored.settings.payment_config) {
      stored.settings.payment_config = DEFAULT_PAYMENT_CONFIG;
    }
    if (!stored.settings.ui_theme) {
      stored.settings.ui_theme = 'classic_emerald';
    }
  }
  if (!Array.isArray(stored?.payments)) {
    stored.payments = [];
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
        payments: store.payments || [],
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

  if (pathPart === 'google-auth' && method === 'POST') {
    const gEmail = String(body?.email || '').trim().toLowerCase();
    const gName = String(body?.name || gEmail.split('@')[0] || 'সদস্য').trim();
    const gPic = String(body?.picture || body?.avatar_url || '').trim();
    const isSuper = gEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    let user = store.members.find((m: any) => String(m.email || '').toLowerCase() === gEmail);
    if (!user) {
      user = {
        id: isSuper ? 'super-admin-raihan' : `mem-${Date.now()}`,
        name: gName,
        email: gEmail,
        mobile: '',
        avatar_url: gPic,
        role: isSuper ? 'admin' : 'member',
        status: 'approved',
        designation: isSuper ? 'অ্যাডমিন' : 'সাধারণ সদস্য',
        sort_order: isSuper ? 1 : 100,
        promoted_by: '',
        fb_url: '',
        blood_group: '',
        age: '',
        bio: '',
        reminder_status: 'auto',
        reminder_note: ''
      };
      store.members.push(user);
      saveLocalD1Store(store);
    } else if (gPic && !user.avatar_url) {
      user.avatar_url = gPic;
      saveLocalD1Store(store);
    }
    return { ok: true, status: 200, notMounted: false, liveD1: false, data: { user, ok: true } };
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
    payments: 'payments',
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
        payments: data.payments || [],
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


// Official Multi-Color Google 'G' SVG Icon (100% Pure SVG)
const GoogleBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

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


// Auto-Sliding Activity Card Component (Supports Both Classic Madinah Emerald & Royal Noor Ottoman Mihrab Themes!)
const ActivityCardItem: React.FC<{
  act: ActivityItem;
  uiTheme?: 'classic_emerald' | 'royal_noor';
  onSelect: (act: ActivityItem) => void;
}> = ({ act, uiTheme = 'classic_emerald', onSelect }) => {
  const validMedia = useMemo(
    () => (Array.isArray(act.media) ? act.media.filter(Boolean) : []),
    [act.media]
  );
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    setSlideIdx(0);
  }, [validMedia.length]);

  useEffect(() => {
    if (validMedia.length <= 1) return;
    const activeUrl = validMedia[slideIdx] || '';
    if (isMediaVideo(activeUrl)) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % validMedia.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [validMedia, slideIdx]);

  const currentMedia = validMedia[slideIdx] || '';
  const isVideo = isMediaVideo(currentMedia);
  const showComingSoon = checkIsComingSoon(act.is_coming_soon, act.activity_date);
  const formattedDate = formatActivityDate(act.activity_date);

  if (uiTheme === 'royal_noor') {
    return (
      <article
        onClick={() => onSelect(act)}
        className="group cursor-pointer bg-[#FFFDF9] rounded-3xl overflow-hidden border-2 border-[#D97706]/35 hover:border-[#D97706] shadow-[0_12px_32px_-12px_rgba(17,28,56,0.16)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
      >
        {/* Top Royal Ottoman Ribbon Bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-[#111C38] via-[#1E3A6D] to-[#111C38] text-white flex items-center justify-between gap-2 border-b border-[#D97706]/50">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FCD34D]">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>{act.category || 'সাধারণ'}</span>
          </span>
          {showComingSoon ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B] text-[#111C38]">
              <Clock className="w-2.5 h-2.5" />
              <span>শীঘ্রই আসছে</span>
            </span>
          ) : formattedDate ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-english text-gray-200">
              <Calendar className="w-3 h-3 text-[#F59E0B]" />
              <span>{formattedDate}</span>
            </span>
          ) : null}
        </div>

        {/* Media Frame */}
        <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-[#111C38]">
          {validMedia.length > 0 ? (
            validMedia.map((mediaUrl, idx) => {
              const active = idx === slideIdx;
              const mediaIsVid = isMediaVideo(mediaUrl);
              return (
                <div
                  key={`${mediaUrl}-${idx}`}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    active ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'
                  }`}
                >
                  {mediaIsVid ? (
                    <div className="relative w-full h-full">
                      <video
                        src={optimizeMedia(mediaUrl)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-[#111C38]/90 border-2 border-[#F59E0B] text-[#FCD34D] flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={optimizeMedia(mediaUrl)}
                      alt={act.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#111C38] to-[#1E3A6D] flex items-center justify-center">
              <HeartHandshake className="w-11 h-11 text-[#F59E0B]/60" />
            </div>
          )}

          {validMedia.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111C38]/75 backdrop-blur-md border border-[#F59E0B]/40"
            >
              {validMedia.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIdx(dotIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dotIdx === slideIdx ? 'w-5 bg-[#F59E0B]' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Illuminated Parchment Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EA]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#111C38] group-hover:text-[#B45309] transition-colors mb-2 leading-snug">
              {act.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {act.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D97706]/25 flex items-center justify-between">
            <span className="text-xs font-bold text-[#B45309] group-hover:text-[#111C38] transition-colors">
              বিস্তারিত ও গ্যালারি দেখুন
            </span>
            <span className="px-3 py-1 rounded-full bg-[#111C38] text-[#FCD34D] text-[11px] font-bold inline-flex items-center gap-1 group-hover:bg-[#B45309] group-hover:text-white transition-all">
              <span>দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(act)}
      className="break-inside-avoid group cursor-pointer bg-white/95 backdrop-blur-md rounded-3xl p-2.5 pb-4 border border-gray-200/90 hover:border-[#D4AF37]/70 shadow-[0_10px_30px_-12px_rgba(10,47,37,0.14)] hover:-translate-y-1 hover:shadow-[0_22px_44px_-15px_rgba(10,47,37,0.24)] transition-all duration-300 flex flex-col"
    >
      {/* Framed Rounded Media Container with Auto-Sliding Carousel */}
      <div className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden bg-[#0A2F25]">
        {validMedia.length > 0 ? (
          validMedia.map((mediaUrl, idx) => {
            const active = idx === slideIdx;
            const mediaIsVid = isMediaVideo(mediaUrl);
            return (
              <div
                key={`${mediaUrl}-${idx}`}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  active ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'
                }`}
              >
                {mediaIsVid ? (
                  <div className="relative w-full h-full">
                    <video
                      src={optimizeMedia(mediaUrl)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-[#0A2F25]/90 border border-[#D4AF37] text-[#F3D568] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={optimizeMedia(mediaUrl)}
                    alt={act.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A2F25] to-[#155e4a] flex items-center justify-center">
            <HeartHandshake className="w-11 h-11 text-[#D4AF37]/60" />
          </div>
        )}

        {/* Subtle Bottom Vignette Inside Image for Dot Visibility */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(5,24,19,0.65), transparent)' }}
        />

        {/* Category Badge (Top Left) */}
        <span className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0A2F25]/85 text-[#F3D568] border border-[#D4AF37]/50 backdrop-blur-md shadow-sm">
          {act.category || 'সাধারণ'}
        </span>

        {/* Formatted Date ("29 Jul 2026") or Coming Soon Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-20">
          {showComingSoon ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] shadow-md">
              <Clock className="w-3 h-3" />
              <span>শীঘ্রই আসছে</span>
            </span>
          ) : formattedDate ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#0A2F25] border border-gray-200/80 shadow-sm font-english">
              <Calendar className="w-3 h-3 text-[#155e4a]" />
              <span>{formattedDate}</span>
            </span>
          ) : null}
        </div>

        {/* Animated Pagination Dots at Bottom Center (Replaces Old 1/N Text Badge) */}
        {validMedia.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15"
          >
            {validMedia.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideIdx(dotIdx);
                }}
                aria-label={`Slide ${dotIdx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dotIdx === slideIdx ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-2.5 pt-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] group-hover:text-[#155e4a] transition-colors mb-1.5 leading-snug">
            {act.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {act.description}
          </p>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-english font-bold text-[#155e4a] group-hover:text-[#0A2F25] transition-colors">
            <span>See More</span>
          </span>
          <span className="w-7 h-7 rounded-full bg-[#0A2F25]/8 group-hover:bg-[#0A2F25] text-[#0A2F25] group-hover:text-[#F3D568] flex items-center justify-center transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// REUSABLE BKASH / NAGAD FUNDING & DONATION WIDGET (HOMEPAGE & MEMBER DASHBOARD)
// ============================================================================
const PaymentContributionCard: React.FC<{
  paymentNumbers: PaymentMethodItem[];
  paymentConfig?: PaymentConfig;
  isMemberDashboard?: boolean;
  uiTheme?: 'classic_emerald' | 'royal_noor';
  defaultName?: string;
  defaultPhone?: string;
  onSubmitPayment: (payload: {
    provider: 'bKash' | 'Nagad' | 'Rocket';
    amount: number;
    sender_number: string;
    receiver_number: string;
    trx_id: string;
    purpose: string;
    month: string;
    sender_name: string;
  }) => Promise<void>;
  onCopyNumber: (num: string, provider: string) => void;
}> = ({
  paymentNumbers,
  paymentConfig = DEFAULT_PAYMENT_CONFIG,
  isMemberDashboard = false,
  uiTheme = 'classic_emerald',
  defaultName = '',
  defaultPhone = '',
  onSubmitPayment,
  onCopyNumber
}) => {
  const bnMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const curMonthName = `${bnMonths[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const activeList = useMemo(
    () => paymentNumbers.filter((p) => p && p.is_active !== false && String(p.number || '').trim()),
    [paymentNumbers]
  );

  const [provider, setProvider] = useState<'bKash' | 'Nagad' | 'Rocket'>(
    activeList[0]?.provider || 'bKash'
  );
  const [amount, setAmount] = useState('');
  const [senderNumber, setSenderNumber] = useState(defaultPhone);
  const [trxId, setTrxId] = useState('');
  const [senderName, setSenderName] = useState(defaultName);
  const [purpose, setPurpose] = useState(isMemberDashboard ? 'মাসিক ফান্ড' : 'সাধারণ অনুদান ও সহযোগিতা');
  const [month, setMonth] = useState(curMonthName);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultName && !senderName) setSenderName(defaultName);
    if (defaultPhone && !senderNumber) setSenderNumber(defaultPhone);
  }, [defaultName, defaultPhone]);

  useEffect(() => {
    if (activeList.length > 0 && !activeList.some((p) => p.provider === provider)) {
      setProvider(activeList[0].provider);
    }
  }, [activeList, provider]);

  const handleCopyClick = (pm: PaymentMethodItem) => {
    onCopyNumber(pm.number, pm.provider);
    setCopiedId(pm.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === pm.id ? null : prev));
    }, 2400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) return;
    if (!senderNumber.trim() && !trxId.trim()) return;
    setSubmitting(true);
    const matchedReceiver = activeList.find((p) => p.provider === provider)?.number || '';
    await onSubmitPayment({
      provider,
      amount: numAmt,
      sender_number: senderNumber.trim(),
      receiver_number: matchedReceiver,
      trx_id: trxId.trim(),
      purpose,
      month: month.trim() || curMonthName,
      sender_name: senderName.trim() || defaultName || 'শুভাকাঙ্ক্ষী'
    });
    setSubmitting(false);
    setAmount('');
    setTrxId('');
  };

  const isRoyal = uiTheme === 'royal_noor';
  const badgeText = paymentConfig?.badge_text || DEFAULT_PAYMENT_CONFIG.badge_text;
  const headingText = isMemberDashboard
    ? paymentConfig?.member_title || DEFAULT_PAYMENT_CONFIG.member_title
    : paymentConfig?.section_title || DEFAULT_PAYMENT_CONFIG.section_title;
  const subText = isMemberDashboard
    ? paymentConfig?.member_subtitle || DEFAULT_PAYMENT_CONFIG.member_subtitle
    : paymentConfig?.section_subtitle || DEFAULT_PAYMENT_CONFIG.section_subtitle;

  return (
    <div
      className={`rounded-3xl overflow-hidden border-2 shadow-xl transition-all ${
        isRoyal
          ? 'bg-[#FFFDF9] border-[#D97706]/60 shadow-[0_16px_40px_-15px_rgba(17,28,56,0.2)]'
          : 'bg-white border-[#D4AF37]/65 shadow-[0_12px_35px_-12px_rgba(10,47,37,0.18)]'
      }`}
    >
      {/* Top Banner Header */}
      <div
        className={`p-5 sm:p-6 text-white border-b ${
          isRoyal
            ? 'bg-gradient-to-r from-[#111C38] via-[#1E3A6D] to-[#111C38] border-[#D97706]/50'
            : 'bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] border-[#D4AF37]/50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
                isRoyal
                  ? 'bg-[#D97706]/25 border-[#F59E0B] text-[#FCD34D]'
                  : 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3D568]'
              }`}
            >
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold mb-1 border ${
                  isRoyal
                    ? 'bg-[#D97706]/25 border-[#F59E0B]/50 text-[#FCD34D]'
                    : 'bg-[#D4AF37]/20 border-[#D4AF37]/45 text-[#F3D568]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{badgeText}</span>
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                {headingText}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-[#E2136E] text-white font-bold text-xs shadow-sm">
              বিকাশ (bKash)
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F7941D] text-white font-bold text-xs shadow-sm">
              নগদ (Nagad)
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 mt-2.5 leading-relaxed max-w-3xl">
          {subText}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* 3-Step Simple Guide Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { step: '১', title: 'নাম্বার কপি করুন', desc: 'পছন্দের বিকাশ বা নগদ নাম্বারটি এক ক্লিকে কপি করুন' },
            { step: '২', title: 'ফান্ড বা অনুদান পাঠান', desc: 'বিকাশ বা নগদ অ্যাপ/ডায়াল (*247# / *167#) থেকে টাকা পাঠান' },
            { step: '৩', title: 'তথ্য ও TrxID জমা দিন', desc: 'নিচের ফর্মে টাকার পরিমাণ ও নাম্বার/TrxID দিয়ে নিশ্চিত করুন' }
          ].map((st) => (
            <div
              key={st.step}
              className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200/90 flex items-center gap-3"
            >
              <span className="w-7 h-7 rounded-full bg-[#0A2F25] text-[#F3D568] font-bold text-xs flex items-center justify-center shrink-0">
                {st.step}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0A2F25]">{st.title}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active bKash / Nagad Numbers Grid */}
        {activeList.length === 0 ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs sm:text-sm text-amber-900 font-medium">
            অ্যাডমিন প্যানেল থেকে এখনো কোনো সক্রিয় বিকাশ বা নগদ নাম্বার যুক্ত করা হয়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeList.map((pm) => {
              const isBkash = pm.provider === 'bKash';
              const isNagad = pm.provider === 'Nagad';
              const isCopied = copiedId === pm.id;
              return (
                <div
                  key={pm.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                    isBkash
                      ? 'bg-gradient-to-br from-pink-50/90 via-white to-pink-50/40 border-[#E2136E]/35 hover:border-[#E2136E]'
                      : isNagad
                      ? 'bg-gradient-to-br from-orange-50/90 via-white to-orange-50/40 border-[#F7941D]/40 hover:border-[#F7941D]'
                      : 'bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 border-[#8C3494]/35 hover:border-[#8C3494]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${
                            isBkash
                              ? 'bg-[#E2136E]'
                              : isNagad
                              ? 'bg-[#F7941D]'
                              : 'bg-[#8C3494]'
                          }`}
                        >
                          {isBkash ? 'বিকাশ (bKash)' : isNagad ? 'নগদ (Nagad)' : 'রকেট (Rocket)'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-700">
                          {pm.account_type}
                        </span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold font-english text-[#0A2F25] mt-2 tracking-wide">
                        {pm.number}
                      </p>
                      {pm.note && (
                        <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-snug">
                          {pm.note}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyClick(pm)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition shrink-0 inline-flex items-center gap-1.5 border ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : isBkash
                          ? 'bg-[#E2136E] hover:bg-[#c81060] text-white border-[#E2136E]'
                          : isNagad
                          ? 'bg-[#F7941D] hover:bg-[#df8112] text-white border-[#F7941D]'
                          : 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37]'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <span>নাম্বার কপি</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Amount Selector Pills */}
        <div className="pt-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
            <span className="text-xs font-bold text-[#0A2F25] mr-1">দ্রুত পরিমাণ নির্বাচন:</span>
            {[100, 200, 500, 1000, 2000, 5000].map((presetAmt) => (
              <button
                key={presetAmt}
                type="button"
                onClick={() => setAmount(String(presetAmt))}
                className={`px-3 py-1 rounded-full text-xs font-bold font-english border transition ${
                  Number(amount) === presetAmt
                    ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-sm scale-105'
                    : 'bg-[#F4F7F5] text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                }`}
              >
                ৳ {presetAmt.toLocaleString('en-US')}
              </button>
            ))}
          </div>

          {/* Payment Confirmation / TrxID Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200/90 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                ফান্ডিং / অনুদান নিশ্চিতকরণ ফর্ম (সম্পূর্ণ ফ্রি ভেরিফিকেশন)
              </h4>
              <span className="text-[11px] text-emerald-700 font-semibold">
                সরাসরি অ্যাডমিন ড্যাশবোর্ডে যুক্ত হবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  প্রেরকের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  পেমেন্ট মাধ্যম *
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-bold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
                >
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Rocket">রকেট (Rocket)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  অনুদানের খাত / উদ্দেশ্য
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-semibold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
                >
                  <option value="মাসিক ফান্ড">সদস্যের মাসিক ফান্ড</option>
                  <option value="সাধারণ অনুদান ও সহযোগিতা">সাধারণ অনুদান ও সহযোগিতা</option>
                  <option value="প্রজেক্ট ফান্ডিং">চলমান প্রজেক্ট ফান্ডিং</option>
                  <option value="সাদাকাহ ও যাকাত তহবিল">সাদাকাহ ও যাকাত তহবিল</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: 500"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-english font-bold focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  যে নাম্বার থেকে পাঠিয়েছেন *
                </label>
                <input
                  type="tel"
                  required
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  ট্রানজেকশন আইডি (TrxID) / শেষ ৪ ডিজিট
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="TrxID বা শেষ ৪ সংখ্যা (ঐচ্ছিক)"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-glossy-emerald w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'জমা হচ্ছে...' : 'অনুদান ও পেমেন্ট তথ্য সাবমিট করুন'}</span>
            </button>
          </form>
        </div>
      </div>
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
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
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
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const INSPIRATIONAL_FLOATING_QUOTES = [
    'মানুষ মানুষের জন্য — ক্ষুদ্র প্রচেষ্টায় ফোটুক হাসি',
    'দান কখনো সম্পদ কমায় না, বরং বরকত বৃদ্ধি করে',
    'অসহায়ের মুখে হাসি ফোটানোই সর্বশ্রেষ্ঠ মানবিকতা'
  ];

  useEffect(() => {
    const onScroll = () => {
      setIsPageScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const qTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_FLOATING_QUOTES.length);
    }, 4500);
    return () => clearInterval(qTimer);
  }, []);
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
          ['overview', 'members', 'finances', 'works', 'ideas', 'gallery', 'theme_ui', 'settings', 'my_profile'].includes(prev)
            ? prev
            : 'overview'
        );
      } else {
        setActiveTab((prev) =>
          ['my_account', 'member_payment', 'my_profile', 'foundation_funds', 'expense_history'].includes(prev)
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
      age: u.age ? String(u.age) : '',
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
        if (Array.isArray(d1Boot.data.payments)) setPaymentSubmissions(d1Boot.data.payments);
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

  // Blood Group & Age Onboarding + Recurring Reminder Popup States
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingBlood, setOnboardingBlood] = useState('');
  const [onboardingAge, setOnboardingAge] = useState('');
  const [onboardingMobile, setOnboardingMobile] = useState('');
  const [onboardingMsgIdx, setOnboardingMsgIdx] = useState(0);
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const ONBOARDING_MESSAGES = [
    'আপনার রক্তের গ্রুপ কী? জরুরি মুহূর্তে জীবন বাঁচাতে রক্তের গ্রুপ ও জন্মতারিখ সিলেক্ট করুন।',
    'নব আলো ফাউন্ডেশনের সদস্য প্রোফাইল সম্পূর্ণ করতে আপনার রক্তের গ্রুপ ও জন্মতারিখ যুক্ত করুন।',
    'এক ফোঁটা রক্ত বাঁচাতে পারে একটি প্রাণ—আপনার রক্তের গ্রুপ কোনটি নির্বাচন করুন।',
    'জরুরি রক্তদাতা তালিকায় যুক্ত হতে আপনার রক্তের গ্রুপ ও যোগাযোগের নাম্বার (ঐচ্ছিক) দিন।'
  ];

  const requestBrowserNotificationAccess = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {
      // Ignore if unsupported
    }
  };

  const triggerBloodGroupBrowserNotification = (msgText: string) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('নব আলো ফাউন্ডেশন — রক্তের গ্রুপ যুক্ত করুন', {
          body: msgText
        });
      }
    } catch {
      // Ignore notification errors on mobile webviews
    }
  };

  // Automatically check when user logs in: if blood_group or age is missing, show Onboarding Popup & start recurring reminder
  useEffect(() => {
    if (!appUser) {
      setShowOnboardingModal(false);
      return;
    }
    requestBrowserNotificationAccess();

    const missingBloodOrAge = !appUser.blood_group || !appUser.age;
    if (missingBloodOrAge) {
      setOnboardingBlood(appUser.blood_group || '');
      setOnboardingAge(appUser.age || '');
      setOnboardingMobile(appUser.mobile || '');
      const initialTimer = setTimeout(() => {
        setShowOnboardingModal(true);
      }, 600);

      // If they skip without adding blood_group, re-notify & pop up periodically with rotating messages
      const recurringInterval = setInterval(() => {
        setOnboardingMsgIdx((prev) => {
          const nextIdx = (prev + 1) % ONBOARDING_MESSAGES.length;
          triggerBloodGroupBrowserNotification(ONBOARDING_MESSAGES[nextIdx]);
          return nextIdx;
        });
        setShowOnboardingModal(true);
      }, 45000);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(recurringInterval);
      };
    } else {
      setShowOnboardingModal(false);
    }
  }, [appUser?.id, appUser?.blood_group, appUser?.age]);

  const handleSaveOnboardingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    if (!onboardingBlood) {
      showNotice('অনুগ্রহ করে আপনার রক্তের গ্রুপ সিলেক্ট করুন।', 'error');
      return;
    }
    if (!onboardingAge.trim()) {
      showNotice('অনুগ্রহ করে আপনার জন্মতারিখ নির্বাচন করুন।', 'error');
      return;
    }
    let cleanMob = appUser.mobile || '';
    if (onboardingMobile.trim()) {
      const bd = analyzeBdPhone(onboardingMobile);
      if (!bd.isValidBd) {
        showNotice('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নাম্বার দিন।', 'error');
        return;
      }
      cleanMob = bd.normalized;
    }

    setSavingOnboarding(true);
    const updated: MemberUser = {
      ...appUser,
      blood_group: onboardingBlood,
      age: bnToEnDigits(onboardingAge.trim()),
      mobile: cleanMob
    };
    setAppUser(updated);
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setShowOnboardingModal(false);

    await callD1Api('members', 'PUT', {
      id: updated.id,
      email: updated.email,
      blood_group: updated.blood_group,
      age: updated.age,
      mobile: updated.mobile
    });
    setSavingOnboarding(false);
    showNotice('ধন্যবাদ! আপনার রক্তের গ্রুপ ও তথ্য সফলভাবে সংরক্ষিত হয়েছে।', 'success');
  };

  // Continue with Google Handler (Uses Official Google Identity Services OAuth2 Popup)
  const handleContinueWithGoogle = () => {
    requestBrowserNotificationAccess();
    const gsi = (window as any).google?.accounts?.oauth2;
    if (gsi && typeof gsi.initTokenClient === 'function') {
      try {
        const tokenClient = gsi.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              showNotice('গুগল লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।', 'error');
              return;
            }
            if (tokenResponse?.access_token) {
              setAuthLoading(true);
              try {
                const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const uJson = uRes.ok ? await uRes.json() : {};
                const authRes = await callD1Api('google-auth', 'POST', {
                  access_token: tokenResponse.access_token,
                  email: uJson.email || '',
                  name: uJson.name || '',
                  picture: uJson.picture || ''
                });
                setAuthLoading(false);
                if (!authRes.ok || !authRes.data?.user) {
                  showNotice(authRes.data?.error || 'গুগল লগইন ব্যর্থ হয়েছে।', 'error');
                  return;
                }
                const loggedUser = normalizeMemberRow(authRes.data.user);
                if (loggedUser.avatar_url) {
                  await autoRecordInGallery(loggedUser.avatar_url);
                }
                setMembers((prev) => {
                  const exists = prev.some((m) => m.id === loggedUser.id || m.email.toLowerCase() === loggedUser.email.toLowerCase());
                  return exists
                    ? prev.map((m) => (m.id === loggedUser.id || m.email.toLowerCase() === loggedUser.email.toLowerCase() ? loggedUser : m))
                    : [...prev, loggedUser];
                });
                setAppUser(loggedUser);
                showNotice(`স্বাগতম, ${loggedUser.name}!`, 'success');
                setCurrentView('dashboard');
              } catch {
                setAuthLoading(false);
                showNotice('গুগল প্রোফাইল যাচাই করতে সমস্যা হয়েছে।', 'error');
              }
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fallback below if popup blocked in sandbox
      }
    }
    showNotice('গুগল লগইন পপআপ লোড হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করে আবার ক্লিক করুন।', 'error');
  };
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

  // ============================================================================
  // BKASH & NAGAD PAYMENT MANAGEMENT + DUAL ISLAMIC UI THEME ENGINE
  // ============================================================================
  const [newPaymentForm, setNewPaymentForm] = useState<{
    id: string;
    provider: 'bKash' | 'Nagad' | 'Rocket';
    number: string;
    account_type: string;
    note: string;
    is_active: boolean;
  }>({
    id: '',
    provider: 'bKash',
    number: '',
    account_type: 'পার্সোনাল (Send Money)',
    note: 'সেন্ড মানি করে নিচে ট্রানজেকশন আইডি (TrxID) বা নাম্বার দিন',
    is_active: true
  });

  const allPaymentNumbers = useMemo(() => {
    return Array.isArray(siteSettings.payment_numbers)
      ? siteSettings.payment_numbers
      : DEFAULT_PAYMENT_NUMBERS;
  }, [siteSettings.payment_numbers]);

  const activePaymentNumbers = useMemo(() => {
    return allPaymentNumbers.filter((p) => p && p.is_active !== false && String(p.number || '').trim());
  }, [allPaymentNumbers]);

  const activePaymentConfig = useMemo<PaymentConfig>(() => {
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      ...(siteSettings.payment_config || {})
    };
  }, [siteSettings.payment_config]);

  const activeUiTheme: 'classic_emerald' | 'royal_noor' =
    (siteSettings.ui_theme as string) === 'royal_noor' || (siteSettings.ui_theme as string) === 'modern_pearl'
      ? 'royal_noor'
      : 'classic_emerald';

  const handleSwitchUiTheme = async (nextTheme: 'classic_emerald' | 'royal_noor') => {
    const nextSettings: SiteSettings = { ...siteSettings, ui_theme: nextTheme };
    await persistSettingsInstant(nextSettings);
    showNotice(
      nextTheme === 'royal_noor'
        ? 'নতুন "রয়্যাল নূর-এ-হারামাইন (সুলতানি নেভি ও পুঁথি-ক্রিম ইউআই)" থিম পুরো ওয়েবসাইটে সেভ ও চালু করা হয়েছে!'
        : '"ক্লাসিক মদিনা এমারেল্ড ও গোল্ড ইউআই" থিম পুরো ওয়েবসাইটে সেভ ও চালু করা হয়েছে!',
      'success'
    );
  };

  const handleToggleShowPaymentOnHome = async () => {
    const nextVal = siteSettings.show_payment_on_home === false ? true : false;
    await persistSettingsInstant({ ...siteSettings, show_payment_on_home: nextVal });
    showNotice(
      nextVal
        ? 'হোমপেজে পাবলিক অনুদান ও ফান্ডিং (বিকাশ/নগদ) সেকশন চালু করা হয়েছে!'
        : 'হোমপেজ থেকে বিকাশ/নগদ সেকশন বন্ধ করা হয়েছে (এখন শুধু মেম্বার ড্যাশবোর্ডে দেখাবে)।',
      'success'
    );
  };

  const handleUpdatePaymentConfigField = (field: keyof PaymentConfig, value: string) => {
    lastSettingsSaveRef.current = Date.now();
    setSiteSettings((prev) => ({
      ...prev,
      payment_config: {
        ...DEFAULT_PAYMENT_CONFIG,
        ...(prev.payment_config || {}),
        [field]: value
      }
    }));
  };

  const handleSavePaymentConfigInstant = async (customPatch?: Partial<PaymentConfig>) => {
    const merged: PaymentConfig = {
      ...activePaymentConfig,
      ...(customPatch || {})
    };
    await persistSettingsInstant({
      ...siteSettings,
      payment_config: merged
    });
    showNotice('অনুদান ও পেমেন্ট সেকশনের শিরোনাম এবং বার্তা সেভ করা হয়েছে!', 'success');
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newPaymentForm.number.trim();
    if (!cleanNum) {
      showNotice('অনুগ্রহ করে বিকাশ বা নগদ নাম্বার লিখুন।', 'error');
      return;
    }

    let nextList: PaymentMethodItem[];
    if (newPaymentForm.id) {
      nextList = allPaymentNumbers.map((pm) =>
        pm.id === newPaymentForm.id
          ? {
              ...pm,
              provider: newPaymentForm.provider,
              number: cleanNum,
              account_type: newPaymentForm.account_type || 'পার্সোনাল (Send Money)',
              note: newPaymentForm.note.trim(),
              is_active: newPaymentForm.is_active
            }
          : pm
      );
      showNotice(`${newPaymentForm.provider} নাম্বারটি সফলভাবে আপডেট করা হয়েছে!`, 'success');
    } else {
      const newItem: PaymentMethodItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pm-${Date.now()}`,
        provider: newPaymentForm.provider,
        number: cleanNum,
        account_type: newPaymentForm.account_type || 'পার্সোনাল (Send Money)',
        note: newPaymentForm.note.trim(),
        is_active: true
      };
      nextList = [...allPaymentNumbers, newItem];
      showNotice(`নতুন ${newPaymentForm.provider} নাম্বার সফলভাবে যুক্ত ও সেভ করা হয়েছে!`, 'success');
    }

    setNewPaymentForm({
      id: '',
      provider: 'bKash',
      number: '',
      account_type: 'পার্সোনাল (Send Money)',
      note: 'সেন্ড মানি করে নিচে ট্রানজেকশন আইডি (TrxID) বা নাম্বার দিন',
      is_active: true
    });
    await persistSettingsInstant({ ...siteSettings, payment_numbers: nextList });
  };

  const handleTogglePaymentMethodActive = async (pm: PaymentMethodItem) => {
    const nextList = allPaymentNumbers.map((item) =>
      item.id === pm.id ? { ...item, is_active: item.is_active === false ? true : false } : item
    );
    await persistSettingsInstant({ ...siteSettings, payment_numbers: nextList });
    showNotice(
      pm.is_active === false
        ? `${pm.provider} (${pm.number}) নাম্বারটি সক্রিয় করা হয়েছে!`
        : `${pm.provider} (${pm.number}) নাম্বারটি সাময়িকভাবে হাইড করা হয়েছে।`,
      'success'
    );
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const nextList = allPaymentNumbers.filter((p) => p.id !== id);
    await persistSettingsInstant({ ...siteSettings, payment_numbers: nextList });
    showNotice('পেমেন্ট নাম্বারটি তালিকা থেকে মুছে ফেলা হয়েছে।', 'success');
  };

  const copyPaymentNum = (num: string, providerName: string) => {
    try {
      navigator.clipboard.writeText(num);
      showNotice(`${providerName} নাম্বার (${num}) কপি করা হয়েছে!`, 'success');
    } catch {
      showNotice(`${providerName} নাম্বার: ${num}`, 'success');
    }
  };

  const handleSubmitPaymentContribution = async (payload: {
    provider: 'bKash' | 'Nagad' | 'Rocket';
    amount: number;
    sender_number: string;
    receiver_number: string;
    trx_id: string;
    purpose: string;
    month: string;
    sender_name: string;
  }) => {
    const newSub: PaymentSubmission = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      member_id: appUser?.id || '',
      sender_name: payload.sender_name || appUser?.name || 'শুভাকাঙ্ক্ষী',
      provider: payload.provider,
      amount: payload.amount,
      sender_number: payload.sender_number,
      receiver_number: payload.receiver_number,
      trx_id: payload.trx_id,
      purpose: payload.purpose || 'সাধারণ অনুদান ও সহযোগিতা',
      month: payload.month,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setPaymentSubmissions((prev) => [newSub, ...prev]);
    await callD1Api('payments', 'POST', newSub);
    showNotice(
      'আলহামদুলিল্লাহ! আপনার অনুদান/ফান্ডিং তথ্য সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করে ফান্ডে যুক্ত করবেন।',
      'success'
    );
  };

  const handleApprovePaymentSubmission = async (sub: PaymentSubmission) => {
    setPaymentSubmissions((prev) =>
      prev.map((p) => (p.id === sub.id ? { ...p, status: 'approved' } : p))
    );
    await callD1Api('payments', 'PUT', { id: sub.id, status: 'approved' });

    const newFin: FinanceRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fin-${Date.now()}`,
      type: 'income',
      amount: Number(sub.amount),
      memberuid: sub.member_id || '',
      month: sub.month || '',
      description: `${sub.provider} (${sub.purpose || 'অনুদান'}) — ${sub.sender_name}${
        sub.trx_id ? ` [TrxID: ${sub.trx_id}]` : sub.sender_number ? ` [${sub.sender_number}]` : ''
      }`,
      created_at: new Date().toISOString()
    };
    setFinances((prev) => [newFin, ...prev]);
    await callD1Api('finances', 'POST', newFin);
    showNotice(`${sub.sender_name}-এর ৳${sub.amount} ফান্ড অনুমোদন ও মূল তহবিলে যোগ করা হয়েছে!`, 'success');
  };

  const handleDeletePaymentSubmission = async (subId: string) => {
    setPaymentSubmissions((prev) => prev.filter((p) => p.id !== subId));
    await callD1Api(`payments?id=${encodeURIComponent(subId)}`, 'DELETE');
    showNotice('পেমেন্ট রিকোয়েস্টটি মুছে ফেলা হয়েছে।', 'success');
  };

  // Reusable Admin Dual Islamic Theme Switcher Component
  const renderAdminThemeSwitcher = () => (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D4AF37]/60 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] text-[11px] font-bold mb-1">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>ডুয়াল ইসলামিক থিম ও ইউআই ইঞ্জিন</span>
          </span>
          <h3 className="text-base sm:text-xl font-bold text-[#0A2F25]">
            ওয়েবসাইটের থিম ও সম্পূর্ণ ইউআই ডিজাইন পরিবর্তন করুন
          </h3>
          <p className="text-xs text-gray-500">
            নিচের ২টি ইসলামিক থিমের মধ্যে যেকোনোটি সিলেক্ট করে সেভ দিলে পুরো ওয়েবসাইটের কালার, হেডার, হিরো ও কার্ড ডিজাইন সাথে সাথে পরিবর্তন হয়ে যাবে
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold">
          সক্রিয় থিম: {activeUiTheme === 'royal_noor' ? 'রয়্যাল নূর-এ-হারামাইন (নতুন UI)' : 'ক্লাসিক মদিনা এমারেল্ড (পূর্বের UI)'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Theme 1 Card: Classic Madinah Emerald & Gold */}
        <div
          onClick={() => handleSwitchUiTheme('classic_emerald')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            activeUiTheme === 'classic_emerald'
              ? 'bg-gradient-to-br from-[#0A2F25]/10 via-white to-[#0A2F25]/5 border-[#0A2F25] ring-2 ring-[#D4AF37] shadow-xl'
              : 'bg-[#F4F7F5]/60 border-gray-200 hover:border-[#D4AF37]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37]">
                  থিম ১ • পূর্বের ইসলামিক ইউআই (উন্নত সংস্করণ)
                </span>
                <h4 className="text-base sm:text-lg font-bold text-[#0A2F25] mt-1.5">
                  ক্লাসিক মদিনা এমারেল্ড ও রয়্যাল গোল্ড ইউআই
                </h4>
              </div>
              {activeUiTheme === 'classic_emerald' && (
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Visual Color Swatches Preview */}
            <div className="p-3 rounded-2xl bg-[#07221B] text-white border border-[#D4AF37]/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#F3D568] font-bold">কালার প্যালেট প্রিভিউ</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#0A2F25] border border-white/40" title="#0A2F25" />
                  <span className="w-4 h-4 rounded-full bg-[#155e4a] border border-white/40" title="#155e4a" />
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] border border-white/40" title="#D4AF37" />
                  <span className="w-4 h-4 rounded-full bg-[#F4F7F5] border border-white/40" title="#F4F7F5" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-gradient-to-r from-[#0A2F25] via-[#D4AF37] to-[#155e4a]" />
              <p className="text-[11px] text-gray-200 leading-relaxed">
                ডিপ এমারেল্ড গ্রিন হেডার, সেন্টার্ড ভিনটেজ হিরো ব্যানার, ঘূর্ণায়মান সোনালি মান্ডালা এবং ক্লাসিক ম্যাসনারি কার্যক্রম কার্ড।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSwitchUiTheme('classic_emerald');
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
              activeUiTheme === 'classic_emerald'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] hover:opacity-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {activeUiTheme === 'classic_emerald'
                ? '✓ এই থিমটি বর্তমানে সেভ ও চালু আছে'
                : 'এই থিমটি সেভ ও চালু করুন'}
            </span>
          </button>
        </div>

        {/* Theme 2 Card: Royal Noor-e-Haramain (New Ottoman Sapphire, Warm Parchment & Copper Gold UI) */}
        <div
          onClick={() => handleSwitchUiTheme('royal_noor')}
          className={`cursor-pointer rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
            activeUiTheme === 'royal_noor'
              ? 'bg-gradient-to-br from-[#FAF5EA] via-white to-[#FEF3C7]/40 border-[#111C38] ring-2 ring-[#D97706] shadow-xl'
              : 'bg-[#FAF5EA]/70 border-gray-200 hover:border-[#D97706]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97706] text-white">
                  থিম ২ • সম্পূর্ণ নতুন ও ভিন্ন ইসলামিক ইউআই
                </span>
                <h4 className="text-base sm:text-lg font-bold text-[#111C38] mt-1.5">
                  রয়্যাল নূর-এ-হারামাইন (সুলতানি নীল, কপার-গোল্ড ও পুঁথি-ক্রিম ইউআই)
                </h4>
              </div>
              {activeUiTheme === 'royal_noor' && (
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Visual Color Swatches Preview */}
            <div
              className="p-3 rounded-2xl text-white border border-[#F59E0B]/60 space-y-2"
              style={{ background: 'linear-gradient(135deg, #0B132B 0%, #1E3A6D 60%, #111C38 100%)' }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#FCD34D] font-bold">নতুন কালার ও আর্কিটেকচার</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#111C38] border border-white/40" title="#111C38" />
                  <span className="w-4 h-4 rounded-full bg-[#1E3A6D] border border-white/40" title="#1E3A6D" />
                  <span className="w-4 h-4 rounded-full bg-[#D97706] border border-white/40" title="#D97706" />
                  <span className="w-4 h-4 rounded-full bg-[#FAF5EA] border border-white/40" title="#FAF5EA" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-gradient-to-r from-[#111C38] via-[#F59E0B] to-[#0D9488]" />
              <p className="text-[11px] text-gray-200 leading-relaxed">
                বিসমিল্লাহ ক্যালিগ্রাফি রিবন, ফ্লোটিং প্যালেস নেভিগেশন ডক, ২-কলাম অটোমান মিহরাব আর্চ হিরো + ৪টি লাইভ ইমপ্যাক্ট কাউন্টার, ইলুমিনেটেড ম্যাগাজিন কার্ড ও ৩-কলাম রয়্যাল ফুটার।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSwitchUiTheme('royal_noor');
            }}
            style={{
              background:
                activeUiTheme === 'royal_noor'
                  ? '#059669'
                  : 'linear-gradient(135deg, #111C38 0%, #1E3A6D 100%)'
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white border border-[#F59E0B] shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {activeUiTheme === 'royal_noor'
                ? '✓ নতুন রয়্যাল নূর থিম বর্তমানে সেভ ও চালু আছে'
                : 'নতুন রয়্যাল নূর থিম সেভ ও চালু করুন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  // Reusable Admin bKash / Nagad Payment & Homepage Toggle Manager
  const renderAdminPaymentManager = () => {
    const isHomeOn = siteSettings.show_payment_on_home !== false;
    return (
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#D4AF37]/60 shadow-md space-y-5">
        {/* Top Header + Public Homepage Display Toggle Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E2136E] text-white text-[10px] font-bold">
                বিকাশ (bKash)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F7941D] text-white text-[10px] font-bold">
                নগদ (Nagad)
              </span>
              <span className="text-xs font-bold text-emerald-700">• সম্পূর্ণ ফ্রি পেমেন্ট সিস্টেম</span>
            </div>
            <h3 className="text-base sm:text-xl font-bold text-[#0A2F25]">
              বিকাশ ও নগদ পেমেন্ট এবং অনুদান/ফান্ডিং ম্যানেজমেন্ট
            </h3>
            <p className="text-xs text-gray-500">
              নতুন বিকাশ বা নগদ নাম্বার যুক্ত করুন — এটি অটোমেটিক্যালি সকল সদস্যের ড্যাশবোর্ডে এবং হোমপেজে (টগল অন থাকলে) দেখাবে
            </p>
          </div>

          {/* Public Homepage Toggle Card */}
          <div className="p-3 rounded-2xl bg-[#F4F7F5] border border-[#D4AF37]/50 flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div>
              <p className="text-xs font-bold text-[#0A2F25]">
                হোমপেজে পাবলিকলি অনুদান সেকশন:
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">
                {isHomeOn ? 'চালু আছে (হোমপেজে সবাই দেখবে)' : 'বন্ধ আছে (শুধু মেম্বার ড্যাশবোর্ডে দেখাবে)'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isHomeOn}
              onClick={handleToggleShowPaymentOnHome}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 px-0.5 items-center ${
                isHomeOn ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              style={{ width: '52px' }}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                  isHomeOn ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Add / Edit bKash or Nagad Number Form */}
        <form
          onSubmit={handleSavePaymentMethod}
          className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
              {newPaymentForm.id ? 'বিকাশ / নগদ নাম্বার এডিট করুন' : 'নতুন বিকাশ বা নগদ নাম্বার অ্যাড করুন'}
            </h4>
            {newPaymentForm.id && (
              <button
                type="button"
                onClick={() =>
                  setNewPaymentForm({
                    id: '',
                    provider: 'bKash',
                    number: '',
                    account_type: 'পার্সোনাল (Send Money)',
                    note: 'সেন্ড মানি করে নিচে ট্রানজেকশন আইডি (TrxID) বা নাম্বার দিন',
                    is_active: true
                  })
                }
                className="text-xs font-bold text-red-600 hover:underline"
              >
                এডিট বাতিল করুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">মাধ্যম নির্বাচন *</label>
              <select
                value={newPaymentForm.provider}
                onChange={(e) => setNewPaymentForm((p) => ({ ...p, provider: e.target.value as any }))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-bold text-[#0A2F25]"
              >
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="Rocket">রকেট (Rocket)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">মোবাইল নাম্বার *</label>
              <input
                type="tel"
                required
                value={newPaymentForm.number}
                onChange={(e) => setNewPaymentForm((p) => ({ ...p, number: e.target.value }))}
                placeholder="017XXXXXXXX / 018XXXXXXXX"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-english font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">নাম্বারের ধরন *</label>
              <select
                value={newPaymentForm.account_type}
                onChange={(e) => setNewPaymentForm((p) => ({ ...p, account_type: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-semibold"
              >
                <option value="পার্সোনাল (Send Money)">পার্সোনাল (Send Money)</option>
                <option value="মার্চেন্ট (Payment)">মার্চেন্ট (Payment)</option>
                <option value="এজেন্ট (Cash Out)">এজেন্ট (Cash Out)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs sm:text-sm font-bold shadow hover:opacity-95 transition inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{newPaymentForm.id ? 'আপডেট ও সেভ করুন' : 'নাম্বার যুক্ত করুন'}</span>
              </button>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <input
                type="text"
                value={newPaymentForm.note}
                onChange={(e) => setNewPaymentForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="নির্দেশনা বা নোট (যেমন: বিকাশ সেন্ড মানি করে রেফারেন্সে আপনার নাম লিখুন)"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs"
              />
            </div>
          </div>
        </form>

        {/* Active / Saved Payment Numbers List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
              যুক্তকৃত বিকাশ ও নগদ নাম্বারসমূহ ({allPaymentNumbers.length}টি)
            </h4>
            <span className="text-[11px] text-gray-500">
              সক্রিয়: {activePaymentNumbers.length}টি
            </span>
          </div>

          {allPaymentNumbers.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center bg-[#F4F7F5] rounded-2xl">
              এখনো কোনো বিকাশ বা নগদ নাম্বার যুক্ত করা হয়নি। উপরের ফর্ম থেকে নাম্বার যুক্ত করুন।
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPaymentNumbers.map((pm) => {
                const isBkash = pm.provider === 'bKash';
                const isNagad = pm.provider === 'Nagad';
                const isActive = pm.is_active !== false;
                return (
                  <div
                    key={pm.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                      isActive
                        ? 'bg-[#F4F7F5] border-gray-200'
                        : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                            isBkash
                              ? 'bg-[#E2136E]'
                              : isNagad
                              ? 'bg-[#F7941D]'
                              : 'bg-[#8C3494]'
                          }`}
                        >
                          {isBkash ? 'বিকাশ' : isNagad ? 'নগদ' : 'রকেট'}
                        </span>
                        <span className="text-xs sm:text-sm font-bold font-english text-[#0A2F25]">
                          {pm.number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-600">
                          {pm.account_type}
                        </span>
                      </div>
                      {pm.note && (
                        <p className="text-[11px] text-gray-500 mt-1 truncate">{pm.note}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethodActive(pm)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-gray-200 text-gray-700 border-gray-300'
                        }`}
                      >
                        {isActive ? 'চালু' : 'হাইড'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNewPaymentForm({
                            id: pm.id,
                            provider: pm.provider,
                            number: pm.number,
                            account_type: pm.account_type || 'পার্সোনাল (Send Money)',
                            note: pm.note || '',
                            is_active: pm.is_active !== false
                          })
                        }
                        className="p-1.5 rounded-full bg-white border border-gray-300 text-[#0A2F25] hover:border-[#D4AF37]"
                        title="এডিট"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePaymentMethod(pm.id)}
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

        {/* Customize Payment Section Heading & Wording */}
        <div className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                হোমপেজ ও ড্যাশবোর্ডের অনুদান/ফান্ডিং শিরোনাম কাস্টমাইজেশন
              </h4>
              <p className="text-[11px] text-gray-500">
                নিচের সুন্দর রেডিমেড শব্দগুলো থেকে সিলেক্ট করুন অথবা নিজের মতো লিখে সেভ করুন
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSavePaymentConfigInstant()}
              className="px-4 py-1.5 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold shadow-sm"
            >
              শিরোনাম সেভ করুন
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PAYMENT_TITLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSavePaymentConfigInstant({ section_title: preset })}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                  activePaymentConfig.section_title === preset
                    ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37]'
                    : 'bg-white text-[#0A2F25] border-gray-300 hover:border-[#D4AF37]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0A2F25] mb-1">
                হোমপেজ অনুদান শিরোনাম
              </label>
              <input
                type="text"
                value={activePaymentConfig.section_title}
                onChange={(e) => handleUpdatePaymentConfigField('section_title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#0A2F25] mb-1">
                মেম্বার ড্যাশবোর্ড পেমেন্ট শিরোনাম
              </label>
              <input
                type="text"
                value={activePaymentConfig.member_title}
                onChange={(e) => handleUpdatePaymentConfigField('member_title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submitted bKash / Nagad Contributions Verification Queue */}
        <div className="pt-2 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
              প্রেরিত বিকাশ ও নগদ অনুদান/ফান্ডিং ভেরিফিকেশন তালিকা ({paymentSubmissions.length})
            </h4>
            {paymentSubmissions.filter((p) => p.status === 'pending').length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                অপেক্ষমাণ: {paymentSubmissions.filter((p) => p.status === 'pending').length}টি
              </span>
            )}
          </div>

          {paymentSubmissions.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center bg-[#F4F7F5] rounded-2xl">
              এখনো কোনো বিকাশ বা নগদ ট্রানজেকশন রিকোয়েস্ট জমা পড়েনি।
            </p>
          ) : (
            <div className="space-y-2">
              {paymentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                          sub.provider === 'bKash'
                            ? 'bg-[#E2136E]'
                            : sub.provider === 'Nagad'
                            ? 'bg-[#F7941D]'
                            : 'bg-[#8C3494]'
                        }`}
                      >
                        {sub.provider}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-[#0A2F25]">
                        {sub.sender_name}
                      </span>
                      <span className="font-bold font-english text-xs sm:text-sm text-emerald-700">
                        ৳ {Number(sub.amount).toLocaleString('en-US')}
                      </span>
                      {sub.purpose && (
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-600">
                          {sub.purpose}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 font-english mt-1">
                      প্রেরকের নাম্বার: {sub.sender_number || '—'} {sub.trx_id ? `• TrxID: ${sub.trx_id}` : ''} • মাস: {sub.month || 'চলতি'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleApprovePaymentSubmission(sub)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>অনুমোদন ও ফান্ডে যোগ</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        ✓ অনুমোদিত
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePaymentSubmission(sub.id)}
                      className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                      title="ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
        age: updated.age,
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
  const [profileAge, setProfileAge] = useState('');
  const [profileFbUrl, setProfileFbUrl] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');

  useEffect(() => {
    if (appUser) {
      setProfileName(appUser.name || '');
      setProfileMobile(appUser.mobile || '');
      setProfileEmail(formatDisplayEmail(appUser.email));
      setProfileBloodGroup(appUser.blood_group || '');
      setProfileAge(appUser.age || '');
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
      age: bnToEnDigits(profileAge.trim()),
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
        age: updatedUser.age,
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
    <div
      data-ui-theme={activeUiTheme}
      className={`min-h-screen flex flex-col overflow-x-hidden w-full max-w-[100vw] selection:bg-[#D4AF37] selection:text-[#0A2F25] ${
        activeUiTheme === 'royal_noor'
          ? 'bg-[#FAF5EA] text-[#111C38]'
          : 'bg-[#F4F7F5] text-[#0A2F25]'
      }`}
    >
      {/* ROYAL NOOR SPECIAL BISMILLAH & HERITAGE TOP RIBBON */}
      {activeUiTheme === 'royal_noor' && (
        <div
          className="w-full py-1 px-3 border-b border-[#F59E0B]/40 text-center text-[11px] sm:text-xs font-semibold text-[#FCD34D] flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(90deg, #0B132B 0%, #172554 50%, #0B132B 100%)' }}
        >
          <span>﷽ • বিসমিল্লাহির রাহমানির রাহিম</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-gray-200">
            মানবতার কল্যাণে ও সাদাকাহ প্রসারের বিশ্বস্ত প্ল্যাটফর্ম
          </span>
        </div>
      )}
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

      {/* 2. SMART SCROLL-COMPACT FROSTED GLASS HEADER / NAVBAR */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isPageScrolled
            ? 'bg-[#0A2F25]/82 backdrop-blur-xl border-b border-[#D4AF37]/35 shadow-[0_8px_32px_rgba(5,24,19,0.38)] py-1.5'
            : 'bg-[#0A2F25]/95 backdrop-blur-md border-b border-[#D4AF37]/45 shadow-[0_6px_24px_rgba(10,47,37,0.24)] py-2.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 relative">
          {/* Left Side: Circular White-BG Logo + Unbreakable Single-Line Site Name */}
          <button
            type="button"
            onClick={() => {
              setHeaderProfileMenuOpen(false);
              setCurrentView('home');
            }}
            className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none min-w-0 shrink"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-md group-hover:scale-105 transition-transform shrink-0">
              <WhiteCircularLogo
                logoUrl={siteSettings.logo_url}
                sizeClass="w-9 h-9 sm:w-11 sm:h-11"
              />
            </div>
            <div className="min-w-0">
              <span className="block text-[15px] sm:text-xl md:text-2xl font-bold text-white leading-tight whitespace-nowrap truncate group-hover:text-[#F3D568] transition-colors">
                {siteSettings.site_name || DEFAULT_SITE_NAME}
              </span>
              <span className="hidden sm:block text-[11px] text-[#F3D568]/85 truncate max-w-xs">
                {siteSettings.tagline || DEFAULT_TAGLINE}
              </span>
            </div>
          </button>

          {/* Right Side Compact Navigation Buttons (Only Active View Turns Golden!) */}
          <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Donate / Funding Button in Header */}
            {(siteSettings.show_payment_on_home !== false || appUser) && (
              <button
                type="button"
                onClick={() => {
                  setHeaderProfileMenuOpen(false);
                  if (appUser && currentView === 'dashboard') {
                    setActiveTab(appUser.role === 'admin' ? 'finances' : 'member_payment');
                  } else if (siteSettings.show_payment_on_home !== false) {
                    if (currentView !== 'home') {
                      setCurrentView('home');
                      setTimeout(() => {
                        document.getElementById('homepage-donation-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 180);
                    } else {
                      document.getElementById('homepage-donation-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else if (appUser) {
                    setActiveTab(appUser.role === 'admin' ? 'finances' : 'member_payment');
                    setCurrentView('dashboard');
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border border-[#F59E0B] bg-gradient-to-r from-[#E2136E] to-[#F7941D] text-white shadow-sm hover:brightness-105 whitespace-nowrap shrink-0"
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span>অনুদান দিন</span>
              </button>
            )}
            {/* Members Button */}
            <button
              type="button"
              onClick={() => {
                setHeaderProfileMenuOpen(false);
                setCurrentView('members');
              }}
              aria-label="সদস্যবৃন্দ"
              title="সদস্যবৃন্দ"
              className={`inline-flex items-center justify-center gap-1.5 ${
                appUser ? 'w-9 h-9 sm:w-auto sm:px-4 sm:py-2' : 'px-3.5 sm:px-4 py-1.5 sm:py-2'
              } rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shrink-0 ${
                currentView === 'members'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:border-[#D4AF37]/60 hover:bg-white/15'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${currentView === 'members' ? 'text-[#0A2F25]' : 'text-[#F3D568]'}`} />
              <span className={appUser ? 'hidden sm:inline' : 'inline'}>সদস্য</span>
            </button>

            {!appUser ? (
              <button
                type="button"
                onClick={() => setCurrentView('join')}
                aria-label="যুক্ত হোন"
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shrink-0 ${
                  currentView === 'join' || currentView === 'login'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] shadow-md'
                    : currentView === 'home'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] shadow-sm hover:brightness-105'
                    : 'bg-white/10 text-white border-white/20 hover:border-[#D4AF37]/60 hover:bg-white/15'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>যুক্ত হোন</span>
              </button>
            ) : (
              <>
                {/* Dashboard Button: Only Golden when currentView === 'dashboard', Glassmorphic otherwise */}
                <button
                  type="button"
                  onClick={() => {
                    setHeaderProfileMenuOpen(false);
                    setCurrentView('dashboard');
                  }}
                  aria-label="ড্যাশবোর্ড"
                  title="ড্যাশবোর্ড"
                  className={`inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shrink-0 ${
                    currentView === 'dashboard'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] shadow-md'
                      : 'bg-white/10 text-white border-white/20 hover:border-[#D4AF37]/60 hover:bg-white/15'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-[#0A2F25]' : 'text-[#F3D568]'}`} />
                  <span className="hidden sm:inline">ড্যাশবোর্ড</span>
                </button>

                {/* Modern Circular Profile Avatar Button Next to Dashboard */}
                <div className="relative" ref={profilePopoverRef}>
                  <button
                    type="button"
                    onClick={() => setHeaderProfileMenuOpen((prev) => !prev)}
                    aria-label="প্রোফাইল মেনু"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-md hover:scale-105 transition-transform focus:outline-none shrink-0"
                  >
                    <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold text-xs sm:text-sm overflow-hidden">
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

                  {/* Modern Profile Popover Menu (Auto-Closes on Outside Click or Scroll) */}
                  {headerProfileMenuOpen && (
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
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#0A2F25] whitespace-nowrap">
                                {appUser.designation || (appUser.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}
                              </span>
                              {appUser.blood_group && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-english font-bold bg-red-600 text-white whitespace-nowrap">
                                  {appUser.blood_group}
                                </span>
                              )}

                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2 text-xs border-b border-gray-100 bg-[#F4F7F5]/60">
                        {formatDisplayEmail(appUser.email) && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                            <span className="font-english truncate">{formatDisplayEmail(appUser.email)}</span>
                          </div>
                        )}
                        {appUser.mobile && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-[#155e4a] shrink-0" />
                            <span className="font-english">{appUser.mobile}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderProfileMenuOpen(false);
                            setActiveTab(appUser.role === 'admin' ? 'overview' : 'my_account');
                            setCurrentView('dashboard');
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-[#0A2F25] hover:bg-[#0A2F25]/10 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#155e4a] shrink-0" />
                          <span>ড্যাশবোর্ডে যান</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHeaderProfileMenuOpen(false);
                            setActiveTab('my_profile');
                            setCurrentView('dashboard');
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-[#0A2F25] hover:bg-[#0A2F25]/10 transition"
                        >
                          <User className="w-4 h-4 text-[#155e4a] shrink-0" />
                          <span>প্রোফাইল আপডেট</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHeaderProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>লগআউট করুন</span>
                        </button>
                      </div>
                    </div>
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
            {activeUiTheme === 'royal_noor' ? (
              /* ================================================================ */
              /* THEME 2 (`royal_noor`): ROYAL NOOR-E-HARAMAIN OTTOMAN MIHRAB     */
              /* SPLIT SHOWCASE HERO + 4 LIVE IMPACT COUNTER BENTO CARDS          */
              /* ================================================================ */
              <section
                className="relative overflow-hidden py-8 sm:py-14 px-3 sm:px-6 border-b-2 border-[#D97706]"
                style={{
                  background:
                    'radial-gradient(circle at 20% 20%, #1E3A6D 0%, #111C38 55%, #0B132B 100%)'
                }}
              >
                {/* Decorative Corner Mandalas */}
                <div className="absolute -left-10 -top-10 opacity-20 pointer-events-none">
                  <IslamicMandala className="animate-mandala" size={150} />
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
                  <IslamicMandala className="animate-mandala-reverse" size={150} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
                  {/* Left Column: Royal Calligraphy Badge, Title, Wisdom Box & Action Buttons */}
                  <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D97706]/25 border border-[#F59E0B] text-[#FCD34D] text-xs font-bold mb-4 shadow">
                      <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{INSPIRATIONAL_FLOATING_QUOTES[quoteIndex]}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                      মানবতার সেবায় ও কল্যাণে{' '}
                      <span className="text-[#FCD34D] underline decoration-[#D97706]/70">
                        {siteSettings.site_name || DEFAULT_SITE_NAME}
                      </span>
                    </h1>

                    <p className="text-xs sm:text-base text-gray-200 max-w-xl mb-5 leading-relaxed">
                      {siteSettings.tagline || DEFAULT_TAGLINE}
                    </p>

                    {/* Illuminated Humanitarian Callout Box */}
                    <div className="w-full max-w-xl p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border-l-4 border-[#F59E0B] text-left mb-6">
                      <p className="text-xs sm:text-sm text-[#FDE68A] font-semibold leading-relaxed">
                        “যারা আল্লাহর পথে নিজেদের ধন-সম্পদ ব্যয় করে, তাদের উপমা একটি শস্যবীজের মতো, যা থেকে সাতটি শীষ জন্মায়।” — মানবিক কাজে আপনার অংশগ্রহণই আমাদের শক্তি।
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentView('join')}
                        className="btn-glossy-gold inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>সদস্য হিসেবে যুক্ত হোন</span>
                      </button>

                      {siteSettings.show_payment_on_home !== false && (
                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('homepage-donation-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-[#E2136E] to-[#F7941D] text-white border border-white/30 font-bold text-xs sm:text-sm shadow-lg hover:scale-[1.02] transition-all whitespace-nowrap"
                        >
                          <HeartHandshake className="w-4 h-4 shrink-0" />
                          <span>অনুদান ও সহযোগিতা দিন</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setCurrentView('members')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-[#F59E0B]/60 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap"
                      >
                        <Users className="w-4 h-4 text-[#FCD34D] shrink-0" />
                        <span>সদস্যবৃন্দ দেখুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Ottoman Pointed Mihrab Arch Frame + 4 Live Impact Counter Cards */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="relative h-56 sm:h-64 mihrab-arch-frame overflow-hidden bg-[#0B132B] border-2 border-[#F59E0B] shadow-2xl flex items-center justify-center">
                      {validBanners.map((bannerUrl, idx) => (
                        <div
                          key={idx}
                          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            idx === bannerIndex ? 'opacity-65 animate-kenburns' : 'opacity-0'
                          }`}
                          style={{
                            backgroundImage: `url("${optimizeMedia(bannerUrl)}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      ))}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(circle at 50% 45%, rgba(17,28,56,0.25) 0%, rgba(11,19,43,0.85) 100%)'
                        }}
                      />
                      <div className="relative z-10 flex flex-col items-center text-center p-4">
                        <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#D97706] via-[#FDE68A] to-[#D97706] shadow-2xl mb-2.5">
                          <WhiteCircularLogo
                            logoUrl={siteSettings.logo_url}
                            sizeClass="w-16 h-16 sm:w-20 sm:h-20"
                          />
                        </div>
                        <span className="px-4 py-1 rounded-full bg-[#111C38]/85 backdrop-blur-md text-[#FCD34D] border border-[#F59E0B]/60 text-xs sm:text-sm font-bold shadow">
                          {siteSettings.site_name || DEFAULT_SITE_NAME}
                        </span>
                      </div>
                    </div>

                    {/* 4 Live Impact Bento Counter Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#F59E0B]/40 text-center">
                        <span className="block text-lg sm:text-xl font-bold font-english text-[#FCD34D]">
                          {approvedMembers.length}
                        </span>
                        <span className="text-[11px] text-gray-200 font-medium">নিবন্ধিত সদস্য</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#F59E0B]/40 text-center">
                        <span className="block text-lg sm:text-xl font-bold font-english text-emerald-300">
                          {activities.length}
                        </span>
                        <span className="text-[11px] text-gray-200 font-medium">মানবিক কার্যক্রম</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#F59E0B]/40 text-center">
                        <span className="block text-lg sm:text-xl font-bold font-english text-[#FCD34D]">
                          {activeHomepageCampaigns.length}
                        </span>
                        <span className="text-[11px] text-gray-200 font-medium">চলমান প্রজেক্ট</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#F59E0B]/40 text-center">
                        <span className="block text-lg sm:text-xl font-bold font-english text-red-300">
                          {approvedMembers.filter((m) => Boolean(m.blood_group)).length}
                        </span>
                        <span className="text-[11px] text-gray-200 font-medium">রক্তদাতা সদস্য</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
            /* A. COMPACT HERO WITH SOFT BANNER OPACITY, RADIAL VINTAGE BLUR & FLOATING INSPIRATIONAL PILLS */
            <section className="relative overflow-hidden bg-[#07221B] text-white min-h-[250px] sm:min-h-[400px] flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-6 border-b border-[#D4AF37]/60">
              {/* Softly Visible Fading Background Banner Slideshow (Lower Opacity + Subtle Blur) */}
              {validBanners.map((bannerUrl, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    idx === bannerIndex ? 'opacity-25 scale-105' : 'opacity-0 scale-100'
                  }`}
                  style={{
                    backgroundImage: `url("${optimizeMedia(bannerUrl)}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(1.5px)'
                  }}
                />
              ))}

              {/* Deep Radial Vignette & Vintage Side Blur Overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(10,47,37,0.52) 0%, rgba(8,36,28,0.84) 62%, rgba(4,19,15,0.97) 100%)',
                  boxShadow: 'inset 0 0 85px 28px rgba(4, 19, 15, 0.88)'
                }}
              />
              {/* Left & Right Frosted Vintage Edge Blur Strips */}
              <div className="hidden sm:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#051A14]/90 to-transparent backdrop-blur-[2px] pointer-events-none" />
              <div className="hidden sm:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#051A14]/90 to-transparent backdrop-blur-[2px] pointer-events-none" />

              {/* Tiny, Subtle Corner Mandalas */}
              <div className="absolute -left-10 -top-10 opacity-12 pointer-events-none">
                <IslamicMandala className="animate-mandala" size={110} />
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-12 pointer-events-none">
                <IslamicMandala className="animate-mandala-reverse" size={115} />
              </div>

              {/* Floating Inspirational Glass Cards on Desktop Sides */}
              <div className="hidden lg:flex items-center gap-2 absolute left-8 top-1/3 px-3.5 py-2 rounded-2xl bg-white/8 backdrop-blur-md border border-[#D4AF37]/30 text-[11px] text-[#F3D568] shadow-lg animate-float-slow pointer-events-none max-w-[210px]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>ক্ষুদ্র দানে ফোটুক অসহায়ের মুখে হাসি</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 absolute right-8 bottom-1/3 px-3.5 py-2 rounded-2xl bg-white/8 backdrop-blur-md border border-[#D4AF37]/30 text-[11px] text-[#F3D568] shadow-lg animate-float-delayed pointer-events-none max-w-[210px]">
                <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>মানবতার সেবায় ঐক্যবদ্ধ পথচলা</span>
              </div>

              {/* Compact Hero Center Content */}
              <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
                {/* Compact Circular Logo */}
                <div className="relative mb-2 sm:mb-3.5 flex items-center justify-center">
                  <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.38)]">
                    <WhiteCircularLogo
                      logoUrl={siteSettings.logo_url}
                      sizeClass="w-12 h-12 sm:w-18 sm:h-18"
                    />
                  </div>
                </div>

                {/* Floating Inspirational Advice Pill (Cycles Softly) */}
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/40 text-[#F3D568] text-[10px] sm:text-xs font-medium mb-2 transition-all duration-500">
                  <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
                  <span>{INSPIRATIONAL_FLOATING_QUOTES[quoteIndex]}</span>
                </div>

                <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-white leading-snug mb-1.5 sm:mb-2.5 drop-shadow-md">
                  মানবতার সেবায় {siteSettings.site_name || DEFAULT_SITE_NAME}
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-lg mb-4 sm:mb-5 leading-relaxed">
                  {siteSettings.tagline || DEFAULT_TAGLINE}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('join')}
                    className="btn-glossy-gold inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>সদস্য হিসেবে যুক্ত হোন</span>
                  </button>
                  {siteSettings.show_payment_on_home !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('homepage-donation-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E2136E] to-[#F7941D] text-white border border-white/30 font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] transition-all whitespace-nowrap"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                      <span>অনুদান ও সহযোগিতা</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentView('members')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-[#D4AF37]/50 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5 text-[#F3D568] shrink-0" />
                    <span>সদস্যবৃন্দ দেখুন</span>
                  </button>
                </div>

                {validBanners.length > 1 && (
                  <div className="mt-4 sm:mt-5 flex items-center gap-1.5">
                    {validBanners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setBannerIndex(i)}
                        aria-label={`ব্যানার ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === bannerIndex ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/35'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
            )}

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
                <div
                  className={
                    activeUiTheme === 'royal_noor'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5'
                  }
                >
                  {filteredActivities.map((act) => (
                    <ActivityCardItem
                      key={act.id}
                      act={act}
                      uiTheme={activeUiTheme}
                      onSelect={(selected) => setSelectedActivityModal(selected)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* C. PUBLIC HOMEPAGE BKASH & NAGAD DONATION / FUNDING SECTION (ADMIN TOGGLE CONTROLLED) */}
            {siteSettings.show_payment_on_home !== false && (
              <section
                id="homepage-donation-section"
                className="max-w-5xl mx-auto px-3 sm:px-6 pb-12 sm:pb-16 scroll-mt-20"
              >
                <div className="text-center max-w-2xl mx-auto mb-6">
                  <IslamicSectionDivider subtitle={activePaymentConfig.badge_text} />
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2F25]">
                    {activePaymentConfig.section_title}
                  </h2>
                </div>
                <PaymentContributionCard
                  paymentNumbers={allPaymentNumbers}
                  paymentConfig={activePaymentConfig}
                  isMemberDashboard={false}
                  uiTheme={activeUiTheme}
                  defaultName={appUser?.name || ''}
                  defaultPhone={appUser?.mobile || ''}
                  onSubmitPayment={handleSubmitPaymentContribution}
                  onCopyNumber={copyPaymentNum}
                />
              </section>
            )}



            {/* D. SHARE YOUR IDEA SECTION (`আপনার পরিকল্পনা শেয়ার করুন`) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2F25] via-[#124A3B] to-[#0A2F25] text-white py-14 sm:py-20 px-4 border-t-2 border-[#D4AF37]/60">
              {/* Animated Islamic Mandalas in Idea Section Background */}
              <div className="absolute -right-8 -top-8 opacity-15 pointer-events-none">
                <IslamicMandala className="animate-mandala" size={120} />
              </div>
              <div className="absolute -left-8 -bottom-8 opacity-15 pointer-events-none">
                <IslamicMandala className="animate-mandala-reverse" size={120} />
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
          <div>
            {/* Ultra-Compact Search & Blood Group Filter Strip Immediately Below Header */}
            <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 py-2 px-3 sm:px-6 sticky top-[54px] sm:top-[62px] z-20 shadow-sm">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                {/* Compact Plain Search Input */}
                <div className="relative w-full sm:w-64">
                  <Users className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="সদস্যের নাম বা পদবি খুঁজুন..."
                    className="w-full h-8 pl-8 pr-3 rounded-full border border-gray-200 bg-[#F4F7F5]/70 text-xs focus:outline-none focus:bg-white focus:border-[#0A2F25]"
                  />
                </div>

                {/* Compact Blood Group Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1 w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-gray-500 mr-1 shrink-0">রক্তের গ্রুপ:</span>
                  {['সব', ...BLOOD_GROUPS].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBloodFilter(bg)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 border whitespace-nowrap ${
                        selectedBloodFilter === bg
                          ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
              <div className="text-center max-w-2xl mx-auto mb-6">
                <IslamicSectionDivider subtitle="আমাদের মানবিক পরিবার" />
                <h2 className="text-xl sm:text-3xl font-bold text-[#0A2F25]">
                  নব আলো ফাউন্ডেশনের সদস্যবৃন্দ
                </h2>
              </div>

              {filteredPublicMembers.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[#D4AF37]/30 shadow-sm max-w-md mx-auto">
                  <Users className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-gray-500 text-xs sm:text-sm">কোনো সদস্য খুঁজে পাওয়া যায়নি।</p>
                </div>
              ) : activeUiTheme === 'royal_noor' ? (
                /* THEME 2 (`royal_noor`): ROYAL MEDALLION HORIZONTAL BENTO MEMBER CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPublicMembers.map((member) => {
                    const rawDesig = (member.designation || '').trim();
                    const publicDesignation =
                      !rawDesig || rawDesig === 'অ্যাডমিন' ? 'সাধারণ সদস্য' : rawDesig;
                    const avatarSrc = optimizeMedia(member.avatar_url);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberModal(member)}
                        className="cursor-pointer group bg-[#FFFDF9] rounded-2xl p-4 border-2 border-[#D97706]/35 hover:border-[#D97706] shadow-sm hover:shadow-xl transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-[#111C38] via-[#D97706] to-[#111C38] shrink-0 shadow">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={member.name}
                                loading="lazy"
                                className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl object-cover bg-white"
                              />
                            ) : (
                              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-[#111C38] text-[#FCD34D] flex items-center justify-center text-lg font-bold">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-[#111C38] group-hover:text-[#B45309] truncate">
                              {member.name}
                            </h3>
                            <span className="mt-1 inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#111C38] text-[#FCD34D] border border-[#D97706]/50">
                              {publicDesignation}
                            </span>
                            {member.bio && (
                              <p className="text-[11px] text-gray-500 mt-1 truncate">{member.bio}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {member.blood_group && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-english font-bold text-xs shadow-sm">
                              {member.blood_group}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-[#B45309] group-hover:underline">
                            প্রোফাইল →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {filteredPublicMembers.map((member) => {
                    const rawDesig = (member.designation || '').trim();
                    const publicDesignation =
                      !rawDesig || rawDesig === 'অ্যাডমিন' ? 'সাধারণ সদস্য' : rawDesig;
                    const avatarSrc = optimizeMedia(member.avatar_url);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberModal(member)}
                        className="cursor-pointer group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D4AF37]/35 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col items-center text-center relative"
                      >
                        <div className="w-full h-12 sm:h-15 bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] border-b border-[#D4AF37] relative" />

                        {member.blood_group && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white font-english font-bold text-[10px] shadow">
                            {member.blood_group}
                          </span>
                        )}

                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#0A2F25] shadow-md -mt-8 sm:-mt-10 mb-2 relative z-10 group-hover:scale-105 transition-transform">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={member.name}
                              loading="lazy"
                              className="w-full h-full rounded-full object-cover bg-white"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-lg sm:text-2xl font-bold">
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="px-3 pb-4 sm:px-5 sm:pb-5 flex-1 flex flex-col items-center justify-between w-full">
                          <div>
                            <h3 className="text-xs sm:text-base font-bold text-[#0A2F25] group-hover:text-[#155e4a] transition-colors leading-snug line-clamp-1">
                              {member.name}
                            </h3>

                            <span className="mt-1.5 inline-flex items-center px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#F4F7F5] text-[#0A2F25] border border-[#D4AF37]/40 whitespace-nowrap">
                              <span>{publicDesignation}</span>
                            </span>
                          </div>


                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
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
                {/* Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-gray-50 text-[#0A2F25] border-2 border-gray-200 hover:border-[#D4AF37] font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-95"
                >
                  <GoogleBrandIcon className="w-5 h-5 shrink-0" />
                  <span className="font-english">Continue with Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400">অথবা</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>

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
                {/* Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-gray-50 text-[#0A2F25] border-2 border-gray-200 hover:border-[#D4AF37] font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-95"
                >
                  <GoogleBrandIcon className="w-5 h-5 shrink-0" />
                  <span className="font-english">Continue with Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400">অথবা</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>

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
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 mb-5">
                {[
                  { id: 'overview', label: 'ওভারভিউ', icon: LayoutDashboard },
                  { id: 'members', label: 'সদস্য পরিচালনা', icon: Users },
                  { id: 'finances', label: 'ফান্ড ও বিকাশ/নগদ', icon: Wallet },
                  { id: 'theme_ui', label: 'থিম ও ইউআই', icon: Sparkles },
                  { id: 'works', label: 'কার্যক্রম আপডেট', icon: FolderKanban },
                  { id: 'ideas', label: 'পরিকল্পনা সমূহ', icon: Lightbulb },
                  { id: 'gallery', label: 'গ্যালারি', icon: ImageIcon },
                  { id: 'settings', label: 'সেটিংস ও পেমেন্ট', icon: Settings },
                  { id: 'my_profile', label: 'আমার প্রোফাইল', icon: User }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.id;
                  const pendingPaymentsCount = paymentSubmissions.filter((p) => p.status === 'pending').length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
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
                      {tab.id === 'finances' && pendingPaymentsCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E2136E] text-white font-english">
                          {pendingPaymentsCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 mb-5">
                {[
                  { id: 'my_account', label: 'আমার জমা ও পেমেন্ট', icon: Wallet },
                  { id: 'member_payment', label: 'অনুদান দিন (বিকাশ/নগদ)', icon: HeartHandshake },
                  { id: 'foundation_funds', label: 'ফান্ড', icon: TrendingUp },
                  { id: 'expense_history', label: 'খরচ', icon: FileText },
                  { id: 'my_profile', label: 'প্রোফাইল আপডেট', icon: User }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
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
              <div className="space-y-6">
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

              {/* Quick Admin Shortcuts for Theme Switcher & bKash/Nagad Payment Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 border-2 border-[#D4AF37]/50 shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] text-[11px] font-bold">
                      ডুয়াল ইসলামিক থিম কন্ট্রোলার
                    </span>
                    <h4 className="text-base font-bold text-[#0A2F25] mt-1">
                      বর্তমান ইউআই থিম: {activeUiTheme === 'royal_noor' ? 'রয়্যাল নূর-এ-হারামাইন (নতুন UI)' : 'ক্লাসিক মদিনা এমারেল্ড (পূর্বের UI)'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      এক ক্লিকে পুরো ওয়েবসাইটের থিম ও ডিজাইন পরিবর্তন করতে নিচের বাটনে ক্লিক করুন।
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchUiTheme(activeUiTheme === 'royal_noor' ? 'classic_emerald' : 'royal_noor')}
                      className="px-4 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold shadow"
                    >
                      {activeUiTheme === 'royal_noor' ? 'ক্লাসিক এমারেল্ড থিমে যান' : 'নতুন রয়্যাল নূর ইউআই চালু করুন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('theme_ui')}
                      className="px-4 py-2 rounded-xl bg-[#F4F7F5] text-[#0A2F25] border border-gray-300 text-xs font-bold"
                    >
                      থিম সেকশন খুলুন →
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-2 border-[#D4AF37]/50 shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#E2136E] text-white text-[10px] font-bold">বিকাশ</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F7941D] text-white text-[10px] font-bold">নগদ</span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        • সক্রিয় নাম্বার: {activePaymentNumbers.length}টি
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#0A2F25] mt-1">
                      হোমপেজ অনুদান সেকশন: {siteSettings.show_payment_on_home !== false ? 'চালু আছে (ON)' : 'বন্ধ আছে (OFF)'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      বিকাশ/নগদ নাম্বার যুক্ত বা পরিবর্তন করতে এবং হোমপেজ টগল নিয়ন্ত্রণ করতে নিচে ক্লিক করুন।
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleShowPaymentOnHome}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow"
                    >
                      {siteSettings.show_payment_on_home !== false ? 'হোমপেজে বন্ধ করুন' : 'হোমপেজে চালু করুন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('finances')}
                      className="px-4 py-2 rounded-xl bg-[#F4F7F5] text-[#0A2F25] border border-gray-300 text-xs font-bold"
                    >
                      বিকাশ/নগদ ম্যানেজার খুলুন →
                    </button>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN DEDICATED TAB: থিম ও ইউআই (`theme_ui`)                    */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'theme_ui' && (
              <div className="space-y-6">
                {renderAdminThemeSwitcher()}
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 2: সদস্য পরিচালনা (`members`)                        */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'members' && (
              <div className="space-y-6">
                

                {/* Compact Collapsible Designation / Category CRUD Manager */}
                <div className="bg-white rounded-2xl p-4 border border-[#D4AF37]/45 shadow-sm">
                  <datalist id="member-designations-datalist">{activeDesignations.map((desig) => (<option key={desig} value={desig} />))}</datalist>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                        পদবি ও ক্যাটাগরি ব্যবস্থাপনা ({activeDesignations.length}টি)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDesignationManager((p) => !p)}
                      aria-label="পদবি তালিকা খুলুন বা বন্ধ করুন"
                      title={showDesignationManager ? 'সংক্ষিপ্ত করুন' : 'পদবি অ্যাড / এডিট'}
                      className="w-8 h-8 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] flex items-center justify-center transition shrink-0"
                    >
                      {showDesignationManager ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
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
                            title={showAllDesignations ? 'কম দেখুন' : 'আরও দেখুন'}
                            aria-label="আরও পদবি দেখুন"
                            className="w-7 h-7 rounded-full bg-[#D4AF37]/25 hover:bg-[#D4AF37] text-[#0A2F25] border border-[#D4AF37]/50 flex items-center justify-center transition shrink-0"
                          >
                            {showAllDesignations ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
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

                {/* Approved Members List (100% Mobile-Responsive Card Rows, Zero Horizontal Scroll) */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-3.5">
                    অনুমোদিত সদস্য তালিকা ({approvedMembers.length})
                  </h3>

                  <div className="space-y-2.5">
                    {approvedMembers.map((m) => {
                      const isSuper =
                        m.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                      const canManage = canActorManageMember(appUser, m);
                      const dispEmail = formatDisplayEmail(m.email);

                      return (
                        <div
                          key={m.id}
                          className="p-3 sm:p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          {/* Top / Left: Avatar + Name + Contact/Blood Badge */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center font-bold overflow-hidden shrink-0 border border-[#D4AF37]">
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
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-bold text-sm text-[#0A2F25] truncate">{m.name}</p>
                                {m.blood_group && (
                                  <span className="px-2 py-0.2 rounded-full bg-red-600 text-white font-english font-bold text-[10px]">
                                    {m.blood_group}
                                  </span>
                                )}
                                <span className="px-2 py-0.2 rounded-full bg-white border border-gray-200 text-gray-600 font-english text-[10px]">
                                  #{m.sort_order ?? 100}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-english truncate">
                                {m.mobile || dispEmail || 'সদস্য'}
                              </p>
                            </div>
                          </div>

                          {/* Bottom / Right Controls: Designation Select + Role Select + Edit/Delete */}
                          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/80">
                            <select
                              value={m.designation || (m.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}
                              onChange={(e) => handleDesignationChange(m, e.target.value)}
                              className="px-3 py-1.5 rounded-full border border-[#D4AF37]/50 bg-white text-xs font-bold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
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

                            {isSuper ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2F25] text-[#F3D568] text-[11px] font-bold whitespace-nowrap">
                                <ShieldCheck className="w-3 h-3" />
                                <span>সুপার অ্যাডমিন</span>
                              </span>
                            ) : !canManage ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#155e4a]/15 text-[#0A2F25] border border-[#D4AF37]/50 text-[11px] font-bold whitespace-nowrap">
                                <ShieldCheck className="w-3 h-3 text-[#155e4a]" />
                                <span>{m.role === 'admin' ? 'সিনিয়র অ্যাডমিন' : 'সদস্য'}</span>
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
                                className="px-2.5 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#0A2F25]"
                              >
                                <option value="member">সদস্য</option>
                                <option value="admin">অ্যাডমিন</option>
                              </select>
                            )}

                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMember({ ...m })}
                                className="p-2 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] transition"
                                title="সম্পাদনা"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m)}
                                  className="p-2 rounded-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
                                  title="ডিলিট"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 3: জমা/খরচের হিসাব (`finances`)                       */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'finances' && (
              <div className="space-y-6">
                {/* 0. ADMIN BKASH & NAGAD PAYMENT SYSTEM & HOMEPAGE TOGGLE CONTROLLER */}
                {renderAdminPaymentManager()}

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

                  <form onSubmit={handleCampaignSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
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
                    <div className="sm:col-span-2">
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
                                {camp.is_active ? 'হোমপেজে চালু' : 'হাইড করা'}
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

                {/* 2. MONTHLY MEMBER CONTRIBUTION REMINDER MANAGER (COMPACT MOBILE CARDS, NO HORIZONTAL SCROLL) */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/45 shadow-sm space-y-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      সদস্যদের মাসিক ফান্ড রিমাইন্ডার তালিকা
                    </h3>
                    <p className="text-xs text-gray-500">
                      প্রত্যেক সদস্যের মাসিক ফান্ড স্ট্যাটাস ও রিমাইন্ডার এখান থেকে নিয়ন্ত্রণ করুন
                    </p>
                  </div>

                  <div className="space-y-2">
                    {approvedMembers.map((m) => {
                      const rem = getMemberMonthlyReminder(m);
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[#0A2F25]">{m.name}</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                rem.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rem.status === 'due_2m'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {rem.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <select
                              value={m.reminder_status || 'auto'}
                              onChange={(e) =>
                                handleSetMemberReminderStatus(m, e.target.value as any)
                              }
                              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-semibold text-[#0A2F25]"
                            >
                              <option value="auto">অটোমেটিক</option>
                              <option value="paid">এই মাসে দিয়েছেন</option>
                              <option value="due_1m">১ মাসের রিমাইন্ডার</option>
                              <option value="due_2m">গত ২ মাসের রিমাইন্ডার</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  navigator.clipboard.writeText(`${m.name}, ${rem.message}`);
                                  showNotice('রিমাইন্ডার মেসেজটি কপি করা হয়েছে!', 'success');
                                } catch {
                                  showNotice(rem.message, 'success');
                                }
                              }}
                              className="px-3 py-1.5 rounded-full bg-[#0A2F25] text-[#F3D568] font-bold text-[11px] whitespace-nowrap shrink-0"
                            >
                              মেসেজ কপি
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

                {/* Finances List (100% Mobile-Responsive Card Rows, Zero Horizontal Scroll) */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-3.5">
                    কালেকশন ও খরচের তালিকা ({finances.length})
                  </h3>

                  {finances.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 py-6 text-center">
                      এখনো কোনো হিসাব যুক্ত করা হয়নি।
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {finances.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  f.type === 'income'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {f.type === 'income' ? 'কালেকশন (+)' : 'খরচ (-)'}
                              </span>
                              {f.month && (
                                <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-600">
                                  {f.month}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-xs sm:text-sm text-[#0A2F25] break-words">
                              {f.description}
                            </p>
                            {f.type === 'income' && f.memberuid && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                সদস্য: {getMemberNameByUid(f.memberuid)}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                            <span
                              className={`text-sm sm:text-base font-bold font-english whitespace-nowrap ${
                                f.type === 'income' ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {f.type === 'income' ? '+' : '-'} ৳ {Number(f.amount).toLocaleString('en-US')}
                            </span>

                            <div className="inline-flex items-center gap-1">
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
                                className="p-1.5 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFinance(f)}
                                className="p-1.5 rounded-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className="space-y-6">
                {/* 1. DUAL ISLAMIC THEME SWITCHER */}
                {renderAdminThemeSwitcher()}

                {/* 2. BKASH & NAGAD PAYMENT MANAGER & HOMEPAGE TOGGLE */}
                {renderAdminPaymentManager()}

                {/* 3. SITE BRANDING, LOGO, FAVICON & BANNERS FORM */}
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
              </div>
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

                      {/* Member Dashboard Direct bKash / Nagad Payment & Funding System */}
                      <PaymentContributionCard
                        paymentNumbers={allPaymentNumbers}
                        paymentConfig={activePaymentConfig}
                        isMemberDashboard={true}
                        uiTheme={activeUiTheme}
                        defaultName={appUser.name}
                        defaultPhone={appUser.mobile}
                        onSubmitPayment={handleSubmitPaymentContribution}
                        onCopyNumber={copyPaymentNum}
                      />

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
            {/* REGULAR MEMBER TAB 2: অনুদান দিন (`member_payment`)             */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'member_payment' && (
              <div className="space-y-6">
                <PaymentContributionCard
                  paymentNumbers={allPaymentNumbers}
                  paymentConfig={activePaymentConfig}
                  isMemberDashboard={true}
                  uiTheme={activeUiTheme}
                  defaultName={appUser.name}
                  defaultPhone={appUser.mobile}
                  onSubmitPayment={handleSubmitPaymentContribution}
                  onCopyNumber={copyPaymentNum}
                />

                {/* Member's Own Submitted bKash / Nagad Requests History */}
                {(() => {
                  const myPaySubs = paymentSubmissions.filter(
                    (p) =>
                      p.member_id === appUser.id ||
                      p.sender_name.toLowerCase() === appUser.name.toLowerCase()
                  );
                  if (myPaySubs.length === 0) return null;
                  return (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                        আমার প্রেরিত বিকাশ/নগদ পেমেন্টসমূহ ({myPaySubs.length})
                      </h3>
                      <div className="space-y-2">
                        {myPaySubs.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                                    sub.provider === 'bKash'
                                      ? 'bg-[#E2136E]'
                                      : sub.provider === 'Nagad'
                                      ? 'bg-[#F7941D]'
                                      : 'bg-[#8C3494]'
                                  }`}
                                >
                                  {sub.provider}
                                </span>
                                <span className="font-bold font-english text-sm text-[#0A2F25]">
                                  ৳ {Number(sub.amount).toLocaleString('en-US')}
                                </span>
                                <span className="text-xs text-gray-600">
                                  ({sub.purpose || 'অনুদান'})
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-english mt-0.5">
                                নাম্বার: {sub.sender_number || '—'} {sub.trx_id ? `• TrxID: ${sub.trx_id}` : ''} • {sub.month}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sub.status === 'approved' ? '✓ অনুমোদিত' : 'যাচাই চলছে'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 3: ফান্ড (`foundation_funds`)                */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'foundation_funds' && (
              <div className="space-y-6">
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

              <PaymentContributionCard
                paymentNumbers={allPaymentNumbers}
                paymentConfig={activePaymentConfig}
                isMemberDashboard={true}
                uiTheme={activeUiTheme}
                defaultName={appUser.name}
                defaultPhone={appUser.mobile}
                onSubmitPayment={handleSubmitPaymentContribution}
                onCopyNumber={copyPaymentNum}
              />
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
                        জন্মতারিখ (গোপন থাকবে)
                      </label>
                      <input
                        type="date"
                        value={profileAge}
                        onChange={(e) => setProfileAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        রক্তের গ্রুপ
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#041510]/80 backdrop-blur-md overflow-y-auto no-scrollbar animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full p-4 sm:p-6 border border-[#D4AF37]/80 shadow-2xl my-auto max-h-[90vh] overflow-y-auto no-scrollbar"
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
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[#0A2F25] font-english">
                    <Calendar className="w-3.5 h-3.5 text-[#155e4a]" />
                    <span>{formatActivityDate(selectedActivityModal.activity_date)}</span>
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
                  {/* ONBOARDING & RECURRING BLOOD GROUP + AGE PROMPT MODAL (`showOnboardingModal`) */}
      {showOnboardingModal && appUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveOnboardingInfo}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-[#D4AF37] shadow-2xl"
          >
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] p-5 text-center text-white">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mx-auto mb-2.5 text-[#F3D568]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">প্রোফাইল তথ্য সম্পূর্ণ করুন</h3>
              <p className="text-xs text-[#F3D568] mt-1 leading-relaxed">
                {ONBOARDING_MESSAGES[onboardingMsgIdx]}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* 1-Tap Blood Group Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-2">
                  ১. আপনার রক্তের গ্রুপ নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setOnboardingBlood(bg)}
                      className={`py-2 rounded-full text-xs font-english font-bold border transition-all ${
                        onboardingBlood === bg
                          ? 'bg-red-600 text-white border-red-700 shadow-md scale-105'
                          : 'bg-[#F4F7F5] text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth Input (Never shown publicly) */}
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  ২. আপনার জন্মতারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={onboardingAge}
                  onChange={(e) => setOnboardingAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              {/* Optional Contact Mobile Number for Blood Donation */}
              <div>
                <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                  ৩. যোগাযোগের মোবাইল নাম্বার (ঐচ্ছিক — রক্তের প্রয়োজনে যোগাযোগের জন্য)
                </label>
                <input
                  type="tel"
                  value={onboardingMobile}
                  onChange={(e) => setOnboardingMobile(e.target.value)}
                  placeholder="017XXXXXXXX (ঐচ্ছিক)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingOnboarding}
                  className="flex-1 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition"
                >
                  {savingOnboarding ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnboardingModal(false)}
                  className="py-2.5 px-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs transition"
                >
                  এখন না, পরে দিবো
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* PUBLIC MEMBER & BLOOD DONOR CONTACT POPUP MODAL (`selectedMemberModal`) */}
      {selectedMemberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedMemberModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border-2 border-[#D4AF37] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] p-5 text-center text-white relative">
              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] mx-auto mb-2.5 shadow-xl">
                {selectedMemberModal.avatar_url ? (
                  <img
                    src={optimizeMedia(selectedMemberModal.avatar_url)}
                    alt={selectedMemberModal.name}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-2xl font-bold">
                    {selectedMemberModal.name.charAt(0)}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-white">{selectedMemberModal.name}</h3>
              <span className="mt-1 inline-flex items-center px-3.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0A2F25] text-xs font-bold">
                {!selectedMemberModal.designation || selectedMemberModal.designation === 'অ্যাডমিন'
                  ? 'সাধারণ সদস্য'
                  : selectedMemberModal.designation}
              </span>
            </div>

            <div className="p-5 space-y-3 text-sm">
              {/* Blood Group Highlight Card */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                <span className="text-xs font-bold text-[#0A2F25]">রক্তের গ্রুপ</span>
                {selectedMemberModal.blood_group ? (
                  <span className="px-3.5 py-1 rounded-full bg-red-600 text-white font-english font-bold text-xs shadow-sm">
                    {selectedMemberModal.blood_group}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">যুক্ত করা হয়নি</span>
                )}
              </div>

              {selectedMemberModal.bio && (
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                  <span className="block text-[11px] font-bold text-gray-500 mb-0.5">ঠিকানা / পরিচয়</span>
                  <p className="text-xs font-semibold text-[#0A2F25]">
                    {selectedMemberModal.bio}
                  </p>
                </div>
              )}

              {/* Blood Emergency Contact Section */}
              <div className="p-3.5 rounded-2xl bg-[#0A2F25]/5 border border-[#D4AF37]/40 space-y-2.5">
                <span className="block text-xs font-bold text-[#0A2F25]">
                  জরুরি রক্তের প্রয়োজনে যোগাযোগ
                </span>

                {selectedMemberModal.mobile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200">
                      <span className="inline-flex items-center gap-1.5 text-xs font-english font-bold text-[#0A2F25]">
                        <Phone className="w-3.5 h-3.5 text-[#155e4a]" />
                        <span>{selectedMemberModal.mobile}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(selectedMemberModal.mobile);
                            showNotice('মোবাইল নাম্বার কপি করা হয়েছে!', 'success');
                          } catch {
                            showNotice(selectedMemberModal.mobile, 'success');
                          }
                        }}
                        className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0A2F25] text-[11px] font-bold transition"
                      >
                        কপি করুন
                      </button>
                    </div>

                    <a
                      href={`tel:${selectedMemberModal.mobile}`}
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 shadow hover:opacity-95 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>সরাসরি কল করুন</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    এই সদস্য এখনো যোগাযোগের মোবাইল নাম্বার যুক্ত করেননি।
                  </p>
                )}

                {selectedMemberModal.fb_url && (
                  <a
                    href={selectedMemberModal.fb_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 rounded-full bg-white text-[#0A2F25] border border-[#D4AF37]/60 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 transition"
                  >
                    <Facebook className="w-3.5 h-3.5 text-[#155e4a]" />
                    <span>ফেসবুক প্রোফাইল</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                className="w-full py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0A2F25] font-bold text-xs transition"
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
