import { VercelRequest, VercelResponse } from '@vercel/node'
import { OpenAI } from 'openai'

// Rate limiting simple (en producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string, limit: number = 30, windowMs: number = 60000): boolean {
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
    // Validar autenticación (en producción verificar JWT)
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    
    // En producción: decodificar y validar JWT con Supabase
    // Por ahora usar token como userId (será validado por Supabase en producción)
    if (!token || token.length < 10) {
      return res.status(401).json({ error: 'Invalid token format' })
    }
    const userId = token.substring(0, 36) // Usar primeros 36 caracteres como ID

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many requests' })
    }

    const { message, conversationHistory } = req.body

    // Validar input
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ error: 'Invalid message' })
    }

    // Crear cliente OpenAI (API key en servidor, seguro)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Construir contexto
    const systemPrompt = `Eres ARIA (Asistente de Recursos Inteligente Automatizado), un asistente virtual de RRHH profesional y amigable.

Tu rol es ayudar a los empleados con consultas sobre:
- Nóminas y salarios
- Vacaciones y días libres
- Bajas médicas y permisos
- Convenios colectivos y políticas de empresa
- Horarios y turnos
- Formación y desarrollo
- Procedimientos internos

Instrucciones:
- Sé conciso y claro
- Usa un tono profesional pero cercano
- Si no tienes información, sugiere contactar con RRHH directamente
- Proporciona pasos concretos cuando sea posible
- Usa emojis ocasionalmente para ser más amigable

Responde en español.`

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []).map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    })

    const response = completion.choices[0]?.message?.content || 
      'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?'

    // Logging (en producción enviar a servicio de logs)
    console.log(`[CHAT] User: ${userId}, Message length: ${message.length}, Response length: ${response.length}`)

    res.status(200).json({ response })
  } catch (error: any) {
    console.error('Error en chat proxy:', error)
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'OpenAI API key invalid' })
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit exceeded' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
}
