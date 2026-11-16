import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import { DocIcon } from '../components/ui/Icons';
import { useI18n } from '../lib/i18n';
import { issueDate, journalsApi, type ApiJournal, type ApiIssue } from '../lib/api';
import Seo from '../components/Seo';

// ── Bitta son kartochkasi ─────────────────────────────────────────────────────

function IssueCard({ iss, journalTitle }: { iss: ApiIssue; journalTitle: string }) {
  const { t, tn } = useI18n();
  const boxStyle = { display: 'flex', flexDirection: 'column', gap: 14 } as const;
  const content = (
    <>
      <div style={{
        height: 300, display: 'grid', placeItems: 'center',
        background: iss.is_upcoming
          ? 'repeating-linear-gradient(135deg,var(--grey-2),var(--grey-2) 8px,var(--grey-3) 8px,var(--grey-3) 16px)'
          : 'var(--grey-1)',
        borderRadius: 8, padding: '24px 0', position: 'relative', overflow: 'hidden',
      }} className={iss.is_upcoming ? '' : 'cover-hover'}>
        {!iss.is_upcoming && (
          iss.cover_image_url ? (
            <img src={iss.cover_image_url} alt={t('journal.cover_alt')}
              style={{ width: 180, height: 240, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block' }} />
          ) : (
            <JournalCover title={journalTitle} year={iss.year} n={iss.number} palette={iss.palette} w={180} h={240} />
          )
        )}
        {iss.is_upcoming && (
          <div style={{ background: 'var(--paper)', border: '1px dashed var(--line-2)', borderRadius: 6, padding: '10px 14px', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase' }}>
            {t('common.in_preparation')}
          </div>
        )}
        {iss.pdf_file_url && !iss.is_upcoming && (
          <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 10, padding: '4px 8px', borderRadius: 3, background: 'var(--paper)', color: 'var(--navy)', fontWeight: 600, letterSpacing: 0.15, textTransform: 'uppercase', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <DocIcon size={10} /> PDF
          </span>
        )}
        {iss.is_current && (
          <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10.5, padding: '4px 8px', borderRadius: 3, background: 'var(--navy)', color: 'white', fontWeight: 600, letterSpacing: 0.15, textTransform: 'uppercase' }}>
            {t('common.current')}
          </span>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {issueDate(iss)}
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>№{iss.number}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {!iss.is_upcoming && (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <DocIcon size={11} /> {tn('unit.articles', iss.article_count)}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );

  // Tayyorlanayotgan sonning sahifasi yo'q, qolganlari oddiy havola
  return iss.is_upcoming
    ? <div style={{ ...boxStyle, opacity: 0.55 }}>{content}</div>
    : <Link to={`/archive/${iss.id}`} style={{ ...boxStyle, color: 'inherit', textDecoration: 'none' }}>{content}</Link>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, tn, num } = useI18n();
  const [journal, setJournal] = useState<ApiJournal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    window.scrollTo({ top: 0 });
    journalsApi.detail(id)
      .then(d => { setJournal(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const issues       = journal?.issues ?? [];
  const published    = issues.filter(i => !i.is_upcoming);
  const totalArts    = published.reduce((s, i) => s + i.article_count, 0);

  // Yillarga guruhlash
  const yearGroups: { year: number; issues: ApiIssue[] }[] = Object.entries(
    issues.reduce<Record<number, ApiIssue[]>>((acc, i) => {
      (acc[i.year] ??= []).push(i); return acc;
    }, {})
  ).map(([y, arr]) => ({ year: Number(y), issues: arr })).sort((a, b) => b.year - a.year);

  const journalTitle = journal?.title ?? t('journal.default_title');

  return (
    <div className="bg-archive" style={{ minHeight: '100vh' }}>
      <Seo title={journalTitle} description={t('journal.seo', { t: journalTitle })} />
      <PageLoadBar />
      <Topbar active="archive" />
      <main id="main" className="page-main">

      <div style={{ padding: '40px var(--px) 28px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <Link to="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>{t('nav.home')}</Link>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <Link to="/archive" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>{t('nav.archive')}</Link>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{journalTitle}</span>
        </div>
        <h1 className="h-display h1-rsp" style={{ fontSize: 48, marginBottom: 10 }}>{journalTitle}</h1>
        <p style={{ fontSize: 14.5, color: 'var(--ink-3)', maxWidth: 680, lineHeight: 1.6 }}>
          {t('journal.sub')}
        </p>

        {/* Stats strip */}
        <div className="rsp-stats-4" style={{ marginTop: 32 }}>
          {[
            [published.length > 0 ? published.length.toString() : '—', t('journal.stat.issues')],
            [totalArts > 0 ? num(totalArts) : '—', t('journal.stat.articles')],
            [yearGroups.length > 0 ? yearGroups.length.toString() : '—', t('journal.stat.years')],
          ].map(([k, v], i) => (
            <div key={i} style={{ background: 'var(--paper)', padding: '18px 22px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.02em', color: 'var(--navy)', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 0.2, textTransform: 'uppercase', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px var(--px) 64px', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>{t('common.loading')}</div>
        )}
        {!loading && !journal && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>{t('journal.not_found')}</div>
        )}
        {!loading && journal && issues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>{t('journal.no_issues')}</div>
        )}
        {yearGroups.map(g => (
          <section key={g.year}>
            <header style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <h2 className="h-display year-num-rsp" style={{ fontSize: 72, letterSpacing: '-0.04em', lineHeight: 0.9, fontWeight: 700, color: 'var(--navy)' }}>{g.year}</h2>
                <div>
                  <div className="eyebrow" style={{ fontSize: 10.5 }}>{t('journal.yearly')}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{tn('unit.issues', g.issues.filter(i => !i.is_upcoming).length)}</div>
                </div>
              </div>
            </header>
            <div className="rsp-issues">
              {g.issues.map(iss => <IssueCard key={iss.id} iss={iss} journalTitle={journalTitle} />)}
            </div>
          </section>
        ))}
      </div>
      </main>
      <Footer />
    </div>
  );
}
