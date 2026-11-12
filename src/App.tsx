import React, { useState, useEffect, useRef, useMemo } from 'react';
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
// 1. EXACT CREDENTIALS, API KEYS & CONSTANTS
// ============================================================================
const D1_DATABASE_NAME = 'nobo-alo-db';
const D1_DATABASE_ID = '2c75ca5d-1dc3-4904-acb6-4ca6bd5202cd';

const CLOUDINARY_ID = 'wz8yg950';
const CLOUDINARY_FALLBACK_CLOUD = 'dbyffzl2n';
const CLOUDINARY_FOLDER_NAME = 'nobo_alo_images';
const CLOUDINARY_UPLOAD_PRESET = 'wz8yg950';

const GOOGLE_CLIENT_ID = '55697442534-8qsn67qq9idh9q0accds2pngflitmhoo.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

const SUPER_ADMIN_EMAIL = 'mohammadraihan4386.bd@gmail.com';
const SUPER_ADMIN_DEFAULT_PASSWORDS = ['NoboAlo@2026', 'noboalo2026', '123456'];
const DEFAULT_LOGO_URL = '';
const FAVICON_URL = '';
const DEFAULT_SITE_NAME = 'নব আলো ফাউন্ডেশন';
const DEFAULT_TAGLINE = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const DEFAULT_ANNOUNCEMENT = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const FOUNDATION_FB_URL = 'https://facebook.com/noboalofoundation00';
const DEVELOPER_FB_URL = 'https://facebook.com/meraihan79';

const DEFAULT_DESIGNATIONS: string[] = [
  'সভাপতি',
  'সহ-সভাপতি',
  'সাধারণ সম্পাদক',
  'যুগ্ম সাধারণ সম্পাদক',
  'সাংগঠনিক সম্পাদক',
  'সহ-সাংগঠনিক সম্পাদক',
  'অর্থ সম্পাদক',
  'সহ-অর্থ সম্পাদক',
  'প্রচার ও প্রকাশনা সম্পাদক',
  'দপ্তর সম্পাদক',
  'সমাজকল্যাণ ও ত্রাণ সম্পাদক',
  'শিক্ষা ও সাংস্কৃতিক সম্পাদক',
  'ধর্ম বিষয়ক সম্পাদক',
  'তথ্য ও প্রযুক্তি সম্পাদক',
  'কার্যনির্বাহী সদস্য',
  'উপদেষ্টা',
  'প্রতিষ্ঠাতা সদস্য',
  'আজীবন সদস্য',
  'অ্যাডমিন',
  'সদস্য',
  'সাধারণ সদস্য'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const DEFAULT_PAYMENT_NUMBERS: PaymentMethodItem[] = [
  {
    id: 'pm-bkash-1',
    provider: 'bKash',
    number: '01800-000000',
    account_type: 'Personal (Send Money)',
    note: 'বিকাশ সেন্ড মানি করে ট্রানজেকশন আইডি দিন'
  },
  {
    id: 'pm-nagad-1',
    provider: 'Nagad',
    number: '01800-000000',
    account_type: 'Personal (Send Money)',
    note: 'নগদ সেন্ড মানি করে ট্রানজেকশন আইডি দিন'
  }
];

// ============================================================================
// 2. HELPERS: MEDIA, BD PHONE VALIDATOR, DATE FORMATTER & IMAGE COMPRESSOR
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

const optimizeGalleryThumb = (url?: string | null): string => {
  return cleanMediaUrl(url);
};

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

const formatDisplayEmail = (email?: string): string => {
  if (!email) return '';
  if (email.endsWith('@phone.noboalo.org') || email.endsWith('@noboalo.org')) return '';
  return email;
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
        if (w > maxDim || h > maxDim) {
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

const SESSION_STORAGE_KEY = 'nobo_alo_auth_session_v4';
const SETTINGS_CACHE_KEY = 'nobo_alo_site_settings_v4';
const LOCAL_D1_STORE_KEY = 'nobo_alo_d1_local_store_v4';

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

// ============================================================================
// 3. INTERFACES & PRODUCTION STATE TYPES
// ============================================================================
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
}

interface PaymentSubmission {
  id: string;
  member_id: string;
  sender_name: string;
  provider: 'bKash' | 'Nagad' | 'Rocket';
  sender_number: string;
  amount: number;
  trx_id: string;
  month: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
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
  ui_theme?: 'classic_emerald' | 'modern_pearl';
  payment_numbers?: PaymentMethodItem[];
  show_payment_on_home?: boolean;
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
  logo_url: '',
  favicon_url: '',
  banners: ['', '', '', ''],
  designations: DEFAULT_DESIGNATIONS,
  campaigns: [],
  ui_theme: 'classic_emerald',
  payment_numbers: DEFAULT_PAYMENT_NUMBERS,
  show_payment_on_home: true,
  auto_approve: false
};

// ============================================================================
// 4. CLOUDFLARE D1 API HELPER + LOCAL MIRROR FALLBACK FOR CANVAS PREVIEW
// ============================================================================
const getLocalD1Store = () => {
  const fallback = {
    settings: DEFAULT_SETTINGS,
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
        fb_url: DEVELOPER_FB_URL,
        blood_group: 'O+',
        age: '2002-01-01',
        bio: '',
        reminder_status: 'auto',
        reminder_note: ''
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
    stored.settings = {
      ...DEFAULT_SETTINGS,
      ...stored.settings,
      logo_url: cleanMediaUrl(stored.settings.logo_url),
      favicon_url: cleanMediaUrl(stored.settings.favicon_url)
    };
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
        payments: store.payments,
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
        fb_url: DEVELOPER_FB_URL
      };
      store.members.unshift(user);
      saveLocalD1Store(store);
    }
    if (!user) {
      return { ok: false, status: 401, notMounted: false, liveD1: false, data: { error: 'ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড সঠিক নয়।' } };
    }
    if (isSuper && SUPER_ADMIN_DEFAULT_PASSWORDS.includes(password)) {
      user.role = 'admin';
      user.status = 'approved';
      saveLocalD1Store(store);
      return { ok: true, status: 200, notMounted: false, liveD1: false, data: { user } };
    }
    if (user.password && user.password !== password && !isSuper) {
      return { ok: false, status: 401, notMounted: false, liveD1: false, data: { error: 'ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড সঠিক নয়।' } };
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
      age: '',
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
      store.members = store.members.map((m: any) =>
        m.id === body?.id || (body?.email && String(m.email).toLowerCase() === String(body.email).toLowerCase())
          ? { ...m, ...body }
          : m
      );
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

const callD1Api = async (endpoint: string, method = 'GET', body?: any) => {
  const normalizedEndpoint = endpoint
    .replace(/^auth\/login$/, 'login')
    .replace(/^auth\/register$/, 'register');

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
// 5. CLOUDINARY XHR UPLOAD UTILITY (`wz8yg950` + folder `nobo_alo_images`)
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
      ? `ক্লাউডিনারি আপলোড ত্রুটি: ${lastError.message}`
      : 'ক্লাউডিনারিতে ফাইল আপলোড ব্যর্থ হয়েছে।'
  );
};

// ============================================================================
// 6. REUSABLE UI COMPONENTS (GOOGLE ICON, MANDALA, LOGO, AUTO-SLIDE CARDS)
// ============================================================================
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

// Official Nobo Alo 8-Pointed Rub el Hizb Octagram Mandala (Sharp Golden Filigree)
const IslamicMandala: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 160
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
          <stop offset="0%" stopColor="#F3D568" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#D4AF37" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="112" fill="url(#octagramGlow)" />
      <circle cx="120" cy="120" r="106" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="5 4" />
      <g stroke="#F3D568" strokeOpacity="0.65" strokeWidth="2">
        <rect x="42" y="42" width="156" height="156" rx="6" />
        <rect x="42" y="42" width="156" height="156" rx="6" transform="rotate(45 120 120)" />
      </g>
      <g stroke="#D4AF37" strokeOpacity="0.75" strokeWidth="1.5">
        <rect x="64" y="64" width="112" height="112" rx="4" />
        <rect x="64" y="64" width="112" height="112" rx="4" transform="rotate(45 120 120)" />
      </g>
      <circle cx="120" cy="120" r="28" stroke="#F3D568" strokeOpacity="0.6" strokeWidth="1.5" />
      <circle cx="120" cy="120" r="8" fill="#F3D568" fillOpacity="0.7" />
    </svg>
  </div>
);

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
          <g fill="none" stroke="#1E4D43" strokeWidth="5.5" strokeLinejoin="round">
            <rect x="20" y="20" width="60" height="60" rx="2" fill="#FFFFFF" />
            <rect x="20" y="20" width="60" height="60" rx="2" transform="rotate(45 50 50)" fill="#FFFFFF" />
          </g>
          <g fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinejoin="round">
            <rect x="26" y="26" width="48" height="48" rx="1.5" />
            <rect x="26" y="26" width="48" height="48" rx="1.5" transform="rotate(45 50 50)" />
          </g>
          <path d="M50 27 A4.5 4.5 0 1 0 54.5 31.5 A3.5 3.5 0 1 1 50 27 Z" fill="#1E4D43" />
          <path d="M36 56 L36 46 C36 37 50 32 50 32 C50 32 64 37 64 46 L64 56 L50 64 Z" fill="#1E4D43" />
          <path d="M34 55 L49 63 L49 69 L34 61 Z M66 55 L51 63 L51 69 L66 61 Z" fill="#D4AF37" />
        </svg>
      )}
    </div>
  );
};

