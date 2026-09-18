import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import Pagination from '../components/ui/Pagination';
import { SearchIcon } from '../components/ui/Icons';
import type { ApiAuthor, PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Mualliflar — Figma «Mualliflar» freymi.
 * Alifbo bo'yicha guruhlangan kartalar, tashkilot chiplari, raqamli sahifalash.
 * Ro'yxat kichik (yuzlab), shuning uchun hammasi bir marta yuklanib
 * saralash/qidiruv/guruhlash brauzerda bajariladi.
 */

const BASE     = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PER_PAGE = 18;

type SortKey = 'abc' | 'count' | 'views';
const SORT: Record<SortKey, string> = { abc: 'Alifbo', count: 'Maqolalar soni', views: 'Ko‘rishlar' };

type OrgKey = 'all' | 'national' | 'regional' | 'edu' | 'foreign';
const ORG: Record<OrgKey, string> = {
  all: 'Barchasi', national: 'Milliy kutubxona', regional: 'Viloyat markazlari', edu: 'Oliy ta‘lim', foreign: 'Xorijiy',
};

/** Tashkilot nomidan turini aniqlash (Figma'dagi 4 guruh). */
function orgKind(org: string): Exclude<OrgKey, 'all'> | null {
  const s = org.toLowerCase();
  if (!s) return null;
  if (/milliy kutubxona|национальн(ая|ой) библиотек/.test(s)) return 'national';
  if (/viloyat|axborot-kutubxona markazi|областн|shahar/.test(s)) return 'regional';
  if (/universitet|institut|akademiya|universit|institute|academy|университет|институт|академи/.test(s)) return 'edu';
  if (/[а-яё]/.test(s) || /russia|kazakh|kyrgyz|tajik|turkmen|international|library of/i.test(s)) return 'foreign';
  return null;
}

/** Sort qilingan ro'yxatni «A», «D — H» kabi harf oraliqlariga bo'lish. */
function groupByLetter(list: ApiAuthor[]): { label: string; items: ApiAuthor[] }[] {
  const groups: { first: string; last: string; items: ApiAuthor[] }[] = [];
  for (const a of list) {
    const L = (a.name.trim()[0] || '#').toUpperCase();
    const g = groups[groups.length - 1];
    if (g && (g.last === L || g.items.length < 4)) { g.items.push(a); g.last = L; }
    else groups.push({ first: L, last: L, items: [a] });
  }
  // oxirgi guruh juda kichik bo'lsa oldingisiga qo'shamiz
  if (groups.length > 1 && groups[groups.length - 1].items.length < 2) {
    const last = groups.pop()!;
    const g = groups[groups.length - 1];
    g.items.push(...last.items); g.last = last.last;
  }
  return groups.map(g => ({ label: g.first === g.last ? g.first : `${g.first} — ${g.last}`, items: g.items }));
}

async function fetchAll(): Promise<ApiAuthor[]> {
  const out: ApiAuthor[] = [];
  let url: string | null = `${BASE}/api/authors/?page_size=100`;
  while (url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const d: PaginatedResponse<ApiAuthor> = await r.json();
    out.push(...d.results);
    url = d.next;
  }
  return out;
}

export default function AuthorsPage() {
  const navigate = useNavigate();
  const [all, setAll]       = useState<ApiAuthor[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ]           = useState('');
  const [sort, setSort]     = useState<SortKey>('abc');
  const [org, setOrg]       = useState<OrgKey>('all');
  const [page, setPage]     = useState(1);

  useEffect(() => { fetchAll().then(setAll).catch(() => setFailed(true)); }, []);
  useEffect(() => { setPage(1); }, [q, sort, org]);

  const orgCounts = useMemo(() => {
    const c: Record<OrgKey, number> = { all: all?.length ?? 0, national: 0, regional: 0, edu: 0, foreign: 0 };
    for (const a of all ?? []) { const k = orgKind(a.org); if (k) c[k]++; }
    return c;
  }, [all]);
  const orgTotal = useMemo(() => new Set((all ?? []).map(a => a.org).filter(Boolean)).size, [all]);

  const filtered = useMemo(() => {
    let list = all ?? [];
    const s = q.trim().toLowerCase();
    if (s) list = list.filter(a => `${a.name} ${a.org} ${a.role}`.toLowerCase().includes(s));
    if (org !== 'all') list = list.filter(a => orgKind(a.org) === org);
    const by: Record<SortKey, (x: ApiAuthor, y: ApiAuthor) => number> = {
      abc:   (x, y) => x.name.localeCompare(y.name, 'uz'),
      count: (x, y) => y.article_count - x.article_count || x.name.localeCompare(y.name, 'uz'),
      views: (x, y) => y.total_views - x.total_views || x.name.localeCompare(y.name, 'uz'),
    };
    return [...list].sort(by[sort]);
  }, [all, q, org, sort]);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const groups = sort === 'abc' ? groupByLetter(pageItems) : [{ label: '', items: pageItems }];
  const from = filtered.length ? (page - 1) * PER_PAGE + 1 : 0;
  const to   = Math.min(page * PER_PAGE, filtered.length);

  return (
    <div className="bg-authors" style={{ minHeight: '100vh' }}>
      <Seo title="Mualliflar" description="Kutubxona.uz jurnali mualliflari — kutubxonachilar, arxivchilar, tadqiqotchilar." />
      <PageLoadBar />
      <Topbar active="authors" />

      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 72 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <span className="cur">Mualliflar</span>
        </nav>

        <div className="page-head">
          <div>
            <h1 className="h-display page-title">Mualliflar</h1>
            <p className="page-sub">
              {all ? `${all.length} muallif · ${orgTotal} tashkilot · 2019-yildan beri` : 'Yuklanmoqda…'}
            </p>
          </div>
          <div className="page-head-ctrl">
            <div className="searchbar au-search">
              <SearchIcon size={15} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism yoki ish joyi bo‘yicha" />
              {q && <button className="searchbar-x" onClick={() => setQ('')}>×</button>}
            </div>
            <div className="segment">
              {(Object.keys(SORT) as SortKey[]).map(k => (
                <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>{SORT[k]}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Tashkilot chiplari */}
        <div className="filter-row" style={{ marginBottom: 28 }}>
          <span className="page-head-lbl">Tashkilot</span>
          {(Object.keys(ORG) as OrgKey[]).map(k => (
            <button key={k} className={`chip${org === k ? ' active' : ''}`} onClick={() => setOrg(k)}>
              {ORG[k]} <span className="count">{orgCounts[k]}</span>
            </button>
          ))}
        </div>

        {failed && <div className="state-box">Mualliflarni yuklashda xatolik.</div>}
        {!all && !failed && <div className="state-box">Yuklanmoqda…</div>}
        {all && filtered.length === 0 && <div className="state-box">Mualliflar topilmadi.</div>}

        {groups.map(g => (
          <section key={g.label || 'flat'} className="au-group">
            {g.label && (
              <div className="au-group-head">
                <span className="au-group-letter h-display">{g.label}</span>
                <span className="rule" />
                <span className="meta">{g.items.length} muallif</span>
              </div>
            )}
            <div className="au-cards">
              {g.items.map(a => (
                <article key={a.id} className="au-card" onClick={() => navigate(`/authors/${a.slug}`)}>
                  <AuthorAvatar name={a.initials} idx={a.avatar_idx} src={mediaUrl(a.avatar_url)} alt={a.name} size={54} />
                  <div style={{ minWidth: 0 }}>
                    <div className="au-card-name">{a.name}</div>
                    <div className="au-card-org">
                      {[a.org, a.role].filter(Boolean).join(' · ') || 'Tashkilot ko‘rsatilmagan'}
                    </div>
                    <div className="au-card-meta">
                      <span>{a.article_count} maqola</span>
                      <span className="dim">{a.total_views.toLocaleString()} ko‘rish</span>
                      {a.orcid && <span className="orc">ORCID</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {all && filtered.length > 0 && (
          <div className="pager-bar">
            <span className="meta">{from}–{to} / {filtered.length} muallif</span>
            <Pagination total={filtered.length} perPage={PER_PAGE} current={page} label={null} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            <span className="page-head-lbl">
              {sort === 'abc' ? 'Alifbo bo‘yicha guruhlangan' : sort === 'count' ? 'Maqolalar soni bo‘yicha' : 'Ko‘rishlar bo‘yicha'}
            </span>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
