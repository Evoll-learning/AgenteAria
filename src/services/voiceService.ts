const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID

export const voiceService = {
  /**
   * Convertir texto a voz (Text-to-Speech)
   */
  async textToSpeech(text: string): Promise<Blob> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      })

      if (!response.ok) {
        throw new Error('Error en Text-to-Speech')
      }

      const blob = await response.blob()
      return blob
    } catch (error) {
      console.error('Error en Text-to-Speech:', error)
      throw new Error('Error al generar audio')
    }
  },

  /**
   * Reproducir audio
   */
  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          reject(new Error('Error al reproducir audio'))
        }

        audio.play()
      } catch (error) {
        reject(error)
      }
    })
  },

  /**
   * Iniciar reconocimiento de voz (Speech-to-Text)
   * Usa la Web Speech API del navegador
   */
  startSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: any) => void
  ): SpeechRecognition | null {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech Recognition no soportado en este navegador')
      return null
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]
      const transcript = (lastResult as any)[0].transcript
      const isFinal = (lastResult as any).isFinal

      onResult(transcript, isFinal)
    }

    recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error)
      if (onError) {
        onError(event.error)
      }
    }

    recognition.start()
    return recognition
  },

  /**
   * Detener reconocimiento de voz
   */
  stopSpeechRecognition(recognition: SpeechRecognition | null) {
    if (recognition) {
      recognition.stop()
    }
  },

  /**
   * Iniciar conversación por voz con ElevenLabs Agent
   * Usa la API de Conversational AI
   */
  async startVoiceConversation(
    onMessage: (text: string, isUser: boolean) => void,
    onEnd: () => void
  ): Promise<WebSocket | null> {
    try {
      // Crear conexión WebSocket con ElevenLabs
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}`
      )

      // Enviar API key en el primer mensaje
      ws.onopen = () => {
        console.log('Conversación de voz iniciada')
        ws.send(JSON.stringify({
          type: 'init',
          api_key: apiKey
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'user_transcript') {
            onMessage(data.text, true)
          } else if (data.type === 'agent_response') {
            onMessage(data.text, false)
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error)
        }
      }

      ws.onclose = () => {
        console.log('Conversación de voz finalizada')
        onEnd()
      }

      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error)
      }

      return ws
    } catch (error) {
      console.error('Error iniciando conversación de voz:', error)
      return null
    }
  },

  /**
   * Finalizar conversación de voz
   */
  endVoiceConversation(ws: WebSocket | null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  },

  /**
   * Verificar si el navegador soporta Speech Recognition
   */
  isSpeechRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  },

  /**
   * Solicitar permisos de micrófono
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Error obteniendo permisos de micrófono:', error)
      return false
    }
  }
}

// Type para SpeechRecognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: any) => void) | null
  onresult: ((event: any) => void) | null
  onend: (() => void) | null
}
