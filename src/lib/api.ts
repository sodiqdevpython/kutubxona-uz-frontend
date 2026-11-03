// ── API base ─────────────────────────────────────────────────────────────────
import { API_BASE, apiOrigin } from './config';

const BASE = API_BASE;

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  // BASE bo'sh bo'lishi mumkin (Docker: nginx bir xil origin'da proksilaydi),
  // shuning uchun nisbiy yo'lni joriy origin'ga nisbatan yechamiz.
  const url = new URL(path, apiOrigin());
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

export interface ApiAuthorBrief {
  id: string;
  name: string;
  slug: string;
  initials: string;
  avatar_idx: number;
  /** Profil rasmi — profilda bor bo'lsa maqola sahifasida ham ko'rinadi. */
  avatar_url: string | null;
  /** Tashkilot va lavozim — maqola sahifasida muallif tagida chiqadi. */
  org: string;
  role: string;
  orcid?: string;
}

export interface ApiAuthor {
  id: string;
  name: string;
  slug: string;
  initials: string;
  role: string;
  org: string;
  degree: string;
  bio: string;
  avatar_idx: number;
  avatar_url: string | null;
  article_count: number;
  total_views: number;
  profile_views: number;
  orcid: string;
}

export interface ApiCoauthor {
  id: string; name: string; slug: string; initials: string;
  avatar_idx: number; avatar_url: string | null;
  /** Birgalikdagi maqolalar soni */
  shared: number;
}

/** Muallif sahifasi — Figma «Muallif detail» */
export interface ApiAuthorDetail extends ApiAuthor {
  email: string;
  scopus_id: string;
  categories: string[];
  years: { year: number; count: number }[];
  coauthors: ApiCoauthor[];
}

export interface ApiArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Sarlavhadan aniqlangan til: uz | uz-cyrl | ru | en */
  language: string;
  doi: string;
  category: ApiCategory | null;
  authors: ApiAuthorBrief[];
  author_label: string;
  author_names: string[];
  year: number;
  quarter: number;
  /** Maqola chiqqan jurnal soni */
  issue_id: string | null;
  issue_number: number | null;
  issue_year: number | null;
  issue_cover_url: string | null;
  /** Manba fayl turi va hajmi (bayt) */
  file_kind: string | null;
  file_size: number | null;
  pages: number;
  min_read: number;
  cites: number;
  views: number;
  img_variant: number;
  /** Jurnaldagi bet oralig'i (mundarija uchun) */
  page_start: number | null;
  page_end: number | null;
  image_url: string | null;
  keywords: string[];
  published_at: string | null;
}

/** Filtrlar paneli uchun hisoblar — GET /api/articles/facets/ */
export interface ApiFacets {
  total: number;
  years: { value: number; count: number }[];
  issues: { id: string; number: number; year: number; count: number }[];
  categories: { slug: string; name: string; count: number }[];
  keywords: { slug: string; name: string; count: number }[];
  languages: { code: string; count: number }[];
}

/** «1–2» yoki «5» — jurnaldagi bet oralig'i; bet noma'lum bo'lsa bo'sh satr. */
export function pageRange(a: { page_start: number | null; page_end: number | null }): string {
  if (a.page_start && a.page_end) return a.page_start === a.page_end ? `${a.page_start}` : `${a.page_start}–${a.page_end}`;
  return a.page_start ? `${a.page_start}` : '';
}

/** 2 400 000 → «2,3 MB» */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Ro'yxatlardagi qisqa muallif: «A. Umarov». Ota ismi bilan yozilganda familiya
 * birinchi turadi: «Kushbakov Kamoliddin Baxromovich» → «K. Kushbakov».
 */
export function shortAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2) return `${parts[1][0]}. ${parts[0]}`;
  return parts.length === 2 ? `${parts[0][0]}. ${parts[1]}` : name;
}

export function authorsLine(a: Pick<ApiArticle, 'authors' | 'author_names' | 'author_label'>): string {
  if (a.authors.length) return a.authors.map(x => shortAuthor(x.name)).join(', ');
  return (a.author_names ?? []).map(shortAuthor).join(', ') || a.author_label;
}

/**
 * Sonning sanasi. `date_label` erkin matn («Mart 2025», «2025 1-son») — faqat haqiqiy
 * sana bo'lsa o'zi ko'rsatiladi, aks holda yil va yil ichidagi tartib raqami bir xil yoziladi.
 */
export function issueDate(i: { date_label: string; year: number; volume?: number }): string {
  if (isRealDate(i.date_label)) return i.date_label;
  return i.volume && i.volume <= 12 ? `${i.year}-yil ${i.volume}-son` : `${i.year}-yil`;
}

export function isRealDate(label: string | null | undefined): boolean {
  return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test((label ?? '').trim());
}

/** Kartalardagi «2025 · № 67» yozuvi — maqola chiqqan jurnal soni. */
export function issueLabel(a: Pick<ApiArticle, 'year' | 'issue_number' | 'issue_year'>): string {
  const year = a.issue_year ?? a.year;
  return a.issue_number === null ? String(year) : `${year} · № ${a.issue_number}`;
}

export interface ApiArticleDetail extends Omit<ApiArticle, 'keywords'> {
  content: string;
  udk: string;
  source_file_url: string | null;
  /** Detail'da object — sayt detail sahifasi keyword + slug ishlatadi (related navigatsiya). */
  keywords: { name: string; slug: string }[];
  references: string;
  issue: ApiIssueBrief | null;
  /** Admin AI ga o'qitgan bo'lsa true — chat widget shu paytda ko'rinadi. */
  ai_ready: boolean;
}

