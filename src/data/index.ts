export interface Author {
  initials: string;
  idx: number;
  name: string;
  role: string;
  org: string;
  count: number;
  views: string;
  cites: number;
  top?: boolean;
  newAuthor?: boolean;
}

export interface Article {
  id: string;
  cat: string;
  title: string;
  excerpt: string;
  authors: { initials: string; idx: number }[];
  authorLabel: string;
  pages: number;
  min: number;
  cites: number;
  year: number;
  q: number;
  img: number;
  status: 'open' | 'lock';
}

export interface Issue {
  vol: number;
  n: number;
  label: string;
  season: string;
  date: string;
  count: number;
  palette: number;
  year?: number;
  current?: boolean;
  upcoming?: boolean;
}

export interface YearGroup {
  year: number;
  note: string;
  issues: Issue[];
}

export const FEATURED_ARTICLE = {
  cat: 'Nodir nashrlar',
  title: "Alisher Navoiy «Mahbub ul-qulub»ning 1907-yilgi nashri",
  excerpt: "Toshkent toshbosma nashriyotida chiqqan kamyob nusxaning matn varianti, marginaliya yozuvlari va paleografik tahlili — to'rt yillik tadqiqotning yakuniy hisoboti.",
  author: 'Nodira Sodiqova',
  initials: 'NS',
  idx: 1,
  org: "ToshDShI Sharqshunoslik instituti",
  date: '12 mart, 2026',
  min: 22,
  cites: 48,
  art: 'manuscript',
};

export const FEED_ARTICLES = [
  { id: 'feed-1', cat: 'Arxiv ishi', title: "Sharq qo'lyozmalari kataloglashning raqamli usullari", author: 'Dilshod Rahimov', initials: 'DR', idx: 0, date: '2 soat oldin', min: 14, cites: 24, art: 'rdf' },
  { id: 'feed-2', cat: 'Katalogizatsiya', title: "BIBFRAME 2.0 standartining O'zbekiston kutubxonalarida joriy etilishi", author: 'Akmal Yusupov', initials: 'AY', idx: 2, date: 'Kecha', min: 18, cites: 12, art: 'grid' },
  { id: 'feed-3', cat: 'Bibliografiya', title: "O'zbek matbuoti tarixi: 1870–1925 bibliografik ko'rsatkichi", author: 'Gulchehra Karimova', initials: 'GK', idx: 3, date: 'Kecha', min: 26, cites: 34, art: 'bars' },
  { id: 'feed-4', cat: 'Arxiv ishi', title: "Termiz arxivlaridagi sovuq urush davri hujjatlarining konservatsiyasi", author: 'Bobur Tursunov', initials: 'BT', idx: 4, date: '2 kun oldin', min: 16, cites: 8, art: 'dossier' },
  { id: 'feed-5', cat: 'Raqamlashtirish', title: "OCR'ning eski o'zbek imlosiga moslashtirilgan modeli — dastlabki natijalar", author: 'Madina Iskandarova', initials: 'MI', idx: 0, date: '2 kun oldin', min: 12, cites: 5, art: 'glyph' },
  { id: 'feed-6', cat: 'Tarix', title: "Jadid matbuotining bibliografik xaritasi va o'qish doiralari", author: 'Oybek Anvarov', initials: 'OA', idx: 2, date: '3 kun oldin', min: 20, cites: 18, art: 'map' },
  { id: 'feed-7', cat: 'Nodir nashrlar', title: "Boburnoma qo'lyozmalarining qiyosiy paleografik tahlili", author: 'Nodira Sodiqova', initials: 'NS', idx: 1, date: '4 kun oldin', min: 22, cites: 41, art: 'manuscript' },
  { id: 'feed-8', cat: 'Katalogizatsiya', title: "SKOS lug'atlarining sharqona mavzu sohalariga moslashuvi", author: 'Kamoliddin Husaynov', initials: 'KH', idx: 3, date: '5 kun oldin', min: 16, cites: 28, art: 'grid' },
  { id: 'feed-9', cat: 'Konservatsiya', title: "Namlik ta'sirida shikastlangan qog'oz hujjatlarni qayta tiklash", author: 'Bobur Tursunov', initials: 'BT', idx: 4, date: '6 kun oldin', min: 12, cites: 6, art: 'dossier' },
  { id: 'feed-10', cat: 'Tarix', title: "Jadid maktablari: 1900–1917 yillar arxiv manbalari", author: 'Oybek Anvarov', initials: 'OA', idx: 2, date: '1 hafta oldin', min: 24, cites: 15, art: 'map' },
  { id: 'feed-11', cat: 'Arxiv ishi', title: "Toshkent shahar kutubxonalari xaritasi — 1924 yil", author: 'Iskandar Komilov', initials: 'IK', idx: 0, date: '1 hafta oldin', min: 14, cites: 19, art: 'rdf' },
  { id: 'feed-12', cat: 'Raqamlashtirish', title: "3D skaner yordamida qo'lyozma mikrostrukturasini o'rganish", author: 'Madina Iskandarova', initials: 'MI', idx: 0, date: '10 kun oldin', min: 18, cites: 11, art: 'bars' },
];

