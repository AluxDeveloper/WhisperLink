import { useState, useEffect } from 'react'
import { LandingPage } from './pages/Landing/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ChatPage } from './pages/chat/ChatPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'

type AppPage = 'landing' | 'login' | 'register' | 'chat' | 'admin'

function App() {
  const [page, setPage] = useState<AppPage>(() => {
    // La refresh verifică dacă există token valid
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) return 'chat'
    return 'landing'
  })

  useEffect(() => {
    document.body.style.overflow = page === 'chat' || page === 'admin' ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = '' }
  }, [page])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setPage('landing')
  }

  if (page === 'admin') return <AdminDashboard />

  if (page === 'chat') return <ChatPage onBack={handleLogout} />

  if (page === 'register') return (
    <RegisterPage
      onRegister={() => setPage('chat')}
      onGoLogin={() => setPage('login')}
      onBack={() => setPage('landing')}
    />
  )

  if (page === 'login') return (
    <LoginPage
      onLogin={() => setPage('chat')}
      onGoRegister={() => setPage('register')}
      onBack={() => setPage('landing')}
    />
  )

  return <LandingPage onEnter={() => setPage('login')} />
}

export default App