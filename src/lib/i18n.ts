import { useLang, type Lang } from '../context/LangContext';

/**
 * Sayt interfeysining statik matnlari. Server'dan keladigan
 * dinamik matn (maqola sarlavhasi, tarkibi, muallif ismi) tarjima qilinmaydi.
 *
 * Yangi kalit qo'shganda — 4 ta til bo'yicha qiymatlarni to'ldiring.
 * Kalit topilmasa `uz-latn` fallback ishlaydi.
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Dict = { [key: string]: string };

const uzLatn: Dict = {
  // ── Navigatsiya ──
  'nav.home':          'Bosh sahifa',
  'nav.articles':      'Maqolalar',
  'nav.archive':       'Jurnal arxivi',
  'nav.authors':       'Mualliflar',
  'nav.central_asia':  'Central Asia',
  'nav.admin':         'Admin',
  'nav.logout':        'Chiqish',

  // ── Umumiy ──
  'common.search_placeholder': "Maqola, muallif, kalit so'z…",
  'common.search':             'Qidirish',
  'common.searching':          'Qidirilmoqda…',
  'common.no_results':         'Hech nima topilmadi.',
  'common.view_all_results':   "Barcha natijalarni ko'rish →",
  'common.upload_article':     'Maqola yuborish',
  'common.menu':               'Menyu',
  'common.loading':            'Yuklanmoqda…',
  'common.error':              'Xatolik yuz berdi.',
  'common.back_to_list':       "Ro'yxatga qaytish",
  'common.read_more':          "O'qish",
  'common.filters':            'Filtrlar',
  'common.clear':              'Tozalash',
  'common.of':                 '/',

  // ── Central Asia ──
  'ca.title':          'Central Asia',
  'ca.eyebrow':        'einfolib.uz · manba',
  'ca.description':    "«Central Asia» axborot-kutubxona ilmiy jurnalining barcha maqolalari. Yangi son chiqishi bilan avtomatik yangilanadi.",
  'ca.stat.articles':  'Maqola',
  'ca.stat.pages':     'Sahifa',
  'ca.search_placeholder': "Sarlavha, muallif yoki matn bo'yicha qidirish…",
  'ca.empty':          "Hech qanday maqola topilmadi. Qidiruvni o'zgartiring yoki admin panelidan «einfolib.uz — yangilash»ni bosing.",
  'ca.not_found':      'Maqola topilmadi.',
  'ca.source_link':    'Asl manba — einfolib.uz',
  'ca.error_backend':  'Xatolik yuz berdi. Backend ishga tushirilganini tekshiring.',

  // ── Footer ──
  'footer.copyright':  "© 2026 O'zbekiston Milliy kutubxonasi · kutubxona.uz",
};

const uzCyrl: Dict = {
  'nav.home':          'Бош саҳифа',
  'nav.articles':      'Мақолалар',
  'nav.archive':       'Журнал архиви',
  'nav.authors':       'Муаллифлар',
  'nav.central_asia':  'Central Asia',
  'nav.admin':         'Админ',
  'nav.logout':        'Чиқиш',

  'common.search_placeholder': 'Мақола, муаллиф, калит сўз…',
  'common.search':             'Қидириш',
  'common.searching':          'Қидирилмоқда…',
  'common.no_results':         'Ҳеч нима топилмади.',
  'common.view_all_results':   'Барча натижаларни кўриш →',
  'common.upload_article':     'Мақола юбориш',
  'common.menu':               'Меню',
  'common.loading':            'Юкланмоқда…',
  'common.error':              'Хатолик юз берди.',
  'common.back_to_list':       'Рўйхатга қайтиш',
  'common.read_more':          'Ўқиш',
  'common.filters':            'Филтрлар',
  'common.clear':              'Тозалаш',
  'common.of':                 '/',

  'ca.title':          'Central Asia',
  'ca.eyebrow':        'einfolib.uz · манба',
  'ca.description':    '«Central Asia» ахборот-кутубхона илмий журналининг барча мақолалари. Янги сон чиқиши билан автоматик янгиланади.',
  'ca.stat.articles':  'Мақола',
  'ca.stat.pages':     'Саҳифа',
  'ca.search_placeholder': 'Сарлавҳа, муаллиф ёки матн бўйича қидириш…',
  'ca.empty':          'Ҳеч қандай мақола топилмади. Қидирувни ўзгартиринг ёки админ панелидан «einfolib.uz — янгилаш»ни босинг.',
  'ca.not_found':      'Мақола топилмади.',
  'ca.source_link':    'Асл манба — einfolib.uz',
  'ca.error_backend':  'Хатолик юз берди. Backend ишга туширилганини текширинг.',

  'footer.copyright':  '© 2026 Ўзбекистон Миллий кутубхонаси · kutubxona.uz',
};

const ru: Dict = {
  'nav.home':          'Главная',
  'nav.articles':      'Статьи',
  'nav.archive':       'Архив журнала',
  'nav.authors':       'Авторы',
  'nav.central_asia':  'Central Asia',
  'nav.admin':         'Админ',
  'nav.logout':        'Выйти',

  'common.search_placeholder': 'Статья, автор, ключевое слово…',
  'common.search':             'Поиск',
  'common.searching':          'Поиск…',
  'common.no_results':         'Ничего не найдено.',
  'common.view_all_results':   'Показать все результаты →',
  'common.upload_article':     'Отправить статью',
  'common.menu':               'Меню',
  'common.loading':            'Загрузка…',
  'common.error':              'Произошла ошибка.',
  'common.back_to_list':       'Вернуться к списку',
  'common.read_more':          'Читать',
  'common.filters':            'Фильтры',
  'common.clear':              'Очистить',
  'common.of':                 '/',

  'ca.title':          'Central Asia',
  'ca.eyebrow':        'einfolib.uz · источник',
  'ca.description':    'Все статьи научного журнала «Central Asia». Обновляется автоматически при выходе нового номера.',
  'ca.stat.articles':  'Статья',
  'ca.stat.pages':     'Стр.',
  'ca.search_placeholder': 'Поиск по заголовку, автору или тексту…',
  'ca.empty':          'Статьи не найдены. Измените поиск или нажмите «einfolib.uz — обновить» в админ-панели.',
  'ca.not_found':      'Статья не найдена.',
  'ca.source_link':    'Оригинал — einfolib.uz',
  'ca.error_backend':  'Ошибка. Проверьте, запущен ли backend.',

  'footer.copyright':  '© 2026 Национальная библиотека Узбекистана · kutubxona.uz',
};

const en: Dict = {
  'nav.home':          'Home',
  'nav.articles':      'Articles',
  'nav.archive':       'Journal archive',
  'nav.authors':       'Authors',
  'nav.central_asia':  'Central Asia',
  'nav.admin':         'Admin',
  'nav.logout':        'Log out',

  'common.search_placeholder': 'Article, author, keyword…',
  'common.search':             'Search',
  'common.searching':          'Searching…',
  'common.no_results':         'Nothing found.',
  'common.view_all_results':   'View all results →',
  'common.upload_article':     'Submit article',
  'common.menu':               'Menu',
  'common.loading':            'Loading…',
  'common.error':              'An error occurred.',
  'common.back_to_list':       'Back to list',
  'common.read_more':          'Read',
  'common.filters':            'Filters',
  'common.clear':              'Clear',
  'common.of':                 '/',

  'ca.title':          'Central Asia',
  'ca.eyebrow':        'einfolib.uz · source',
  'ca.description':    'All articles of the «Central Asia» library-science journal. Updated automatically when a new issue is released.',
  'ca.stat.articles':  'Article',
  'ca.stat.pages':     'Page',
  'ca.search_placeholder': 'Search by title, author or text…',
  'ca.empty':          'No articles found. Adjust your search or press "einfolib.uz — refresh" in the admin panel.',
  'ca.not_found':      'Article not found.',
  'ca.source_link':    'Original — einfolib.uz',
  'ca.error_backend':  'An error occurred. Check that the backend is running.',

  'footer.copyright':  '© 2026 National Library of Uzbekistan · kutubxona.uz',
};

const dicts: Record<Lang, Dict> = {
  'uz-latn': uzLatn,
  'uz-cyrl': uzCyrl,
  'ru':      ru,
  'en':      en,
};

export function useT() {
  const { lang } = useLang();
  return (key: string): string => {
    return dicts[lang][key] ?? uzLatn[key] ?? key;
  };
}
