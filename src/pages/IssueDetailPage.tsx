import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import PdfViewer from '../components/ui/PdfViewer';
import CommentsSection from '../components/CommentsSection';
import { DocIcon } from '../components/ui/Icons';
import { issuesApi, type ApiIssue } from '../lib/api';
import Seo from '../components/Seo';

export default function IssueDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [issue,   setIssue]   = useState<ApiIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    window.scrollTo({ top: 0 });
    issuesApi.detail(id)
      .then(d => { setIssue(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const journalTitle = issue?.journal_title ?? 'Kutubxona Arxivi';
  const title = issue
    ? `${journalTitle} — ${issue.volume}-jild, ${issue.number}-son (${issue.year})`
    : 'Jurnal soni';

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={title} description={`${journalTitle} jurnalining ${issue?.volume}-jild ${issue?.number}-soni.`} image={issue?.cover_image_url ?? undefined} />
      <PageLoadBar />
      <Topbar active="archive" />

      {/* Breadcrumbs */}
      <div style={{ padding: '16px var(--px)', background: 'var(--grey-1)', borderBottom: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-3)' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <a onClick={() => navigate('/')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Bosh sahifa</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <a onClick={() => navigate('/archive')} style={{ color: 'var(--ink-3)', cursor: 'pointer' }}>Jurnal arxivi</a>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{issue ? `${issue.volume}-jild · ${issue.number}-son` : '…'}</span>
        </div>
      </div>

      <div className="rsp-detail" style={{ padding: '48px var(--px) 32px', maxWidth: 1340, margin: '0 auto' }}>
        {/* Body */}
        <article>
          <header style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <span className="tag navy">Jurnal soni</span>
              {issue?.is_current && <span className="tag ok">Joriy son</span>}
              {issue?.season && <span className="tag line">{issue.season}</span>}
            </div>
            <h1 className="h-display h1-rsp" style={{ fontSize: 48, lineHeight: 1.06, letterSpacing: '-0.025em', marginBottom: 22 }}>
              {issue ? `${journalTitle} — ${issue.volume}-jild, ${issue.number}-son` : 'Jurnal soni'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingTop: 22, paddingBottom: 22, borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {issue?.date_label && <span style={{ fontWeight: 600 }}>{issue.date_label}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-3)' }}>
                  <DocIcon size={12} /> {issue?.article_count ?? 0} maqola
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{issue?.year}</div>
            </div>
          </header>

          {loading && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>Yuklanmoqda…</div>
          )}

          {!loading && issue && (
            issue.pdf_file_url ? (
              <PdfViewer url={issue.pdf_file_url} title={title} />
            ) : (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14, fontStyle: 'italic' }}>
                Bu son uchun PDF hali yuklanmagan.
              </div>
            )
          )}

          {!loading && !issue && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
              Jurnal soni topilmadi.
            </div>
          )}
        </article>

        {/* Metadata sidebar */}
        <aside className="rsp-hide" style={{ position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {issue && (
            <div className="card-hover" style={{ background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>Jurnal soni</span>
              <div className="cover-hover" style={{ marginTop: 18, marginBottom: 18, cursor: issue.journal_id ? 'pointer' : 'default' }}
                onClick={() => issue.journal_id && navigate(`/journals/${issue.journal_id}`)}>
                {issue.cover_image_url ? (
                  <img src={issue.cover_image_url} alt="Jurnal muqovasi"
                    style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)', display: 'block' }} />
                ) : (
                  <JournalCover title={journalTitle} vol={`Vol. ${issue.volume}`} year={issue.year} n={issue.number} palette={issue.palette} w={150} h={200} />
                )}
              </div>
              <div className="h-display" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.2, cursor: issue.journal_id ? 'pointer' : 'default' }}
                onClick={() => issue.journal_id && navigate(`/journals/${issue.journal_id}`)}>
                {journalTitle}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--sans)' }}>
                <b style={{ color: 'var(--ink-2)' }}>{issue.volume}-jild · {issue.number}-son</b>
                <span style={{ color: 'var(--ink-4)' }}> · </span>
                {issue.year}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', width: '100%', fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mavsum</span><span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{issue.season}</span></div>
                {issue.date_label && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sana</span><span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{issue.date_label}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Maqolalar</span><span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{issue.article_count}</span></div>
              </div>
              {issue.pdf_file_url && (
                <a href={issue.pdf_file_url} target="_blank" rel="noreferrer" className="btn ghost"
                  style={{ width: '100%', height: 36, fontSize: 12.5, justifyContent: 'center', marginTop: 14, gap: 8, textDecoration: 'none' }}>
                  <DocIcon size={13} /> PDF ni yangi tabda ochish
                </a>
              )}
            </div>
          )}
        </aside>
      </div>

      {issue && <CommentsSection issueId={issue.id} />}
    </div>
  );
}
