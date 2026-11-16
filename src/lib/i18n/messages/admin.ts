import { m, type Entry } from './types';

/** Admin panel qobig'i (AdminShell) — bo'limlar nav.admin.* da (common.ts). */
export default {
  'adm.shell.tag':         m('Admin paneli', 'Админ панели', 'Админ-панель', 'Admin panel'),
  'adm.shell.view_site':   m('Saytni ko‘rish', 'Сайтни кўриш', 'Открыть сайт', 'View site'),
  'adm.shell.role_default': m('Tahririyat', 'Таҳририят', 'Редакция', 'Editorial'),
  'adm.shell.crumb_root':  m('Tahririyat', 'Таҳририят', 'Редакция', 'Editorial'),
  'adm.shell.crumb_panel': m('Panel', 'Панел', 'Панель', 'Panel'),
  'adm.shell.search':      m('Maqola, muallif, son…', 'Мақола, муаллиф, сон…', 'Статья, автор, номер…', 'Article, author, issue…'),
  'adm.shell.notifs':      m('Bildirishnomalar', 'Билдиришномалар', 'Уведомления', 'Notifications'),
  'adm.shell.mark_read':   m('Hammasini o‘qildi', 'Ҳаммасини ўқилди', 'Прочитать все', 'Mark all read'),
  'adm.shell.no_notifs':   m('Yangi bildirishnoma yo‘q', 'Янги билдиришнома йўқ', 'Новых уведомлений нет', 'No new notifications'),
  'adm.shell.logout':      m('Chiqish', 'Чиқиш', 'Выйти', 'Log out'),
} satisfies Record<string, Entry>;
