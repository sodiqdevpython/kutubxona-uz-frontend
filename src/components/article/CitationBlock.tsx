import { useState } from 'react';
import { CITATION_FORMATS, citationFileName, formatCitation, type CitationData, type CitationFormat } from '../../lib/citation';

/** «Iqtibos keltirish» — Figma: 5 format, har biri nusxalanadi yoki fayl sifatida yuklanadi. */
export default function CitationBlock({ data }: { data: CitationData }) {
  const [format, setFormat] = useState<CitationFormat>('GOST');
  const [copied, setCopied] = useState(false);
  const text = formatCitation(format, data);
  const isCode = format === 'BibTeX' || format === 'RIS';

  function copy() {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = citationFileName(format, data.slug);
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="cite-tabs" role="tablist">
        {CITATION_FORMATS.map(f => (
          <button key={f} role="tab" aria-selected={f === format}
            className={f === format ? 'active' : ''} onClick={() => setFormat(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="cite-card">
        <div className={isCode ? 'cite-text cite-code' : 'cite-text'}>{text}</div>
        <div className="cite-foot">
          <span className="meta">{format} uslubi</span>
          <div className="cite-actions">
            <button className="btn ghost sm" onClick={download}>Fayl sifatida yuklash</button>
            <button className="btn primary sm" onClick={copy}>{copied ? 'Nusxalandi ✓' : 'Nusxalash'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
