import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import Pagination from '../components/ui/Pagination';
import { CheckIcon, SearchIcon } from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiArticle, ApiCategory, PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

/**
 * Maqolalar ro'yxati — Figma «Maqolalar» freymi.
 * Chapda filtrlar paneli, o'ngda raqamlangan qatorlar jadvali.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Saralash (Figma: segmentli boshqaruv) ────────────────────────────────────
type SortKey = 'new' | 'old' | 'views' | 'alpha';
const SORT_OPTS: Record<SortKey, { label: string; param: string }> = {
  new:   { label: 'Eng yangi',     param: '-issue__year,-issue__number,-published_at' },
  old:   { label: 'Eng eski',      param: 'issue__year,issue__number,published_at' },
  views: { label: "Ko'p o'qilgan", param: '-views' },
  alpha: { label: 'Alifbo',        param: 'title' },
};

const PAGE_SIZES = [20, 50, 100];

const QUARTERS: [string, string][] = [
  ['1-chorak', '1'], ['2-chorak', '2'], ['3-chorak', '3'], ['4-chorak', '4'],
];

/** Sarlavhadan tilni taxmin qilamiz — Figma'da har qatorda til kodi turadi. */
const EN_WORDS = /\b(the|and|of|in|for|with|study|based|habits|among|research|analysis|libraries|digital|review|survey|case|data)\b/i;

function langCode(title: string): string {
  if (/[а-яА-ЯёЁ]/.test(title)) {
    return /[ўқғҳЎҚҒҲ]/.test(title) ? 'ЎЗ' : 'RU';
  }
  // O'zbek lotin belgilari yoki so'zlari — aniq o'zbekcha
  if (/[‘’]|\b(va|bilan|uchun|haqida|asosida|qilish|tizim|kutubxona)/i.test(title)) return 'UZ';
  return EN_WORDS.test(title) ? 'EN' : 'UZ';
}

// ── Bitta qator ──────────────────────────────────────────────────────────────

function ArticleRow({ a, index }: { a: ApiArticle; index: number }) {
  const navigate = useNavigate();
  const authors = a.authors.length
    ? a.authors.map(x => x.name).join(', ')
    : (a.author_names ?? []).join(', ') || a.author_label;

  return (
    <article className="art-row" onClick={() => navigate(`/articles/${a.slug}`)}>
      <div className="art-row-num">{String(index).padStart(2, '0')}</div>

      <div className="art-row-body">
        <div className="art-row-tags">
          {a.category && <span className="tag cat">{a.category.name}</span>}
          <span className="tag ok">Ochiq kirish</span>
          <span className="meta">{langCode(a.title)}</span>
        </div>

        <h3 className="art-row-title h-display">{a.title}</h3>

        {authors && <div className="art-row-authors">{authors}</div>}
      </div>

      <div className="art-row-meta">
        <span>{a.year} · №&nbsp;{a.quarter}</span>
        {a.pages > 0 && <span>{a.pages}&nbsp;b.</span>}
        <span>{a.views.toLocaleString()} ko‘rish</span>
        <Link to={`/articles/${a.slug}`} className="art-row-pdf"
          onClick={e => e.stopPropagation()}>O‘qish</Link>
      </div>
    </article>
  );
}

// ── Filtr guruhi ─────────────────────────────────────────────────────────────

