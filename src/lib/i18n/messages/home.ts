import { m, type Entry } from './types';

/** Bosh sahifa (HomePage). */
export default {
  'home.seo.description': m(
    'Kutubxona — axborot-kutubxona texnologiyalari ilmiy-amaliy jurnali. Ochiq kirish arxivi.',
    'Кутубхона — ахборот-кутубхона технологиялари илмий-амалий журнали. Очиқ кириш архиви.',
    'Kutubxona — научно-практический журнал по информационно-библиотечным технологиям. Архив открытого доступа.',
    'Kutubxona — a scholarly journal on library and information technologies. Open-access archive.',
  ),
  'home.summary.default': m(
    'Axborot-kutubxona texnologiyalari bo‘yicha ilmiy-amaliy jurnal. Barcha maqolalar ochiq kirishda.',
    'Ахборот-кутубхона технологиялари бўйича илмий-амалий журнал. Барча мақолалар очиқ киришда.',
    'Научно-практический журнал по информационно-библиотечным технологиям. Все статьи в открытом доступе.',
    'A scholarly journal on library and information technologies. All articles are open access.',
  ),
  'home.summary.with_rubrics': m('Bu sonda: {rubrics}. Jami {count}.', 'Бу сонда: {rubrics}. Жами {count}.', 'В этом номере: {rubrics}. Всего {count}.', 'In this issue: {rubrics}. {count} in total.'),
  'home.summary.count_only':   m('Bu sonda {count}.', 'Бу сонда {count}.', 'В этом номере {count}.', 'This issue contains {count}.'),

  'home.hero.latest_issue':  m('So‘nggi son', 'Сўнгги сон', 'Свежий номер', 'Latest issue'),
  'home.hero.title_default': m('Ilmiy meros va kelajak raqamli formatda', 'Илмий мерос ва келажак рақамли форматда', 'Научное наследие и будущее в цифровом формате', 'Scholarly heritage and the future in digital form'),
  'home.hero.open_issue':    m('Sonni ochish', 'Сонни очиш', 'Открыть номер', 'Open the issue'),
  'home.hero.featured':      m('Yetakchi maqola', 'Етакчи мақола', 'Главная статья', 'Featured article'),
  'home.hero.slide':         m('{n}-slayd', '{n}-слайд', 'Слайд {n}', 'Slide {n}'),
  'home.stat.articles':      m('Maqola', 'Мақола', 'Статей', 'Articles'),
  'home.stat.authors':       m('Muallif', 'Муаллиф', 'Авторов', 'Authors'),
  'home.stat.issues':        m('Son', 'Сон', 'Номеров', 'Issues'),

  'home.issue.latest_default':   m('Jurnalning so‘nggi soni', 'Журналнинг сўнгги сони', 'Свежий номер журнала', 'The latest issue of the journal'),
  'home.issue.read_full':        m('Butun sonni o‘qish', 'Бутун сонни ўқиш', 'Читать весь номер', 'Read the full issue'),
  'home.issue.featured_eyebrow': m('Sonning yetakchi maqolasi', 'Соннинг етакчи мақоласи', 'Главная статья номера', 'Featured article of the issue'),
  'home.issue.this_article':     m('Ushbu maqola', 'Ушбу мақола', 'Эта статья', 'This article'),

  'home.side.rubrics':     m('Sondagi yo‘nalishlar', 'Сондаги йўналишлар', 'Рубрики номера', 'Sections in this issue'),
  'home.side.about_title': m('Jurnal haqida', 'Журнал ҳақида', 'О журнале', 'About the journal'),
  'home.side.about_text':  m(
    '2019-yildan chiqadigan choraklik nashr. Nashr uchun ham, o‘qish uchun ham to‘lov olinmaydi.',
    '2019 йилдан чиқадиган чораклик нашр. Нашр учун ҳам, ўқиш учун ҳам тўлов олинмайди.',
    'Ежеквартальное издание, выходит с 2019 года. Плата ни за публикацию, ни за чтение не взимается.',
    'A quarterly published since 2019. No fees are charged for publishing or reading.',
  ),
  'home.side.board_link':  m('Tahririyat kengashi →', 'Таҳририят кенгаши →', 'Редакционный совет →', 'Editorial board →'),

  'home.also.eyebrow':  m('Shu sondan yana', 'Шу сондан яна', 'Ещё из этого номера', 'More from this issue'),
  'home.also.full_toc': m('To‘liq mundarija →', 'Тўлиқ мундарижа →', 'Полное содержание →', 'Full contents →'),

  'home.top.eyebrow':  m('Ko‘p o‘qilganlar', 'Кўп ўқилганлар', 'Самые читаемые', 'Most read'),
  'home.top.all_time': m('barcha vaqt', 'барча вақт', 'за всё время', 'all time'),
  'home.top.empty':    m('Hozircha bo‘sh', 'Ҳозирча бўш', 'Пока пусто', 'Nothing yet'),
  'home.cats.eyebrow': m('Yo‘nalishlar', 'Йўналишлар', 'Рубрики', 'Sections'),

  'home.archive.eyebrow': m('Arxiv', 'Архив', 'Архив', 'Archive'),
  'home.archive.all':     m('Barcha {n} son →', 'Барча {n} сон →', 'Все номера ({n}) →', 'All {n} issues →'),

  'home.cta.eyebrow': m('Mualliflarga', 'Муаллифларга', 'Авторам', 'For authors'),
  'home.cta.title':   m('Keyingi songa maqola qabul qilinmoqda', 'Кейинги сонга мақола қабул қилинмоқда', 'Открыт приём статей в следующий номер', 'Now accepting articles for the next issue'),
  'home.cta.lede':    m(
    'Qo‘lyozmani Telegram bot orqali yuboring — tahririyat 3 ish kuni ichida qabulini tasdiqlaydi va taqrizga yo‘naltiradi.',
    'Қўлёзмани Telegram бот орқали юборинг — таҳририят 3 иш куни ичида қабулини тасдиқлайди ва тақризга йўналтиради.',
    'Отправьте рукопись через Telegram-бот — редакция подтвердит получение в течение 3 рабочих дней и направит её на рецензирование.',
    'Send your manuscript via the Telegram bot — the editors confirm receipt within 3 working days and forward it for review.',
  ),
  'home.cta.button':  m('Telegram bot orqali yuborish', 'Telegram бот орқали юбориш', 'Отправить через Telegram-бот', 'Submit via Telegram bot'),

  'home.cta.step1.title': m('Talablarni o‘qing', 'Талабларни ўқинг', 'Прочитайте требования', 'Read the requirements'),
  'home.cta.step1.text':  m(
    'Qamrov, hajm (8–15 bet), annotatsiya va kalit so‘zlar bo‘yicha qabul shartlari.',
    'Қамров, ҳажм (8–15 бет), аннотация ва калит сўзлар бўйича қабул шартлари.',
    'Условия приёма: тематика, объём (8–15 страниц), аннотация и ключевые слова.',
    'Submission requirements: scope, length (8–15 pages), abstract and keywords.',
  ),
  'home.cta.step1.link':  m('Qo‘llanma', 'Қўлланма', 'Руководство', 'Guidelines'),
  'home.cta.step2.title': m('Faylni tayyorlang', 'Файлни тайёрланг', 'Подготовьте файл', 'Prepare the file'),
  'home.cta.step2.text':  m(
    '.docx yoki .pdf, Times New Roman 14 kegl, adabiyotlar GOST bo‘yicha.',
    '.docx ёки .pdf, Times New Roman 14 кегл, адабиётлар ГОСТ бўйича.',
    '.docx или .pdf, Times New Roman 14 кегль, список литературы по ГОСТ.',
    '.docx or .pdf, Times New Roman 14 pt, references formatted per GOST.',
  ),
  'home.cta.step2.link':  m('Formatlash talablari', 'Форматлаш талаблари', 'Требования к оформлению', 'Formatting requirements'),
  'home.cta.step3.title': m('Yuboring', 'Юборинг', 'Отправьте', 'Submit'),
  'home.cta.step3.text':  m(
    'Tahririyat 3 ish kuni ichida qabulni tasdiqlaydi va taqrizga yo‘naltiradi.',
    'Таҳририят 3 иш куни ичида қабулни тасдиқлайди ва тақризга йўналтиради.',
    'Редакция подтвердит получение в течение 3 рабочих дней и направит статью на рецензирование.',
    'The editors confirm receipt within 3 working days and forward the article for review.',
  ),
  'home.cta.step3.link':  m('Taqriz jarayoni', 'Тақриз жараёни', 'Процесс рецензирования', 'Review process'),
} satisfies Record<string, Entry>;
