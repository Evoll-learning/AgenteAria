import { supabase, type User } from '../lib/supabase'

export const authService = {
  /**
   * Login con email y contraseña
   */
  async signIn(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // Obtener datos del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', authData.user.id)
      .single()

    if (userError) throw userError

    return {
      user: authData.user,
      session: authData.session,
      profile: userData
    }
  },

  /**
   * Registro de nuevo usuario
   */
  async signUp(email: string, password: string, fullName: string, companyId: string) {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_id: companyId
        }
      }
    })

    if (authError) throw authError

    // 2. Crear entrada en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        company_id: companyId,
        email,
        full_name: fullName,
        role: 'employee'
      })
      .select()
      .single()

    if (userError) throw userError

    return {
      user: authData.user,
      profile: userData
    }
  },

  /**
   * Logout
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Obtener sesión actual
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  /**
   * Obtener perfil de usuario
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*, companies(*)')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data as User & { companies: any }
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Resetear contraseña
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  },

  /**
   * Actualizar contraseña
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  },

  /**
   * Verificar si usuario está autenticado
   */
  async isAuthenticated() {
    const session = await this.getSession()
    return !!session
  }
}
