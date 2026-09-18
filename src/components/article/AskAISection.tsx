/* Maqola sahifasidagi AI chat bo'limi — ArticleDetailPage dan ajratildi. */
import { useRef, useState, useEffect } from 'react';
import AiUnavailableModal from '../ui/AiUnavailableModal';
import { getAiStatus, isAiUnavailableError, resetAiStatus } from '../../lib/ai';
import { SparkIcon, SearchIcon, SendIcon, ICON_MAP } from '../ui/Icons';
import { articlesApi } from '../../lib/api';

const SUGGESTED_QUESTIONS: string[] = [
  "Bu maqola nima haqida?",
  "Asosiy xulosa nima?",
  "Mualliflar kimlar?",
  "Qaysi metod ishlatilgan?",
  "Kalit so'zlar nima?",
  "Adabiyotlar ro'yxatida nimalar bor?",
];

type Msg = { who: 'ai' | 'user'; name: string; src: string | null; text: string };

function AskAISection({ slug }: { slug: string }) {
  const seed: Msg[] = [{ who: 'ai', name: 'Kutubxona AI', src: null, text: "Salom! Men ushbu maqolaning to'liq matnini o'qib chiqdim. Pastdagi tayyor savollardan birini bosing yoki o'zingiz yozing — javobni maqola ichidan topib beraman." }];
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  // Local AI ulanmagan bo'lsa modal chiqadi
  const [aiOff, setAiOff] = useState<{ reason?: string } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const asked = msgs.filter(m => m.who === 'user').length;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, typing]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || typing) return;

    const status = await getAiStatus();
    if (!status.available) {
      setAiOff({ reason: status.reason });
      return;
    }

    setInput('');
    setMsgs(m => [...m, { who: 'user', name: "Anonim o'quvchi", src: null, text: q }]);
    setTyping(true);
    try {
      const res = await articlesApi.ask(slug, q);
      setMsgs(m => [...m, { who: 'ai', name: 'Kutubxona AI', src: null, text: res.answer }]);
    } catch (e) {
      if (isAiUnavailableError(e)) {
        resetAiStatus();
        setAiOff({});
        setMsgs(m => m.slice(0, -1));   // savolni qaytarib olamiz
        setTyping(false);
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      let nice = "Hozir javob ololmadim. Iltimos, biroz kutib qayta urinib ko'ring.";
      if (/429/.test(msg)) nice = "Juda tez-tez savol berayapsiz. Bir oz kuting va qaytadan urinib ko'ring.";
      else if (/400/.test(msg)) nice = "Bu maqola uchun manba fayl mavjud emas yoki savol noto'g'ri.";
      setMsgs(m => [...m, { who: 'ai', name: 'Kutubxona AI', src: null, text: nice }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <section className="bg-ai" style={{ padding: '72px 0 80px', position: 'relative', borderTop: '1px solid var(--line)', overflow: 'hidden' }}>
      <AiUnavailableModal
        open={aiOff !== null}
        action="Maqola haqida so'rash"
        reason={aiOff?.reason}
        onClose={() => setAiOff(null)}
      />
      <div style={{ position: 'absolute', left: '8%', top: '14%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(43,70,112,0.14),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '4%', bottom: '8%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(94,117,149,0.22),transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 var(--px)', position: 'relative' }}>
        <header style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase', marginBottom: 18, boxShadow: '0 6px 18px -8px rgba(10,25,47,0.40)' }}>
            <SparkIcon size={13} /> Kutubxona AI · Beta
          </div>
          <h2 className="h-display" style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 14 }}>Bu maqola <em>haqida</em> so'rang.</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 640, margin: '0 auto' }}>Tayyor savolni bosing yoki o'zingiz yozing — AI javobni shu maqola matnidan topib, aniq paragrafga havola qiladi.</p>
        </header>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 28px 60px -28px rgba(10,25,47,0.26),0 4px 12px rgba(10,25,47,0.05)', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg,var(--grey-1),var(--paper))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,#2B4670,#0A192F)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: '0 4px 12px -4px rgba(10,25,47,0.40)' }}><SparkIcon size={16} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>Kutubxona AI <span className="live-dot" /></div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Maqola matni indekslandi</div>
              </div>
            </div>
            <span className="tag navy-soft">Faqat shu maqola</span>
          </div>
          {/* Messages */}
          <div ref={logRef} style={{ padding: '26px 28px 18px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 380, overflowY: 'auto' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: m.who === 'ai' ? 'linear-gradient(135deg,#2B4670,#0A192F)' : 'var(--grey-3)', color: m.who === 'ai' ? 'white' : 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                  {m.who === 'ai' ? <SparkIcon size={14} /> : <span style={{ fontSize: 11, fontWeight: 600 }}>A</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                    {m.src && <span style={{ fontSize: 10, color: 'var(--navy)', fontFamily: 'var(--mono)', background: 'var(--navy-08)', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>Manba: {m.src}</span>}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-2)', background: m.who === 'ai' ? 'var(--grey-2)' : 'transparent', padding: m.who === 'ai' ? '12px 14px' : 0, borderRadius: m.who === 'ai' ? 10 : 0, border: m.who === 'ai' ? '1px solid var(--line)' : 'none', maxWidth: '95%' }}>{m.text}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', display: 'grid', placeItems: 'center' }}><SparkIcon size={14} /></div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--grey-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '13px 16px' }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--navy-50)', display: 'inline-block', animation: `typingDot 1.2s ${i*0.18}s infinite ease-in-out` }} />)}
                </div>
              </div>
            )}
          </div>
          {/* Suggested questions */}
          <div style={{ padding: '4px 22px 14px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, letterSpacing: 0.14, textTransform: 'uppercase', margin: '12px 2px 10px' }}>Tayyor savollar — bosing</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q, i) => {
                const Ic = ICON_MAP['doc'];
                return (
                  <button key={i} className="ai-pill" onClick={() => ask(q)} disabled={typing}>
                    <span className="ai-pill-icon"><Ic size={12} /></span>
                    <span>{q}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Input */}
          <div style={{ padding: '14px 22px 22px', borderTop: '1px solid var(--line)', background: 'linear-gradient(180deg,var(--grey-1) 0%,var(--paper) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 16px', background: 'var(--paper)', border: '1px solid var(--line-2)', borderRadius: 28, boxShadow: '0 2px 8px rgba(10,25,47,0.06)' }}>
              <SearchIcon size={14} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
                placeholder="Maqola bo'yicha o'z savolingizni yozing…"
                style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', padding: '12px 0' }} />
              <button onClick={() => ask(input)} disabled={typing || !input.trim()} style={{ height: 40, padding: '0 18px', borderRadius: 20, background: (typing || !input.trim()) ? 'var(--navy-30)' : 'linear-gradient(135deg,#2B4670,#0A192F)', color: 'white', border: 0, cursor: (typing || !input.trim()) ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, fontFamily: 'var(--sans)', boxShadow: (typing || !input.trim()) ? 'none' : '0 6px 16px -6px rgba(10,25,47,0.50)' }}>
                So'rash <SendIcon size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11.5, color: 'var(--ink-4)' }}>
              <span>Javoblar faqat ushbu maqola matni doirasida beriladi.</span>
              <span>{asked} ta savol berildi · Enter — yuborish</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── DOCX Viewer (PDF kabi, lekin server'da mammoth parse qilgan HTML ni o'qiydi) ─


export default AskAISection;
