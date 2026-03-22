import { Layout } from './components/layout/Layout'
import { AuthPage } from './components/auth/AuthPage'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { isAuthenticated, username, loading, login, register, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-100 flex items-center justify-center">
        <img src="/pua-logo.svg" alt="PUA" className="w-12 h-12 animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={login} onRegister={register} />
  }

  return <Layout username={username} onLogout={logout} />
}
