import { Link, useLocation } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import Seo from '../components/Seo';

/**
 * «Jurnal haqida» bo'limi — Figma'dagi 14–17-freymlar.
 * To'rt sahifa bir xil karkasdan foydalanadi: chapda bo'lim navigatsiyasi,
 * markazda matn, o'ngda jurnal pasporti.
 */

const NAV = [
  { to: '/about',        label: 'Jurnal haqida' },
  { to: '/about/board',  label: 'Tahririyat kengashi' },
  { to: '/about/policy', label: 'Taqriz siyosati va etika' },
  { to: '/about/guide',  label: 'Mualliflar uchun qo‘llanma' },
];

const PASSPORT: [string, string, boolean?][] = [
  ['Nashr etuvchi', 'O‘zbekiston Milliy kutubxonasi'],
  ['Ta’sis yili', '2019'],
  ['Davriylik', 'Choraklik · yiliga 4 son'],
  ['ISSN / e-ISSN', '2181-1732 · 2181-1740'],
  ['DOI prefiks', '10.62499', true],
  ['Kirish', 'Ochiq · CC BY 4.0', true],
  ['Taqriz', 'Ikki tomonlama ko‘r'],
  ['Nashr to‘lovi', 'Yo‘q', true],
];

// ── Karkas ───────────────────────────────────────────────────────────────────

function AboutLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title={title} />
      <PageLoadBar />
      <Topbar active="about" />

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link>
          <span>/</span>
          <span className="cur">{title}</span>
        </nav>
      </div>

      <div className="wrap about-grid">
        {/* Bo'lim navigatsiyasi */}
        <aside className="about-nav rsp-hide">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Jurnal haqida</div>
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className={pathname === n.to ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </aside>

        {/* Matn */}
        <article className="about-body">
          <h1 className="h-display about-title">{title}</h1>
          {children}
        </article>

        {/* Pasport */}
        <aside className="about-side rsp-hide">
          <div className="side-card">
            <div className="side-card-title">Jurnal pasporti</div>
            {PASSPORT.map(([k, v, accent]) => (
              <div key={k} className="pass-row">
                <span className="pass-k">{k}</span>
                <span className="pass-v" data-accent={accent ? 'on' : undefined}>{v}</span>
              </div>
            ))}
          </div>

          <div className="side-card" style={{ background: 'var(--grey-2)' }}>
            <div className="side-card-title">Tahririyat</div>
            <p className="side-text" style={{ marginBottom: 8 }}>
              100011, Toshkent, Navoiy ko‘chasi 1<br />
              O‘zbekiston Milliy kutubxonasi, 3-qavat
            </p>
            <a className="side-link" href="mailto:jurnal@natlib.uz">jurnal@natlib.uz</a>
            <div className="meta" style={{ marginTop: 6 }}>+998 71 232-83-94</div>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

// ── Yordamchi bloklar ────────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="h-display about-h2">{children}</h2>;
}

