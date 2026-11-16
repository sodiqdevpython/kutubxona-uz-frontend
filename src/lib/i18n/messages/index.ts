/**
 * Barcha lug'at bo'limlari bir joyda. Kalit prefikslari fayllar bo'yicha:
 *   common   — nav.*, topbar.*, common.*, unit.*, time.*, issue.date*, footer.*, seo.*
 *   home     — home.*
 *   articles — articles.*, article.*, cite.*, comments.*, ai.*, aimodal.*, docx.*, pdf.*
 *   archive  — archive.*, issue.*, journal.*
 *   authors  — authors.*, author.*
 *   about    — about.*
 *   central  — ca.*, cad.*
 *   misc     — login.*, notfound.*, eb.*, captcha.*
 *   admin             — adm.shell.* (AdminShell)
 *   admin-submissions — adm.sub.*, adm.parse.*
 *   admin-journals    — adm.jr.*, adm.iss.*, adm.au.*
 *   admin-articles    — adm.art.*, adm.ap.* (maqola tahriri, muallif tanlagich)
 *   admin-dashboard   — adm.dash.*, adm.chat.*, adm.set.*, adm.nf.*
 *
 * Yangi kalit qo'shganda to'rt tilni ham to'ldiring — `m(lotin, kirill, ru, en)`.
 */
import type { Entry } from './types';
import common   from './common';
import home     from './home';
import articles from './articles';
import archive  from './archive';
import authors  from './authors';
import about    from './about';
import central  from './central';
import misc     from './misc';
import admin    from './admin';
import adminSubmissions from './admin-submissions';
import adminJournals    from './admin-journals';
import adminDashboard   from './admin-dashboard';
import adminArticles    from './admin-articles';

export const MESSAGES = {
  ...common,
  ...home,
  ...articles,
  ...archive,
  ...authors,
  ...about,
  ...central,
  ...misc,
  ...admin,
  ...adminSubmissions,
  ...adminJournals,
  ...adminDashboard,
  ...adminArticles,
} satisfies Record<string, Entry>;
