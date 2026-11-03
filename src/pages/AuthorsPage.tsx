import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import Pagination from '../components/ui/Pagination';
import { SearchIcon } from '../components/ui/Icons';
import type { ApiAuthor, PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import { foldText } from '../lib/search';
import Seo from '../components/Seo';

/**
 * Mualliflar — Figma «Mualliflar» freymi.
 * Alifbo bo'yicha guruhlangan kartalar, raqamli sahifalash.
 * Ro'yxat kichik (yuzlab), shuning uchun hammasi bir marta yuklanib
 * saralash/qidiruv/guruhlash brauzerda bajariladi.
 */

const BASE     = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PER_PAGE = 18;

type SortKey = 'abc' | 'count' | 'views';
const SORT: Record<SortKey, string> = { abc: 'Alifbo', count: 'Maqolalar soni', views: 'Ko‘rishlar' };

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

/** Tashkilot chiplari — tashkilot nomidan aniqlanadi (Figma: «Mualliflar» sarlavhasi ostida). */
const ORG_GROUPS: { key: string; label: string; test: RegExp }[] = [
  { key: 'national', label: 'Milliy kutubxona', test: /milliy kutubxona/i },
  { key: 'regional', label: 'Viloyat markazlari', test: /viloyat|axborot-kutubxona markaz|axborot-resurs markaz/i },
  { key: 'higher',   label: 'Oliy ta’lim', test: /universitet|institut|akademiya|magistr|университет|институт|академи/i },
  { key: 'foreign',  label: 'Xorijiy', test: /россий|moskva|москв|kazakh|qozog‘iston|казахстан|kyrgyz|tojikiston/i },
];

export default function AuthorsPage() {
  const [all, setAll]       = useState<ApiAuthor[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ]           = useState('');
  const [sort, setSort]     = useState<SortKey>('abc');
  const [page, setPage]     = useState(1);
  const [org, setOrg]       = useState('');

  useEffect(() => { fetchAll().then(setAll).catch(() => setFailed(true)); }, []);
  useEffect(() => { setPage(1); }, [q, sort, org]);

  const orgTotal = useMemo(() => new Set((all ?? []).map(a => a.org).filter(Boolean)).size, [all]);

  const orgCounts = useMemo(() => ORG_GROUPS
    .map(g => ({ ...g, count: (all ?? []).filter(a => g.test.test(a.org)).length }))
    .filter(g => g.count > 0), [all]);

  const filtered = useMemo(() => {
    let list = all ?? [];
    const group = ORG_GROUPS.find(g => g.key === org);
    if (group) list = list.filter(a => group.test.test(a.org));
    const s = foldText(q.trim());
    if (s) list = list.filter(a => foldText(`${a.name} ${a.org} ${a.role}`).includes(s));
    const by: Record<SortKey, (x: ApiAuthor, y: ApiAuthor) => number> = {
      abc:   (x, y) => x.name.localeCompare(y.name, 'uz'),
      count: (x, y) => y.article_count - x.article_count || x.name.localeCompare(y.name, 'uz'),
      views: (x, y) => y.total_views - x.total_views || x.name.localeCompare(y.name, 'uz'),
    };
    return [...list].sort(by[sort]);
  }, [all, q, sort, org]);

  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const groups = sort === 'abc' ? groupByLetter(pageItems) : [{ label: '', items: pageItems }];
  const from = filtered.length ? (page - 1) * PER_PAGE + 1 : 0;
  const to   = Math.min(page * PER_PAGE, filtered.length);

  return (
    <div className="bg-authors" style={{ minHeight: '100vh' }}>
      <Seo title="Mualliflar" description="Kutubxona.uz jurnali mualliflari — kutubxonachilar, arxivchilar, tadqiqotchilar." />
      <PageLoadBar />
      <Topbar active="authors" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 72 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <span className="cur">Mualliflar</span>
        </nav>

        <div className="page-head">
          <div>
            <h1 className="h-display page-title">Mualliflar</h1>
            <p className="page-sub">
              {all ? `${all.length} muallif${orgTotal ? ` · ${orgTotal} tashkilot` : ''} · 2019-yildan beri` : 'Yuklanmoqda…'}
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

        {orgCounts.length > 0 && (
          <div className="chip-wrap au-org-chips">
            <button className={`chip${org === '' ? ' active' : ''}`} onClick={() => setOrg('')}>
              Barchasi <span className="count">{all?.length}</span>
            </button>
            {orgCounts.map(g => (
              <button key={g.key} className={`chip${org === g.key ? ' active' : ''}`} onClick={() => setOrg(g.key)}>
                {g.label} <span className="count">{g.count}</span>
              </button>
            ))}
          </div>
        )}

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
                <Link key={a.id} to={`/authors/${a.slug}`} className="au-card">
                  <AuthorAvatar name={a.initials} idx={a.avatar_idx} src={mediaUrl(a.avatar_url)} alt={a.name} size={54} />
                  <div style={{ minWidth: 0 }}>
                    <div className="au-card-name">{a.name}</div>
                    {(a.org || a.role) && (
                      <div className="au-card-org">{[a.org, a.role].filter(Boolean).join(' · ')}</div>
                    )}
                    <div className="au-card-meta">
                      <span>{a.article_count} maqola</span>
                      <span className="dim">{a.total_views.toLocaleString()} ko‘rish</span>
                      {a.orcid && <span className="orc">ORCID</span>}
                    </div>
                  </div>
                </Link>
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

      </main>
      <Footer />
    </div>
  );
}
