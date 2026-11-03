import { Link } from 'react-router-dom';
import { authorsLine, issueLabel, pageRange, type ApiArticle } from '../../lib/api';
import { mediaUrl } from '../../lib/config';

const LANG_CODE: Record<string, string> = { uz: 'UZ', 'uz-cyrl': 'ЎЗ', ru: 'RU', en: 'EN' };

/**
 * Maqola qatori — Figma «Maqolalar» va bosh sahifadagi «Shu sondan yana».
 * Butun qator havola: yangi tabda ochiladi va klaviatura bilan ishlaydi.
 * `thumb` — rasmli ko'rinish (bosh sahifa); rasm bo'lmasa chiqqan sonning muqovasi.
 */
export default function ArticleRow({ a, index, thumb = false }: { a: ApiArticle; index: number; thumb?: boolean }) {
  const pages = pageRange(a);
  const image = mediaUrl(a.image_url ?? a.issue_cover_url);
  const num = String(index).padStart(2, '0');

  return (
    <Link to={`/articles/${a.slug}`} className={`art-row${thumb ? ' art-row-thumb' : ''}`}>
      <div className="art-row-num">{num}</div>

      {thumb && (
        <div className="art-row-media">
          {image
            ? <img src={image} alt={a.image_url ? a.title : `${issueLabel(a)} soni muqovasi`} loading="lazy" />
            : <div className="home-featured-ph" />}
        </div>
      )}

      <div className="art-row-body">
        <div className="art-row-tags">
          {a.category && <span className="art-row-cat">{a.category.name}</span>}
          <span className="tag ok">Ochiq kirish</span>
          {!thumb && <span className="meta">{LANG_CODE[a.language] ?? 'UZ'}</span>}
        </div>
        <h3 className="art-row-title h-display">{a.title}</h3>
        <div className="art-row-authors">{authorsLine(a)}</div>
      </div>

      <div className="art-row-meta">
        {!thumb && <span className="art-row-issue">{issueLabel(a)}</span>}
        {pages && <span>{pages}&nbsp;b.</span>}
        <span>{a.views.toLocaleString()} ko‘rish</span>
        {a.file_kind && <span className="art-row-pdf">{a.file_kind.toUpperCase()}</span>}
      </div>
    </Link>
  );
}