// Auto-Sliding Activity Card Component (Supports Both Classic Emerald & Modern Pearl Bento Magazine Themes!)
const ActivityCardItem: React.FC<{
  act: ActivityItem;
  uiTheme?: 'classic_emerald' | 'modern_pearl';
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

  const showComingSoon = checkIsComingSoon(act.is_coming_soon, act.activity_date);
  const formattedDate = formatActivityDate(act.activity_date);

  if (uiTheme === 'modern_pearl') {
    return (
      <article
        onClick={() => onSelect(act)}
        className="group cursor-pointer relative h-80 rounded-3xl overflow-hidden bg-[#0A2F25] border border-gray-200 hover:border-[#D4AF37] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-end"
      >
        {validMedia.length > 0 ? (
          validMedia.map((mediaUrl, idx) => {
            const active = idx === slideIdx;
            const mediaIsVid = isMediaVideo(mediaUrl);
            return (
              <div
                key={`${mediaUrl}-${idx}`}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  active ? 'opacity-100 scale-100 z-0' : 'opacity-0 scale-105 z-0 pointer-events-none'
                }`}
              >
                {mediaIsVid ? (
                  <video
                    src={optimizeMedia(mediaUrl)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A2F25] to-[#155e4a] flex items-center justify-center">
            <HeartHandshake className="w-12 h-12 text-[#D4AF37]/40" />
          </div>
        )}

        {/* Magazine Gradient Overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(4,20,15,0.96) 0%, rgba(7,34,27,0.68) 45%, rgba(0,0,0,0.15) 100%)'
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#0A2F25] shadow-sm">
            {act.category || 'সাধারণ'}
          </span>
          {showComingSoon ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#0A2F25] shadow">
              <Clock className="w-3 h-3" />
              <span>শীঘ্রই আসছে</span>
            </span>
          ) : formattedDate ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/50 text-white border border-white/20 backdrop-blur-md font-english">
              <Calendar className="w-3 h-3 text-[#F3D568]" />
              <span>{formattedDate}</span>
            </span>
          ) : null}
        </div>

        {/* Bottom Magazine Content */}
        <div className="relative z-20 p-5 text-white">
          {validMedia.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 mb-2.5"
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
                    dotIdx === slideIdx ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#F3D568] transition-colors mb-1 line-clamp-1">
            {act.title}
          </h3>
          <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed mb-3">
            {act.description}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <span className="text-xs font-english font-bold text-[#F3D568]">See More</span>
            <span className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-[#D4AF37] group-hover:text-[#0A2F25] flex items-center justify-center transition-all">
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

        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, rgba(5,24,19,0.65), transparent)' }}
        />

        <span className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0A2F25]/85 text-[#F3D568] border border-[#D4AF37]/50 backdrop-blur-md shadow-sm">
          {act.category || 'সাধারণ'}
        </span>

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

// Activity Detail Modal Slider
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
      <div className="relative w-full bg-black/95 rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-xl">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A2F25]/85 hover:bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="পরবর্তী স্লাইড"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A2F25]/85 hover:bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              {validMedia.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`স্লাইড ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/55'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 7. REUSABLE BKASH / NAGAD CONTRIBUTION WIDGET (USED ON HOMEPAGE & MEMBER DASHBOARD)
// ============================================================================
const PaymentContributionCard: React.FC<{
  paymentNumbers: PaymentMethodItem[];
  defaultName?: string;
  defaultPhone?: string;
  onSubmitPayment: (payload: {
    provider: 'bKash' | 'Nagad' | 'Rocket';
    amount: number;
    sender_number: string;
    trx_id: string;
    month: string;
    sender_name: string;
  }) => Promise<void>;
  onCopyNumber: (num: string, provider: string) => void;
  compact?: boolean;
}> = ({
  paymentNumbers,
  defaultName = '',
  defaultPhone = '',
  onSubmitPayment,
  onCopyNumber,
  compact = false
}) => {
  const bnMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const curMonthName = `${bnMonths[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const [provider, setProvider] = useState<'bKash' | 'Nagad' | 'Rocket'>(
    paymentNumbers[0]?.provider || 'bKash'
  );
  const [amount, setAmount] = useState('');
  const [senderNumber, setSenderNumber] = useState(defaultPhone);
  const [trxId, setTrxId] = useState('');
  const [senderName, setSenderName] = useState(defaultName);
  const [month, setMonth] = useState(curMonthName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultName && !senderName) setSenderName(defaultName);
    if (defaultPhone && !senderNumber) setSenderNumber(defaultPhone);
  }, [defaultName, defaultPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) return;
    if (!senderNumber.trim() && !trxId.trim()) return;
    setSubmitting(true);
    await onSubmitPayment({
      provider,
      amount: numAmt,
      sender_number: senderNumber.trim(),
      trx_id: trxId.trim(),
      month: month.trim() || curMonthName,
      sender_name: senderName.trim() || defaultName || 'শুভাকাঙ্ক্ষী'
    });
    setSubmitting(false);
    setAmount('');
    setTrxId('');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#D4AF37]/55 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0A2F25] text-[#F3D568] flex items-center justify-center shadow shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
              মানবিক কাজে সহযোগিতা ও ফান্ড প্রদান (বিকাশ / নগদ)
            </h3>
            <p className="text-xs text-gray-500">
              নিচের যেকোনো নাম্বারে ফান্ড পাঠিয়ে টাকার পরিমাণ ও নাম্বার/TrxID জমা দিন
            </p>
          </div>
        </div>
      </div>

      {/* Active bKash / Nagad Numbers Grid */}
      {paymentNumbers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentNumbers.map((pm) => {
            const isBkash = pm.provider === 'bKash';
            const isNagad = pm.provider === 'Nagad';
            return (
              <div
                key={pm.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
                  isBkash
                    ? 'bg-pink-50/70 border-pink-200'
                    : isNagad
                    ? 'bg-orange-50/70 border-orange-200'
                    : 'bg-purple-50/70 border-purple-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-english font-bold text-white ${
                        isBkash
                          ? 'bg-[#E2136E]'
                          : isNagad
                          ? 'bg-[#F7941D]'
                          : 'bg-[#8C3494]'
                      }`}
                    >
                      {pm.provider}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600 truncate">
                      {pm.account_type}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold font-english text-[#0A2F25] mt-1">
                    {pm.number}
                  </p>
                  {pm.note && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{pm.note}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onCopyNumber(pm.number, pm.provider)}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] border border-gray-300 text-xs font-bold shadow-sm transition shrink-0"
                >
                  নাম্বার কপি
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Contribution Verification Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end pt-1">
        {!defaultName && (
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] mb-1">আপনার নাম</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="আপনার নাম (ঐচ্ছিক)"
              className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#0A2F25] mb-1">মাধ্যম নির্বাচন *</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-bold text-[#0A2F25] focus:outline-none focus:border-[#0A2F25]"
          >
            <option value="bKash">বিকাশ (bKash)</option>
            <option value="Nagad">নগদ (Nagad)</option>
            <option value="Rocket">রকেট (Rocket)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A2F25] mb-1">পরিমাণ (৳) *</label>
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="যেমন: 500"
            className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A2F25] mb-1">
            প্রেরকের নাম্বার বা TrxID *
          </label>
          <input
            type="text"
            required
            value={trxId || senderNumber}
            onChange={(e) => {
              setTrxId(e.target.value);
              setSenderNumber(e.target.value);
            }}
            placeholder="যে নাম্বার থেকে পাঠিয়েছেন / TrxID"
            className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
          />
        </div>

        <div className={ !defaultName ? 'sm:col-span-2 lg:col-span-4' : '' }>
          <button
            type="submit"
            disabled={submitting}
            className="btn-glossy-emerald w-full py-2.5 px-5 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition"
          >
            {submitting ? 'জমা হচ্ছে...' : 'সহযোগিতা তথ্য নিশ্চিত করুন'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// 8. MAIN PRODUCTION APPLICATION COMPONENT (`App`)
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
      ...DEFAULT_SETTINGS,
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

  const [appUser, setAppUser] = useState<MemberUser | null>(() =>
    readLocalJson<MemberUser | null>(SESSION_STORAGE_KEY, null)
  );
  const [activeTab, setActiveTab] = useState<string>('overview');
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);
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

  useEffect(() => {
    writeLocalJson(SESSION_STORAGE_KEY, appUser);
  }, [appUser]);

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
      age: u.age ? String(u.age) : '',
      bio: u.bio ? String(u.bio) : '',
      reminder_status: (['auto', 'paid', 'due_1m', 'due_2m'].includes(u.reminder_status) ? u.reminder_status : 'auto') as any,
      reminder_note: u.reminder_note ? String(u.reminder_note) : '',
      created_at: u.created_at
    };
  };

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
              ...DEFAULT_SETTINGS,
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
      }
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const syncTimer = setInterval(() => {
      fetchAllData();
    }, 15000);
    return () => clearInterval(syncTimer);
  }, []);

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
        latest.blood_group !== appUser.blood_group ||
        latest.age !== appUser.age
      ) {
        setAppUser(latest);
      }
    }
  }, [members]);

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
    if (siteSettings.logo_url) pushUrl(siteSettings.logo_url, 'logo');
    for (const mem of members) {
      if (mem.avatar_url && !mem.avatar_url.includes('unavatar.io')) {
        pushUrl(mem.avatar_url, `mem-${mem.id}`, mem.created_at);
      }
    }
    return combined;
  }, [gallery, activities, siteSettings.banners, siteSettings.logo_url, members]);

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
    await callD1Api('ideas', 'POST', newIdea);
    setIdeaSubmitting(false);
    showNotice('আপনার মূল্যবান পরিকল্পনা সফলভাবে জমা হয়েছে! ধন্যবাদ।', 'success');
  };

  // ============================================================================
  // 9. AUTHENTICATION, ONBOARDING, DESIGNATIONS, CAMPAIGNS & BKASH/NAGAD HANDLERS
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

  // Blood Group & Date of Birth Onboarding Popup States
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

  // Campaign Form State
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

  // Admin bKash / Nagad Number Form State
  const [newPaymentForm, setNewPaymentForm] = useState<{
    provider: 'bKash' | 'Nagad' | 'Rocket';
    number: string;
    account_type: string;
    note: string;
  }>({
    provider: 'bKash',
    number: '',
    account_type: 'Personal (Send Money)',
    note: ''
  });

  const [authLoading, setAuthLoading] = useState(false);

  const activeDesignations = useMemo(() => {
    const list =
      siteSettings.designations && siteSettings.designations.length > 0
        ? siteSettings.designations
        : DEFAULT_DESIGNATIONS;
    return Array.from(new Set(list));
  }, [siteSettings.designations]);

  const activePaymentNumbers = useMemo(() => {
    return Array.isArray(siteSettings.payment_numbers) && siteSettings.payment_numbers.length > 0
      ? siteSettings.payment_numbers
      : DEFAULT_PAYMENT_NUMBERS;
  }, [siteSettings.payment_numbers]);

  const activeUiTheme: 'classic_emerald' | 'modern_pearl' =
    siteSettings.ui_theme === 'modern_pearl' ? 'modern_pearl' : 'classic_emerald';

  useEffect(() => {
    if (!headerProfileMenuOpen) return;
    const handleOutsideClick = (ev: MouseEvent | TouchEvent) => {
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(ev.target as Node)) {
        setHeaderProfileMenuOpen(false);
      }
    };
    const handleWindowScroll = () => setHeaderProfileMenuOpen(false);
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

  const requestBrowserNotificationAccess = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {
      // ignore
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
      // ignore
    }
  };

  useEffect(() => {
    if (!appUser) {
      setShowOnboardingModal(false);
      return;
    }
    requestBrowserNotificationAccess();

    const missingBloodOrDob = !appUser.blood_group || !appUser.age;
    if (missingBloodOrDob) {
      setOnboardingBlood(appUser.blood_group || '');
      setOnboardingAge(appUser.age || '');
      setOnboardingMobile(appUser.mobile || '');
      const initialTimer = setTimeout(() => {
        setShowOnboardingModal(true);
      }, 600);

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
      age: onboardingAge.trim(),
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
                  const exists = prev.some(
                    (m) => m.id === loggedUser.id || m.email.toLowerCase() === loggedUser.email.toLowerCase()
                  );
                  return exists
                    ? prev.map((m) =>
                        m.id === loggedUser.id || m.email.toLowerCase() === loggedUser.email.toLowerCase()
                          ? loggedUser
                          : m
                      )
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
        // fallback below
      }
    }
    showNotice('গুগল লগইন পপআপ লোড হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করে আবার ক্লিক করুন।', 'error');
  };

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
    setMembers((prev) => [...prev.filter((m) => m.email.toLowerCase() !== resolvedEmail), createdUser]);
    setJoinForm({ name: '', email: '', mobile: '', fb_url: '', password: '' });
    if (createdUser.status === 'approved') {
      setAppUser(createdUser);
      showNotice('অভিনন্দন! আপনার একাউন্টটি অনুমোদিত হয়েছে।', 'success');
      setCurrentView('dashboard');
    } else {
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
    const logRes = await callD1Api('auth/login', 'POST', {
      identifier: cleanIdentifier,
      email: cleanIdentifier,
      password: loginForm.password
    });
    setAuthLoading(false);
    if (!logRes.ok) {
      showNotice(logRes.data?.error || 'ইমেইল/মোবাইল নাম্বার অথবা পাসওয়ার্ড সঠিক নয়।', 'error');
      return;
    }
    const loggedUser = normalizeMemberRow(logRes.data.user);
    setAppUser(loggedUser);
    setLoginForm({ email: '', password: '' });
    showNotice(`স্বাগতম, ${loggedUser.name}!`, 'success');
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    setAppUser(null);
    setCurrentView('home');
    showNotice('সফলভাবে লগআউট করা হয়েছে।', 'success');
  };

  const canActorManageMember = (actor: MemberUser | null, target: MemberUser): boolean => {
    if (!actor || actor.role !== 'admin') return false;
    const actorIsSuper = actor.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const targetIsSuper = target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (targetIsSuper) return false;
    if (actorIsSuper) return true;
    if (target.id === actor.id) return false;
    if (actor.promoted_by && target.id === actor.promoted_by) return false;
    if (target.role === 'admin' && target.promoted_by !== actor.id) return false;
    return true;
  };

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
    await callD1Api('gallery', 'POST', newGal);
  };

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

  const handleSwitchUiTheme = async (nextTheme: 'classic_emerald' | 'modern_pearl') => {
    const nextSettings = { ...siteSettings, ui_theme: nextTheme };
    await persistSettingsInstant(nextSettings);
    showNotice(
      nextTheme === 'modern_pearl'
        ? 'নতুন "মডার্ন পার্ল ও বেন্টো ইউআই" থিম পুরো ওয়েবসাইটে সেট করা হয়েছে!'
        : '"ক্লাসিক রয়্যাল এমেরাল্ড ইউআই" থিম পুরো ওয়েবসাইটে সেট করা হয়েছে!',
      'success'
    );
  };

  const handleToggleAutoApprove = async () => {
    const nextVal = !siteSettings.auto_approve;
    await persistSettingsInstant({ ...siteSettings, auto_approve: nextVal });
    showNotice(
      nextVal ? 'অটো-অ্যাপ্রুভাল চালু করা হয়েছে।' : 'অটো-অ্যাপ্রুভাল বন্ধ করা হয়েছে।',
      'success'
    );
  };

  const handleToggleShowPaymentOnHome = async () => {
    const nextVal = !siteSettings.show_payment_on_home;
    await persistSettingsInstant({ ...siteSettings, show_payment_on_home: nextVal });
    showNotice(
      nextVal
        ? 'হোমপেজে পাবলিক বিকাশ/নগদ সহযোগিতা সেকশন চালু করা হয়েছে!'
        : 'হোমপেজ থেকে বিকাশ/নগদ সহযোগিতা সেকশন হাইড করা হয়েছে।',
      'success'
    );
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentForm.number.trim()) {
      showNotice('বিকাশ বা নগদ নাম্বার লিখুন।', 'error');
      return;
    }
    const newMethod: PaymentMethodItem = {
      id: `pm-${Date.now()}`,
      provider: newPaymentForm.provider,
      number: newPaymentForm.number.trim(),
      account_type: newPaymentForm.account_type.trim() || 'Personal (Send Money)',
      note: newPaymentForm.note.trim()
    };
    const nextList = [...activePaymentNumbers, newMethod];
    setNewPaymentForm({
      provider: 'bKash',
      number: '',
      account_type: 'Personal (Send Money)',
      note: ''
    });
    await persistSettingsInstant({ ...siteSettings, payment_numbers: nextList });
    showNotice(`${newMethod.provider} নাম্বার (${newMethod.number}) যুক্ত হয়েছে!`, 'success');
  };

  const handleDeletePaymentMethod = async (id: string) => {
    const nextList = activePaymentNumbers.filter((p) => p.id !== id);
    await persistSettingsInstant({ ...siteSettings, payment_numbers: nextList });
    showNotice('পেমেন্ট নাম্বারটি মুছে ফেলা হয়েছে।', 'success');
  };

  const handleSubmitPaymentContribution = async (payload: {
    provider: 'bKash' | 'Nagad' | 'Rocket';
    amount: number;
    sender_number: string;
    trx_id: string;
    month: string;
    sender_name: string;
  }) => {
    const newSub: PaymentSubmission = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      member_id: appUser?.id || '',
      sender_name: payload.sender_name || appUser?.name || 'শুভাকাঙ্ক্ষী',
      provider: payload.provider,
      sender_number: payload.sender_number,
      amount: payload.amount,
      trx_id: payload.trx_id,
      month: payload.month,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setPaymentSubmissions((prev) => [newSub, ...prev]);
    await callD1Api('payments', 'POST', newSub);
    showNotice('আপনার সহযোগিতার তথ্য জমা হয়েছে! অ্যাডমিন যাচাই করে ফান্ডে যুক্ত করবেন।', 'success');
  };

  const handleApprovePaymentSubmission = async (sub: PaymentSubmission) => {
    setPaymentSubmissions((prev) =>
      prev.map((p) => (p.id === sub.id ? { ...p, status: 'approved' } : p))
    );
    await callD1Api('payments', 'PUT', { id: sub.id, status: 'approved' });

    const finRecord: FinanceRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fin-${Date.now()}`,
      type: 'income',
      amount: Number(sub.amount),
      memberuid: sub.member_id || '',
      month: sub.month || '',
      description: `${sub.provider} সহযোগিতা (${sub.sender_name}${sub.trx_id ? ' • ' + sub.trx_id : ''})`,
      created_at: new Date().toISOString()
    };
    setFinances((prev) => [finRecord, ...prev]);
    await callD1Api('finances', 'POST', finRecord);

    if (sub.member_id) {
      const targetMem = members.find((m) => m.id === sub.member_id);
      if (targetMem) {
        await handleSetMemberReminderStatus(targetMem, 'paid');
      }
    }
    showNotice(`${sub.sender_name}-এর ৳${sub.amount} ফান্ডে যুক্ত করা হয়েছে!`, 'success');
  };

  const handleDeletePaymentSubmission = async (subId: string) => {
    setPaymentSubmissions((prev) => prev.filter((p) => p.id !== subId));
    await callD1Api(`payments?id=${encodeURIComponent(subId)}`, 'DELETE');
    showNotice('পেমেন্ট রিকোয়েস্টটি মুছে ফেলা হয়েছে।', 'success');
  };

  const handleApproveMember = (member: MemberUser) => {
    setConfirmDialog({
      open: true,
      title: 'সদস্য অনুমোদন নিশ্চিত করুন',
      message: `আপনি কি "${member.name}"-কে নব আলো ফাউন্ডেশনের অনুমোদিত সদস্য হিসেবে যুক্ত করতে চান?`,
      isDanger: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: 'approved' } : m))
        );
        showNotice(`${member.name}-কে সফলভাবে অনুমোদন দেওয়া হয়েছে!`, 'success');
        await callD1Api('members', 'PUT', { id: member.id, status: 'approved' });
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
        await callD1Api(`members?id=${encodeURIComponent(member.id)}`, 'DELETE');
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
        ? `${member.name}-কে অ্যাডমিন করা হয়েছে!`
        : `${member.name}-এর রোল সাধারণ সদস্য করা হয়েছে।`,
      'success'
    );
    await callD1Api('members', 'PUT', {
      id: member.id,
      role: newRole,
      designation: updatedDesignation,
      promoted_by: promotedByVal
    });
  };

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

  const allCampaigns = useMemo(() => {
    return Array.isArray(siteSettings.campaigns) ? siteSettings.campaigns : [];
  }, [siteSettings.campaigns]);

  const activeHomepageCampaigns = useMemo(() => {
    return allCampaigns.filter((c) => c && c.is_active);
  }, [allCampaigns]);

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

  const [editingMember, setEditingMember] = useState<MemberUser | null>(null);

  const handleEditMemberAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;
    setUploadState({ active: true, percent: 0, label: 'সদস্যের ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(
        file,
        (percent) => {
          setUploadState({ active: true, percent, label: 'সদস্যের ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
        },
        'avatar'
      );
      setEditingMember((prev) => (prev ? { ...prev, avatar_url: uploadedUrl } : null));
      await autoRecordInGallery(uploadedUrl);
      showNotice('ছবি সফলভাবে আপলোড হয়েছে!', 'success');
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
    showNotice(`${updated.name}-এর তথ্য সফলভাবে আপডেট করা হয়েছে!`, 'success');
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
        description:
          financeForm.description.trim() ||
          (financeForm.type === 'income' ? 'সদস্যের মাসিক জমা' : 'ফাউন্ডেশন খরচ')
      };
      setFinances((prev) => prev.map((f) => (f.id === updatedRecord.id ? updatedRecord : f)));
      setFinanceForm({ id: '', type: 'income', amount: '', memberuid: '', month: '', description: '' });
      showNotice('হিসাব সফলভাবে আপডেট করা হয়েছে!', 'success');
      await callD1Api('finances', 'PUT', updatedRecord);
    } else {
      const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fin-${Date.now()}`;
      const newRecord: FinanceRecord = {
        id: tempId,
        type: financeForm.type,
        amount: numericAmount,
        memberuid: financeForm.type === 'income' ? financeForm.memberuid : '',
        month: financeForm.month.trim(),
        description:
          financeForm.description.trim() ||
          (financeForm.type === 'income' ? 'সদস্যের মাসিক জমা' : 'ফাউন্ডেশন খরচ'),
        created_at: new Date().toISOString()
      };
      setFinances((prev) => [newRecord, ...prev]);
      setFinanceForm({ id: '', type: 'income', amount: '', memberuid: '', month: '', description: '' });
      showNotice('নতুন হিসাব সফলভাবে যুক্ত করা হয়েছে!', 'success');
      await callD1Api('finances', 'POST', newRecord);
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
        await callD1Api(`finances?id=${encodeURIComponent(record.id)}`, 'DELETE');
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
  };

  const moveWorkMedia = (index: number, direction: -1 | 1) => {
    setWorkForm((prev) => {
      const next = [...prev.media];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, media: next };
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
        media: workForm.media
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
      showNotice('কার্যক্রম সফলভাবে আপডেট করা হয়েছে!', 'success');
      await callD1Api('activities', 'PUT', updatedAct);
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
      await callD1Api('activities', 'POST', newAct);
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
        await callD1Api(`activities?id=${encodeURIComponent(act.id)}`, 'DELETE');
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
        await callD1Api(`ideas?id=${encodeURIComponent(item.id)}`, 'DELETE');
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
        await callD1Api('gallery', 'POST', newGal);
        showNotice('গ্যালারিতে নতুন মিডিয়া যুক্ত হয়েছে!', 'success');
      } catch (err: any) {
        showNotice(err?.message || 'গ্যালারি আপলোড ব্যর্থ হয়েছে।', 'error');
      }
    }
    setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
  };

  const handleDeleteGalleryItem = (item: GalleryItem) => {
    setConfirmDialog({
      open: true,
      title: 'গ্যালারি মিডিয়া ডিলিট',
      message: 'আপনি কি এই ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setGallery((prev) => prev.filter((g) => g.id !== item.id));
        showNotice('গ্যালারি থেকে মুছে ফেলা হয়েছে।', 'success');
        await callD1Api(`gallery?id=${encodeURIComponent(item.id)}`, 'DELETE');
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ active: true, percent: 0, label: 'সাইট লোগো ও ফেভিকন আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(
        file,
        (percent) => {
          setUploadState({ active: true, percent, label: 'সাইট লোগো ও ফেভিকন আপলোড হচ্ছে...' });
        },
        'logo'
      );
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
      const uploadedUrl = await uploadMediaToCloudinary(
        file,
        (percent) => {
          setUploadState({ active: true, percent, label: 'ফেভিকন (Favicon) আপলোড হচ্ছে...' });
        },
        'logo'
      );
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
    setUploadState({ active: true, percent: 0, label: 'প্রোফাইল ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(
        file,
        (percent) => {
          setUploadState({ active: true, percent, label: 'প্রোফাইল ছবি কম্প্রেস ও আপলোড হচ্ছে...' });
        },
        'avatar'
      );
      const updatedUser = { ...appUser, avatar_url: uploadedUrl };
      setAppUser(updatedUser);
      setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));
      await autoRecordInGallery(uploadedUrl);
      await callD1Api('members', 'PUT', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        designation: updatedUser.designation,
        avatar_url: uploadedUrl
      });
      showNotice('প্রোফাইল ছবি সফলভাবে পরিবর্তন হয়েছে!', 'success');
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
      age: profileAge.trim(),
      fb_url: profileFbUrl.trim(),
      bio: profileBio.trim()
    };
    setAppUser(updatedUser);
    setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));

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

    setProfileNewPassword('');
    showNotice('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', 'success');
  };

  const getMemberNameByUid = (uid?: string) => {
    if (!uid) return 'সাধারণ তহবিল';
    const found = members.find((m) => m.id === uid);
    return found ? found.name : 'সদস্য';
  };

  const copyPaymentNum = (num: string, providerName: string) => {
    try {
      navigator.clipboard.writeText(num);
      showNotice(`${providerName} নাম্বার (${num}) কপি করা হয়েছে!`, 'success');
    } catch {
      showNotice(`${providerName}: ${num}`, 'success');
    }
  };

  // ============================================================================
  // 10. RENDER DUAL-THEME APPLICATION UI (`classic_emerald` | `modern_pearl`)
  // ============================================================================
  return (
    <div
      className={`min-h-screen flex flex-col overflow-x-hidden w-full max-w-[100vw] selection:bg-[#D4AF37] selection:text-[#0A2F25] ${
        activeUiTheme === 'modern_pearl'
          ? 'bg-[#F8FAF9] text-[#0A2F25]'
          : 'bg-[#F4F7F5] text-[#0A2F25]'
      }`}
    >
      {/* 1. TOP MARQUEE ANNOUNCEMENT BAR (DEEP EMERALD) */}
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

      {/* 2. WHITE FROSTED GLASS HEADER / NAVBAR (CONTRASTS CLEANLY BETWEEN TOP BAR & HERO!) */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          isPageScrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/90 shadow-[0_8px_30px_rgba(10,47,37,0.10)] py-1.5'
            : 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm py-2.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 relative">
          {/* Left Side: Circular Logo + Emerald Site Name on Clean White Header */}
          <button
            type="button"
            onClick={() => {
              setHeaderProfileMenuOpen(false);
              setCurrentView('home');
            }}
            className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none min-w-0 shrink"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <WhiteCircularLogo
                logoUrl={siteSettings.logo_url}
                sizeClass="w-9 h-9 sm:w-11 sm:h-11"
              />
            </div>
            <div className="min-w-0">
              <span className="block text-[15px] sm:text-xl md:text-2xl font-bold text-[#0A2F25] leading-tight whitespace-nowrap truncate group-hover:text-[#155e4a] transition-colors">
                {siteSettings.site_name || DEFAULT_SITE_NAME}
              </span>
              <span className="hidden sm:block text-[11px] text-gray-500 truncate max-w-xs">
                {siteSettings.tagline || DEFAULT_TAGLINE}
              </span>
            </div>
          </button>

          {/* Right Side Navigation Buttons (Only Active View Turns Golden/Emerald!) */}
          <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
                  ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-md'
                  : 'bg-[#F4F7F5] text-[#0A2F25] border-gray-200 hover:border-[#D4AF37] hover:bg-gray-100'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${currentView === 'members' ? 'text-[#F3D568]' : 'text-[#155e4a]'}`} />
              <span className={appUser ? 'hidden sm:inline' : 'inline'}>সদস্য</span>
            </button>

            {!appUser ? (
              <button
                type="button"
                onClick={() => setCurrentView('join')}
                aria-label="যুক্ত হোন"
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shrink-0 ${
                  currentView === 'join' || currentView === 'login'
                    ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-md'
                    : 'bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border-[#D4AF37] shadow-sm hover:opacity-95'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>যুক্ত হোন</span>
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
                  title="ড্যাশবোর্ড"
                  className={`inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap shrink-0 ${
                    currentView === 'dashboard'
                      ? 'bg-[#0A2F25] text-[#F3D568] border-[#D4AF37] shadow-md'
                      : 'bg-[#F4F7F5] text-[#0A2F25] border-gray-200 hover:border-[#D4AF37] hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-[#F3D568]' : 'text-[#155e4a]'}`} />
                  <span className="hidden sm:inline">ড্যাশবোর্ড</span>
                </button>

                {/* Circular Profile Avatar Button */}
                <div className="relative" ref={profilePopoverRef}>
                  <button
                    type="button"
                    onClick={() => setHeaderProfileMenuOpen((prev) => !prev)}
                    aria-label="প্রোফাইল মেনু"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] shadow-md hover:scale-105 transition-transform focus:outline-none shrink-0"
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
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </button>

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

      {/* NON-BLOCKING CLOUDINARY UPLOAD TOAST BAR */}
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
        {/* VIEW 1: HOME VIEW (`home` — Supports Both Classic & Modern Themes) */}
        {/* ================================================================== */}
        {currentView === 'home' && (
          <div>
            {activeUiTheme === 'modern_pearl' ? (
              /* THEME 2: MODERN PEARL & BENTO MAGAZINE HERO */
              <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F4F8F6] to-[#EBF2EE] py-8 sm:py-14 px-3 sm:px-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2F25]/8 border border-[#D4AF37]/60 text-[#0A2F25] text-xs font-bold mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{INSPIRATIONAL_FLOATING_QUOTES[quoteIndex]}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0A2F25] leading-tight mb-3">
                      মানবতার সেবায়{' '}
                      <span className="text-[#155e4a] underline decoration-[#D4AF37]/60">
                        {siteSettings.site_name || DEFAULT_SITE_NAME}
                      </span>
                    </h1>

                    <p className="text-xs sm:text-base text-gray-600 max-w-xl mb-6 leading-relaxed">
                      {siteSettings.tagline || DEFAULT_TAGLINE}
                    </p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentView('join')}
                        className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-lg hover:scale-[1.02] transition-all whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>সদস্য হিসেবে যুক্ত হোন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentView('members')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-gray-50 text-[#0A2F25] border border-gray-300 font-bold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
                      >
                        <Users className="w-4 h-4 text-[#155e4a]" />
                        <span>সদস্যবৃন্দ দেখুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side Bento Banner Showcase Frame */}
                  <div className="lg:col-span-5">
                    <div className="relative h-56 sm:h-72 rounded-3xl overflow-hidden bg-[#0A2F25] border-2 border-[#D4AF37]/60 shadow-2xl flex items-center justify-center">
                      {validBanners.map((bannerUrl, idx) => (
                        <div
                          key={idx}
                          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            idx === bannerIndex ? 'opacity-75 animate-kenburns' : 'opacity-0'
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
                            'radial-gradient(circle at 50% 50%, rgba(10,47,37,0.18) 0%, rgba(5,24,19,0.75) 100%)'
                        }}
                      />
                      <div className="relative z-10 flex flex-col items-center text-center p-4">
                        <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-xl mb-2.5">
                          <WhiteCircularLogo
                            logoUrl={siteSettings.logo_url}
                            sizeClass="w-16 h-16 sm:w-20 sm:h-20"
                          />
                        </div>
                        <span className="px-3.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-[#F3D568] border border-[#D4AF37]/40 text-xs font-bold">
                          {siteSettings.site_name || DEFAULT_SITE_NAME}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              /* THEME 1: CLASSIC ROYAL EMERALD HERO (CLEAR CENTER + CORNER VINTAGE SHADE + MOVING SLIDES + VISIBLE MANDALAS) */
              <section className="relative overflow-hidden bg-[#07221B] text-white min-h-[260px] sm:min-h-[410px] flex flex-col items-center justify-center py-7 sm:py-13 px-3 sm:px-6 border-b-2 border-[#D4AF37]">
                {/* Moving Background Banner Slideshow (Clear Center, Soft Opacity, Slow Pan/Zoom Motion!) */}
                {validBanners.map((bannerUrl, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      idx === bannerIndex ? 'opacity-40 animate-kenburns' : 'opacity-0'
                    }`}
                    style={{
                      backgroundImage: `url("${optimizeMedia(bannerUrl)}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                ))}

                {/* Clear Center + Corner-Only Radial Vintage Vignette */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      validBanners.length > 0
                        ? 'radial-gradient(circle at 50% 48%, rgba(10,47,37,0.22) 0%, rgba(8,36,28,0.68) 64%, rgba(4,18,14,0.95) 100%)'
                        : 'radial-gradient(circle at 50% 45%, rgba(21,94,74,0.55) 0%, rgba(10,47,37,0.88) 70%, rgba(4,18,14,0.98) 100%)',
                    boxShadow: 'inset 0 0 75px 22px rgba(3, 16, 12, 0.85)'
                  }}
                />

                {/* Clearly Visible Sharp Golden Corner Mandalas */}
                <div className="absolute -left-8 -top-8 opacity-35 pointer-events-none">
                  <IslamicMandala className="animate-mandala" size={145} />
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-35 pointer-events-none">
                  <IslamicMandala className="animate-mandala-reverse" size={150} />
                </div>

                {/* Floating Inspirational Glass Cards on Desktop Sides */}
                <div className="hidden lg:flex items-center gap-2 absolute left-8 top-1/3 px-3.5 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-[#D4AF37]/40 text-[11px] text-[#F3D568] shadow-lg animate-float-slow pointer-events-none max-w-[210px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>ক্ষুদ্র দানে ফোটুক অসহায়ের মুখে হাসি</span>
                </div>
                <div className="hidden lg:flex items-center gap-2 absolute right-8 bottom-1/3 px-3.5 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-[#D4AF37]/40 text-[11px] text-[#F3D568] shadow-lg animate-float-delayed pointer-events-none max-w-[210px]">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>মানবতার সেবায় ঐক্যবদ্ধ পথচলা</span>
                </div>

                {/* Compact Hero Center Content */}
                <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
                  <div className="relative mb-2.5 sm:mb-3.5 flex items-center justify-center">
                    <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.45)]">
                      <WhiteCircularLogo
                        logoUrl={siteSettings.logo_url}
                        sizeClass="w-14 h-14 sm:w-20 sm:h-20"
                      />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-black/35 backdrop-blur-md border border-[#D4AF37]/50 text-[#F3D568] text-[10px] sm:text-xs font-medium mb-2">
                    <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
                    <span>{INSPIRATIONAL_FLOATING_QUOTES[quoteIndex]}</span>
                  </div>

                  <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-white leading-snug mb-1.5 sm:mb-2.5 drop-shadow-md">
                    মানবতার সেবায় {siteSettings.site_name || DEFAULT_SITE_NAME}
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base text-gray-100 max-w-lg mb-4 sm:mb-5 leading-relaxed drop-shadow">
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
                    <button
                      type="button"
                      onClick={() => setCurrentView('members')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-black/35 hover:bg-black/50 backdrop-blur-md text-white border border-[#D4AF37]/60 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap"
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
                            i === bannerIndex ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/40'
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
              <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-9 pb-2">
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
            <section className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-14">
              <div className="text-center max-w-2xl mx-auto mb-7">
                <IslamicSectionDivider subtitle="মানবতার কল্যাণে আমাদের পদক্ষেপ" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2F25]">
                  আমাদের কার্যক্রম
                </h2>
                <div className="w-28 h-1 bg-gradient-to-r from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] mx-auto mt-2.5 rounded-full" />
              </div>

              <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
                {activityCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all border ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border-[#D4AF37] shadow-md scale-105'
                        : 'bg-white text-[#0A2F25] border-[#0A2F25]/15 hover:border-[#D4AF37] hover:bg-[#0A2F25]/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

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
                    activeUiTheme === 'modern_pearl'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
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

            {/* C. PUBLIC BKASH / NAGAD CONTRIBUTION SECTION (SHOWN WHEN ADMIN TOGGLE IS ON!) */}
            {siteSettings.show_payment_on_home !== false && activePaymentNumbers.length > 0 && (
              <section className="max-w-4xl mx-auto px-3 sm:px-6 pb-12">
                <PaymentContributionCard
                  paymentNumbers={activePaymentNumbers}
                  defaultName={appUser?.name || ''}
                  defaultPhone={appUser?.mobile || ''}
                  onSubmitPayment={handleSubmitPaymentContribution}
                  onCopyNumber={copyPaymentNum}
                />
              </section>
            )}

            {/* D. SHARE YOUR IDEA SECTION (`আপনার পরিকল্পনা শেয়ার করুন`) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2F25] via-[#124A3B] to-[#0A2F25] text-white py-12 sm:py-16 px-4 border-t-2 border-[#D4AF37]/60">
              <div className="absolute -right-8 -top-8 opacity-20 pointer-events-none">
                <IslamicMandala className="animate-mandala" size={135} />
              </div>
              <div className="absolute -left-8 -bottom-8 opacity-20 pointer-events-none">
                <IslamicMandala className="animate-mandala-reverse" size={135} />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="text-center mb-7">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 text-[#F3D568]">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                    আপনার পরিকল্পনা শেয়ার করুন
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-200">
                    সমাজ ও মানবতার কল্যাণে আপনার যেকোনো সুন্দর পরামর্শ বা পরিকল্পনা আমাদের জানান।
                  </p>
                </div>

                <form
                  onSubmit={handleIdeaSubmit}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-7 border border-[#D4AF37]/45 shadow-2xl space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#F3D568] mb-1">
                        আপনার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={ideaForm.name}
                        onChange={(e) => setIdeaForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="পূর্ণ নাম লিখুন"
                        className="w-full px-4 py-2.5 rounded-full bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#F3D568] mb-1">
                        মোবাইল নাম্বার *
                      </label>
                      <input
                        type="tel"
                        required
                        value={ideaForm.mobile}
                        onChange={(e) => setIdeaForm((p) => ({ ...p, mobile: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-full bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm font-english focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#F3D568] mb-1">
                      আপনার পরিকল্পনা / পরামর্শ *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={ideaForm.idea}
                      onChange={(e) => setIdeaForm((p) => ({ ...p, idea: e.target.value }))}
                      placeholder="আপনার বিস্তারিত পরিকল্পনা এখানে লিখুন..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/95 text-[#0A2F25] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ideaSubmitting}
                    className="btn-glossy-gold w-full py-3 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-sm sm:text-base shadow-lg hover:brightness-105 transition-all disabled:opacity-60"
                  >
                    {ideaSubmitting ? 'জমা হচ্ছে...' : 'পরিকল্পনা জমা দিন'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: MEMBERS VIEW (`/members` — 1-Line Search + Blood Dropdown) */}
        {/* ================================================================== */}
        {currentView === 'members' && (
          <div>
            {/* Single-Line Search + Compact Blood Group Dropdown Strip Immediately Below Header */}
            <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 py-2 px-3 sm:px-6 sticky top-[52px] sm:top-[60px] z-20 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                {/* Search Input on Left */}
                <div className="relative flex-1 max-w-md">
                  <Users className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="সদস্যের নাম বা পদবি খুঁজুন..."
                    className="w-full h-8 pl-8 pr-3 rounded-full border border-gray-200 bg-[#F4F7F5]/80 text-xs focus:outline-none focus:bg-white focus:border-[#0A2F25]"
                  />
                </div>

                {/* Compact Blood Group Dropdown on Right (Stays on the Exact Same 1 Line on Mobile!) */}
                <div className="shrink-0">
                  <select
                    value={selectedBloodFilter}
                    onChange={(e) => setSelectedBloodFilter(e.target.value)}
                    aria-label="রক্তের গ্রুপ ফিল্টার"
                    className="h-8 px-3 rounded-full border border-[#D4AF37]/60 bg-[#0A2F25] text-[#F3D568] text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="সব">রক্তের গ্রুপ: সব</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        রক্তের গ্রুপ: {bg}
                      </option>
                    ))}
                  </select>
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
              ) : activeUiTheme === 'modern_pearl' ? (
                /* THEME 2: MODERN HORIZONTAL BENTO PROFILE CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredPublicMembers.map((member) => {
                    const rawDesig = (member.designation || '').trim();
                    const publicDesignation =
                      !rawDesig || rawDesig === 'অ্যাডমিন' ? 'সাধারণ সদস্য' : rawDesig;
                    const avatarSrc = optimizeMedia(member.avatar_url);

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberModal(member)}
                        className="cursor-pointer group bg-white rounded-2xl p-3.5 border border-gray-200 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] shrink-0">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={member.name}
                                loading="lazy"
                                className="w-full h-full rounded-full object-cover bg-white"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-lg font-bold">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-[#0A2F25] group-hover:text-[#155e4a] truncate">
                              {member.name}
                            </h3>
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F7F5] text-[#0A2F25] border border-[#D4AF37]/40">
                              {publicDesignation}
                            </span>
                          </div>
                        </div>

                        {member.blood_group && (
                          <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-english font-bold text-xs shadow-sm shrink-0">
                            {member.blood_group}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* THEME 1: CLASSIC ARCH MEMBER CARDS */
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
        {/* VIEW 3: JOIN VIEW (`join` — 3 Boxes + Continue with Google)        */}
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

                {/* BOX 2: Email OR Bangladeshi Mobile Number */}
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
        {/* VIEW 4: LOGIN VIEW (`login` — 2 Boxes + Continue with Google)      */}
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
                  আপনার ইমেইল অথবা মোবাইল নাম্বার ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="p-5 sm:p-7 space-y-4">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
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
                  className="btn-glossy-emerald w-full py-3 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm sm:text-base shadow-lg hover:opacity-95 transition disabled:opacity-60"
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
          <section className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
            {/* Authenticated User Header Banner */}
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] rounded-3xl p-4 sm:p-5 text-white border border-[#D4AF37]/60 shadow-lg mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-[#F3D568] shrink-0">
                  {appUser.avatar_url ? (
                    <img
                      src={optimizeMedia(appUser.avatar_url)}
                      alt={appUser.name}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0A2F25] text-[#F3D568] flex items-center justify-center text-lg font-bold">
                      {appUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-xl font-bold">{appUser.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-[#0A2F25]">
                      {appUser.designation || (appUser.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}
                    </span>
                    {appUser.blood_group && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-english font-bold bg-red-600 text-white">
                        {appUser.blood_group}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 font-english mt-0.5">
                    {appUser.mobile || formatDisplayEmail(appUser.email)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Navigation Tabs (Responsive Multi-Row Grid on Mobile — Zero Horizontal Scroll!) */}
            {appUser.role === 'admin' ? (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 mb-5">
                {[
                  { id: 'overview', label: 'ওভারভিউ', icon: LayoutDashboard },
                  { id: 'members', label: 'সদস্য পরিচালনা', icon: Users },
                  { id: 'finances', label: 'ফান্ড ও বিকাশ', icon: Wallet },
                  { id: 'works', label: 'কার্যক্রম আপডেট', icon: FolderKanban },
                  { id: 'ideas', label: 'পরিকল্পনা সমূহ', icon: Lightbulb },
                  { id: 'gallery', label: 'গ্যালারি', icon: ImageIcon },
                  { id: 'settings', label: 'সেটিংস ও থিম', icon: Settings },
                  { id: 'my_profile', label: 'আমার প্রোফাইল', icon: User }
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const active = activeTab === tab.id;
                  const pendingPayCount = paymentSubmissions.filter((p) => p.status === 'pending').length;
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
                      {tab.id === 'finances' && pendingPayCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-pink-600 text-white font-english">
                          {pendingPayCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 mb-5">
                {[
                  { id: 'my_account', label: 'আমার জমা ও ফান্ডিং', icon: Wallet },
                  { id: 'my_profile', label: 'প্রোফাইল আপডেট', icon: User },
                  { id: 'foundation_funds', label: 'ফাউন্ডেশন ফান্ড', icon: TrendingUp },
                  { id: 'expense_history', label: 'খরচের হিসাব', icon: FileText }
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
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-5 border-2 border-[#D4AF37] shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#F3D568]">বর্তমান ফান্ড</span>
                      <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center text-[#F3D568]">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold font-english">
                      ৳ {currentBalance.toLocaleString('en-US')}
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-emerald-800">মোট কালেকশন</span>
                      <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-english">
                      ৳ {totalIncome.toLocaleString('en-US')}
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-red-700">মোট খরচ</span>
                      <div className="w-9 h-9 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600 font-english">
                      ৳ {totalExpense.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 2: সদস্য পরিচালনা (`members`)                        */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'members' && (
              <div className="space-y-5">
                <datalist id="member-designations-datalist">
                  {activeDesignations.map((desig) => (
                    <option key={desig} value={desig} />
                  ))}
                </datalist>

                {/* Compact Collapsible Designation / Category CRUD Manager with Icon Buttons */}
                <div className="bg-white rounded-2xl p-4 border border-[#D4AF37]/45 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                      পদবি ও ক্যাটাগরি ব্যবস্থাপনা ({activeDesignations.length}টি)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDesignationManager((p) => !p)}
                      aria-label="পদবি তালিকা খুলুন বা বন্ধ করুন"
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

                      <div className="flex flex-wrap items-center gap-1.5">
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
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDesignation(desig)}
                                    className="p-0.5 rounded-full hover:bg-red-50 text-red-600"
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

                {/* Auto-Approve Switch */}
                <div className="bg-white rounded-2xl p-4 border border-[#D4AF37]/45 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0A2F25]">
                      অটো-অ্যাপ্রুভাল
                    </h3>
                    <p className="text-xs text-gray-500">
                      চালু থাকলে নতুন রেজিস্ট্রেশনকৃত সদস্যরা সাথে সাথে অনুমোদিত হয়ে যাবেন।
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={siteSettings.auto_approve}
                    onClick={handleToggleAutoApprove}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      siteSettings.auto_approve ? 'bg-[#155e4a]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        siteSettings.auto_approve ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Pending Member Requests */}
                {pendingMembers.length > 0 && (
                  <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                    <h3 className="text-sm sm:text-base font-bold text-[#0A2F25] mb-3 flex items-center gap-2">
                      <span>পেন্ডিং সদস্য রিকোয়েস্ট</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-english">
                        {pendingMembers.length}
                      </span>
                    </h3>
                    <div className="space-y-2.5">
                      {pendingMembers.map((pm) => (
                        <div
                          key={pm.id}
                          className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-2.5"
                        >
                          <div>
                            <p className="font-bold text-sm text-[#0A2F25]">{pm.name}</p>
                            <p className="text-xs text-gray-500 font-english">
                              {pm.mobile || formatDisplayEmail(pm.email)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveMember(pm)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>অ্যাপ্রুভ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(pm)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shadow"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ডিলিট</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved Members List (100% Mobile-Responsive Card Rows) */}
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
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(m)}
                                  className="p-2 rounded-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
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
            {/* ADMIN TAB 3: ফান্ড ও বিকাশ (`finances`)                         */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'finances' && (
              <div className="space-y-5">
                {/* 1. ADMIN BKASH / NAGAD PAYMENT METHODS & HOMEPAGE TOGGLE MANAGER */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-[#D4AF37]/55 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                        বিকাশ ও নগদ পেমেন্ট নাম্বার ব্যবস্থাপনা
                      </h3>
                      <p className="text-xs text-gray-500">
                        এখানে যুক্ত করা নাম্বারগুলো সব সদস্যের ড্যাশবোর্ডে এবং হোমপেজে (টগল চালু থাকলে) দেখাবে
                      </p>
                    </div>

                    {/* Homepage Public Payment Section Toggle Switch */}
                    <div className="flex items-center gap-2.5 bg-[#F4F7F5] px-3.5 py-2 rounded-full border border-gray-200">
                      <span className="text-xs font-bold text-[#0A2F25]">
                        হোমপেজে অনুদান সেকশন:
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={siteSettings.show_payment_on_home !== false}
                        onClick={handleToggleShowPaymentOnHome}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          siteSettings.show_payment_on_home !== false ? 'bg-[#155e4a]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                            siteSettings.show_payment_on_home !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Add New bKash / Nagad Number Form */}
                  <form onSubmit={handleAddPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">মাধ্যম *</label>
                      <select
                        value={newPaymentForm.provider}
                        onChange={(e) => setNewPaymentForm((p) => ({ ...p, provider: e.target.value as any }))}
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-bold text-[#0A2F25]"
                      >
                        <option value="bKash">বিকাশ (bKash)</option>
                        <option value="Nagad">নগদ (Nagad)</option>
                        <option value="Rocket">রকেট (Rocket)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">নাম্বার *</label>
                      <input
                        type="tel"
                        required
                        value={newPaymentForm.number}
                        onChange={(e) => setNewPaymentForm((p) => ({ ...p, number: e.target.value }))}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">ধরন</label>
                      <select
                        value={newPaymentForm.account_type}
                        onChange={(e) => setNewPaymentForm((p) => ({ ...p, account_type: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-semibold"
                      >
                        <option value="Personal (Send Money)">Personal (Send Money)</option>
                        <option value="Merchant (Payment)">Merchant (Payment)</option>
                        <option value="Agent (Cash Out)">Agent (Cash Out)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="py-2 px-4 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold shadow inline-flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নাম্বার যুক্ত করুন</span>
                    </button>
                  </form>

                  {/* Active Payment Numbers List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {activePaymentNumbers.map((pm) => (
                      <div
                        key={pm.id}
                        className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-english font-bold text-white ${
                                pm.provider === 'bKash'
                                  ? 'bg-[#E2136E]'
                                  : pm.provider === 'Nagad'
                                  ? 'bg-[#F7941D]'
                                  : 'bg-[#8C3494]'
                              }`}
                            >
                              {pm.provider}
                            </span>
                            <span className="text-xs font-bold font-english text-[#0A2F25]">
                              {pm.number}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500">{pm.account_type}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pending bKash / Nagad Submissions Queue */}
                  {paymentSubmissions.length > 0 && (
                    <div className="pt-3 border-t border-gray-100 space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0A2F25]">
                        প্রেরিত বিকাশ / নগদ সহযোগিতা তালিকা ({paymentSubmissions.length})
                      </h4>
                      <div className="space-y-2">
                        {paymentSubmissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-2.5"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-[#0A2F25] text-[#F3D568] font-english text-[10px] font-bold">
                                  {sub.provider}
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-[#0A2F25]">
                                  {sub.sender_name}
                                </span>
                                <span className="font-bold font-english text-xs sm:text-sm text-emerald-700">
                                  ৳ {Number(sub.amount).toLocaleString('en-US')}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 font-english mt-0.5">
                                প্রেরক/TrxID: {sub.trx_id || sub.sender_number} • মাস: {sub.month || 'চলতি'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {sub.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleApprovePaymentSubmission(sub)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>অনুমোদন ও ফান্ডে যোগ</span>
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                  অনুমোদিত
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePaymentSubmission(sub.id)}
                                className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PROJECT-BASED TARGET FUND PROGRESS BAR CONTROLLER */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/50 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      প্রজেক্ট ভিত্তিক টার্গেট ফান্ড প্রোগ্রেস বার কন্ট্রোলার
                    </h3>
                    <p className="text-xs text-gray-500">
                      হোমপেজে রিয়েল-টাইম প্রজেক্ট ফান্ড প্রোগ্রেস বার যুক্ত, এডিট বা অন/অফ করুন
                    </p>
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
                        সংগৃহীত ফান্ড (৳)
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
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        className="py-2 px-5 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] text-xs font-bold shadow"
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
                          className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold"
                        >
                          বাতিল
                        </button>
                      )}
                    </div>
                  </form>

                  {allCampaigns.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {allCampaigns.map((camp) => {
                        const target = Math.max(1, Number(camp.target_amount) || 1);
                        const collected = Math.max(0, Number(camp.collected_amount) || 0);
                        const pct = Math.min(100, Math.round((collected / target) * 100));
                        return (
                          <div
                            key={camp.id}
                            className="p-3 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-[#0A2F25]">{camp.title}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-english font-bold bg-[#0A2F25] text-[#F3D568]">
                                  {pct}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 font-english mt-0.5">
                                সংগৃহীত: ৳ {collected.toLocaleString('en-US')} / লক্ষ্যমাত্রা: ৳ {target.toLocaleString('en-US')}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
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
                                className="p-1.5 rounded-full bg-white border border-gray-300 text-[#0A2F25]"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
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

                {/* 3. MONTHLY MEMBER CONTRIBUTION REMINDER MANAGER */}
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

                {/* 4. ADD FINANCE RECORD FORM */}
                <form
                  onSubmit={handleFinanceSubmit}
                  className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      {financeForm.id ? 'হিসাব সম্পাদনা করুন' : 'নতুন কালেকশন / খরচের হিসাব যুক্ত করুন'}
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
                        বাতিল করুন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0A2F25]"
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
                        placeholder="500"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm font-english focus:outline-none focus:border-[#0A2F25]"
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
                          className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                        >
                          <option value="">সাধারণ তহবিল / শুভাকাঙ্ক্ষী</option>
                          {approvedMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">মাস</label>
                      <input
                        type="text"
                        value={financeForm.month}
                        onChange={(e) => setFinanceForm((p) => ({ ...p, month: e.target.value }))}
                        placeholder="যেমন: নভেম্বর ২০২৬"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">বিবরণ</label>
                    <input
                      type="text"
                      value={financeForm.description}
                      onChange={(e) =>
                        setFinanceForm((p) => ({ ...p, description: e.target.value }))
                      }
                      placeholder="হিসাবের সংক্ষিপ্ত বিবরণ..."
                      className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{financeForm.id ? 'আপডেট সংরক্ষণ করুন' : 'হিসাব যুক্ত করুন'}</span>
                  </button>
                </form>

                {/* 5. FINANCES LIST */}
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
              <div className="space-y-5">
                <form
                  ref={worksFormRef}
                  onSubmit={handleWorkSubmit}
                  className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-4"
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
                        বাতিল করুন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        শিরোনাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={workForm.title}
                        onChange={(e) => setWorkForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="কার্যক্রমের শিরোনাম"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        ক্যাটাগরি
                      </label>
                      <input
                        type="text"
                        value={workForm.category}
                        onChange={(e) => setWorkForm((p) => ({ ...p, category: e.target.value }))}
                        placeholder="যেমন: ত্রাণ, শিক্ষা, চিকিৎসা"
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">তারিখ</label>
                      <input
                        type="date"
                        value={workForm.activity_date}
                        onChange={(e) =>
                          setWorkForm((p) => ({ ...p, activity_date: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                      />
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
                      onChange={(e) => setWorkForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="কার্যক্রমের বিস্তারিত বিবরণ লিখুন..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workForm.is_coming_soon}
                      onChange={(e) =>
                        setWorkForm((p) => ({ ...p, is_coming_soon: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-[#0A2F25]"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-[#0A2F25]">
                      "শীঘ্রই আসছে" ব্যাজ হিসেবে প্রদর্শন করুন
                    </span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-2">
                      ছবি বা ভিডিও আপলোড করুন (একাধিক সিলেক্ট করা যাবে)
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25]/20 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold cursor-pointer transition">
                      <Upload className="w-4 h-4 text-[#155e4a]" />
                      <span>মিডিয়া ফাইল নির্বাচন করুন</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleWorkMediaUpload}
                        className="hidden"
                      />
                    </label>

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
                    className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{workForm.id ? 'কার্যক্রম আপডেট করুন' : 'কার্যক্রম প্রকাশ করুন'}</span>
                  </button>
                </form>

                {/* Published Activities List */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                    প্রকাশিত কার্যক্রম সমূহ ({activities.length})
                  </h3>

                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm sm:text-base text-[#0A2F25]">{act.title}</p>
                        <p className="text-xs text-gray-500">
                          {act.category} •{' '}
                          <span className="font-english">{formatActivityDate(act.activity_date) || 'তারিখ নেই'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWorkForm({
                              id: act.id,
                              title: act.title,
                              description: act.description,
                              category: act.category,
                              activity_date: act.activity_date || '',
                              is_coming_soon: Boolean(act.is_coming_soon),
                              media: Array.isArray(act.media) ? [...act.media] : []
                            });
                            worksFormRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="p-2 rounded-full bg-[#0A2F25]/10 hover:bg-[#0A2F25] text-[#0A2F25] hover:text-[#F3D568] transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act)}
                          className="p-2 rounded-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 5: পরিকল্পনা সমূহ (`ideas`)                           */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'ideas' && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                  প্রাপ্ত পরিকল্পনা ও পরামর্শ ({ideas.length})
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
                        className="p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-[#0A2F25]">
                              {item.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs bg-white border border-gray-300 font-english text-gray-700">
                              {item.mobile}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">
                            {item.idea}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(item)}
                          className="p-2 rounded-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
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
              <div className="space-y-5">
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
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

                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-4">
                    ওয়েবসাইটের সকল আপলোডকৃত গ্যালারি মিডিয়া ({allWebsiteMedia.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {allWebsiteMedia.map((g) => (
                      <div
                        key={g.id}
                        className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 bg-[#0A2F25] h-36 sm:h-40 group"
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
                            alt="Gallery item"
                            loading="lazy"
                            onClick={() => setLightboxMediaUrl(g.url)}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(g)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ADMIN TAB 7: সেটিংস ও থিম (`settings` — Includes Dual UI Theme Switcher!) */}
            {/* ============================================================== */}
            {appUser.role === 'admin' && activeTab === 'settings' && (
              <form
                onSubmit={handleSaveSiteSettings}
                className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm space-y-5"
              >
                {/* DUAL UI THEME SWITCHER SECTION */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0A2F25]/5 via-[#D4AF37]/10 to-[#0A2F25]/5 border-2 border-[#D4AF37]/55 space-y-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                      ওয়েবসাইট ইউআই থিম নির্বাচন করুন (Theme Switcher)
                    </h3>
                    <p className="text-xs text-gray-600">
                      আপনার পছন্দ অনুযায়ী যেকোনো সময় ওয়েবসাইটের সম্পূর্ণ ইউআই থিম পরিবর্তন ও সেভ করতে পারবেন
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Theme Option 1: Classic Royal Emerald UI */}
                    <button
                      type="button"
                      onClick={() => handleSwitchUiTheme('classic_emerald')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start justify-between gap-3 ${
                        activeUiTheme === 'classic_emerald'
                          ? 'bg-[#0A2F25] text-white border-[#D4AF37] shadow-lg'
                          : 'bg-white text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#0A2F25] border border-[#D4AF37]" />
                          <span className="font-bold text-xs sm:text-sm">
                            ১. ক্লাসিক রয়্যাল এমেরাল্ড থিম (বর্তমান)
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            activeUiTheme === 'classic_emerald' ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          সাদা হেডার, কর্নার ভিনটেজ হিরো ব্যানার ও ফ্রেমড কার্যক্রম কার্ড ডিজাইন
                        </p>
                      </div>
                      {activeUiTheme === 'classic_emerald' && (
                        <CheckCircle2 className="w-5 h-5 text-[#F3D568] shrink-0" />
                      )}
                    </button>

                    {/* Theme Option 2: Modern Pearl & Bento Magazine UI */}
                    <button
                      type="button"
                      onClick={() => handleSwitchUiTheme('modern_pearl')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start justify-between gap-3 ${
                        activeUiTheme === 'modern_pearl'
                          ? 'bg-[#0A2F25] text-white border-[#D4AF37] shadow-lg'
                          : 'bg-white text-[#0A2F25] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#F8FAF9] border-2 border-[#155e4a]" />
                          <span className="font-bold text-xs sm:text-sm">
                            ২. মডার্ন পার্ল ও বেন্টো ম্যাগাজিন ইউআই (নতুন)
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            activeUiTheme === 'modern_pearl' ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          পার্ল-হোয়াইট স্প্লিট হিরো, সমান উচ্চতার ম্যাগাজিন কার্ড ও বেন্টো প্রোফাইল গ্রিড
                        </p>
                      </div>
                      {activeUiTheme === 'modern_pearl' && (
                        <CheckCircle2 className="w-5 h-5 text-[#F3D568] shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Logo & Favicon Upload Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer hover:opacity-95 transition shadow-sm">
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
                            className="px-2.5 py-1.5 rounded-full bg-white border border-gray-300 text-gray-600 hover:text-[#0A2F25] text-[11px] font-semibold transition"
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
                        className="w-full px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs font-english focus:outline-none focus:border-[#0A2F25]"
                      />
                    )}
                  </div>

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
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#155e4a] text-white text-xs font-bold cursor-pointer hover:opacity-95 transition shadow-sm">
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
                            className="px-2.5 py-1.5 rounded-full bg-white border border-[#D4AF37] text-[#0A2F25] text-[11px] font-bold hover:bg-[#D4AF37]/20 transition"
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
                      className="w-full px-3.5 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
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
                      className="w-full px-3.5 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
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
                    className="w-full px-3.5 py-2.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                  />
                </div>

                {/* 4 Homepage Banner Upload Cards */}
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

                          <label className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full bg-[#155e4a] hover:bg-[#0A2F25] text-white text-xs font-semibold cursor-pointer transition">
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
                  className="btn-glossy-emerald inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সেটিংস সংরক্ষণ করুন</span>
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 1: আমার জমা ও ফান্ডিং (`my_account`)        */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'my_account' && (
              <div className="space-y-5">
                {(() => {
                  const myDeposits = finances.filter(
                    (f) => f.type === 'income' && f.memberuid === appUser.id
                  );
                  const myTotal = myDeposits.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                  const myRem = getMemberMonthlyReminder(appUser);

                  return (
                    <>
                      {/* Monthly Contribution Reminder Card */}
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

                      {/* Member Total Deposit Banner */}
                      <div className="bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-5 sm:p-6 border-2 border-[#D4AF37] shadow-lg">
                        <span className="text-xs sm:text-sm font-semibold text-[#F3D568]">
                          আমার মোট জমা
                        </span>
                        <p className="text-3xl sm:text-4xl font-bold font-english mt-1">
                          ৳ {myTotal.toLocaleString('en-US')}
                        </p>
                      </div>

                      {/* Member bKash / Nagad Contribution Widget */}
                      <PaymentContributionCard
                        paymentNumbers={activePaymentNumbers}
                        defaultName={appUser.name}
                        defaultPhone={appUser.mobile}
                        onSubmitPayment={handleSubmitPaymentContribution}
                        onCopyNumber={copyPaymentNum}
                      />

                      {/* Member Deposit History */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-3.5">
                          আমার জমার তালিকা ({myDeposits.length})
                        </h3>
                        {myDeposits.length === 0 ? (
                          <p className="text-sm text-gray-500 py-6 text-center">
                            আপনার নামে এখনো কোনো জমার রেকর্ড যুক্ত হয়নি।
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {myDeposits.map((d) => (
                              <div
                                key={d.id}
                                className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="text-xs font-bold text-[#0A2F25] block">
                                    {d.description}
                                  </span>
                                  <span className="text-[11px] text-gray-500">
                                    মাস: {d.month || '—'}
                                  </span>
                                </div>
                                <span className="font-bold font-english text-sm text-emerald-700">
                                  + ৳ {Number(d.amount).toLocaleString('en-US')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 3: ফাউন্ডেশন ফান্ড (`foundation_funds`)     */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'foundation_funds' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#0A2F25] to-[#155e4a] text-white rounded-3xl p-5 border-2 border-[#D4AF37] shadow-lg">
                  <span className="text-sm font-semibold text-[#F3D568]">বর্তমান ফান্ড</span>
                  <p className="text-2xl sm:text-3xl font-bold font-english mt-2">
                    ৳ {currentBalance.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm">
                  <span className="text-sm font-bold text-emerald-800">মোট কালেকশন</span>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-english mt-2">
                    ৳ {totalIncome.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-red-200 shadow-sm">
                  <span className="text-sm font-bold text-red-700">মোট খরচ</span>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 font-english mt-2">
                    ৳ {totalExpense.toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* REGULAR MEMBER TAB 4: খরচের হিসাব (`expense_history`)          */}
            {/* ============================================================== */}
            {appUser.role === 'member' && activeTab === 'expense_history' && (
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#D4AF37]/40 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] mb-3.5">
                  ফাউন্ডেশনের খরচের তালিকা
                </h3>
                <div className="space-y-2">
                  {finances
                    .filter((f) => f.type === 'expense')
                    .map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#0A2F25] block">
                            {exp.description}
                          </span>
                          <span className="text-[11px] text-gray-500">মাস: {exp.month || '—'}</span>
                        </div>
                        <span className="font-bold font-english text-sm text-red-600">
                          - ৳ {Number(exp.amount).toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SHARED TAB: আমার প্রোফাইল (`my_profile`)                       */}
            {/* ============================================================== */}
            {activeTab === 'my_profile' && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-4 sm:p-7 border border-[#D4AF37]/40 shadow-sm space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-[#0A2F25]">আমার প্রোফাইল ও বিস্তারিত তথ্য</h3>
                  <p className="text-xs text-gray-500">
                    আপনার প্রোফাইল ছবি, রক্তের গ্রুপ, জন্মতারিখ, মোবাইল নাম্বার ও পরিচয় এখান থেকে আপডেট করুন
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
                      <p className="text-xs font-bold text-[#0A2F25] mb-1">প্রোফাইল ছবি</p>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                    <div>
                      <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                        ঠিকানা / পরিচয়
                      </label>
                      <input
                        type="text"
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        placeholder="যেমন: চট্টগ্রাম"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                      />
                    </div>
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

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 4. MODALS (ONBOARDING, MEMBER CONTACT, EDIT MEMBER, ACTIVITY DETAIL) */}
      {/* ==================================================================== */}
      {showOnboardingModal && appUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSaveOnboardingInfo}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-[#D4AF37] shadow-2xl no-scrollbar max-h-[92vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] p-5 text-center text-white">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mx-auto mb-2 text-[#F3D568]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">প্রোফাইল তথ্য সম্পূর্ণ করুন</h3>
              <p className="text-xs text-[#F3D568] mt-1 leading-relaxed">
                {ONBOARDING_MESSAGES[onboardingMsgIdx]}
              </p>
            </div>

            <div className="p-5 space-y-4">
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
                  className="flex-1 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs sm:text-sm shadow-md"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedMemberModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden border-2 border-[#D4AF37] shadow-2xl no-scrollbar max-h-[90vh] overflow-y-auto"
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
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 shadow"
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
                    className="w-full py-2 px-4 rounded-full bg-white text-[#0A2F25] border border-[#D4AF37]/60 font-bold text-xs flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form
            onSubmit={handleSaveEditedMember}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border-2 border-[#D4AF37] shadow-2xl space-y-3.5 no-scrollbar max-h-[90vh] overflow-y-auto"
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
              <label className="px-3.5 py-2 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer">
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
                className="w-full px-3.5 py-2 rounded-full border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">পদবি নির্বাচন করুন</label>
              <select
                value={editingMember.designation || 'সাধারণ সদস্য'}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, designation: e.target.value } : null
                  )
                }
                className="w-full px-3.5 py-2 rounded-full border border-gray-300 bg-white text-sm font-semibold text-[#0A2F25]"
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
                  className="w-full px-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-bold text-[#0A2F25]"
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
                  className="w-full px-3 py-2 rounded-full border border-gray-300 text-sm font-english"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-full border border-gray-300 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

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
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] flex items-center justify-center shadow-lg"
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
                alt="Preview"
                className="w-full max-h-[82vh] object-contain"
              />
            )}
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border-2 border-[#D4AF37] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#0A2F25]">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
                className="px-4 py-2 rounded-full border border-gray-300 text-xs font-bold text-gray-700"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow ${
                  confirmDialog.isDanger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                হ্যাঁ, নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. CENTERED MOBILE-FIRST FOOTER & SUBTLE 2-COLOR DEVELOPER CREDIT    */}
      {/* ==================================================================== */}
      <footer className="bg-[#0A2F25] text-white border-t-2 border-[#D4AF37] pt-8 pb-5 px-4 mt-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          {/* 1. Centered Logo on Top */}
          <div className="p-1 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-md mb-2.5">
            <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-12 h-12" />
          </div>

          {/* 2. Foundation Name Centered Below Logo */}
          <h3 className="text-lg sm:text-xl font-bold text-[#F3D568] leading-snug">
            {siteSettings.site_name || DEFAULT_SITE_NAME}
          </h3>

          {/* 3. Tagline Centered Below Name */}
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-md mx-auto">
            {siteSettings.tagline || DEFAULT_TAGLINE}
          </p>

          {/* 4. Official Facebook Page Pill Centered */}
          <a
            href={FOUNDATION_FB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#155e4a] hover:bg-[#196f58] text-white border border-[#D4AF37]/60 text-xs font-semibold shadow transition"
          >
            <Facebook className="w-3.5 h-3.5 text-[#F3D568]" />
            <span>অফিসিয়াল ফেসবুক পেজ</span>
            <ExternalLink className="w-3 h-3 text-[#F3D568]" />
          </a>

          {/* 5. Bottom Copyright & Small Borderless 2-Color Developer Credit */}
          <div className="w-full mt-6 pt-4 border-t border-white/10 flex flex-col items-center justify-center gap-1 text-center">
            <p className="text-[11px] text-gray-300">
              © {new Date().getFullYear()} {siteSettings.site_name || DEFAULT_SITE_NAME}। সর্বস্বত্ব সংরক্ষিত।
            </p>
            <p className="text-[10px] font-english tracking-wide">
              <span className="text-gray-400">Developed by </span>
              <a
                href={DEVELOPER_FB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F3D568] hover:underline font-semibold transition-colors"
              >
                Mohammad Raihan
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