function NumList({ items }: { items: string[] }) {
  return (
    <ol className="about-list">
      {items.map((t, i) => (
        <li key={i}>
          <span className="about-list-n">{String(i + 1).padStart(2, '0')}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

// ── 1. Jurnal haqida ─────────────────────────────────────────────────────────

export function AboutJournal() {
  return (
    <AboutLayout title="Jurnal haqida">
      <p className="about-lede">
        «Kutubxona» — O‘zbekiston Milliy kutubxonasi nashr etadigan ilmiy-amaliy jurnal.
        2019-yildan beri choraklik chiqadi va axborot-kutubxona sohasidagi tadqiqotlar
        uchun taqrizdan o‘tuvchi maydon bo‘lib xizmat qiladi.
      </p>

      <H2>Maqsad va qamrov</H2>
      <p>
        Jurnal kutubxonashunoslik, bibliografiya, manbashunoslik va axborot xizmatlari
        bo‘yicha original tadqiqotlarni chop etadi. Amaliyotchilar tajribasi va nazariy
        ishlar teng qabul qilinadi — muhim shart tadqiqot metodikasining ochiqligi.
      </p>
      <NumList items={[
        'Kutubxona fondlarini shakllantirish, saqlash va raqamlashtirish',
        'Bibliografik tavsif standartlari va metama’lumot sifati',
        'Mutolaa madaniyati va foydalanuvchi xatti-harakati tadqiqotlari',
        'Qo‘lyozma va noyob nashrlar bilan ishlash amaliyoti',
        'Markaziy Osiyo kutubxonalari o‘rtasidagi hamkorlik',
      ]} />

      <H2>Nashr siyosati</H2>
      <p>
        Barcha maqolalar ochiq kirishda, CC BY 4.0 litsenziyasi ostida chop etiladi —
        nashr uchun ham, o‘qish uchun ham to‘lov olinmaydi. Har maqolaga DOI beriladi,
        PDF Milliy kutubxona serverlarida doimiy saqlanadi.
      </p>
      <p>
        Jurnal O‘zbekiston Respublikasi OAK ro‘yxatiga kiritilgan; maqolalar Google
        Scholar va CyberLeninka bazalarida indekslanadi.
      </p>

      <H2>Tarix</H2>
      <p>
        Jurnal 2019-yilda Milliy kutubxonaning ilmiy-metodik bo‘limi tashabbusi bilan
        tashkil etilgan. 2023-yilda tahririyat almashuvi tufayli bir son chiqmagan,
        2024-yildan boshlab davriylik to‘liq tiklandi. 2022-yilda IFLA mintaqaviy
        bo‘limi bilan hamkorlikda «Central Asia» to‘plami ochildi.
      </p>
    </AboutLayout>
  );
}

// ── 2. Tahririyat kengashi ───────────────────────────────────────────────────

const BOARD: { role: string; people: { name: string; org: string }[] }[] = [
  {
    role: 'Bosh muharrir',
    people: [{ name: 'Anvar Umarov', org: 'O‘zbekiston Milliy kutubxonasi, PhD' }],
  },
  {
    role: 'Bosh muharrir o‘rinbosari',
    people: [{ name: 'Dilnoza Hamroyeva', org: 'Jizzax viloyati axborot-kutubxona markazi' }],
  },
  {
    role: 'Tahririyat kengashi',
    people: [
      { name: 'Zulfiya Yusupova', org: 'Toshkent davlat sharqshunoslik universiteti' },
      { name: 'Kamol Baxromov', org: 'O‘zbekiston Milliy universiteti, dotsent' },
      { name: 'Feruza Ro‘ziyeva', org: 'O‘zbekiston Milliy kutubxonasi, bibliograf' },
      { name: 'Hulkar Karimova', org: 'Toshkent davlat madaniyat instituti' },
      { name: 'Muzaffar Otaxonov', org: 'Westminster International University in Tashkent' },
    ],
  },
  {
    role: 'Xalqaro a’zolar',
    people: [
      { name: 'Эльвира Азаматова', org: 'Российская государственная библиотека' },
      { name: 'Marina Kovaleva', org: 'IFLA Central Asia Section' },
    ],
  },
];

export function AboutBoard() {
  return (
    <AboutLayout title="Tahririyat kengashi">
      <p className="about-lede">
        Tahririyat kengashi maqolalarni qabul qilish, taqrizga yo‘naltirish va yakuniy
        qarorni chiqarish uchun javob beradi. A’zolar ikki yillik muddatga saylanadi.
      </p>

      {BOARD.map(group => (
        <section key={group.role}>
          <H2>{group.role}</H2>
          <div className="board-list">
            {group.people.map(p => (
              <div key={p.name} className="board-row">
                <span className="board-name">{p.name}</span>
                <span className="board-org">{p.org}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AboutLayout>
  );
}

// ── 3. Taqriz siyosati va etika ──────────────────────────────────────────────

export function AboutPolicy() {
  return (
    <AboutLayout title="Taqriz siyosati va etika">
      <p className="about-lede">
        Har bir qo‘lyozma ikki tomonlama ko‘r taqrizdan o‘tadi: taqrizchi muallifni,
        muallif taqrizchini bilmaydi. O‘rtacha taqriz muddati — 21 kun.
      </p>

      <H2>Taqriz bosqichlari</H2>
      <NumList items={[
        'Tahririyat texnik tekshiruvi — qamrov, hajm va formatlash (3 ish kuni)',
        'Ikki mustaqil taqrizchiga yuborish',
        'Taqriz xulosasi: qabul qilish, tuzatish bilan qabul qilish yoki rad etish',
        'Muallif tuzatishlari va qayta ko‘rib chiqish',
        'Bosh muharrirning yakuniy qarori va songa kiritish',
      ]} />

      <H2>Nashr etikasi</H2>
      <p>
        Jurnal COPE (Committee on Publication Ethics) tamoyillariga amal qiladi.
        Plagiat tekshiruvi barcha qo‘lyozmalar uchun majburiy; o‘xshashlik darajasi
        20% dan oshsa qo‘lyozma muallifga qaytariladi.
      </p>
      <p>
        Mualliflar manfaatlar to‘qnashuvi, moliyalash manbasi va har bir muallifning
        hissasini ko‘rsatishi shart. Tadqiqot ma’lumotlari so‘rov bo‘yicha taqdim
        etilishi kutiladi.
      </p>

      <H2>Muallif huquqlari</H2>
      <p>
        Mualliflik huquqi muallifda qoladi. Jurnal maqolani CC BY 4.0 litsenziyasi
        ostida chop etish huquqini oladi — ya’ni har kim manbani ko‘rsatgan holda
        nusxa ko‘chirishi va tarqatishi mumkin.
      </p>
    </AboutLayout>
  );
}

// ── 4. Mualliflar uchun qo'llanma ────────────────────────────────────────────

export function AboutGuide() {
  return (
    <AboutLayout title="Mualliflar uchun qo&#8216;llanma">
      <p className="about-lede">
        Qo‘lyozmani Telegram bot orqali yuboring. Tahririyat 3 ish kuni ichida qabulni
        tasdiqlaydi va taqrizga yo‘naltiradi.
      </p>

      <H2>Qabul shartlari</H2>
      <NumList items={[
        'Hajm 8–15 bet (adabiyotlar ro‘yxati bilan)',
        'Uch tilli annotatsiya: o‘zbek, rus va ingliz tillarida, 150–250 so‘z',
        '5–8 ta kalit so‘z, UDK indeksi',
        'Adabiyotlar GOST 7.0.5-2008 bo‘yicha rasmiylashtiriladi',
        'Muallif ORCID identifikatorini ko‘rsatishi tavsiya etiladi',
      ]} />

      <H2>Formatlash talablari</H2>
      <p>
        Fayl .docx yoki .pdf formatida. Asosiy matn Times New Roman 14 kegl, 1,5
        interval; jadval va rasmlar matn ichida, nomlanган holda. Formulalar uchun
        Microsoft Equation yoki MathType ishlatiladi.
      </p>

      <H2>Yuborish</H2>
      <p>
        Telegram botga faylni yuborasiz — bot sarlavha, mualliflar, annotatsiya va
        kalit so‘zlarni so‘raydi. Qabul qilingandan keyin holatni «Mening maqolalarim»
        bo‘limida kuzatib borasiz.
      </p>
      <p style={{ marginTop: 20 }}>
        <a className="btn primary" href="https://t.me/journal_kutubxona_bot"
          target="_blank" rel="noreferrer">
          Telegram bot orqali yuborish
        </a>
      </p>
    </AboutLayout>
  );
}
