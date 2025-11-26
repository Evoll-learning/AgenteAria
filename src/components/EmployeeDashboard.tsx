import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'
import { voiceService } from '../services/voiceService'
import { proxyService } from '../services/proxyService'
import { LogOut, Send, Mic, MicOff, MessageSquare } from 'lucide-react'
import type { Message, Conversation } from '../lib/supabase'
import './Dashboard.css'

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    // Obtener token de sesión para usar en proxy
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
      }
    }
    getToken()
  }, [])

  const loadUserData = async () => {
    try {
      const session = await authService.getSession()
      if (session) {
        const profile = await authService.getUserProfile(session.user.id)
        setUser(profile)

        // Crear o cargar conversación
        const conversations = await chatService.getUserConversations(session.user.id, 1)
        let conv = conversations[0]

        if (!conv) {
          conv = await chatService.createConversation(
            session.user.id,
            profile.company_id,
            'chat'
          )
        }

        setConversation(conv)

        // Cargar mensajes
        const msgs = await chatService.getMessages(conv.id)
        setMessages(msgs)

        // Suscribirse a nuevos mensajes
        const unsubscribe = chatService.subscribeToMessages(conv.id, (newMsg) => {
          setMessages(prev => [...prev, newMsg])
        })

        return () => unsubscribe()
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !conversation || loading || !token) return

    setLoading(true)
    try {
      // 1. Guardar mensaje del usuario
      const userMsg = await chatService.saveMessage(conversation.id, 'user', inputMessage)
      setMessages(prev => [...prev, userMsg])

      // 2. Obtener historial
      const history = await chatService.getMessages(conversation.id)

      // 3. Obtener respuesta a través del proxy seguro
      const ariaResponse = await proxyService.getAriaResponse(
        inputMessage,
        history.slice(0, -1),
        token
      )

      // 4. Guardar respuesta de ARIA
      const ariaMsg = await chatService.saveMessage(conversation.id, 'aria', ariaResponse)
      setMessages(prev => [...prev, ariaMsg])
      setInputMessage('')
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      alert('Error al enviar mensaje. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecording = async () => {
    if (!voiceService.isSpeechRecognitionSupported()) {
      alert('Tu navegador no soporta reconocimiento de voz')
      return
    }

    try {
      const hasPermission = await voiceService.requestMicrophonePermission()
      if (!hasPermission) {
        alert('Necesitas permitir acceso al micrófono')
        return
      }

      const rec = voiceService.startSpeechRecognition(
        (text, isFinal) => {
          if (isFinal) {
            setInputMessage(text)
          }
        },
        (error) => {
          console.error('Error de voz:', error)
          setIsRecording(false)
        }
      )

      setRecognition(rec)
      setIsRecording(true)
    } catch (error) {
      console.error('Error iniciando grabación:', error)
    }
  }

  const handleStopRecording = () => {
    if (recognition) {
      voiceService.stopSpeechRecognition(recognition)
      setIsRecording(false)
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
          <h1>🤖 ARIA - Panel del Empleado</h1>
          <p>Bienvenido, {user?.full_name}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} />
              <h2>Inicia una conversación</h2>
              <p>Haz preguntas sobre RRHH, nóminas, vacaciones y más</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'user-message' : 'aria-message'}`}
              >
                <div className="message-content">
                  {msg.sender === 'aria' && <span className="sender-badge">ARIA</span>}
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-area">
          <div className="input-group">
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={loading}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