function FilterGroup({ title, items, selected, onToggle, limit = 4 }: {
  title: string;
  items: [string, number | null, string][];   // [nomi, soni, qiymati]
  selected: string[];
  onToggle: (val: string) => void;
  limit?: number;
}) {
  const [open, setOpen] = useState(true);
  const [all, setAll]   = useState(false);
  const shown = all ? items : items.slice(0, limit);
  const rest  = items.length - shown.length;

  return (
    <div className="filter-group">
      <button className="filter-group-head" onClick={() => setOpen(o => !o)}>
        {title}
        <span className="filter-group-toggle">{open ? '–' : '+'}</span>
      </button>

      {open && (
        <>
          <div className="filter-group-items">
            {shown.map(([name, count, value]) => {
              const on = selected.includes(value);
              const empty = count === 0;
              return (
                <label key={value} className="filter-row" onClick={() => !empty && onToggle(value)}
                  style={{ opacity: empty ? 0.45 : 1, cursor: empty ? 'default' : 'pointer' }}>
                  <span className="filter-box" data-on={on ? 'on' : undefined}>
                    {on && <CheckIcon size={9} />}
                  </span>
                  <span className="filter-label">{name}</span>
                  {count !== null && <span className="filter-count">{count}</span>}
                </label>
              );
            })}
          </div>
          {rest > 0 && (
            <button className="filter-more" onClick={() => setAll(true)}>
              Yana {rest} {title.toLowerCase()}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Yuklanish skeleti (Figma: «Maqolalar loading») ───────────────────────────

function ArticlesSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="art-table" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="art-row sk-row">
          <div className="sk sk-num" />
          <div className="art-row-body">
            <div className="sk sk-cat" />
            <div className="sk sk-title" style={{ width: `${72 + ((i * 7) % 22)}%` }} />
            <div className="sk sk-author" />
          </div>
          <div className="art-row-meta">
            <div className="sk sk-meta" />
            <div className="sk sk-meta sk-meta-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sahifa ───────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  const [urlParams] = useSearchParams();
  const initialSearch = urlParams.get('search') ?? '';

  const [selCats,     setSelCats]     = useState<string[]>([]);
  const [selYears,    setSelYears]    = useState<string[]>([]);
  const [selQuarters, setSelQuarters] = useState<string[]>([]);
  const [search,      setSearch]      = useState(initialSearch);
  const [debouncedQ,  setDebouncedQ]  = useState(initialSearch);
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(20);
  const [sort,        setSort]        = useState<SortKey>('new');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [sort, pageSize]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (val: string) => {
      setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
      setPage(1);
    };

  function clearAll() {
    setSelCats([]); setSelYears([]); setSelQuarters([]);
    setSearch(''); setDebouncedQ(''); setPage(1);
  }

  // ── So'rov manzili ──────────────────────────────────────────────────────────
  const articlesUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (selCats.length)     p.set('categories', selCats.join(','));
    if (selYears.length)    p.set('years',      selYears.join(','));
    if (selQuarters.length) p.set('quarters',   selQuarters.join(','));
    if (debouncedQ.trim())  p.set('search',     debouncedQ.trim());
    p.set('ordering',  SORT_OPTS[sort].param);
    p.set('page',      String(page));
    p.set('page_size', String(pageSize));
    return `${BASE}/api/articles/?${p.toString()}`;
  }, [selCats, selYears, selQuarters, debouncedQ, page, pageSize, sort]);

  const articlesState = useFetch<PaginatedResponse<ApiArticle>>(articlesUrl);
  const catState      = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);
  const allState      = useFetch<PaginatedResponse<ApiArticle>>(`${BASE}/api/articles/?page_size=100`);

  const articles   = articlesState.status === 'ok' ? articlesState.data.results : [];
  const totalCount = articlesState.status === 'ok' ? articlesState.data.count   : 0;
  const categories = catState.status      === 'ok' ? catState.data              : [];
  const allArticles = allState.status     === 'ok' ? allState.data.results      : [];

  // Yillar ro'yxati — mavjud maqolalardan hisoblanadi
  const yearItems = useMemo<[string, number | null, string][]>(() => {
    const m = new Map<number, number>();
    allArticles.forEach(a => m.set(a.year, (m.get(a.year) ?? 0) + 1));
    return [...m.entries()].sort((x, y) => y[0] - x[0])
      .map(([y, n]) => [String(y), n, String(y)]);
  }, [allArticles]);

  const quarterItems = useMemo<[string, number | null, string][]>(() => {
    const m = new Map<number, number>();
    allArticles.forEach(a => m.set(a.quarter, (m.get(a.quarter) ?? 0) + 1));
    return QUARTERS.map(([label, val]) => [label, m.get(Number(val)) ?? 0, val]);
  }, [allArticles]);

  const catItems: [string, number | null, string][] =
    categories.map(c => [c.name, c.article_count, c.slug]);

  // Faol filtrlar — Figma'da ro'yxat tepasida chiplar qatori bo'lib chiqadi
  const activeChips = useMemo(() => {
    const out: { key: string; label: string; remove: () => void }[] = [];
    selYears.forEach(y => out.push({
      key: 'y' + y, label: y, remove: () => toggle(setSelYears)(y),
    }));
    selQuarters.forEach(q => {
      const lbl = QUARTERS.find(([, v]) => v === q)?.[0] ?? q;
      out.push({ key: 'q' + q, label: lbl, remove: () => toggle(setSelQuarters)(q) });
    });
    selCats.forEach(c => {
      const lbl = categories.find(x => x.slug === c)?.name ?? c;
      out.push({ key: 'c' + c, label: lbl, remove: () => toggle(setSelCats)(c) });
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selYears, selQuarters, selCats, categories]);

  const years = yearItems.map(y => Number(y[0]));
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '';
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title="Maqolalar" description="Barcha ilmiy maqolalar — yo'nalish, yil, chorak bo'yicha filtrlash va qidirish." />
      <PageLoadBar />
      <Topbar active="articles" />

      <div className="wrap" style={{ paddingTop: 30 }}>
        {/* Non-pon */}
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link>
          <span>/</span>
          <span className="cur">Maqolalar</span>
        </nav>

        {/* Sarlavha + saralash */}
        <div className="page-head">
          <div>
            <h1 className="h-display page-title">Barcha maqolalar</h1>
            <p className="page-sub">
              {articlesState.status !== 'ok'
                ? '…'
                : activeChips.length > 0
                  ? `${totalCount.toLocaleString()} natija · ${activeChips.length} filtr qo‘llangan`
                  : `${totalCount.toLocaleString()} ta maqola${yearRange ? ` · ${yearRange}` : ''}`}
            </p>
          </div>

          <div className="page-head-ctrl">
            <span className="page-head-lbl">Saralash</span>
            <div className="segment">
              {(Object.keys(SORT_OPTS) as SortKey[]).map(key => (
                <button key={key} className={sort === key ? 'active' : ''}
                  onClick={() => setSort(key)}>
                  {SORT_OPTS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Asosiy: filtr + ro'yxat ── */}
      <div className="wrap articles-grid">
        <aside className="filters rsp-hide">
          <div className="filters-head">
            <span className="eyebrow">Filtrlar</span>
            <button onClick={clearAll} className={activeChips.length ? 'on' : ''}>Tozalash</button>
          </div>

          <div className="searchbar" style={{ marginBottom: 20 }}>
            <SearchIcon size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ro‘yxat ichidan qidirish" style={{ fontSize: 13 }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 15, lineHeight: 1 }}>×</button>
            )}
          </div>

          {yearItems.length > 0 && (
            <FilterGroup title="Yil" items={yearItems}
              selected={selYears} onToggle={toggle(setSelYears)} />
          )}
          <FilterGroup title="Chorak" items={quarterItems}
            selected={selQuarters} onToggle={toggle(setSelQuarters)} />
          {catItems.length > 0 && (
            <FilterGroup title="Yo‘nalish" items={catItems}
              selected={selCats} onToggle={toggle(setSelCats)} />
          )}
        </aside>

        {/* Ro'yxat */}
        <div>
          {/* Faol filtrlar */}
          {activeChips.length > 0 && (
            <div className="active-filters">
              <span className="eyebrow accent">Faol filtrlar</span>
              <div className="active-chips">
                {activeChips.map(c => (
                  <button key={c.key} className="active-chip" onClick={c.remove}>
                    {c.label}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
              <button className="active-clear" onClick={clearAll}>Barchasini bekor qilish</button>
            </div>
          )}

          {articlesState.status === 'loading' && <ArticlesSkeleton rows={pageSize > 20 ? 10 : 8} />}
          {articlesState.status === 'error' && (
            <div className="state-box">Xatolik yuz berdi. Keyinroq urinib ko‘ring.</div>
          )}

          {articlesState.status === 'ok' && (
            <>
              {articles.length === 0 ? (
                <div className="state-box">
                  Hech qanday natija topilmadi. Filtrlarni o‘zgartiring yoki qidiruvni tozalang.
                </div>
              ) : (
                <div className="art-table">
                  {articles.map((a, i) => (
                    <ArticleRow key={a.id} a={a} index={from + i} />
                  ))}
                </div>
              )}

              {/* Pagination qatori */}
              <div className="art-pager">
                <span className="meta">
                  {totalCount > 0 ? `${from}–${to} / ${totalCount.toLocaleString()} natija` : '0 natija'}
                </span>

                {totalCount > pageSize && (
                  <Pagination
                    total={totalCount}
                    perPage={pageSize}
                    current={page}
                    onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                )}

                <div className="art-pager-size">
                  <span className="meta">Sahifada</span>
                  <div className="segment">
                    {PAGE_SIZES.map(n => (
                      <button key={n} className={pageSize === n ? 'active' : ''}
                        onClick={() => setPageSize(n)}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
