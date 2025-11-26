import { VercelRequest, VercelResponse } from '@vercel/node'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validar autenticación
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const userId = token

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many requests' })
    }

    const { text } = req.body

    // Validar input
    if (!text || typeof text !== 'string' || text.length > 1000) {
      return res.status(400).json({ error: 'Invalid text' })
    }

    // Llamar a ElevenLabs (API key en servidor)
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
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
      const error = await response.text()
      console.error('ElevenLabs error:', error)
      return res.status(response.status).json({ error: 'Voice generation failed' })
    }

    // Obtener audio como buffer
    const audioBuffer = await response.arrayBuffer()

    // Logging
    console.log(`[VOICE] User: ${userId}, Text length: ${text.length}, Audio size: ${audioBuffer.byteLength}`)

    // Enviar audio
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.byteLength)
    res.send(Buffer.from(audioBuffer))
  } catch (error: any) {
    console.error('Error en voice proxy:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
