import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthorAvatar from '../ui/AuthorAvatar';
import { adminApi, type AdminAuthorBrief, type AuthorMatch, type AuthorPayloadItem } from '../../lib/admin-api';
import { useI18n, type MsgKey } from '../../lib/i18n';

/**
 * Maqola mualliflari — tartibli ro'yxat. Har bir muallif alohida:
 *   • mavjud profil (qidiruvdan yoki mos profillardan tanlanadi),
 *   • yangi profil (ism + lavozim + tashkilot),
 *   • profilsiz — faqat ism matni.
 * «A. Umarov, D. Hamroyeva» kabi vergul bilan yozilsa — har biri alohida qo'shiladi.
 * Qo'lda qo'shish, maqolani tahrirlash va PDF parser oynasida ishlatiladi.
 */

export type PickedProfile = Pick<AdminAuthorBrief, 'id' | 'name' | 'initials' | 'role' | 'org' | 'avatar_idx' | 'avatar_url' | 'article_count'>
  & { is_telegram?: boolean };

export interface AuthorEntry {
  key: string;
  mode: 'existing' | 'new' | 'text';
  /** Yangi profil / profilsiz uchun yozilgan ism (mavjud profilda — profil nomi) */
  name: string;
  profile: PickedProfile | null;
  role: string; org: string; bio: string;
  /** Parser ajratgan rasm (yangi profilga qo'yiladi) */
  photo_url?: string | null;
  /** Parser / ajratish topgan mos profillar */
  candidates?: PickedProfile[];
  /** Parser'dagi tartib raqami — backend rasmni shu orqali topadi */
  parsed_index?: number;
}

let seq = 0;
const nextKey = () => `a${++seq}`;

/** Solishtirish uchun ism: katta harf, apostrofsiz, kirill-lotin bir xil harflar tenglashtirilgan. */
export function normName(s: string): string {
  const map: Record<string, string> = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X' };
  return s.toUpperCase().split('').map(c => map[c] ?? c).join('').replace(/[^\p{L}\p{N}]/gu, '');
}

/** «A, B va C» → ['A', 'B', 'C'] (backenddagi split_author_names bilan bir xil). */
export function splitNames(raw: string): string[] {
  const seen = new Set<string>();
  return raw.split(/\s*(?:[,;\n]|\s(?:va|и|and)\s|&)\s*/i)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(n => {
      const k = normName(n);
      if (!k || seen.has(k)) return false;
      seen.add(k); return true;
    });
}

export function entryFromProfile(p: PickedProfile, extra: Partial<AuthorEntry> = {}): AuthorEntry {
  return { key: nextKey(), mode: 'existing', name: p.name, profile: p, role: '', org: '', bio: '', ...extra };
}

export function entryFromName(name: string, mode: 'new' | 'text' = 'new', extra: Partial<AuthorEntry> = {}): AuthorEntry {
  return { key: nextKey(), mode, name, profile: null, role: '', org: '', bio: '', ...extra };
}

export function matchToProfile(m: AuthorMatch | AdminAuthorBrief): PickedProfile {
  return {
    id: m.id, name: m.name, initials: m.initials, role: m.role, org: m.org,
    avatar_idx: m.avatar_idx, avatar_url: m.avatar_url, article_count: m.article_count,
    is_telegram: 'is_telegram' in m ? m.is_telegram : m.source === 'telegram',
  };
}

/** Ism bo'yicha boshlang'ich holat: to'liq mos profil bo'lsa — o'sha, aks holda yangi profil. */
export function entryForName(name: string, matches: PickedProfile[], extra: Partial<AuthorEntry> = {}): AuthorEntry {
  const exact = matches.find(m => normName(m.name) === normName(name));
  return exact
    ? entryFromProfile(exact, { candidates: matches, ...extra })
    : entryFromName(name, 'new', { candidates: matches, ...extra });
}

export function entriesToPayload(entries: AuthorEntry[]): AuthorPayloadItem[] {
  return entries.map((e): AuthorPayloadItem => {
    const pi = e.parsed_index !== undefined ? { parsed_index: e.parsed_index } : {};
    if (e.mode === 'existing' && e.profile) return { id: e.profile.id, ...pi };
    if (e.mode === 'new') return { new: true, name: e.name.trim(), role: e.role.trim(), org: e.org.trim(), bio: e.bio.trim(), ...pi };
    return { text: e.name.trim() };
  });
}

/** Xato matni yoki null. */
export function validateEntries(entries: AuthorEntry[], t: ReturnType<typeof useI18n>['t']): string | null {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.mode === 'existing' && !e.profile) return t('adm.ap.need_profile', { n: i + 1 });
    if (e.mode !== 'existing' && !e.name.trim()) return t('adm.ap.need_name', { n: i + 1 });
  }
  return null;
}

