import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { landingPath, useAuth } from './auth/context'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppHeader from './components/AppHeader'
import ChangePasswordPage from './pages/ChangePasswordPage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/admin/UsersPage'
import ClassesPage from './pages/examiner/ClassesPage'
import PlaceholderHome from './pages/PlaceholderHome'
import RegisterPage from './pages/RegisterPage'
import SessionLoading from './components/SessionLoading'

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
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/candidate" element={<ProtectedRoute role="candidate"><PlaceholderHome role="candidate" /></ProtectedRoute>} />
            <Route path="/examiner" element={<ProtectedRoute role="examiner"><ClassesPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="administrator"><UsersPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
