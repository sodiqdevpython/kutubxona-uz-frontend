import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import { DocIcon } from '../components/ui/Icons';
import { journalsApi, type ApiJournal, type ApiIssue } from '../lib/api';
import Seo from '../components/Seo';

// ── Bitta son kartochkasi ─────────────────────────────────────────────────────

function IssueCard({ iss, journalTitle }: { iss: ApiIssue; journalTitle: string }) {
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
            <JournalCover title={journalTitle} vol={`Vol. ${iss.volume}`} year={iss.year} n={iss.number} palette={iss.palette} w={180} h={240} />
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
            {iss.date_label || `${iss.season} ${iss.year}`}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JournalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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

  const journalTitle = journal?.title ?? 'Kutubxona Arxivi';

  return (
    <div className="bg-archive" style={{ minHeight: '100vh' }}>
      <Seo title={journalTitle} description={`${journalTitle} jurnali — barcha sonlar.`} />
      <PageLoadBar />
      <Topbar active="archive" />

      <div style={{ padding: '40px var(--px) 28px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
          <a onClick={() => navigate('/')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <a onClick={() => navigate('/archive')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Jurnal arxivi</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{journalTitle}</span>
        </div>
        <h1 className="h-display h1-rsp" style={{ fontSize: 48, marginBottom: 10 }}>{journalTitle}</h1>
        <p style={{ fontSize: 14.5, color: 'var(--ink-3)', maxWidth: 680, lineHeight: 1.6 }}>
          {journal?.issn ? `ISSN: ${journal.issn} · ` : ''}Jurnalning barcha sonlari. Har bir son ustiga bosib, to'liq PDF va maqolalarni ko'rishingiz mumkin.
        </p>

        {/* Stats strip */}
        <div className="rsp-stats-4" style={{ marginTop: 32 }}>
          {[
            [published.length > 0 ? published.length.toString() : '—', 'Jami sonlar'],
            [totalArts > 0 ? totalArts.toLocaleString() : '—', 'Maqolalar'],
            [yearGroups.length > 0 ? yearGroups.length.toString() : '—', 'Yillar'],
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
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Yuklanmoqda…</div>
        )}
        {!loading && !journal && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Jurnal topilmadi.</div>
        )}
        {!loading && journal && issues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-3)', fontSize: 13 }}>Hali jurnal sonlari yo'q.</div>
        )}
        {yearGroups.map(g => (
          <section key={g.year}>
            <header style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <h2 className="h-display year-num-rsp" style={{ fontSize: 72, letterSpacing: '-0.04em', lineHeight: 0.9, fontWeight: 700, color: 'var(--navy)' }}>{g.year}</h2>
                <div>
                  <div className="eyebrow" style={{ fontSize: 10.5 }}>Yillik to'plam</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{g.issues.filter(i => !i.is_upcoming).length} son</div>
                </div>
              </div>
            </header>
            <div className="rsp-issues">
              {g.issues.map(iss => <IssueCard key={iss.id} iss={iss} journalTitle={journalTitle} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