export const TRENDING = [
  { title: "Toshkent shahar kutubxonalari xaritasi — 1924", views: 1842, cat: 'Arxiv ishi' },
  { title: "Marginaliya tahlili: o'quvchining maxfiy tarixi", views: 1620, cat: 'Nodir nashrlar' },
  { title: "Cheksiz polkalar: RFID tegli zamonaviy fond", views: 980, cat: 'Texnologiya' },
  { title: "Jadid matbuotining bibliografik xaritasi", views: 764, cat: 'Tarix' },
  { title: "Yo'qolgan asar: «Boburnoma» nashrlari", views: 612, cat: 'Nodir nashrlar' },
];

export const ARTICLES: Article[] = [
  { id: 'a1', cat: 'Arxiv ishi', title: "Sharq qo'lyozmalari kataloglashning raqamli usullari", excerpt: "O'zbekiston Milliy kutubxonasidagi XV–XIX asr qo'lyozmalarini RDF asosida tasniflash bo'yicha to'rt yillik tajriba xulosalari.", authors: [{ initials: 'DR', idx: 0 }, { initials: 'AY', idx: 1 }], authorLabel: "D. Rahimov, A. Yusupov", pages: 24, min: 14, cites: 24, year: 2026, q: 1, img: 0, status: 'open' },
  { id: 'a2', cat: 'Nodir nashrlar', title: "«Mahbub ul-qulub»ning 1907-yilgi nashri — paleografik tahlil", excerpt: "Toshkent toshbosma nashriyotida chiqqan kamyob nusxaning matn varianti va marginaliya yozuvlari.", authors: [{ initials: 'NS', idx: 1 }], authorLabel: "N. Sodiqova", pages: 32, min: 22, cites: 48, year: 2026, q: 1, img: 1, status: 'open' },
  { id: 'a3', cat: 'Katalogizatsiya', title: "BIBFRAME 2.0 standartining O'zbekiston kutubxonalarida joriy etilishi", excerpt: "MARC21'dan BIBFRAME ga o'tishdagi asosiy yo'qotishlar va imkoniyatlar — uchta shahar tajribasi.", authors: [{ initials: 'AY', idx: 2 }, { initials: '+2', idx: 3 }], authorLabel: "A. Yusupov + 2", pages: 18, min: 18, cites: 12, year: 2026, q: 1, img: 2, status: 'open' },
  { id: 'a4', cat: 'Bibliografiya', title: "O'zbek matbuoti tarixi: 1870–1925 yillar bibliografik ko'rsatkichi", excerpt: "Ellik beshta davriy nashr va o'n besh ming maqolani qamragan ko'rsatkichning ish metodikasi.", authors: [{ initials: 'GK', idx: 3 }], authorLabel: "G. Karimova", pages: 48, min: 26, cites: 34, year: 2026, q: 1, img: 3, status: 'lock' },
  { id: 'a5', cat: 'Arxiv ishi', title: "Termiz arxivlaridagi sovuq urush davri hujjatlarining konservatsiyasi", excerpt: "Past namlik sharoitida saqlangan hujjatlar va raqamli nusxa olishning optimal rejimlari.", authors: [{ initials: 'BT', idx: 4 }], authorLabel: "B. Tursunov", pages: 14, min: 16, cites: 8, year: 2026, q: 1, img: 0, status: 'open' },
  { id: 'a6', cat: 'Raqamlashtirish', title: "OCR'ning eski o'zbek imlosiga moslashtirilgan modeli", excerpt: "Arab grafikasidagi bosma matnlar uchun fine-tuned transformer modelining dastlabki natijalari.", authors: [{ initials: 'MI', idx: 0 }, { initials: 'DR', idx: 1 }], authorLabel: "M. Iskandarova, D. Rahimov", pages: 12, min: 12, cites: 5, year: 2025, q: 4, img: 1, status: 'open' },
];

