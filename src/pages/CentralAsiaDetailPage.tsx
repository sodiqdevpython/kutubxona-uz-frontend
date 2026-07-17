import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import PageLoadBar from '../components/ui/PageLoadBar';
import { ArrowIcon, EyeIcon } from '../components/ui/Icons';
import { centralAsiaApi, type ApiCentralAsiaPostDetail } from '../lib/api';
import Seo from '../components/Seo';
import { useT } from '../lib/i18n';

export default function CentralAsiaDetailPage() {
  const t = useT();
  const { slug = '' } = useParams<{ slug: string }>();
  const [post, setPost]   = useState<ApiCentralAsiaPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setPost(null);
    if (!slug) return;
    centralAsiaApi.detail(slug)
      .then(setPost)
      .catch(e => setError((e as Error).message));
    window.scrollTo({ top: 0 });
  }, [slug]);

  return (
    <div className="bg-detail" style={{ minHeight: '100vh', fontFamily: 'var(--sans)' }}>
      <Seo
        title={post?.title ?? t('ca.title')}
        description={post?.excerpt || t('ca.description')}
      />
      <PageLoadBar />
      <Topbar active="central-asia" />

      <div style={{ padding: '40px var(--px) 72px', maxWidth: 1180, margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          fontSize: 12.5, color: 'var(--ink-3)', fontFamily: 'var(--sans)',
        }}>
          <Link to="/" style={{ color: 'var(--ink-3)' }}>{t('nav.home')}</Link>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <Link to="/central-asia" style={{ color: 'var(--ink-3)' }}>{t('ca.title')}</Link>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
            {post ? post.title.slice(0, 70) + (post.title.length > 70 ? '…' : '') : '…'}
          </span>
        </div>

        {error && (
          <div style={{ padding: '96px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
            {t('ca.not_found')}
            <div style={{ marginTop: 16 }}>
              <Link to="/central-asia" className="btn ghost" style={{ display: 'inline-flex' }}>
                <ArrowIcon size={12} style={{ transform: 'rotate(180deg)' }} /> {t('common.back_to_list')}
              </Link>
            </div>
          </div>
        )}

        {!error && !post && (
          <div style={{ padding: '96px 0', textAlign: 'center', color: 'var(--ink-3)' }}>{t('common.loading')}</div>
        )}

        {post && (
          <>
            {/* ── Header card ── */}
            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '32px 40px',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                <span className="tag navy-soft">{post.source_category || 'Central Asia'}</span>
                {post.doi && (
                  <span style={{
                    fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)',
                  }}>DOI · {post.doi}</span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span
                    title={`Manba: ${post.views_scraped.toLocaleString()} · Sayt: ${post.views_local.toLocaleString()}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13, color: 'var(--ink-2)', fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <EyeIcon size={13} style={{ color: 'var(--ink-4)' }} />
                    {post.total_views.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
                    ❝ {post.quote_number}
                  </span>
                </div>
              </div>

              <h1 style={{
                fontFamily: 'var(--sans)',
                fontSize: 34, lineHeight: 1.2,
                fontWeight: 700, letterSpacing: '-0.025em',
                color: 'var(--ink)', margin: '0 0 14px',
              }}>
                {post.title}
              </h1>

              {post.author_line && (
                <p style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 14.5, lineHeight: 1.55,
                  color: 'var(--ink-2)', margin: 0,
                }}>{post.author_line}</p>
              )}

              {post.source_url && (
                <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a href={post.source_url} target="_blank" rel="noreferrer"
                    className="btn ghost"
                    style={{ height: 34, fontSize: 12.5, padding: '0 14px' }}>
                    {t('ca.source_link')}
                  </a>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
                    {post.source_slug}
                  </span>
                </div>
              )}
            </div>

            {/* ── Content ── */}
            {post.image_url && (
              <img src={post.image_url} alt=""
                style={{ width: '100%', borderRadius: 14, border: '1px solid var(--line)', marginBottom: 24 }} />
            )}

            <div
              className="ca-content"
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: '40px 56px',
              }}
              dangerouslySetInnerHTML={{ __html: post.content || '<p><i>Tarkib mavjud emas.</i></p>' }}
            />

            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/central-asia" className="btn ghost" style={{ display: 'inline-flex' }}>
                <ArrowIcon size={12} style={{ transform: 'rotate(180deg)' }} /> {t('common.back_to_list')}
              </Link>
            </div>

            <style>{`
              .ca-content,
              .ca-content * {
                font-family: var(--sans) !important;
              }
              .ca-content {
                font-size: 15.5px;
                line-height: 1.75;
                color: var(--ink);
                letter-spacing: -0.003em;
              }
              .ca-content p       { margin: 0 0 16px; }
              .ca-content strong  { color: var(--ink); font-weight: 600; }
              .ca-content em      { font-style: italic; color: var(--ink-2); }
              .ca-content h1,
              .ca-content h2,
              .ca-content h3,
              .ca-content h4      {
                margin: 28px 0 12px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
                line-height: 1.3;
              }
              .ca-content h2      { font-size: 22px; }
              .ca-content h3      { font-size: 19px; }
              .ca-content h4      { font-size: 17px; }
              .ca-content ul,
              .ca-content ol      { margin: 0 0 16px; padding-left: 22px; }
              .ca-content li      { margin-bottom: 6px; }
              .ca-content img     { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
              .ca-content a       { color: var(--navy); text-decoration: underline; }
              .ca-content table   { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 14px; }
              .ca-content td,
              .ca-content th      { border: 1px solid var(--line); padding: 8px 12px; }
              .ca-content blockquote {
                margin: 16px 0; padding: 6px 20px; color: var(--ink-2);
                border-left: 3px solid var(--navy-30); background: var(--grey-1);
              }
              @media (max-width: 720px) {
                .ca-content { padding: 24px 22px !important; }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
