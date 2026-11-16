import { m, type Entry } from './types';

/** Jurnal arxivi, son sahifasi, jurnal sahifasi. */
export default {
  // ── Arxiv ──
  'archive.seo.description': m('Jurnalning barcha sonlari — muqova va mundarija.', 'Журналнинг барча сонлари — муқова ва мундарижа.', 'Все номера журнала — обложки и содержание.', 'All issues of the journal — covers and contents.'),
  'archive.sub': m(
    '{year}-yildan bugungacha chiqqan {issues}. Har sonda muqova va mundarija.',
    '{year} йилдан бугунгача чиққан {issues}. Ҳар сонда муқова ва мундарижа.',
    '{issues} с {year} года по сегодняшний день. В каждом — обложка и содержание.',
    '{issues} published from {year} to date. Each with a cover and contents.',
  ),
  'archive.category':       m('Yo‘nalish', 'Йўналиш', 'Рубрика', 'Section'),
  'archive.years':          m('Yillar', 'Йиллар', 'Годы', 'Years'),
  'archive.total':          m('Jami', 'Жами', 'Всего', 'Total'),
  'archive.current_year':   m('joriy yil', 'жорий йил', 'текущий год', 'current year'),
  'archive.upcoming_title': m('№ {n} tayyorlanmoqda', '№ {n} тайёрланмоқда', '№ {n} готовится', 'No. {n} in preparation'),
  'archive.upcoming_text':  m('Kelgusi son uchun maqola qabuli ochiq.', 'Келгуси сон учун мақола қабули очиқ.', 'Открыт приём статей в следующий номер.', 'Submissions for the next issue are open.'),
  'archive.single_title':   m('Arxivda bitta son', 'Архивда битта сон', 'В архиве один номер', 'One issue in the archive'),
  'archive.single_text':    m('Bu yildan arxivga hozircha bitta son kiritilgan.', 'Бу йилдан архивга ҳозирча битта сон киритилган.', 'За этот год в архив пока добавлен один номер.', 'Only one issue from this year has been added so far.'),
  'archive.show_years':     m('{range} yillarni ko‘rsatish · {issues}', '{range} йилларни кўрсатиш · {issues}', 'Показать {range} годы · {issues}', 'Show {range} · {issues}'),

  // ── Son sahifasi ──
  'issue.seo.description': m('{journal} jurnalining {year}-yil {n}-soni.', '{journal} журналининг {year} йил {n}-сони.', 'Журнал {journal}, {year} год, № {n}.', '{journal}, {year}, issue No. {n}.'),
  'issue.download_cover':  m('Muqova rasmini yuklash', 'Муқова расмини юклаш', 'Скачать обложку', 'Download cover image'),
  'issue.first':           m('← Birinchi son', '← Биринчи сон', '← Первый номер', '← First issue'),
  'issue.last':            m('So‘nggi son', 'Сўнгги сон', 'Последний номер', 'Latest issue'),
  'issue.upcoming':        m('№ {n} tayyorlanmoqda', '№ {n} тайёрланмоқда', '№ {n} готовится', 'No. {n} in preparation'),
  'issue.latest_badge':    m('So‘nggi son', 'Сўнгги сон', 'Свежий номер', 'Latest issue'),
  'issue.year_sub':        m('{year}-yil', '{year}-йил', '{year} год', '{year}'),
  'issue.meta.date':        m('Chiqarilgan sana', 'Чиқарилган сана', 'Дата выхода', 'Publication date'),
  'issue.meta.articles':    m('Maqolalar', 'Мақолалар', 'Статьи', 'Articles'),
  'issue.meta.volume':      m('Hajm', 'Ҳажм', 'Объём', 'Length'),
  'issue.meta.periodicity': m('Davriylik', 'Даврийлик', 'Периодичность', 'Frequency'),
  'issue.meta.quarterly':   m('Choraklik', 'Чораклик', 'Ежеквартально', 'Quarterly'),
  'issue.meta.languages':   m('Tillar', 'Тиллар', 'Языки', 'Languages'),
  'issue.editorial':       m('Tahririyat so‘zi', 'Таҳририят сўзи', 'Слово редакции', 'Editorial'),
  'issue.editor':          m('Bosh muharrir · {name}', 'Бош муҳаррир · {name}', 'Главный редактор · {name}', 'Editor-in-chief · {name}'),
  'issue.read_full':       m('Butun sonni o‘qish', 'Бутун сонни ўқиш', 'Читать весь номер', 'Read the full issue'),
  'issue.about':           m('Son haqida', 'Сон ҳақида', 'О номере', 'About this issue'),
  'issue.rubrics':         m('Sondagi yo‘nalishlar', 'Сондаги йўналишлар', 'Рубрики номера', 'Sections in this issue'),
  'issue.full':            m('Butun son', 'Бутун сон', 'Весь номер', 'Full issue'),
  'issue.toc':             m('Mundarija', 'Мундарижа', 'Содержание', 'Contents'),
  'issue.grouped':         m('Rubrikalar bo‘yicha guruhlangan', 'Рубрикалар бўйича гуруҳланган', 'Сгруппировано по рубрикам', 'Grouped by section'),
  'issue.pages_as_printed': m('sahifa raqamlari jurnaldagidek', 'саҳифа рақамлари журналдагидек', 'номера страниц как в журнале', 'page numbers as printed'),
  'issue.empty':           m('Bu songa hali maqola kiritilmagan.', 'Бу сонга ҳали мақола киритилмаган.', 'В этот номер ещё не добавлены статьи.', 'No articles have been added to this issue yet.'),

  // ── Jurnal sahifasi ──
  'journal.cover_alt':     m('Jurnal muqovasi', 'Журнал муқоваси', 'Обложка журнала', 'Journal cover'),
  'journal.default_title': m('Kutubxona Arxivi', 'Кутубхона Архиви', 'Архив Kutubxona', 'Kutubxona Archive'),
  'journal.seo':           m('{t} jurnali — barcha sonlar.', '{t} журнали — барча сонлар.', 'Журнал {t} — все номера.', '{t} journal — all issues.'),
  'journal.sub':           m('Jurnalning barcha sonlari. Har bir son ustiga bosib, to‘liq PDF va maqolalarni ko‘rishingiz mumkin.', 'Журналнинг барча сонлари. Ҳар бир сон устига босиб, тўлиқ PDF ва мақолаларни кўришингиз мумкин.', 'Все номера журнала. Нажмите на номер, чтобы открыть полный PDF и статьи.', 'All issues of the journal. Click an issue to open the full PDF and its articles.'),
  'journal.stat.issues':   m('Jami sonlar', 'Жами сонлар', 'Всего номеров', 'Total issues'),
  'journal.stat.articles': m('Maqolalar', 'Мақолалар', 'Статьи', 'Articles'),
  'journal.stat.years':    m('Yillar', 'Йиллар', 'Годы', 'Years'),
  'journal.not_found':     m('Jurnal topilmadi.', 'Журнал топилмади.', 'Журнал не найден.', 'Journal not found.'),
  'journal.no_issues':     m('Hali jurnal sonlari yo‘q.', 'Ҳали журнал сонлари йўқ.', 'Номеров журнала пока нет.', 'No journal issues yet.'),
  'journal.yearly':        m('Yillik to‘plam', 'Йиллик тўплам', 'Годовой комплект', 'Yearly volume'),
} satisfies Record<string, Entry>;
