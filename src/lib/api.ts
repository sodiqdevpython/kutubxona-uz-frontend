// ── API base ─────────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
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
  article_count: number;
  total_views: number;
  profile_views: number;
}

export interface ApiArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: ApiCategory | null;
  authors: ApiAuthorBrief[];
  author_label: string;
  author_names: string[];
  status: 'open' | 'lock';
  year: number;
  quarter: number;
  pages: number;
  min_read: number;
  cites: number;
  views: number;
  img_variant: number;
  image_url: string | null;
  keywords: string[];
  published_at: string | null;
}

export interface ApiArticleDetail extends Omit<ApiArticle, 'keywords'> {
  content: string;
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
}

export interface ApiIssue {
  id: string;
  cover_image_url: string | null;
  volume: number;
  number: number;
  year: number;
  season: string;
  date_label: string;
  palette: number;
  is_current: boolean;
  is_upcoming: boolean;
  article_count: number;
}

export interface ApiYearGroup {
  year: number;
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

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsApi = {
  list(articleId: string) {
    return get<PaginatedResponse<ApiComment>>('/api/comments/', { article: articleId });
  },
  create(body: { article: string; name: string; text: string; parent?: string }) {
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
