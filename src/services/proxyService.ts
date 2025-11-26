/**
 * Servicio de Proxy - Comunica con backend seguro
 * Las API keys están protegidas en el servidor
 */

import type { Message } from '../lib/supabase'

export const proxyService = {
  /**
   * Obtener respuesta de ARIA a través del proxy seguro
   */
  async getAriaResponse(
    userMessage: string,
    conversationHistory: Message[] = [],
    token: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado')
        }
        if (response.status === 429) {
          throw new Error('Demasiadas solicitudes. Intenta más tarde.')
        }
        throw new Error('Error al obtener respuesta')
      }

      const data = await response.json()
      return data.response
    } catch (error: any) {
      console.error('Error en proxy chat:', error)
      throw error
    }
  },

  /**
   * Generar audio a través del proxy seguro
   */
  async textToSpeech(text: string, token: string): Promise<Blob> {
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado')
        }
        if (response.status === 429) {
          throw new Error('Límite de solicitudes alcanzado')
        }
        throw new Error('Error al generar audio')
      }

      const blob = await response.blob()
      return blob
    } catch (error: any) {
      console.error('Error en proxy voice:', error)
      throw error
    }
  },

  /**
   * Reproducir audio desde blob
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
  }
}
