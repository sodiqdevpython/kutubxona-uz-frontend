const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function token(): string {
  return localStorage.getItem('kb_admin_access') ?? '';
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`);
  return body as T;
}

// Multipart (FormData) uchun — Content-Type ni o'rnatmaymiz (browser boundary qo'shadi)
async function apiFetchForm<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? body.error ?? `HTTP ${res.status}`);
  return body as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminAuthor {
  id: string; name: string; slug: string; initials: string;
  role: string; org: string; degree: string; bio: string;
  avatar_idx: number;
  telegram_chat_id: number | null; telegram_username: string;
  article_count: number; created_at: string;
}

export interface AdminSubmission {
  id: string; chat_id: number; tg_name: string; tg_username: string;
  title: string;
  keywords: string; keywords_list: string[];
  abstract: string; references: string; note: string;
  extracted_authors: string; authors_list: string[]; ai_filled: boolean;
  status: 'pending' | 'approved' | 'rejected'; reject_reason: string;
  created_at: string; submitted_at: string | null;
  author_name: string;
  article_id: string | null; article_title: string | null; article_slug: string | null;
  article_category: { id: string; name: string } | null;
  article_issue: { id: string; volume: number; number: number; year: number; label: string } | null;
  article_ai_ready: boolean;
  source_file_url: string | null;
  image_url: string | null;
}

export interface SubmissionEdit {
  title?: string; keywords?: string; abstract?: string;
  references?: string; extracted_authors?: string;
}

export interface AdminCategory { id: string; name: string; slug: string; }

export interface PaginatedSubmissions {
  count: number; page: number; page_size: number; num_pages: number;
  results: AdminSubmission[];
}

export interface AdminIssue {
  id: string; journal: string; journal_title: string | null;
  volume: number; number: number; year: number;
  season: string; date_label: string; palette: number;
  is_current: boolean; is_upcoming: boolean;
  article_count: number; cover_image_url: string | null; created_at: string;
}

export interface AdminIssueDetail extends AdminIssue {
  articles: AdminArticleInIssue[];
}

export interface AdminArticleInIssue {
  id: string; title: string; slug: string; status: string;
  year: number; quarter: number; pages: number; min_read: number;
  authors_label: string; category_name: string | null; published_at: string | null;
}

export interface PaginatedAuthors {
  results:     AdminAuthor[];
  total:       number;
  has_more:    boolean;
  next_offset: number;
}

export interface AdminJournal { id: string; title: string; issn: string; }

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface AdminChat {
  id: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  author_avatar_idx: number;
  author_slug: string;
  telegram_username: string;
  is_blocked: boolean;
  unread_count: number;
  last_message_at: string | null;
  last_message: { text: string; kind: string; sender: 'admin' | 'user'; created_at: string } | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'admin' | 'user';
  kind: 'text' | 'photo' | 'document';
  text: string;
  image_url: string | null;
  document_url: string | null;
  document_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedChats {
  results:     AdminChat[];
  total:       number;
  has_more:    boolean;
  next_offset: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const adminApi = {
  authors: {
    list: (params: { offset?: number; limit?: number; search?: string } = {}) => {
      const p = new URLSearchParams();
      if (params.offset !== undefined) p.set('offset', String(params.offset));
      if (params.limit  !== undefined) p.set('limit',  String(params.limit));
      if (params.search)               p.set('search', params.search);
      const q = p.toString();
      return apiFetch<PaginatedAuthors>(`/api/admin/authors/${q ? `?${q}` : ''}`);
    },
    create: (d: Partial<AdminAuthor>) =>
      apiFetch<AdminAuthor>('/api/admin/authors/', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<AdminAuthor>) =>
      apiFetch<AdminAuthor>(`/api/admin/authors/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id: string, mode: 'soft' | 'full') =>
      apiFetch<void>(`/api/admin/authors/${id}/?mode=${mode}`, { method: 'DELETE' }),
  },

  submissions: {
    list: (params: { status?: string; search?: string; page?: number; page_size?: number } = {}) => {
      const p = new URLSearchParams();
      if (params.status)    p.set('status', params.status);
      if (params.search)    p.set('search', params.search);
      if (params.page)      p.set('page', String(params.page));
      if (params.page_size) p.set('page_size', String(params.page_size));
      const q = p.toString();
      return apiFetch<PaginatedSubmissions>(`/api/admin/submissions/${q ? `?${q}` : ''}`);
    },
    aiExtract: (id: string) =>
      apiFetch<AdminSubmission>(`/api/admin/submissions/${id}/ai-extract/`, { method: 'POST' }),
    update: (id: string, data: SubmissionEdit) =>
      apiFetch<AdminSubmission>(`/api/admin/submissions/${id}/`, {
        method: 'PATCH', body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      apiFetch<void>(`/api/admin/submissions/${id}/`, { method: 'DELETE' }),
    approve: (id: string, category?: { category_id?: string; category_name?: string }) =>
      apiFetch<AdminSubmission>(`/api/admin/submissions/${id}/approve/`, {
        method: 'POST', body: JSON.stringify(category ?? {}),
      }),
    reject: (id: string, reason: string) =>
      apiFetch<AdminSubmission>(`/api/admin/submissions/${id}/reject/`, {
        method: 'POST', body: JSON.stringify({ reason }),
      }),
    revert: (id: string, reason: string) =>
      apiFetch<AdminSubmission>(`/api/admin/submissions/${id}/revert/`, {
        method: 'POST', body: JSON.stringify({ reason }),
      }),
  },

  categories: {
    list:   () => apiFetch<AdminCategory[]>('/api/admin/categories/'),
    create: (name: string) =>
      apiFetch<AdminCategory>('/api/admin/categories/', { method: 'POST', body: JSON.stringify({ name }) }),
  },

  articles: {
    trainAi: (articleId: string) =>
      apiFetch<{ id: string; slug: string; llm_document_id: string; ai_ready: boolean }>(
        `/api/admin/articles/${articleId}/train-ai/`,
        { method: 'POST' },
      ),
    clearAi: (articleId: string) =>
      apiFetch<{ id: string; ai_ready: boolean }>(
        `/api/admin/articles/${articleId}/train-ai/`,
        { method: 'DELETE' },
      ),
  },

  chat: {
    list: (params: { offset?: number; limit?: number } = {}) => {
      const p = new URLSearchParams();
      if (params.offset !== undefined) p.set('offset', String(params.offset));
      if (params.limit  !== undefined) p.set('limit',  String(params.limit));
      const q = p.toString();
      return apiFetch<PaginatedChats>(`/api/admin/chat/${q ? `?${q}` : ''}`);
    },
    byAuthor:   (authorSlug: string)     => apiFetch<AdminChat>(`/api/admin/chat/by-author/${authorSlug}/`),
    messages:   (chatId: string)         => apiFetch<ChatMessage[]>(`/api/admin/chat/${chatId}/messages/`),
    send: (chatId: string, payload: { text?: string; image?: File | null; document?: File | null }) => {
      const fd = new FormData();
      if (payload.text)     fd.append('text', payload.text);
      if (payload.image)    fd.append('image', payload.image);
      if (payload.document) fd.append('document', payload.document);
      return apiFetchForm<ChatMessage>(`/api/admin/chat/${chatId}/send/`, { method: 'POST', body: fd });
    },
    toggleBlock: (chatId: string) =>
      apiFetch<{ is_blocked: boolean }>(`/api/admin/chat/${chatId}/block/`, { method: 'POST' }),
    markRead:    (chatId: string) =>
      apiFetch<{ ok: boolean }>(`/api/admin/chat/${chatId}/read/`, { method: 'POST' }),
    remove:      (chatId: string) =>
      apiFetch<void>(`/api/admin/chat/${chatId}/`, { method: 'DELETE' }),
  },

  journals: {
    list: () => apiFetch<AdminJournal[]>('/api/admin/journals/'),
  },

  issues: {
    list:   ()            => apiFetch<AdminIssue[]>('/api/admin/issues/'),
    detail: (id: string)  => apiFetch<AdminIssueDetail>(`/api/admin/issues/${id}/`),
    create: (d: Record<string, unknown>, cover?: File | null) => {
      if (cover) {
        const fd = new FormData();
        Object.entries(d).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
        fd.append('cover_image', cover);
        return apiFetchForm<AdminIssue>('/api/admin/issues/', { method: 'POST', body: fd });
      }
      return apiFetch<AdminIssue>('/api/admin/issues/', { method: 'POST', body: JSON.stringify(d) });
    },
    update: (id: string, d: Partial<AdminIssue>, cover?: File | null) => {
      if (cover) {
        const fd = new FormData();
        Object.entries(d).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
        fd.append('cover_image', cover);
        return apiFetchForm<AdminIssue>(`/api/admin/issues/${id}/`, { method: 'PATCH', body: fd });
      }
      return apiFetch<AdminIssue>(`/api/admin/issues/${id}/`, { method: 'PATCH', body: JSON.stringify(d) });
    },
    remove: (id: string) =>
      apiFetch<void>(`/api/admin/issues/${id}/`, { method: 'DELETE' }),
    assign: (issueId: string, articleId: string) =>
      apiFetch<{ success: boolean }>(`/api/admin/issues/${issueId}/assign/`, {
        method: 'POST', body: JSON.stringify({ article_id: articleId }),
      }),
    removeArticle: (issueId: string, articleId: string) =>
      apiFetch<void>(`/api/admin/issues/${issueId}/articles/${articleId}/`, { method: 'DELETE' }),
  },
};
