import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import Pagination from '../components/ui/Pagination';
import { SearchIcon } from '../components/ui/Icons';
import { useI18n, type MsgKey } from '../lib/i18n';
import type { ApiAuthor, PaginatedResponse } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Mualliflar — Figma «Mualliflar» freymi.
 * Alifbo bo'yicha guruhlangan kartalar, raqamli sahifalash.
 * Sahifalash, saralash, qidiruv va tashkilot filtri serverda bajariladi —
 * har safar faqat bitta sahifa (18 ta muallif) yuklanadi.
 */

const BASE     = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const PER_PAGE = 18;

type SortKey = 'abc' | 'count' | 'views';
const SORT: Record<SortKey, MsgKey> = { abc: 'authors.sort.abc', count: 'authors.sort.count', views: 'authors.sort.views' };
const GROUPED: Record<SortKey, MsgKey> = { abc: 'authors.grouped.abc', count: 'authors.grouped.count', views: 'authors.grouped.views' };
const ORDERING: Record<SortKey, string> = { abc: 'name', count: '-n_articles', views: '-n_views' };

/** Tashkilot chiplari — backend `ORG_GROUPS` bilan bir xil kalitlar. */
const ORG_GROUPS: { key: string; label: MsgKey }[] = [
  { key: 'national', label: 'authors.org.national' },
  { key: 'regional', label: 'authors.org.regional' },
  { key: 'higher',   label: 'authors.org.higher' },
  { key: 'foreign',  label: 'authors.org.foreign' },
];

interface Summary { total: number; orgs: number; groups: Record<string, number> }

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

export default function AuthorsPage() {
  const { t, tn, num, locale } = useI18n();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData]       = useState<PaginatedResponse<ApiAuthor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);
  const [q, setQ]             = useState('');
  const [query, setQuery]     = useState('');      // qidiruv — yozib bo'lgach (debounce)
  const [sort, setSort]       = useState<SortKey>('abc');
  const [page, setPage]       = useState(1);
  const [org, setOrg]         = useState('');

  useEffect(() => {
    fetch(`${BASE}/api/authors/summary/`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setSummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Filtr o'zgarsa birinchi sahifaga qaytamiz (render vaqtida — qo'shimcha so'rovsiz)
  const filterKey = `${query}|${sort}|${org}`;
  const [seenKey, setSeenKey] = useState(filterKey);
  if (seenKey !== filterKey) { setSeenKey(filterKey); setPage(1); }

  useEffect(() => {
    const p = new URLSearchParams({ page: String(page), page_size: String(PER_PAGE), ordering: ORDERING[sort] });
    if (query) p.set('search', query);
    if (org) p.set('org_group', org);
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`${BASE}/api/authors/?${p}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: PaginatedResponse<ApiAuthor>) => { setData(d); setFailed(false); setLoading(false); })
      .catch(e => { if ((e as Error).name !== 'AbortError') { setFailed(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [page, sort, query, org]);

  const items  = data?.results ?? [];
  const total  = data?.count ?? 0;
  const groups = sort === 'abc' ? groupByLetter(items) : [{ label: '', items }];
  const from   = total ? (page - 1) * PER_PAGE + 1 : 0;
  const to     = Math.min(page * PER_PAGE, total);
  const orgCounts = ORG_GROUPS
    .map(g => ({ ...g, count: summary?.groups[g.key] ?? 0 }))
    .filter(g => g.count > 0);

  function goPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="bg-authors" style={{ minHeight: '100vh' }}>
      <Seo title={t('nav.authors')} description={t('authors.seo.description')} />
      <PageLoadBar />
      <Topbar active="authors" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 72 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <span className="cur">{t('nav.authors')}</span>
        </nav>

        <div className="page-head">
          <div>
            <h1 className="h-display page-title">{t('nav.authors')}</h1>
            <p className="page-sub">
              {summary
                ? [tn('unit.authors', summary.total), summary.orgs ? tn('unit.orgs', summary.orgs) : '', t('authors.since')].filter(Boolean).join(' · ')
                : t('common.loading')}
            </p>
          </div>
          <div className="page-head-ctrl">
            <div className="searchbar au-search">
              <SearchIcon size={15} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('authors.search_placeholder')} aria-label={t('authors.search_placeholder')} />
              {q && <button className="searchbar-x" onClick={() => setQ('')} aria-label={t('common.clear')}>×</button>}
            </div>
            <div className="segment">
              {(Object.keys(SORT) as SortKey[]).map(k => (
                <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>{t(SORT[k])}</button>
              ))}
            </div>
          </div>
        </div>

        {orgCounts.length > 0 && (
          <div className="chip-wrap au-org-chips">
            <button className={`chip${org === '' ? ' active' : ''}`} onClick={() => setOrg('')}>
              {t('common.all')} <span className="count">{summary?.total}</span>
            </button>
            {orgCounts.map(g => (
              <button key={g.key} className={`chip${org === g.key ? ' active' : ''}`} onClick={() => setOrg(g.key)}>
                {t(g.label)} <span className="count">{g.count}</span>
              </button>
            ))}
          </div>
        )}

        {failed && <div className="state-box">{t('authors.load_error')}</div>}
        {!data && !failed && <div className="state-box">{t('common.loading')}</div>}
        {data && !loading && total === 0 && <div className="state-box">{t('authors.empty')}</div>}

        <div className={`au-results${loading && data ? ' is-loading' : ''}`} aria-busy={loading}>
          {groups.map(g => (
            <section key={g.label || 'flat'} className="au-group">
              {g.label && (
                <div className="au-group-head">
                  <span className="au-group-letter h-display">{g.label}</span>
                  <span className="rule" />
                  <span className="meta">{tn('unit.authors', g.items.length)}</span>
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
                        <span>{tn('unit.articles', a.article_count)}</span>
                        <span className="dim">{tn('unit.views', a.total_views)}</span>
                        {a.orcid && <span className="orc">ORCID</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {total > 0 && (
          <div className="pager-bar">
            <span className="meta">{num(from)}–{num(to)} / {tn('unit.authors', total)}</span>
            <Pagination total={total} perPage={PER_PAGE} current={page} label={null} onPageChange={goPage} />
            <span className="page-head-lbl" lang={locale}>{t(GROUPED[sort])}</span>
          </div>
        )}
      </div>

      </main>
      <Footer />
    </div>
  );
}
