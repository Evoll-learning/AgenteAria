import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'
import { LogOut, Users, MessageSquare, TrendingUp } from 'lucide-react'
import './Dashboard.css'

export default function CompanyDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    avgSatisfaction: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const session = await authService.getSession()
      if (session) {
        const profile = await authService.getUserProfile(session.user.id)
        setUser(profile)

        // Cargar estadísticas
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('company_id', profile.company_id)

        const { data: conversations } = await supabase
          .from('conversations')
          .select('id, satisfaction_rating')
          .eq('company_id', profile.company_id)

        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .in('conversation_id', conversations?.map(c => c.id) || [])

        const avgRating = conversations && conversations.length > 0
          ? conversations.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / conversations.length
          : 0

        setStats({
          totalUsers: users?.length || 0,
          totalConversations: conversations?.length || 0,
          totalMessages: messages?.length || 0,
          avgSatisfaction: Math.round(avgRating * 10) / 10
        })
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🤖 ARIA - Panel de Administración</h1>
          <p>Bienvenido, {user?.full_name}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Users size={32} />
          <h3>Empleados</h3>
          <p className="stat-value">{stats.totalUsers}</p>
        </div>

        <div className="stat-card">
          <MessageSquare size={32} />
          <h3>Conversaciones</h3>
          <p className="stat-value">{stats.totalConversations}</p>
        </div>

        <div className="stat-card">
          <TrendingUp size={32} />
          <h3>Mensajes Totales</h3>
          <p className="stat-value">{stats.totalMessages}</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <h3>Satisfacción Promedio</h3>
          <p className="stat-value">{stats.avgSatisfaction}/5</p>
        </div>
      </div>

      <div className="admin-section">
        <h2>Información de la Empresa</h2>
        <div className="company-info">
          <p><strong>Nombre:</strong> {user?.companies?.name}</p>
          <p><strong>Email:</strong> {user?.companies?.email || 'No configurado'}</p>
          <p><strong>Teléfono:</strong> {user?.companies?.phone || 'No configurado'}</p>
          <p><strong>Industria:</strong> {user?.companies?.industry || 'No configurado'}</p>
        </div>
      </div>
    </div>
  )
}
