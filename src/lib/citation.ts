// Iqtibos matnlari (GOST, APA, MLA, BibTeX, RIS) — faqat maqolaning mavjud
// ma'lumotidan; bo'sh maydon natijaga tushmaydi.

export type CitationFormat = 'GOST' | 'APA' | 'MLA' | 'BibTeX' | 'RIS';

export const CITATION_FORMATS: CitationFormat[] = ['GOST', 'APA', 'MLA', 'BibTeX', 'RIS'];

export interface CitationData {
  title: string;
  authors: string[];
  journal: string;
  issn: string;
  year: number;
  number: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  doi: string;
  url: string;
  slug: string;
}

/** «Familiya Ism Sharif» yoki «Ism Familiya» → [familiya, bosh harflar]. */
function splitName(name: string): [string, string[]] {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], []];
  if (parts.length === 2) return [parts[1], [parts[0][0]]];
  // Uch va undan ko'p so'z: familiya birinchi; «qizi / o‘g‘li» bosh harf emas
  const given = parts.slice(1).filter(p => !/^(qizi|o‘g‘li|ogli|o.g.li)$/i.test(p));
  return [parts[0], given.map(p => p[0])];
}

const dotted = (initials: string[]) => initials.map(i => `${i}.`).join(' ');

function pagesText(d: CitationData, sep = '–'): string {
  if (d.pageStart && d.pageEnd) return `${d.pageStart}${sep}${d.pageEnd}`;
  return d.pageStart ? String(d.pageStart) : '';
}

function gost(d: CitationData): string {
  const authors = d.authors.map(n => { const [s, i] = splitName(n); return `${s} ${dotted(i)}`.trim(); }).join(', ');
  const parts = [`${authors ? `${authors} ` : ''}${d.title} // ${d.journal}.`, `${d.year}.`];
  if (d.number) parts.push(`№ ${d.number}.`);
  if (pagesText(d)) parts.push(`S. ${pagesText(d)}.`);
  if (d.doi) parts.push(`DOI: ${d.doi}.`);
  return parts.join(' — ');
}

function apa(d: CitationData): string {
  const authors = d.authors.map(n => { const [s, i] = splitName(n); return `${s}, ${dotted(i)}`.trim(); });
  const who = authors.length > 1 ? `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}` : authors[0] ?? '';
  let out = `${who ? `${who} ` : ''}(${d.year}). ${d.title}. ${d.journal}`;
  if (d.number) out += `, (${d.number})`;
  if (pagesText(d)) out += `, ${pagesText(d)}`;
  out += '.';
  return d.doi ? `${out} https://doi.org/${d.doi}` : out;
}

function mla(d: CitationData): string {
  const names = d.authors.map(n => { const [s, i] = splitName(n); return i.length ? `${s}, ${dotted(i)}` : s; });
  const who = names.length > 2 ? `${names[0]}, et al.` : names.join(', and ');
  let out = `${who ? `${who} ` : ''}"${d.title}." ${d.journal}`;
  if (d.number) out += `, no. ${d.number}`;
  out += `, ${d.year}`;
  if (pagesText(d)) out += `, pp. ${pagesText(d)}`;
  out += '.';
  return d.doi ? `${out} https://doi.org/${d.doi}` : `${out} ${d.url}`;
}

function bibtex(d: CitationData): string {
  const lines = [
    `  title = {${d.title}}`,
    d.authors.length ? `  author = {${d.authors.join(' and ')}}` : '',
    `  journal = {${d.journal}}`,
    `  year = {${d.year}}`,
    d.number ? `  number = {${d.number}}` : '',
    pagesText(d, '--') ? `  pages = {${pagesText(d, '--')}}` : '',
    d.issn ? `  issn = {${d.issn}}` : '',
    d.doi ? `  doi = {${d.doi}}` : '',
    `  url = {${d.url}}`,
  ].filter(Boolean);
  return `@article{${d.slug},\n${lines.join(',\n')}\n}`;
}

function ris(d: CitationData): string {
  return [
    'TY  - JOUR',
    `TI  - ${d.title}`,
    ...d.authors.map(a => `AU  - ${a}`),
    `JO  - ${d.journal}`,
    `PY  - ${d.year}`,
    d.number ? `IS  - ${d.number}` : '',
    d.pageStart ? `SP  - ${d.pageStart}` : '',
    d.pageEnd ? `EP  - ${d.pageEnd}` : '',
    d.issn ? `SN  - ${d.issn}` : '',
    d.doi ? `DO  - ${d.doi}` : '',
    `UR  - ${d.url}`,
    'ER  - ',
  ].filter(Boolean).join('\n');
}

export function formatCitation(format: CitationFormat, data: CitationData): string {
  switch (format) {
    case 'GOST':   return gost(data);
    case 'APA':    return apa(data);
    case 'MLA':    return mla(data);
    case 'BibTeX': return bibtex(data);
    case 'RIS':    return ris(data);
  }
}

export function citationFileName(format: CitationFormat, slug: string): string {
  const ext = format === 'BibTeX' ? 'bib' : format === 'RIS' ? 'ris' : 'txt';
  return `${slug}.${ext}`;
}
