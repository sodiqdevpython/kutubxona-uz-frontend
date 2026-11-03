import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import Pagination from '../components/ui/Pagination';
import { CheckIcon, ChevIcon, SearchIcon } from '../components/ui/Icons';
import ArticleRow from '../components/article/ArticleRow';
import { useFetch } from '../lib/hooks';
import { type ApiArticle, type ApiFacets, type PaginatedResponse } from '../lib/api';
import Seo from '../components/Seo';

/**
 * Maqolalar ro'yxati — Figma «Maqolalar» freymi.
 * Chapda filtrlar paneli, o'ngda raqamlangan qatorlar jadvali.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Saralash (Figma: segmentli boshqaruv) ────────────────────────────────────
type SortKey = 'new' | 'old' | 'views' | 'alpha';
const SORT_OPTS: Record<SortKey, { label: string; param: string }> = {
  new:   { label: 'Eng yangi',     param: '-issue__year,-issue__number,page_start' },
  old:   { label: 'Eng eski',      param: 'issue__year,issue__number,page_start' },
  views: { label: "Ko‘p o‘qilgan", param: '-views' },
  alpha: { label: 'Alifbo',        param: 'title' },
};

const PAGE_SIZES = [20, 50, 100];

// ── Filtr guruhi ─────────────────────────────────────────────────────────────

type FilterItem = [string, number | null, string];   // [nomi, soni, qiymati]

const LANG_LABEL: Record<string, string> = {
  uz: 'O‘zbek (lotin)', 'uz-cyrl': 'Ўзбек (кирилл)', ru: 'Русский', en: 'English',
};

function FiltersSkeleton() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2].map(g => (
        <div key={g} className="filter-group">
          <div className="sk sk-author" style={{ marginBottom: 12 }} />
          {[0, 1, 2].map(r => <div key={r} className="sk sk-meta" style={{ marginBottom: 10 }} />)}
        </div>
      ))}
    </div>
  );
}

function FilterGroup({ title, items, selected, onToggle, limit = 4 }: {
  title: string;
  items: FilterItem[];
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

  // Boshqa sahifalardagi havolalar filtrni manzil orqali beradi (?categories=…&issues=…)
  const listParam = (name: string) => (urlParams.get(name) ?? '').split(',').filter(Boolean);
  const [selCats,     setSelCats]     = useState<string[]>(() => listParam('categories'));
  const [selYears,    setSelYears]    = useState<string[]>([]);
  const [selIssues,   setSelIssues]   = useState<string[]>(() => listParam('issues'));
  const [selLangs,    setSelLangs]    = useState<string[]>([]);
  const [selKeywords, setSelKeywords] = useState<string[]>(() => listParam('keywords'));
  const [search,     setSearch]      = useState(initialSearch);
  const [debouncedQ,  setDebouncedQ]  = useState(initialSearch);
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(20);
  const [sort,        setSort]        = useState<SortKey>('new');
  // Bir ustunli ko'rinishda filtrlar yopiq turadi (keng ekranda CSS doim ko'rsatadi)
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [sort, pageSize]);

  // Tepadagi qidiruv shu sahifada ham ishlaydi: manzildagi so'z o'zgarsa ro'yxat yangilanadi
  useEffect(() => { setSearch(initialSearch); setDebouncedQ(initialSearch); }, [initialSearch]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (val: string) => {
      setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
      setPage(1);
    };

  function clearAll() {
    setSelCats([]); setSelYears([]); setSelIssues([]); setSelLangs([]); setSelKeywords([]);
    setSearch(''); setDebouncedQ(''); setPage(1);
  }

  // ── So'rov manzili ──────────────────────────────────────────────────────────
  const articlesUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (selCats.length)     p.set('categories', selCats.join(','));
    if (selYears.length)    p.set('years',      selYears.join(','));
    if (selIssues.length)   p.set('issues',     selIssues.join(','));
    if (selLangs.length)    p.set('langs',      selLangs.join(','));
    if (selKeywords.length) p.set('keywords',   selKeywords.join(','));
    if (debouncedQ.trim())  p.set('search',     debouncedQ.trim());
    p.set('ordering',  SORT_OPTS[sort].param);
    p.set('page',      String(page));
    p.set('page_size', String(pageSize));
    return `${BASE}/api/articles/?${p.toString()}`;
  }, [selCats, selYears, selIssues, selLangs, selKeywords, debouncedQ, page, pageSize, sort]);

  const articlesState = useFetch<PaginatedResponse<ApiArticle>>(articlesUrl);
  const facetState    = useFetch<ApiFacets>(`${BASE}/api/articles/facets/`);

  const articles   = articlesState.status === 'ok' ? articlesState.data.results : [];
  const totalCount = articlesState.status === 'ok' ? articlesState.data.count   : 0;
  const facets     = facetState.status    === 'ok' ? facetState.data            : null;

  // Yillar ro'yxati — mavjud maqolalardan hisoblanadi
  const yearItems = useMemo<FilterItem[]>(() =>
    (facets?.years ?? []).map(y => [String(y.value), y.count, String(y.value)]), [facets]);

  // Sonlar ro'yxati — yangisi tepada
  const issueItems = useMemo<FilterItem[]>(() =>
    (facets?.issues ?? []).map(i => [`${i.year} · №\u00A0${i.number}`, i.count, i.id]), [facets]);

  const catItems = useMemo<FilterItem[]>(() =>
    (facets?.categories ?? []).map(c => [c.name, c.count, c.slug]), [facets]);

  const langItems = useMemo<FilterItem[]>(() =>
    (facets?.languages ?? []).map(l => [LANG_LABEL[l.code] ?? l.code, l.count, l.code]), [facets]);

  const keywordItems = useMemo<FilterItem[]>(() =>
    (facets?.keywords ?? []).map(k => [k.name, k.count, k.slug]), [facets]);

  // Faol filtrlar — Figma'da ro'yxat tepasida chiplar qatori bo'lib chiqadi
  const activeChips = useMemo(() => {
    const out: { key: string; label: string; remove: () => void }[] = [];
    selYears.forEach(y => out.push({
      key: 'y' + y, label: y, remove: () => toggle(setSelYears)(y),
    }));
    selIssues.forEach(id => {
      const lbl = issueItems.find(x => x[2] === id)?.[0] ?? id;
      out.push({ key: 'i' + id, label: lbl, remove: () => toggle(setSelIssues)(id) });
    });
    selCats.forEach(c => {
      const lbl = catItems.find(x => x[2] === c)?.[0] ?? c;
      out.push({ key: 'c' + c, label: lbl, remove: () => toggle(setSelCats)(c) });
    });
    selLangs.forEach(l => {
      out.push({ key: 'l' + l, label: LANG_LABEL[l] ?? l, remove: () => toggle(setSelLangs)(l) });
    });
    selKeywords.forEach(k => {
      const lbl = keywordItems.find(x => x[2] === k)?.[0] ?? k;
      out.push({ key: 'k' + k, label: lbl, remove: () => toggle(setSelKeywords)(k) });
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selYears, selIssues, selCats, selLangs, selKeywords, catItems, issueItems, keywordItems]);

  const years = (facets?.years ?? []).map(y => y.value);
  const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '';
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title="Maqolalar" description="Barcha ilmiy maqolalar — yo‘nalish, yil, jurnal soni bo‘yicha filtrlash va qidirish." />
      <PageLoadBar />
      <Topbar active="articles" />
      <main id="main" className="page-main">

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
        <aside className="filters" data-open={filtersOpen ? 'on' : undefined}>
          <div className="filters-head">
            <span className="eyebrow">Filtrlar</span>
            <button onClick={clearAll} className={activeChips.length ? 'on' : ''}>Tozalash</button>
          </div>

          <div className="searchbar" style={{ marginBottom: 20 }}>
            <SearchIcon size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input id="search" value={search} onChange={e => setSearch(e.target.value)}
              aria-label="Ro‘yxat ichidan qidirish"
              placeholder="Ro‘yxat ichidan qidirish" style={{ fontSize: 13 }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink-3)', fontSize: 15, lineHeight: 1 }}>×</button>
            )}
          </div>

          <button className="filters-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>
            <span>Filtrlar{activeChips.length ? ` (${activeChips.length})` : ''}</span>
            <ChevIcon size={12} style={{ transform: 'rotate(90deg)', transition: 'transform .15s' }} />
          </button>

          <div className="filters-body">
          {!facets && <FiltersSkeleton />}
          {yearItems.length > 0 && (
            <FilterGroup title="Yil" items={yearItems}
              selected={selYears} onToggle={toggle(setSelYears)} />
          )}
          {issueItems.length > 0 && (
            <FilterGroup title="Son" items={issueItems}
              selected={selIssues} onToggle={toggle(setSelIssues)} />
          )}
          {catItems.length > 0 && (
            <FilterGroup title="Yo‘nalish" items={catItems}
              selected={selCats} onToggle={toggle(setSelCats)} />
          )}
          {langItems.length > 0 && (
            <FilterGroup title="Til" items={langItems}
              selected={selLangs} onToggle={toggle(setSelLangs)} />
          )}
          {keywordItems.length > 0 && (
            <FilterGroup title="Kalit so‘z" items={keywordItems}
              selected={selKeywords} onToggle={toggle(setSelKeywords)} />
          )}
          </div>
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

      </main>
      <Footer />
    </div>
  );
}