export const AUTHORS: Author[] = [
  { initials: 'DR', idx: 0, name: "Dilshod Rahimov", role: "Qo'lyozmalar bo'limi mudiri", org: "O'zbekiston Milliy kutubxonasi", count: 18, views: '62.4k', cites: 284, top: true },
  { initials: 'NS', idx: 1, name: "Nodira Sodiqova", role: "Katta ilmiy xodim", org: "ToshDShI Sharqshunoslik instituti", count: 14, views: '48.1k', cites: 212 },
  { initials: 'AY', idx: 2, name: "Akmal Yusupov", role: "Katalogizatsiya bo'limi", org: "O'zbekiston Milliy kutubxonasi", count: 22, views: '71.0k', cites: 318, top: true },
  { initials: 'GK', idx: 3, name: "Gulchehra Karimova", role: "Bibliografiya bo'limi", org: "Alisher Navoiy nomidagi davlat muzeyi", count: 11, views: '34.6k', cites: 152 },
  { initials: 'BT', idx: 4, name: "Bobur Tursunov", role: "Konservator", org: "Termiz arxeologiya muzeyi", count: 9, views: '22.8k', cites: 88 },
  { initials: 'MI', idx: 0, name: "Madina Iskandarova", role: "Raqamlashtirish loyihasi", org: "O'zbekiston Milliy kutubxonasi", count: 7, views: '18.4k', cites: 62, newAuthor: true },
  { initials: 'OA', idx: 2, name: "Oybek Anvarov", role: "Nashriyot ishi mutaxassisi", org: "O'zbekiston Yozuvchilar uyushmasi", count: 15, views: '42.2k', cites: 198 },
  { initials: 'JS', idx: 1, name: "Jasmina Saidova", role: "Doktorant", org: "Toshkent davlat universiteti", count: 6, views: '14.0k', cites: 38, newAuthor: true },
  { initials: 'KH', idx: 3, name: "Kamoliddin Husaynov", role: "Akademik", org: "O'zbekiston FA Sharqshunoslik instituti", count: 32, views: '124k', cites: 512, top: true },
  { initials: 'ZA', idx: 4, name: "Zarina Abdullayeva", role: "Katta o'qituvchi", org: "ToshDShI", count: 10, views: '28.0k', cites: 124 },
  { initials: 'IK', idx: 0, name: "Iskandar Komilov", role: "Texnik mutaxassis", org: "O'zbekiston Milliy kutubxonasi", count: 8, views: '19.2k', cites: 74 },
  { initials: 'LE', idx: 2, name: "Lola Ergasheva", role: "Tahririyat kotibasi", org: "Kutubxona Arxivi jurnali", count: 5, views: '11.4k', cites: 26, newAuthor: true },
];

export const ARCHIVE: YearGroup[] = [
  {
    year: 2026,
    note: 'Joriy yil · 1 son nashr etilgan',
    issues: [
      { vol: 42, n: 1, label: "1-chorak nashri", season: "Bahor", date: "Mart 2026", count: 24, palette: 0, current: true },
      { vol: 42, n: 2, label: "2-chorak nashri", season: "Yoz",   date: "Iyun 2026",    count: 0,  palette: 1, upcoming: true },
      { vol: 42, n: 3, label: "3-chorak nashri", season: "Kuz",   date: "Sentabr 2026", count: 0,  palette: 2, upcoming: true },
      { vol: 42, n: 4, label: "4-chorak nashri", season: "Qish",  date: "Dekabr 2026",  count: 0,  palette: 3, upcoming: true },
    ],
  },
  {
    year: 2025,
    note: '4 son · 92 ta maqola',
    issues: [
      { vol: 41, n: 1, label: "1-chorak nashri", season: "Bahor", date: "Mart 2025",    count: 22, palette: 1 },
      { vol: 41, n: 2, label: "2-chorak nashri", season: "Yoz",   date: "Iyun 2025",    count: 24, palette: 4 },
      { vol: 41, n: 3, label: "3-chorak nashri", season: "Kuz",   date: "Sentabr 2025", count: 23, palette: 5 },
      { vol: 41, n: 4, label: "4-chorak nashri", season: "Qish",  date: "Dekabr 2025",  count: 23, palette: 0 },
    ],
  },
  {
    year: 2024,
    note: '4 son · 88 ta maqola',
    issues: [
      { vol: 40, n: 1, label: "1-chorak nashri", season: "Bahor", date: "Mart 2024",    count: 20, palette: 3 },
      { vol: 40, n: 2, label: "2-chorak nashri", season: "Yoz",   date: "Iyun 2024",    count: 22, palette: 2 },
      { vol: 40, n: 3, label: "3-chorak nashri", season: "Kuz",   date: "Sentabr 2024", count: 22, palette: 1 },
      { vol: 40, n: 4, label: "4-chorak nashri", season: "Qish",  date: "Dekabr 2024",  count: 24, palette: 4 },
    ],
  },
];

