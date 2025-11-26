import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import EmployeeDashboard from './components/EmployeeDashboard'
import CompanyDashboard from './components/CompanyDashboard'
import Loading from './components/Loading'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)

        if (session) {
          // Obtener rol del usuario
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            setUserRole(userData.role)
          }
        }
      } catch (error) {
        console.error('Error verificando sesión:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)

        if (newSession) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', newSession.user.id)
            .single()

          if (userData) {
            setUserRole(userData.role)
          }
        } else {
          setUserRole(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {userRole === 'admin' || userRole === 'hr_manager' ? (
              <>
                <Route path="/dashboard" element={<CompanyDashboard />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