/** Ro'yxat holatini solishtirish uchun (tahrir sahifasida «o'zgargan» belgisi). */
export function entriesSignature(entries: AuthorEntry[]): string {
  return JSON.stringify(entriesToPayload(entries));
}

// ── Profil qidiruvi ───────────────────────────────────────────────────────────

function ProfileSearch({ onPick, onNew, onText, onBulk, noTelegram, placeholder, autoFocus, exclude }: {
  onPick: (p: PickedProfile) => void;
  onNew?: (name: string) => void;
  onText?: (name: string) => void;
  onBulk?: (text: string) => void;
  noTelegram?: boolean; placeholder: string; autoFocus?: boolean;
  exclude: Set<string>;
}) {
  const { t, tn } = useI18n();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PickedProfile[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const query = q.trim();
  const names = onBulk ? splitNames(query) : [];
  const bulk = names.length > 1;

  useEffect(() => {
    if (!query || bulk) { setResults([]); setBusy(false); return; }
    const ctrl = new AbortController();
    setBusy(true);
    const id = setTimeout(() => {
      adminApi.authors.search(query, { noTelegram, signal: ctrl.signal })
        .then(r => { setResults(r.map(matchToProfile)); setBusy(false); })
        .catch(() => { if (!ctrl.signal.aborted) setBusy(false); });
    }, 250);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [query, bulk, noTelegram]);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const shown = results.filter(r => !exclude.has(r.id));
  function done() { setQ(''); setResults([]); setOpen(false); }
  function pick(p: PickedProfile) { onPick(p); done(); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key !== 'Enter' || !query) return;
    e.preventDefault();
    if (bulk && onBulk) { onBulk(query); done(); return; }
    const exact = shown.find(r => normName(r.name) === normName(query));
    if (exact) pick(exact);
    else if (onNew) { onNew(query); done(); }
  }

  return (
    <div className="ap-search" ref={wrapRef}>
      <input className="f-input" value={q} placeholder={placeholder} autoFocus={autoFocus}
        onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
      {open && query && (
        <div className="ap-drop" role="listbox">
          {bulk && onBulk ? (
            <button type="button" className="ap-opt strong" onClick={() => { onBulk(query); done(); }}>
              {t('adm.ap.add_bulk', { n: names.length, names: names.join(' · ') })}
            </button>
          ) : (
            <>
              {busy && shown.length === 0 && <div className="ap-opt muted">{t('adm.ap.searching')}</div>}
              {!busy && shown.length === 0 && <div className="ap-opt muted">{t('adm.ap.no_results')}</div>}
              {shown.map(r => (
                <button key={r.id} type="button" className="ap-opt" onClick={() => pick(r)}>
                  <AuthorAvatar name={r.initials} idx={r.avatar_idx} src={r.avatar_url} size={28} />
                  <span className="ap-opt-main">
                    <b>{r.name}</b>
                    <small>{[r.role || r.org, tn('unit.articles', r.article_count), r.is_telegram ? t('adm.ap.telegram') : ''].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              ))}
              {onNew && <button type="button" className="ap-opt strong" onClick={() => { onNew(query); done(); }}>{t('adm.ap.add_new', { name: query })}</button>}
              {onText && <button type="button" className="ap-opt" onClick={() => { onText(query); done(); }}>{t('adm.ap.add_text', { name: query })}</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bitta qator ───────────────────────────────────────────────────────────────

const MODES: [AuthorEntry['mode'], MsgKey][] = [
  ['existing', 'adm.ap.mode.existing'], ['new', 'adm.ap.mode.new'], ['text', 'adm.ap.mode.text'],
];

function Row({ e, i, total, onChange, onMove, onRemove, noTelegram, exclude }: {
  e: AuthorEntry; i: number; total: number;
  onChange: (e: AuthorEntry) => void; onMove: (dir: -1 | 1) => void; onRemove: () => void;
  noTelegram?: boolean; exclude: Set<string>;
}) {
  const { t, tn } = useI18n();
  const [replacing, setReplacing] = useState(false);
  const p = e.mode === 'existing' ? e.profile : null;
  const cands = (e.candidates ?? []).filter(c => !exclude.has(c.id) || c.id === p?.id);
  const initials = (p?.initials || e.name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('')).toUpperCase();

  function setMode(mode: AuthorEntry['mode']) {
    if (mode === 'existing') {
      const first = cands[0];
      if (first) onChange({ ...e, mode, profile: first, name: first.name });
      else setReplacing(true);
      return;
    }
    onChange({ ...e, mode, profile: null, name: e.name || p?.name || '' });
  }

  return (
    <li className={`ap-row is-${e.mode}`}>
      <span className="ap-n">{String(i + 1).padStart(2, '0')}</span>
      <AuthorAvatar name={initials || '?'} idx={p?.avatar_idx ?? 1} src={p?.avatar_url ?? (e.mode === 'new' ? e.photo_url : null)} size={40} />
      <div className="ap-main">
        {p ? (
          <div className="ap-head">
            <Link className="ap-name" to={`/admin/authors/${p.id}`} target="_blank" title={t('adm.ap.open_profile')}>{p.name}</Link>
            <span className="ap-sub">{[p.role || p.org, tn('unit.articles', p.article_count), p.is_telegram ? t('adm.ap.telegram') : ''].filter(Boolean).join(' · ')}</span>
          </div>
        ) : (
          <input className="f-input ap-name-input" value={e.name} placeholder={t('adm.ap.name_ph')}
            onChange={ev => onChange({ ...e, name: ev.target.value })} />
        )}

        <div className="ap-modes" role="group">
          {MODES.map(([m, label]) => (
            <button key={m} type="button" className={e.mode === m ? 'on' : ''} onClick={() => setMode(m)}>{t(label)}</button>
          ))}
          <button type="button" className="link" onClick={() => setReplacing(r => !r)}>{t('adm.ap.pick_other')}</button>
        </div>

        {cands.length > 0 && (
          <div className="ap-cands">
            <span>{t('adm.ap.matches')}</span>
            {cands.map(c => (
              <button key={c.id} type="button" className={`ap-cand${p?.id === c.id ? ' on' : ''}`}
                onClick={() => onChange({ ...e, mode: 'existing', profile: c, name: c.name })}>
                {c.name} <small>· {tn('unit.articles', c.article_count)}</small>
              </button>
            ))}
          </div>
        )}

        {replacing && (
          <ProfileSearch noTelegram={noTelegram} exclude={exclude} autoFocus placeholder={t('adm.ap.replace_ph')}
            onPick={c => { onChange({ ...e, mode: 'existing', profile: c, name: c.name }); setReplacing(false); }} />
        )}

        {e.mode === 'new' && (
          <div className="ap-new">
            <input className="f-input" placeholder={t('adm.ap.role')} value={e.role} onChange={ev => onChange({ ...e, role: ev.target.value })} />
            <input className="f-input" placeholder={t('adm.ap.org')} value={e.org} onChange={ev => onChange({ ...e, org: ev.target.value })} />
            <textarea className="f-textarea" rows={2} placeholder={t('adm.ap.bio')} value={e.bio} onChange={ev => onChange({ ...e, bio: ev.target.value })} />
          </div>
        )}
      </div>
      <div className="ap-actions">
        <button type="button" disabled={i === 0} onClick={() => onMove(-1)} title={t('adm.ap.up')} aria-label={t('adm.ap.up')}>↑</button>
        <button type="button" disabled={i === total - 1} onClick={() => onMove(1)} title={t('adm.ap.down')} aria-label={t('adm.ap.down')}>↓</button>
        <button type="button" className="x" onClick={onRemove} title={t('adm.ap.remove')} aria-label={t('adm.ap.remove')}>✕</button>
      </div>
    </li>
  );
}

// ── Ro'yxat ───────────────────────────────────────────────────────────────────

export default function AuthorListEditor({ value, onChange, noTelegram = false }: {
  value: AuthorEntry[]; onChange: (v: AuthorEntry[]) => void;
  /** PDF parser: Telegram profillari biriktirilmaydi */
  noTelegram?: boolean;
}) {
  const { t } = useI18n();
  const exclude = new Set(value.map(e => e.profile?.id).filter((x): x is string => Boolean(x)));

  const update = (i: number, e: AuthorEntry) => onChange(value.map((x, j) => (j === i ? e : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const add = (e: AuthorEntry) => onChange([...value, e]);

  async function addBulk(text: string) {
    const names = splitNames(text);
    try {
      const resolved = await adminApi.authors.resolve(names.join(', '), noTelegram);
      onChange([...value, ...resolved.map(r => {
        const matches = r.matches.map(matchToProfile).filter(m => !exclude.has(m.id));
        return r.exact && !exclude.has(r.exact.id)
          ? entryFromProfile(matchToProfile(r.exact), { candidates: matches })
          : entryFromName(r.name, 'new', { candidates: matches });
      })]);
    } catch {
      onChange([...value, ...names.map(n => entryFromName(n, 'new'))]);
    }
  }

  return (
    <div className="ap">
      {value.length === 0
        ? <div className="ap-empty">{t('adm.ap.empty')}</div>
        : (
          <ol className="ap-list">
            {value.map((e, i) => (
              <Row key={e.key} e={e} i={i} total={value.length} noTelegram={noTelegram} exclude={exclude}
                onChange={x => update(i, x)} onMove={d => move(i, d)} onRemove={() => remove(i)} />
            ))}
          </ol>
        )}
      <ProfileSearch noTelegram={noTelegram} exclude={exclude} placeholder={t('adm.ap.search_ph')}
        onPick={p => add(entryFromProfile(p))}
        onNew={name => add(entryFromName(name, 'new'))}
        onText={name => add(entryFromName(name, 'text'))}
        onBulk={addBulk} />
    </div>
  );
}