export const PROFILE_AUTHOR = {
  initials: 'DR',
  idx: 0,
  name: 'Dilshod Rahimov',
  degree: 'Kutubxonashunoslik fanlari doktori',
  org: "O'zbekiston Milliy kutubxonasi · Toshkent",
  web: 'natlib.uz/rahimov',
  orcid: '0000-0002-4218-8842',
  bio: "O'zbekiston Milliy kutubxonasi Sharq qo'lyozmalari bo'limining mudiri. 18 yildan beri qo'lyozma fondlarini raqamli kataloglash sohasida ishlaydi. Xiva xonligi davri va Buxoro madrasalari qo'lyozmalari bo'yicha o'n sakkizta yirik ilmiy maqola muallifi.",
  stats: { submitted: 12, accepted: 8, views: '45,000' },
};

export const PROFILE_ARTICLES = [
  { id: 'pa1', cat: 'Arxiv ishi',     title: "Sharq qo'lyozmalari kataloglashning raqamli usullari",         date: "Mart 2026",    min: 14, cites: 24, status: 'open' as const },
  { id: 'pa2', cat: 'Katalogizatsiya',title: "BIBFRAME 2.0 standartining O'zbekiston kutubxonalarida joriy etilishi", date: "Yanvar 2026", min: 18, cites: 12, status: 'open' as const },
  { id: 'pa3', cat: 'Arxiv ishi',     title: "XV asr Buxoro madrasalari fondining elektron tasnifi",          date: "Sentabr 2025", min: 22, cites: 48, status: 'open' as const },
  { id: 'pa4', cat: 'Nodir nashrlar', title: "Boburnoma qo'lyozmalarining qiyosiy paleografik tahlili",       date: "Iyun 2025",    min: 26, cites: 67, status: 'open' as const },
  { id: 'pa5', cat: 'Bibliografiya',  title: "Toshkent kutubxonalari fondining yo'qotilgan qatlamlari",       date: "Mart 2025",    min: 14, cites: 18, status: 'lock' as const },
  { id: 'pa6', cat: 'Katalogizatsiya',title: "SKOS lug'atlarining sharqona mavzu sohalariga moslashuvi",      date: "Dekabr 2024",  min: 16, cites: 32, status: 'open' as const },
  { id: 'pa7', cat: 'Arxiv ishi',     title: "Xiva xonligi davri hujjatlarining digitalizatsiyasi",          date: "Sentabr 2024", min: 20, cites: 54, status: 'open' as const },
  { id: 'pa8', cat: 'Raqamlashtirish',title: "Mahalliy OCR modelini Sharq matnlariga moslashtirish",          date: "Iyun 2024",    min: 12, cites: 41, status: 'open' as const },
];

export const DETAIL_ARTICLE = {
  id: 'a1',
  cat: 'Arxiv ishi',
  title: "Sharq qo'lyozmalari kataloglashning raqamli usullari",
  subtitle: "O'zbekiston Milliy kutubxonasidagi XV–XIX asr Sharq qo'lyozmalarini RDF asosida tasniflash bo'yicha to'rt yillik tajriba xulosalari va katalog tuzilmasining yangi modeli.",
  authors: [{ initials: 'DR', idx: 0 }, { initials: 'AY', idx: 1 }],
  authorLabel: 'Dilshod Rahimov, Akmal Yusupov',
  authorOrg: "O'zbekiston Milliy kutubxonasi · ToshDShI",
  date: '12 mart, 2026',
  min: 14,
  status: 'open' as const,
  journal: { title: 'Kutubxona Arxivi', vol: 'Vol. 42', year: 2026, n: 1, issn: '2181-1394' },
};

