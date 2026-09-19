import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';

import HomePage           from './pages/HomePage';
import ArticlesPage       from './pages/ArticlesPage';
import ArticleDetailPage  from './pages/ArticleDetailPage';
import ArchivePage        from './pages/ArchivePage';
import IssueDetailPage    from './pages/IssueDetailPage';
import JournalDetailPage  from './pages/JournalDetailPage';
import AuthorsPage          from './pages/AuthorsPage';
import AuthorDetailPage     from './pages/AuthorDetailPage';
import CentralAsiaPage       from './pages/CentralAsiaPage';
import CentralAsiaDetailPage from './pages/CentralAsiaDetailPage';
import LoginPage             from './pages/LoginPage';
import NotFoundPage          from './pages/NotFoundPage';
import ErrorBoundary         from './components/ErrorBoundary';
import { AboutJournal, AboutBoard, AboutPolicy, AboutGuide } from './pages/AboutPage';

import AdminDashboardPage   from './pages/admin/AdminDashboardPage';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminSubmissionDetailPage from './pages/admin/AdminSubmissionDetailPage';
import AdminSettingsPage    from './pages/admin/AdminSettingsPage';
import AdminNotFoundPage    from './pages/admin/AdminNotFoundPage';
import AdminAuthorsPage     from './pages/admin/AdminAuthorsPage';
import AdminAuthorDetailPage from './pages/admin/AdminAuthorDetailPage';
import AdminJournalsPage    from './pages/admin/AdminJournalsPage';
import AdminIssueDetailPage from './pages/admin/AdminIssueDetailPage';
import AdminChatPage        from './pages/admin/AdminChatPage';

// ── Himoyalangan route ────────────────────────────────────────────────────────

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, token, user } = useAuth();
  // Token bor, profil hali yuklanmagan (sahifa yangilanganda) — login'ga qaytarmaymiz
  if (token && !user) return <div style={{ padding: 48, color: 'var(--ink-3)', fontSize: 14 }}>Yuklanmoqda…</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Routes>
          {/* ── Ommaviy sahifalar ── */}
          <Route path="/"                   element={<HomePage />} />
          <Route path="/articles"           element={<ArticlesPage />} />
          <Route path="/articles/:slug"     element={<ArticleDetailPage />} />
          <Route path="/archive"            element={<ArchivePage />} />
          <Route path="/archive/:id"        element={<IssueDetailPage />} />
          <Route path="/journals/:id"       element={<JournalDetailPage />} />
          <Route path="/authors"            element={<AuthorsPage />} />
          <Route path="/authors/:slug"      element={<AuthorDetailPage />} />
          <Route path="/central-asia"       element={<CentralAsiaPage />} />
          <Route path="/central-asia/:slug" element={<CentralAsiaDetailPage />} />

          {/* Jurnal haqida bo'limi (Figma: 14–17-freymlar) */}
          <Route path="/about"        element={<AboutJournal />} />
          <Route path="/about/board"  element={<AboutBoard />} />
          <Route path="/about/policy" element={<AboutPolicy />} />
          <Route path="/about/guide"  element={<AboutGuide />} />

          {/* Eski /issues/:id havolalari arxiv sahifasiga olib boradi */}
          <Route path="/issues/:id"   element={<IssueDetailPage />} />

          {/* ── Auth ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Admin panel (himoyalangan) ── */}
          {/* Eski Django admin manzillari (brauzer tarixi/keshi) — React login sahifasiga */}
          <Route path="/admin/login/*" element={<Navigate to="/login" replace />} />
          <Route path="/admin"             element={<Protected><AdminDashboardPage /></Protected>} />
          <Route path="/admin/submissions" element={<Protected><AdminSubmissionsPage /></Protected>} />
          <Route path="/admin/submissions/:id" element={<Protected><AdminSubmissionDetailPage /></Protected>} />
          <Route path="/admin/settings"    element={<Protected><AdminSettingsPage /></Protected>} />
          <Route path="/admin/authors"     element={<Protected><AdminAuthorsPage /></Protected>} />
          <Route path="/admin/authors/:id" element={<Protected><AdminAuthorDetailPage /></Protected>} />
          <Route path="/admin/journals"    element={<Protected><AdminJournalsPage /></Protected>} />
          <Route path="/admin/journals/:id" element={<Protected><AdminIssueDetailPage /></Protected>} />
          <Route path="/admin/chat"        element={<Protected><AdminChatPage /></Protected>} />
          <Route path="/admin/*"           element={<Protected><AdminNotFoundPage /></Protected>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
  );
}
