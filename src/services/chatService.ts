import OpenAI from 'openai'
import { supabase, type Message, type Conversation } from '../lib/supabase'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para MVP, en producción usar backend
})

export const chatService = {
  /**
   * Crear nueva conversación
   */
  async createConversation(
    userId: string,
    companyId: string,
    channel: 'voice' | 'chat' | 'phone' = 'chat'
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        company_id: companyId,
        channel,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return data as Conversation
  },

  /**
   * Guardar mensaje en base de datos
   */
  async saveMessage(
    conversationId: string,
    sender: 'user' | 'aria' | 'system',
    content: string,
    contentType: 'text' | 'voice' | 'document' = 'text'
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender,
        content,
        content_type: contentType
      })
      .select()
      .single()

    if (error) throw error
    return data as Message
  },

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  },

  /**
   * Obtener respuesta de ARIA usando OpenAI
   */
  async getAriaResponse(
    userMessage: string,
    conversationHistory: Message[] = [],
    companyContext?: string
  ): Promise<string> {
    try {
      // Construir contexto del sistema
      const systemPrompt = `Eres ARIA (Asistente de Recursos Inteligente Automatizado), un asistente virtual de RRHH profesional y amigable.

Tu rol es ayudar a los empleados con consultas sobre:
- Nóminas y salarios
- Vacaciones y días libres
- Bajas médicas y permisos
- Convenios colectivos y políticas de empresa
- Horarios y turnos
- Formación y desarrollo
- Procedimientos internos

Contexto de la empresa:
${companyContext || 'Empresa española del sector tecnológico con 50-200 empleados.'}

Instrucciones:
- Sé conciso y claro
- Usa un tono profesional pero cercano
- Si no tienes información, sugiere contactar con RRHH directamente
- Proporciona pasos concretos cuando sea posible
- Usa emojis ocasionalmente para ser más amigable

Responde en español.`

      // Construir historial de mensajes para OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ]

      // Llamar a OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      })

      const response = completion.choices[0]?.message?.content || 
        'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?'

      return response
    } catch (error) {
      console.error('Error en OpenAI:', error)
      throw new Error('Error al obtener respuesta de ARIA')
    }
  },

  /**
   * Obtener conversaciones de un usuario
   */
  async getUserConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Conversation[]
  },

  /**
   * Cerrar conversación
   */
  async closeConversation(conversationId: string, rating?: number) {
    const updates: any = {
      status: 'resolved',
      ended_at: new Date().toISOString()
    }

    if (rating) {
      updates.satisfaction_rating = rating
    }

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)

    if (error) throw error
  },

  /**
   * Suscribirse a nuevos mensajes (realtime)
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Flujo completo: enviar mensaje y obtener respuesta
   */
  async sendMessageAndGetResponse(
    conversationId: string,
    userMessage: string,
    _userId: string,
    companyContext?: string
  ): Promise<{ userMsg: Message; ariaMsg: Message }> {
    // 1. Guardar mensaje del usuario
    const userMsg = await this.saveMessage(conversationId, 'user', userMessage)

    // 2. Obtener historial
    const history = await this.getMessages(conversationId)

    // 3. Obtener respuesta de ARIA
    const ariaResponse = await this.getAriaResponse(
      userMessage,
      history.slice(0, -1), // Excluir el último (que acabamos de enviar)
      companyContext
    )

    // 4. Guardar respuesta de ARIA
    const ariaMsg = await this.saveMessage(conversationId, 'aria', ariaResponse)

    return { userMsg, ariaMsg }
  }
}
