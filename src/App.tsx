import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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
const DEFAULT_LOGO_URL = 'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/1772377523792_Nobo%20Alo%20Logo-03.png';
const FAVICON_URL = 'https://xlcepfrjngtzrmpazkla.supabase.co/storage/v1/object/public/foundation-images/Website%20favicon-03.png';
const DEFAULT_SITE_NAME = 'নব আলো ফাউন্ডেশন';
const DEFAULT_TAGLINE = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const DEFAULT_ANNOUNCEMENT = 'মানবতার সেবায়, একসাথে নতুন আলোর সন্ধানে।';
const FOUNDATION_FB_URL = 'https://facebook.com/noboalofoundation00';
const DEVELOPER_CREDIT_TEXT = 'DEVELOPED BY MOHAMMAD RAIHAN';
const DEVELOPER_FB_URL = 'https://facebook.com/mohammadraihan3859';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// 2. TRD MEDIA OPTIMIZATION & SMART DATE HELPERS
// ============================================================================
const isMediaVideo = (url?: string | null): boolean => {
  return Boolean(url && url.match(/\.(mp4|webm|ogg|mov|avi)$/i));
};

const optimizeMedia = (url?: string | null): string => {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (isMediaVideo(url)) {
      return url.replace('/upload/', '/upload/q_auto,f_auto,w_800,c_limit/');
    }
    return url.replace('/upload/', '/upload/q_auto,f_auto/');
  }
  return url;
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
interface SiteSettings {
  id?: number;
  site_name: string;
  tagline: string;
  announcement_text: string;
  logo_url: string;
  banners: string[];
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
  logo_url: DEFAULT_LOGO_URL,
  banners: ['', '', '', ''],
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

// Cloudflare D1 Pages Function API Helper
const callD1Api = async (endpoint: string, method = 'GET', body?: any) => {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, notMounted: true, data: null };
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, notMounted: false, data };
  } catch {
    return { ok: false, notMounted: true, data: null };
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
  file: File,
  onProgress: (percent: number) => void
): Promise<string> => {
  const attempts = [
    { cloud: CLOUDINARY_ID, preset: CLOUDINARY_FOLDER_NAME, folder: CLOUDINARY_FOLDER_NAME },
    { cloud: CLOUDINARY_ID, preset: CLOUDINARY_UPLOAD_PRESET, folder: CLOUDINARY_FOLDER_NAME },
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

const IslamicMandala: React.FC<{ className?: string; size?: number }> = ({
  className = 'animate-mandala',
  size = 420
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
    aria-hidden="true"
  >
    <g stroke="#D4AF37" strokeOpacity="0.32" strokeWidth="0.9">
      <circle cx="100" cy="100" r="94" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="82" />
      <circle cx="100" cy="100" r="64" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="22" />
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <rect x="42" y="42" width="116" height="116" rx="10" />
          <ellipse cx="100" cy="100" rx="88" ry="28" />
          <line x1="100" y1="6" x2="100" y2="194" strokeOpacity="0.18" />
        </g>
      ))}
      <polygon
        points="100,10 122,78 190,100 122,122 100,190 78,122 10,100 78,78"
        stroke="#F3D568"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
      <polygon
        points="100,10 122,78 190,100 122,122 100,190 78,122 10,100 78,78"
        transform="rotate(45 100 100)"
        stroke="#D4AF37"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
    </g>
  </svg>
);

// White Circular Logo Rule: Always wrapped inside bg-white rounded-full p-1.5 shadow-md
const WhiteCircularLogo: React.FC<{
  logoUrl: string;
  sizeClass?: string;
  imgClass?: string;
}> = ({ logoUrl, sizeClass = 'w-11 h-11', imgClass = 'w-full h-full' }) => {
  const resolvedUrl = optimizeMedia(logoUrl || DEFAULT_LOGO_URL);

  return (
    <div className={`bg-white rounded-full p-1.5 shadow-md flex items-center justify-center shrink-0 ${sizeClass}`}>
      <img
        src={resolvedUrl}
        alt="নব আলো ফাউন্ডেশন লোগো"
        className={`${imgClass} object-contain rounded-full`}
      />
    </div>
  );
};

