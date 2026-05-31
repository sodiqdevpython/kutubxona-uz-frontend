export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      padding: '32px 56px',
      maxWidth: 1400,
      margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 12, color: 'var(--ink-3)',
    }}>
      <div>© 2026 O'zbekiston Milliy kutubxonasi · Kutubxona Archive</div>
      <div style={{ display: 'flex', gap: 24 }}>
        {['Foydalanish shartlari', 'Maxfiylik', 'Aloqa', 'API'].map(t => (
          <a key={t} style={{ color: 'var(--ink-3)', cursor: 'pointer', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-3)')}>{t}</a>
        ))}
      </div>
    </footer>
  );
}
