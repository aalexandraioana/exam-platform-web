import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { landingPath, useAuth } from './auth/context'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppHeader from './components/AppHeader'
import { LoaderCircle } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SessionLoading from './components/SessionLoading'

// Signed-in screens load when first opened, so the login screen stays light (one chunk per page).
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const AdminExamsPage = lazy(() => import('./pages/admin/AdminExamsPage'))
const DashboardPage = lazy(() => import('./pages/candidate/DashboardPage'))
const ExamRoomPage = lazy(() => import('./pages/candidate/ExamRoomPage'))
const ResultsPage = lazy(() => import('./pages/candidate/ResultsPage'))
const ClassesPage = lazy(() => import('./pages/examiner/ClassesPage'))
const ExamBuilderPage = lazy(() => import('./pages/examiner/ExamBuilderPage'))
const ExamsPage = lazy(() => import('./pages/examiner/ExamsPage'))
const ExaminerDashboardPage = lazy(() => import('./pages/examiner/ExaminerDashboardPage'))
const GradingPage = lazy(() => import('./pages/examiner/GradingPage'))
const ItemAnalysisPage = lazy(() => import('./pages/examiner/ItemAnalysisPage'))
const QuestionBankPage = lazy(() => import('./pages/examiner/QuestionBankPage'))

/** Shown while a page's code loads (usually a moment). */
function PageLoading() {
  const { t } = useTranslation()
  return (
    <main role="status" className="grid flex-1 place-items-center px-4 py-16">
      <LoaderCircle className="size-icon-lg animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
      <span className="sr-only">{t('session.page')}</span>
    </main>
  )
}

// "/" goes to the signed-in user's home, or to the login screen.
function RootRedirect() {
  const { user, status } = useAuth()
  if (status === 'loading') return <SessionLoading />
  return <Navigate to={user ? landingPath(user) : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/candidate" element={<ProtectedRoute role="candidate"><DashboardPage /></ProtectedRoute>} />
              <Route path="/candidate/attempts/:id" element={<ProtectedRoute role="candidate"><ExamRoomPage /></ProtectedRoute>} />
              <Route path="/candidate/exams/:id/results" element={<ProtectedRoute role="candidate"><ResultsPage /></ProtectedRoute>} />
              <Route path="/examiner" element={<ProtectedRoute role="examiner"><ExaminerDashboardPage /></ProtectedRoute>} />
              <Route path="/examiner/classes" element={<ProtectedRoute role="examiner"><ClassesPage /></ProtectedRoute>} />
              <Route path="/examiner/questions" element={<ProtectedRoute role="examiner"><QuestionBankPage /></ProtectedRoute>} />
              <Route path="/examiner/exams" element={<ProtectedRoute role="examiner"><ExamsPage /></ProtectedRoute>} />
              <Route path="/examiner/exams/:id" element={<ProtectedRoute role="examiner"><ExamBuilderPage /></ProtectedRoute>} />
              <Route path="/examiner/exams/:id/grading" element={<ProtectedRoute role="examiner"><GradingPage /></ProtectedRoute>} />
              <Route path="/examiner/exams/:id/analysis" element={<ProtectedRoute role="examiner"><ItemAnalysisPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute role="administrator"><UsersPage /></ProtectedRoute>} />
              <Route path="/admin/exams" element={<ProtectedRoute role="administrator"><AdminExamsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