// Activity Detail Modal & Auto-Slider (`ActivitySlider`)
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

// ============================================================================
// 6. MAIN PRODUCTION APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'members' | 'join' | 'login' | 'dashboard'>('home');

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [useD1Backend, setUseD1Backend] = useState<boolean>(false);

  const [membersTable, setMembersTable] = useState<string>('members');
  const [activitiesTable, setActivitiesTable] = useState<string>('activities');

  const [appUser, setAppUser] = useState<MemberUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

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
    document.title = siteSettings.site_name || DEFAULT_SITE_NAME;
  }, [siteSettings.site_name]);

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
      created_at: u.created_at
    };
  };

  // ============================================================================
  // 7. DATA FETCH (CLOUDFLARE D1 PRIMARY + SUPABASE FALLBACK)
  // ============================================================================
  const fetchAllData = async () => {
    try {
      const d1Boot = await callD1Api('bootstrap', 'GET');
      if (!d1Boot.notMounted && d1Boot.ok && d1Boot.data?.d1_active) {
        setUseD1Backend(true);
        if (d1Boot.data.settings) setSiteSettings(d1Boot.data.settings);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncAuthUserProfile(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncAuthUserProfile(session.user);
      } else if (!useD1Backend) {
        setAppUser(null);
      }
    });

    return () => {
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
    password: ''
  });
  const [authLoading, setAuthLoading] = useState(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = joinForm.email.trim().toLowerCase();
    if (!joinForm.name.trim() || !cleanEmail || !joinForm.mobile.trim()) {
      showNotice('সবগুলো তথ্য সঠিকভাবে পূরণ করুন।', 'error');
      return;
    }
    if (joinForm.password.length < 6) {
      showNotice('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    setAuthLoading(true);
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const assignedStatus: 'approved' | 'pending' =
      isSuperAdmin || siteSettings.auto_approve === true ? 'approved' : 'pending';
    const assignedRole: 'admin' | 'member' = isSuperAdmin ? 'admin' : 'member';
    const assignedDesignation = isSuperAdmin ? 'অ্যাডমিন' : 'সাধারণ সদস্য';

    if (useD1Backend) {
      const regRes = await callD1Api('auth/register', 'POST', {
        name: joinForm.name.trim(),
        email: cleanEmail,
        mobile: joinForm.mobile.trim(),
        password: joinForm.password
      });
      setAuthLoading(false);
      if (!regRes.ok || !regRes.data?.user) {
        showNotice(regRes.data?.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।', 'error');
        return;
      }
      const createdUser = normalizeMemberRow(regRes.data.user);
      setMembers((prev) => [...prev.filter((m) => m.email.toLowerCase() !== cleanEmail), createdUser]);
      setJoinForm({ name: '', email: '', mobile: '', password: '' });
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
    const cleanEmail = loginForm.email.trim().toLowerCase();
    if (!cleanEmail || !loginForm.password) {
      showNotice('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।', 'error');
      return;
    }

    setAuthLoading(true);
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    if (useD1Backend) {
      const logRes = await callD1Api('auth/login', 'POST', {
        email: cleanEmail,
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
    if (member.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showNotice('সুপার অ্যাডমিন একাউন্ট ডিলিট করা যাবে না!', 'error');
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
    if (member.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showNotice('সুপার অ্যাডমিনের রোল পরিবর্তন করা যাবে না।', 'error');
      return;
    }
    const updatedDesignation =
      member.designation === 'সাধারণ সদস্য' && newRole === 'admin'
        ? 'অ্যাডমিন'
        : member.designation === 'অ্যাডমিন' && newRole === 'member'
        ? 'সাধারণ সদস্য'
        : member.designation;

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id ? { ...m, role: newRole, designation: updatedDesignation } : m
      )
    );
    showNotice(`${member.name}-এর রোল আপডেট করা হয়েছে।`, 'success');

    if (useD1Backend) {
      await callD1Api('members', 'PUT', {
        id: member.id,
        role: newRole,
        designation: updatedDesignation
      });
    } else {
      await smartSupabaseMutation(
        [membersTable, 'members', 'users', 'profiles'],
        'update',
        { role: newRole, designation: updatedDesignation },
        'id',
        member.id
      );
    }
  };

  const [editingMember, setEditingMember] = useState<MemberUser | null>(null);

  const handleEditMemberAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMember) return;
    setUploadState({ active: true, percent: 0, label: 'সদস্যের ছবি আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'সদস্যের ছবি আপলোড হচ্ছে...' });
      });
      setEditingMember((prev) => (prev ? { ...prev, avatar_url: uploadedUrl } : null));
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
        avatar_url: updated.avatar_url,
        designation: updated.designation,
        sort_order: updated.sort_order
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
    setUploadState({ active: true, percent: 0, label: 'সাইট লোগো আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'সাইট লোগো আপলোড হচ্ছে...' });
      });
      setSiteSettings((prev) => ({ ...prev, logo_url: uploadedUrl }));
      showNotice('নতুন লোগো ক্লাউডিনারিতে আপলোড হয়েছে!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'লোগো আপলোড ব্যর্থ হয়েছে।', 'error');
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
      setSiteSettings((prev) => {
        const nextBanners = [...(prev.banners || ['', '', '', ''])];
        while (nextBanners.length < 4) nextBanners.push('');
        nextBanners[slotIndex] = uploadedUrl;
        return { ...prev, banners: nextBanners };
      });
      showNotice(`ব্যানার #${slotIndex + 1} সফলভাবে আপলোড হয়েছে!`, 'success');
    } catch (err: any) {
      showNotice(err?.message || 'ব্যানার আপলোড ব্যর্থ হয়েছে।', 'error');
    } finally {
      setTimeout(() => setUploadState({ active: false, percent: 0, label: '' }), 600);
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useD1Backend) {
      await callD1Api('settings', 'PUT', siteSettings);
      showNotice('সাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
      return;
    }
    const { error } = await smartSupabaseMutation(['site_settings'], 'upsert', {
      id: siteSettings.id || 1,
      site_name: siteSettings.site_name,
      tagline: siteSettings.tagline,
      announcement_text: siteSettings.announcement_text,
      logo_url: siteSettings.logo_url,
      banners: siteSettings.banners,
      auto_approve: siteSettings.auto_approve
    });
    if (error) {
      showNotice('সেটিংস সংরক্ষণে ত্রুটি: ' + error.message, 'error');
      return;
    }
    showNotice('সাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  const [profileName, setProfileName] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');

  useEffect(() => {
    if (appUser) {
      setProfileName(appUser.name);
    }
  }, [appUser]);

  const handleMyProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appUser) return;
    setUploadState({ active: true, percent: 0, label: 'প্রোফাইল ছবি আপলোড হচ্ছে...' });
    try {
      const uploadedUrl = await uploadMediaToCloudinary(file, (percent) => {
        setUploadState({ active: true, percent, label: 'প্রোফাইল ছবি আপলোড হচ্ছে...' });
      });
      const updatedUser = { ...appUser, avatar_url: uploadedUrl };
      setAppUser(updatedUser);
      setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));
      if (useD1Backend) {
        await callD1Api('members', 'PUT', { id: updatedUser.id, avatar_url: uploadedUrl });
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
    if (profileNewPassword && profileNewPassword.length < 6) {
      showNotice('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    const updatedUser: MemberUser = {
      ...appUser,
      name: profileName.trim()
    };
    setAppUser(updatedUser);
    setMembers((prev) => prev.map((m) => (m.id === updatedUser.id ? updatedUser : m)));

    if (useD1Backend) {
      await callD1Api('members', 'PUT', {
        id: updatedUser.id,
        name: updatedUser.name,
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
      {/* 1. TOP SCROLLING ANNOUNCEMENT BAR */}
      <div
        className="w-full py-1.5 px-2 overflow-hidden border-b border-[#D4AF37]/50 shadow-sm z-40"
        style={{ background: 'linear-gradient(90deg, #0A2F25, #155e4a, #0A2F25)' }}
      >
        <div className="animate-marquee flex items-center gap-6 text-xs sm:text-sm font-medium text-[#FFFFFF]">
          {[0, 1, 2, 3].map((repeatIdx) => (
            <span key={repeatIdx} className="inline-flex items-center gap-4">
              <span className="text-[#D4AF37]">✧</span>
              <span className="text-[#FFFFFF] tracking-wide">
                {siteSettings.announcement_text || DEFAULT_ANNOUNCEMENT}
              </span>
              <span className="text-[#D4AF37]">✧</span>
              <span className="text-[#FFFFFF] tracking-wide">
                {siteSettings.site_name || DEFAULT_SITE_NAME} — {siteSettings.tagline || DEFAULT_TAGLINE}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. MOBILE-FIRST HEADER / NAVBAR (NO HAMBURGER MENU) */}
      <header className="sticky top-0 z-30 bg-[#0A2F25]/95 backdrop-blur-lg border-b border-[#D4AF37]/40 shadow-[0_8px_30px_rgba(10,47,37,0.28)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Left Side: Circular White-BG Logo + Site Name */}
          <button
            type="button"
            onClick={() => setCurrentView('home')}
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

          {/* Right Side Navigation Buttons (NO Hamburger Menu, NO Login button, NO Logout button) */}
          <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentView('members')}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
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
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md border ${
                  currentView === 'join' || currentView === 'login'
                    ? 'bg-[#F3D568] text-[#0A2F25] border-white'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] hover:brightness-105'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">যুক্ত হোন</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                aria-label="ড্যাশবোর্ড"
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md border ${
                  currentView === 'dashboard'
                    ? 'bg-[#F3D568] text-[#0A2F25] border-white'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#F3D568] text-[#0A2F25] border-[#F3D568] hover:brightness-105'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">ড্যাশবোর্ড</span>
              </button>
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
            {/* A. LUXURY ISLAMIC HERO SECTION */}
            <section className="relative overflow-hidden bg-[#0A2F25] text-white min-h-[460px] sm:min-h-[550px] flex flex-col items-center justify-center py-12 sm:py-20 px-4 border-b-4 border-[#D4AF37]">
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

              {/* Deep Emerald Vignette & Radial Glow */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(21,94,74,0.62) 0%, rgba(10,47,37,0.92) 72%, rgba(5,24,19,0.98) 100%)'
                }}
              />

              {/* Rotating SVG Islamic Geometric Mandalas */}
              <div className="absolute -left-28 -top-28 opacity-40">
                <IslamicMandala className="animate-mandala" size={400} />
              </div>
              <div className="absolute -right-28 -bottom-28 opacity-40">
                <IslamicMandala className="animate-mandala-reverse" size={440} />
              </div>

              {/* Hero Center Content */}
              <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
                {/* Floating Circular White-BG Logo */}
                <div className="mb-5 p-1.5 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.45)]">
                  <WhiteCircularLogo
                    logoUrl={siteSettings.logo_url}
                    sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                  />
                </div>

                {/* Golden Ornamental Filigree Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/50 text-[#F3D568] text-xs sm:text-sm font-semibold mb-4 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>মানবতা, ভ্রাতৃত্ব ও কল্যাণের অঙ্গীকার</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-snug sm:leading-tight mb-4 drop-shadow-lg">
                  মানবতার সেবায় নব আলো ফাউন্ডেশন
                </h1>

                <p className="text-sm sm:text-lg md:text-xl text-gray-200 max-w-2xl mb-8 leading-relaxed">
                  {siteSettings.tagline || DEFAULT_TAGLINE}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setCurrentView('join')}
                    className="inline-flex items-center gap-2 px-7 sm:px-9 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-sm sm:text-base shadow-[0_10px_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>সদস্য হিসেবে যুক্ত হোন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('members')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-[#D4AF37]/50 font-semibold text-sm sm:text-base transition-all"
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

                {/* Glassmorphic Live Impact Ribbon */}
                <div className="mt-10 w-full max-w-2xl grid grid-cols-3 gap-2.5 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#F3D568] font-english">
                      {approvedMembers.length}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-200 mt-0.5">অনুমোদিত সদস্য</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#F3D568] font-english">
                      {activities.length}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-200 mt-0.5">মানবিক কার্যক্রম</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-[#F3D568] font-english">100%</p>
                    <p className="text-[11px] sm:text-xs text-gray-200 mt-0.5">স্বচ্ছ তহবিল</p>
                  </div>
                </div>
              </div>
            </section>

            {/* B. ACTIVITIES SECTION (`আমাদের কার্যক্রম`) */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 py-11 sm:py-16">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold mb-2">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#155e4a]" />
                  <span>মানবতার কল্যাণে আমাদের পদক্ষেপ</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2F25]">
                  আমাদের কার্যক্রম
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-[#0A2F25] via-[#D4AF37] to-[#0A2F25] mx-auto mt-2.5 rounded-full" />
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
                              →
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* C. PUBLIC GALLERY SHOWCASE WITH FULLSCREEN LIGHTBOX */}
            {gallery.length > 0 && (
              <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-12 sm:pb-16">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-[#155e4a]" />
                    <span>স্মৃতির পাতা</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2F25]">ফাউন্ডেশন গ্যালারি</h2>
                  <div className="w-20 h-1 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLightboxMediaUrl(item.url)}
                      className="cursor-pointer rounded-2xl overflow-hidden border-2 border-[#D4AF37]/35 hover:border-[#D4AF37] bg-[#0A2F25] shadow-md hover:shadow-xl h-44 sm:h-52 relative group transition-all"
                    >
                      {isMediaVideo(item.url) ? (
                        <video
                          src={optimizeMedia(item.url)}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <img
                          src={optimizeMedia(item.url)}
                          alt="গ্যালারি"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-[#0A2F25]/85 border border-[#D4AF37] text-[#F3D568] flex items-center justify-center">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D568] to-[#D4AF37] text-[#0A2F25] font-bold text-sm sm:text-base shadow-xl hover:brightness-105 transition disabled:opacity-60"
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
            <div className="text-center max-w-2xl mx-auto mb-9">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5 text-[#155e4a]" />
                <span>আমাদের মানবিক পরিবার</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2F25]">
                নব আলো ফাউন্ডেশনের সদস্যবৃন্দ
              </h2>
              <div className="w-20 h-1 bg-[#D4AF37] mx-auto mt-2 rounded-full" />
            </div>

            {approvedMembers.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#D4AF37]/30 shadow-sm max-w-md mx-auto">
                <Users className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />
                <p className="text-gray-500 text-sm">এখনো কোনো অনুমোদিত সদস্য প্রদর্শিত নেই।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {approvedMembers.map((member) => {
                  const defaultDesignation = member.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য';
                  const displayDesignation = member.designation || defaultDesignation;
                  const avatarSrc = optimizeMedia(member.avatar_url);

                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col items-center text-center"
                    >
                      {/* Decorative Emerald & Gold Arch Header */}
                      <div className="w-full h-16 bg-gradient-to-r from-[#0A2F25] via-[#155e4a] to-[#0A2F25] border-b-2 border-[#D4AF37] relative" />

                      {/* Circular Profile Photo or Initial overlapping arch */}
                      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#D4AF37] via-[#F3D568] to-[#0A2F25] shadow-lg -mt-10 mb-3 relative z-10">
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

                      <div className="px-5 pb-6 flex-1 flex flex-col items-center">
                        <h3 className="text-base sm:text-lg font-bold text-[#0A2F25] leading-snug">
                          {member.name}
                        </h3>

                        <span
                          className={`mt-2 inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold ${
                            member.role === 'admin'
                              ? 'bg-[#0A2F25] text-[#F3D568] border border-[#D4AF37] shadow-sm'
                              : 'bg-[#F4F7F5] text-[#155e4a] border border-[#155e4a]/25'
                          }`}
                        >
                          {member.role === 'admin' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                          )}
                          <span>{displayDesignation}</span>
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
        {/* VIEW 3: JOIN / REGISTRATION VIEW (`join`)                          */}
        {/* ================================================================== */}
        {currentView === 'join' && (
          <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] p-6 text-center text-white border-b border-[#D4AF37]/40">
                <div className="flex justify-center mb-3">
                  <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-14 h-14" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">সদস্য হিসেবে যুক্ত হোন</h2>
                <p className="text-xs text-[#F3D568] mt-1">
                  নব আলো ফাউন্ডেশনের মানবিক পরিবারে আপনাকে স্বাগতম
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="p-5 sm:p-7 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    পূর্ণ নাম *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={joinForm.name}
                      onChange={(e) => setJoinForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="আপনার পূর্ণ নাম"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    ইমেইল এড্রেস *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={joinForm.email}
                      onChange={(e) => setJoinForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="example@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    মোবাইল নাম্বার *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={joinForm.mobile}
                      onChange={(e) => setJoinForm((p) => ({ ...p, mobile: e.target.value }))}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={joinForm.password}
                      onChange={(e) => setJoinForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm sm:text-base shadow-lg hover:opacity-95 transition disabled:opacity-60"
                >
                  {authLoading ? 'প্রসেসিং হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
                </button>

                {/* Login Link Location at bottom of Join Card */}
                <div className="pt-4 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className="text-xs sm:text-sm font-semibold text-[#155e4a] hover:text-[#0A2F25] underline underline-offset-4 transition"
                  >
                    আগেই একাউন্ট করা থাকলে লগইন করুন
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* VIEW 4: LOGIN VIEW (`login`)                                       */}
        {/* ================================================================== */}
        {currentView === 'login' && (
          <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2F25] via-[#124A3B] to-[#0A2F25] p-6 text-center text-white border-b border-[#D4AF37]/40">
                <div className="flex justify-center mb-3">
                  <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-14 h-14" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">সদস্য লগইন</h2>
                <p className="text-xs text-[#F3D568] mt-1">
                  আপনার ইমেইল ও পাসওয়ার্ড দিয়ে ড্যাশবোর্ডে প্রবেশ করুন
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="p-5 sm:p-7 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    ইমেইল এড্রেস *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="example@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#0A2F25] mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25] focus:ring-1 focus:ring-[#0A2F25]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm sm:text-base shadow-lg hover:opacity-95 transition disabled:opacity-60"
                >
                  {authLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
                </button>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('join')}
                    className="text-xs sm:text-sm font-semibold text-[#155e4a] hover:text-[#0A2F25] underline underline-offset-4 transition"
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
                    <span className="text-sm font-semibold text-[#F3D568]">ফান্ড</span>
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
                    <span className="text-sm font-bold text-emerald-800">মোট আয়</span>
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
                    <span className="text-sm font-bold text-red-700">মোট ব্যয়</span>
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
                                {m.designation || (m.role === 'admin' ? 'অ্যাডমিন' : 'সাধারণ সদস্য')}
                              </td>
                              <td className="py-3 px-3 font-english">{m.sort_order ?? 100}</td>
                              <td className="py-3 px-3">
                                {isSuper ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2F25] text-[#F3D568] text-xs font-bold">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>সুপার অ্যাডমিন</span>
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
                                  {!isSuper && (
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
                        <option value="income">জমা (+)</option>
                        <option value="expense">খরচ (-)</option>
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

                    {/* Uploaded Media Thumbnails with ‹ and › Reorder Arrows and × Remove */}
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
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center shadow"
                            >
                              ×
                            </button>

                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 flex items-center justify-between text-white text-xs">
                              <button
                                type="button"
                                onClick={() => moveWorkMedia(idx, -1)}
                                disabled={idx === 0}
                                className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-[#D4AF37] hover:text-[#0A2F25] disabled:opacity-30 font-bold"
                              >
                                ‹
                              </button>
                              <span className="font-english text-[11px]">#{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => moveWorkMedia(idx, 1)}
                                disabled={idx === workForm.media.length - 1}
                                className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-[#D4AF37] hover:text-[#0A2F25] disabled:opacity-30 font-bold"
                              >
                                ›
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
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
                    গ্যালারিতে ছবি বা ভিডিও আপলোড করুন (Cloudinary Folder: {CLOUDINARY_FOLDER_NAME})
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
                    গ্যালারি মিডিয়া ({gallery.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {gallery.map((g) => (
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
                            src={optimizeMedia(g.url)}
                            alt="গ্যালারি"
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A2F25]">
                    সাইট সেটিংস
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#0A2F25]/10 text-[#0A2F25] border border-[#D4AF37]/50 text-xs font-english font-semibold">
                    Cloudinary ID: {CLOUDINARY_ID} • Folder: {CLOUDINARY_FOLDER_NAME}
                  </span>
                </div>

                {/* Logo Upload */}
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[#F4F7F5] border border-gray-200">
                  <WhiteCircularLogo logoUrl={siteSettings.logo_url} sizeClass="w-16 h-16" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs sm:text-sm font-bold text-[#0A2F25] mb-1">
                      ফাউন্ডেশন লোগো
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer hover:opacity-95 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>নতুন লোগো আপলোড করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      সাইটের নাম
                    </label>
                    <input
                      type="text"
                      value={siteSettings.site_name}
                      onChange={(e) =>
                        setSiteSettings((p) => ({ ...p, site_name: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setSiteSettings((p) => ({ ...p, tagline: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                    টপ স্ক্রলিং সাদা টেক্সট (announcement_text)
                  </label>
                  <input
                    type="text"
                    value={siteSettings.announcement_text}
                    onChange={(e) =>
                      setSiteSettings((p) => ({ ...p, announcement_text: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                  />
                </div>

                {/* 4 Homepage Banners */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#0A2F25] mb-2">
                    হোমপেজ ব্যানার (৪টি)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const currentBanner = siteSettings.banners?.[slotIdx] || '';
                      return (
                        <div
                          key={slotIdx}
                          className="p-3.5 rounded-2xl bg-[#F4F7F5] border border-gray-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0A2F25]">
                              ব্যানার #{slotIdx + 1}
                            </span>
                            <label className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#155e4a] text-white text-xs font-semibold cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>আপলোড</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUpload(slotIdx, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {currentBanner && (
                            <div className="w-full h-24 rounded-xl overflow-hidden bg-[#0A2F25] border border-[#D4AF37]/40">
                              <img
                                src={optimizeMedia(currentBanner)}
                                alt={`Banner ${slotIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
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
                  <span className="text-sm font-semibold text-[#F3D568]">ফান্ড</span>
                  <p className="text-2xl sm:text-3xl font-bold font-english mt-2">
                    ৳ {currentBalance.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm">
                  <span className="text-sm font-bold text-emerald-800">মোট আয়</span>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700 font-english mt-2">
                    ৳ {totalIncome.toLocaleString('en-US')}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-sm">
                  <span className="text-sm font-bold text-red-700">মোট ব্যয়</span>
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
                <h3 className="text-lg font-bold text-[#0A2F25]">আমার প্রোফাইল</h3>

                <form onSubmit={handleSaveMyProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
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
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A2F25] text-[#F3D568] text-xs font-bold cursor-pointer hover:opacity-95 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>প্রোফাইল ছবি পরিবর্তন করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMyProfileAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">নাম</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                      নতুন পাসওয়ার্ড (ঐচ্ছিক)
                    </label>
                    <input
                      type="password"
                      value={profileNewPassword}
                      onChange={(e) => setProfileNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-english focus:outline-none focus:border-[#0A2F25]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A2F25] to-[#155e4a] text-[#F3D568] border border-[#D4AF37] font-bold text-sm shadow-md hover:opacity-95 transition"
                  >
                    প্রোফাইল আপডেট করুন
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
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">পদবী</label>
              <input
                type="text"
                value={editingMember.designation}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, designation: e.target.value } : null
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A2F25] mb-1">
                ক্রমিক নাম্বার (sort_order)
              </label>
              <input
                type="number"
                value={editingMember.sort_order}
                onChange={(e) =>
                  setEditingMember((prev) =>
                    prev ? { ...prev, sort_order: Number(e.target.value) } : null
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm font-english"
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
