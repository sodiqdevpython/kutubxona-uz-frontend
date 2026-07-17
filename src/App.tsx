import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

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

import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminAuthorsPage     from './pages/admin/AdminAuthorsPage';
import AdminJournalsPage    from './pages/admin/AdminJournalsPage';
import AdminChatPage        from './pages/admin/AdminChatPage';

// ── Himoyalangan route ────────────────────────────────────────────────────────

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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

          {/* ── Auth ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Admin panel (himoyalangan) ── */}
          <Route path="/admin" element={<Navigate to="/admin/submissions" replace />} />
          <Route path="/admin/submissions" element={<Protected><AdminSubmissionsPage /></Protected>} />
          <Route path="/admin/authors"     element={<Protected><AdminAuthorsPage /></Protected>} />
          <Route path="/admin/journals"    element={<Protected><AdminJournalsPage /></Protected>} />
          <Route path="/admin/chat"        element={<Protected><AdminChatPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