export const AI_KB = [
  { id: 'summary', icon: 'doc', chip: "Maqolaning asosiy xulosasi nima?", tag: 'Qisqacha', kw: ['xulosa','asosiy','qisqa','nima haqida','mavzu','umumiy','summary','natija','maqsad'], src: 'Annotatsiya · §3', a: "Maqola O'zbekiston Milliy kutubxonasi fondidagi 12,840 ta Sharq qo'lyozmasini RDF/SKOS asosida tasniflashning yangi modelini taqdim etadi. Klassik bibliografik standartlar (MARC21) paleografik, kodikologik va matn-tarixiy tafsilotlarni to'liq qamrab ololmagani uchun mualliflar ikki mustaqil graf — kodikologik va matn-tarixiy tavsifdan iborat modelni ishlab chiqqan." },
  { id: 'rdf-vs-marc', icon: 'cite', chip: "RDF modeli MARC21 dan nimasi bilan farq qiladi?", tag: '§2 · §3', kw: ['marc21','marc','rdf','farq','ustun','solishtir','taqqos','model','afzal','difference'], src: '§2 · §3.1', a: "MARC21 ramkasi paleografik (xat turi, siyoh kompozitsiyasi), kodikologik (qog'oz turi, varaqlash tartibi) va matn-tarixiy (qiyosiy nusxalar, sharhlar) maydonlarni to'liq tasvirlay olmaydi. Taklif etilgan RDF modeli esa ikkita mustaqil grafdan iborat — kodikologik tavsif va matn-tarixiy tavsif — ular «km:witnesses» munosabati orqali bog'lanadi." },
  { id: 'count', icon: 'beaker', chip: "Tadqiqotda nechta qo'lyozma o'rganilgan?", tag: 'Faktlar', kw: ['nechta','qancha','soni','12840','qo\'lyozma soni','fond','material','hajm'], src: 'Annotatsiya · §1', a: "Tadqiqotga O'zbekiston Milliy kutubxonasi fondidagi 12,840 ta qo'lyozma materiali jalb qilingan. Bu majmua XII asrdan boshlanuvchi va Buxoro, Samarqand, Xiva hamda Toshkent madrasalarida bitilgan nusxalarni qamrab oladi." },
  { id: 'witnesses', icon: 'brain', chip: "«km:witnesses» munosabati nima vazifani bajaradi?", tag: '§3.1', kw: ['witnesses','km:witnesses','munosabat','bog\'lanish','graf','aloqa','relation'], src: '§3.1', a: "«km:witnesses» — kodikologik graf (jismoniy ob'ekt) bilan matn-tarixiy graf (asarning ma'lum nusxasi) o'rtasidagi ko'prik munosabatdir. U bir jismoniy qo'lyozmaning qaysi asar(lar)ning nusxasi ekanini bildiradi va shu orqali ikki mustaqil tavsif bir-biriga bog'lanadi." },
  { id: 'skos', icon: 'book', chip: "Qaysi SKOS lug'atlaridan foydalanilgan?", tag: '§3.2', kw: ['skos','lug\'at','vocabulary','controlled','xat turi','qog\'oz','nasx','ta\'liq','terminlar'], src: '§3.2', a: "Sxema SKOS lug'atlari bilan to'ldirilgan: xat turlari (nasx, ta'liq, shikasta), qog'oz turlari (samarqandiy, xivaliq, evropacha) va boshqa qo'shimcha terminlar uchun controlled vocabulary mavjud." },
  { id: 'prior', icon: 'globe', chip: "Avval qaysi kutubxonalarda shunday tajriba bo'lgan?", tag: '§2', kw: ['avval','tajriba','tehron','istanbul','qohira','dehli','boshqa kutubxona','tarix','oldin'], src: '§2', a: "Birinchi yirik tajriba 2003-yilda Tehron Markaziy kutubxonasida MARC21 ning mahalliylashtirilgan varianti asosida amalga oshirilgan. Keyinchalik Istanbul Süleymaniye, Qohira Dar al-Kutub va Dehli Khuda Bakhsh kutubxonalarida ham shu yo'l takrorlangan." },
];

export const COMMENTS = [
  { id: 'c1', name: 'Akmal Yusupov', initials: 'AY', idx: 2, role: "Katalogizatsiya bo'limi", when: '2 kun oldin', likes: 18, replies: 3, text: "Maqola juda tushunarli yozilgan. Bizning ToshDShI kutubxonasida ham xuddi shu yo'nalishda ish boshladik, lekin BIBFRAME 2.0 dan keldik. RDF modelini SKOS bilan to'ldirish g'oyasi qiziq — bu yondashuvni o'z ustimizda sinab ko'rmoqchimiz." },
  { id: 'c2', name: "Anonim o'quvchi", initials: 'A', idx: 0, role: null, when: '1 kun oldin', likes: 7, replies: 1, text: "4-rasmda ko'rsatilgan grafda «km:witnesses» munosabatining yo'nalishi noaniq. Bidirectional ekanmi yoki faqat object→witness ekanmi?" },
  { id: 'c3', name: 'Madina Iskandarova', initials: 'MI', idx: 4, role: "Raqamlashtirish loyihasi", when: '18 soat oldin', likes: 24, replies: 5, accepted: true, text: "Bu javobning amaliy qismi haqida: 12,840 ta qo'lyozmaning manual tasniflash uchun zarur vaqtni qisqartirgan deb taxmin qilishimiz mumkinmi? Bizning loyihada 2,300 ta uchun 14 oy ketdi." },
];