export interface ApiIssueBrief {
  id: string;
  volume: number;
  number: number;
  year: number;
  season: string;
  date_label: string;
  cover_image_url?: string | null;
  journal_id?: string | null;
  journal_title?: string | null;
}

export interface ApiIssue {
  id: string;
  cover_image_url: string | null;
  pdf_file_url: string | null;
  volume: number;
  number: number;
  year: number;
  season: string;
  date_label: string;
  palette: number;
  is_current: boolean;
  is_upcoming: boolean;
  article_count: number;
  total_pages: number;
  views: number;
  /** To'liq son PDF'ining hajmi (bayt) */
  pdf_size?: number | null;
  journal_id?: string | null;
  journal_title?: string | null;
}

/** Mundarija qatori (son sahifasi) */
export interface ApiTocArticle {
  id: string;
  title: string;
  slug: string;
  authors: string[];
  page_start: number | null;
  page_end: number | null;
  views: number;
  image_url: string | null;
  doi: string;
}

export interface ApiIssueSection {
  category: string;
  page_start: number | null;
  page_end: number | null;
  articles: ApiTocArticle[];
}

export interface ApiIssueNeighbor {
  id: string;
  number: number;
  year: number;
  is_upcoming: boolean;
}

/** Son sahifasi — Figma «Jurnal arxiv detail» */
export interface ApiIssueDetail extends ApiIssue {
  editorial_note: string;
  editor_name: string;
  issn: string;
  pdf_size: number | null;
  sections: ApiIssueSection[];
  categories: { name: string; count: number }[];
  languages: string[];
  prev_issue: ApiIssueNeighbor | null;
  next_issue: ApiIssueNeighbor | null;
}

export interface ApiYearGroup {
  year: number;
  issues: ApiIssue[];
}

export interface ApiJournal {
  id: string;
  title: string;
  issn: string;
  issues: ApiIssue[];
}

export interface ApiComment {
  id: string;
  name: string;
  text: string;
  parent: string | null;
  created_at: string;
  replies: ApiComment[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Central Asia (einfolib.uz'dan) ────────────────────────────────────────────
export interface ApiCentralAsiaPost {
  id: string;
  title: string;
  slug: string;
  author_line: string;
  excerpt: string;
  image_url: string | null;
  views_scraped: number;
  views_local: number;
  total_views: number;
  quote_number: number;
  doi: string;
  source_category: string;
  source_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface ApiCentralAsiaPostDetail extends ApiCentralAsiaPost {
  content: string;
  source_slug: string;
}

export interface ApiCentralAsiaStats {
  articles: number;
  authors: number;
  topics: { name: string; count: number }[];
  languages: string[];
}

// ── Articles ──────────────────────────────────────────────────────────────────
export const articlesApi = {
  list(params?: Record<string, string>) {
    return get<PaginatedResponse<ApiArticle>>('/api/articles/', params);
  },
  detail(slug: string) {
    return get<ApiArticleDetail>(`/api/articles/${slug}/`);
  },
  search(q: string) {
    return get<ApiArticle[]>('/api/articles/search/', { q });
  },
  related(slug: string) {
    return get<ApiArticle[]>(`/api/articles/${slug}/related/`);
  },
  stats() {
    return get<{ articles: number; authors: number; issues: number }>('/api/articles/stats/');
  },
  ask(slug: string, question: string) {
    return post<{ answer: string }>(`/api/articles/${slug}/ask/`, { question });
  },
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list() {
    return get<ApiCategory[]>('/api/categories/');
  },
};

// ── Authors ───────────────────────────────────────────────────────────────────
export const authorsApi = {
  list(params?: Record<string, string>) {
    return get<PaginatedResponse<ApiAuthor>>('/api/authors/', params);
  },
  detail(slug: string) {
    return get<ApiAuthor>(`/api/authors/${slug}/`);
  },
};

// ── Archive ───────────────────────────────────────────────────────────────────
export const archiveApi = {
  grouped() {
    return get<ApiYearGroup[]>('/api/issues/archive/');
  },
};

// ── Issues ────────────────────────────────────────────────────────────────────
export const issuesApi = {
  detail(id: string) {
    return get<ApiIssueDetail>(`/api/issues/${id}/`);
  },
};

// ── Journals ──────────────────────────────────────────────────────────────────
export const journalsApi = {
  detail(id: string) {
    return get<ApiJournal>(`/api/journals/${id}/`);
  },
};

// ── Central Asia ──────────────────────────────────────────────────────────────
export const centralAsiaApi = {
  list(params?: Record<string, string>) {
    return get<PaginatedResponse<ApiCentralAsiaPost>>('/api/central-asia/', params);
  },
  stats() {
    return get<ApiCentralAsiaStats>('/api/central-asia/stats/');
  },
  detail(slug: string) {
    return get<ApiCentralAsiaPostDetail>(`/api/central-asia/${slug}/`);
  },
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsApi = {
  list(target: { article: string } | { issue: string }) {
    return get<PaginatedResponse<ApiComment>>('/api/comments/', target);
  },
  create(body: { article?: string; issue?: string; name: string; text: string; parent?: string }) {
    return post<ApiComment>('/api/comments/', body);
  },
  remove(id: string) {
    const token = localStorage.getItem('kb_admin_access') ?? '';
    return fetch(`${BASE}/api/comments/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); });
  },
};
