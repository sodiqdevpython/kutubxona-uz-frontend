import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import { ArrowIcon, ChevIcon, DocIcon } from '../components/ui/Icons';
import { useFetch } from '../lib/hooks';
import type { ApiYearGroup, ApiIssue } from '../lib/api';
import Seo from '../components/Seo';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── IssueCard ─────────────────────────────────────────────────────────────────

function IssueCard({ iss, year }: { iss: ApiIssue; year: number }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, cursor: iss.is_upcoming ? 'default' : 'pointer', opacity: iss.is_upcoming ? 0.55 : 1 }}
      onClick={() => !iss.is_upcoming && navigate(`/archive/${iss.id}`)}>
      <div style={{
        height: 300, display: 'grid', placeItems: 'center',
        background: iss.is_upcoming
          ? 'repeating-linear-gradient(135deg,var(--grey-2),var(--grey-2) 8px,var(--grey-3) 8px,var(--grey-3) 16px)'
          : 'var(--grey-1)',
        borderRadius: 8, padding: '24px 0', position: 'relative', overflow: 'hidden',
      }} className={iss.is_upcoming ? '' : 'cover-hover'}>
        {!iss.is_upcoming && (
          iss.cover_image_url ? (
            <img src={iss.cover_image_url} alt="Jurnal muqovasi"
              style={{ width: 180, height: 240, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block' }} />
          ) : (
            <JournalCover
              title="Kutubxona Arxivi"
              vol={`Vol. ${iss.volume}`}
              year={year}
              n={iss.number}
              palette={iss.palette}
              w={180}
              h={240}
            />
          )
        )}
        {iss.is_upcoming && (
          <div style={{ background: 'var(--paper)', border: '1px dashed var(--line-2)', borderRadius: 6, padding: '10px 14px', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase' }}>
            Tayyorlanmoqda
          </div>
        )}
        {iss.pdf_file_url && !iss.is_upcoming && (
          <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 10, padding: '4px 8px', borderRadius: 3, background: 'var(--paper)', color: 'var(--navy)', fontWeight: 600, letterSpacing: 0.15, textTransform: 'uppercase', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <DocIcon size={10} /> PDF
          </span>
        )}
        {iss.is_current && (
          <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10.5, padding: '4px 8px', borderRadius: 3, background: 'var(--navy)', color: 'white', fontWeight: 600, letterSpacing: 0.15, textTransform: 'uppercase' }}>
            Joriy
          </span>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {iss.date_label}
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>№{iss.number}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{iss.season}</span>
          {!iss.is_upcoming && (
            <>
              <span style={{ color: 'var(--ink-4)' }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <DocIcon size={11} /> {iss.article_count} maqola
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── YearGroupSection ──────────────────────────────────────────────────────────

function YearGroupSection({ g }: { g: ApiYearGroup }) {
  const published     = g.issues.filter(i => !i.is_upcoming);
  const totalArticles = published.reduce((s, i) => s + i.article_count, 0);
  const note          = published.length > 0
    ? `${published.length} son · ${totalArticles} ta maqola`
    : 'Rejalashtirilgan';

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <h2 className="h-display year-num-rsp" style={{ fontSize: 72, letterSpacing: '-0.04em', lineHeight: 0.9, fontWeight: 700, color: 'var(--navy)' }}>{g.year}</h2>
          <div>
            <div className="eyebrow" style={{ fontSize: 10.5 }}>Yillik to'plam</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{note}</div>
          </div>
        </div>
        <a className="link-arrow" style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600, cursor: 'pointer' }}>
          {g.year} yillik hisobot <ArrowIcon size={12} />
        </a>
      </header>
      <div className="rsp-issues">
        {g.issues.map(iss => <IssueCard key={iss.id} iss={iss} year={g.year} />)}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ArchivePage() {
  const state = useFetch<ApiYearGroup[]>(`${BASE}/api/issues/archive/`);

  const groups         = state.status === 'ok' ? state.data : [];
  const totalArticles  = groups.flatMap(g => g.issues).reduce((s, i) => s + i.article_count, 0);
  const totalIssues    = groups.flatMap(g => g.issues).filter(i => !i.is_upcoming).length;
  const minYear        = groups.length > 0 ? groups[groups.length - 1].year : 1962;
  const maxYear        = groups.length > 0 ? groups[0].year                 : new Date().getFullYear();

  return (
    <div className="bg-archive" style={{ minHeight: '100vh' }}>
      <Seo title="Jurnal arxivi" description="Kutubxona Arxivi jurnalining barcha sonlari — yil va chorak bo'yicha." />
      <PageLoadBar />
      <Topbar active="archive" />

      <div style={{ padding: '40px var(--px) 28px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Jurnal arxivi</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 48, marginBottom: 10 }}>Jurnal arxivi</h1>
            <p style={{ fontSize: 14.5, color: 'var(--ink-3)', maxWidth: 680, lineHeight: 1.6 }}>
              «Kutubxona Arxivi» jurnalining barcha sonlari. Har bir son chorak yakuniga ko'ra alohida muqovada saqlanadi.
            </p>
          </div>
          <div className="arch-ctrl-hide" style={{ display: 'flex', gap: 8 }}>
            <div className="field" style={{ minWidth: 160 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Yo'nalish:</span>
              <span style={{ color: 'var(--ink)', fontWeight: 600, marginLeft: 'auto' }}>Barchasi</span>
              <ChevIcon />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="rsp-stats-4" style={{ marginTop: 32 }}>
          {[
            [groups.length > 0 ? `${maxYear - minYear + 1}` : '—', `Yil · ${minYear}→${maxYear}`],
            [totalIssues > 0   ? totalIssues.toLocaleString()   : '—', 'Jami sonlar'],
            [totalArticles > 0 ? totalArticles.toLocaleString() : '—', 'Maqolalar'],
          ].map(([k, v], i) => (
            <div key={i} style={{ background: 'var(--paper)', padding: '18px 22px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.02em', color: 'var(--navy)', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 0.2, textTransform: 'uppercase', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px var(--px) 64px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {state.status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
        )}
        {state.status === 'error' && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>
            Arxivni yuklashda xatolik.
          </div>
        )}
        {state.status === 'ok' && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>
            Hali jurnal sonlari qo'shilmagan.
          </div>
        )}
        {groups.map(g => <YearGroupSection key={g.year} g={g} />)}
      </div>
    </div>
  );
}
