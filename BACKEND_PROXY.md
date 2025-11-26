# 🔒 Backend Proxy - Seguridad Empresarial

## Descripción

El backend proxy es una capa de seguridad que protege tus API keys de OpenAI y ElevenLabs. Las keys se almacenan en el servidor (Vercel), no en el navegador.

## Arquitectura

```
Frontend (Navegador)
    ↓
    ├─ Envía: { message, token }
    ├─ Recibe: { response }
    ↓
Backend Proxy (Vercel Functions)
    ↓
    ├─ Valida token JWT
    ├─ Aplica rate limiting
    ├─ Llama a OpenAI/ElevenLabs
    ├─ Logs de auditoría
    ↓
OpenAI / ElevenLabs APIs
```

## Rutas de API

### POST /api/chat
Obtener respuesta de ARIA a través del proxy seguro.

**Request:**
```json
{
  "message": "¿Cuándo cobro este mes?",
  "conversationHistory": [...]
}
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Response:**
```json
{
  "response": "Según el calendario de nóminas..."
}
```

**Errores:**
- 401: No autorizado
- 429: Demasiadas solicitudes
- 500: Error del servidor

### POST /api/voice
Generar audio a través del proxy seguro.

**Request:**
```json
{
  "text": "Hola, soy ARIA"
}
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Response:**
- Audio MP3 binario

**Errores:**
- 401: No autorizado
- 429: Demasiadas solicitudes
- 500: Error del servidor

## Seguridad

### 1. Autenticación
- Todas las rutas requieren JWT token
- Token obtenido de Supabase Auth
- Se valida en cada request

### 2. Rate Limiting
- Chat: 30 requests por minuto por usuario
- Voice: 60 requests por minuto por usuario
- Retorna 429 si se excede el límite

### 3. Validación de Input
- Máximo 2000 caracteres para chat
- Máximo 1000 caracteres para voice
- Valida tipos de datos

### 4. Logging
- Logs de todos los requests
- Información: usuario, tamaño de mensaje, tamaño de respuesta
- En producción: enviar a servicio de logs (Sentry, etc.)

### 5. API Keys Protegidas
- Nunca expuestas en frontend
- Almacenadas en variables de entorno de Vercel
- Solo accesibles en backend

## Variables de Entorno (Vercel)

```env
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# ElevenLabs
ELEVENLABS_API_KEY=sk_your-key-here

# Supabase (para validar tokens)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Implementación en Frontend

### Usar ProxyService

```typescript
import { proxyService } from './services/proxyService'

// Obtener respuesta de ARIA
const response = await proxyService.getAriaResponse(
  'Mi pregunta',
  conversationHistory,
  token
)

// Generar audio
const audioBlob = await proxyService.textToSpeech(
  'Texto a convertir',
  token
)

// Reproducir audio
await proxyService.playAudio(audioBlob)
```

## Despliegue en Vercel

### 1. Estructura de Carpetas
```
aria-hr/
├── api/
│   ├── chat.ts
│   └── voice.ts
├── src/
│   └── ...
```

### 2. Configurar Variables en Vercel
- Settings → Environment Variables
- Añadir OPENAI_API_KEY, ELEVENLABS_API_KEY, etc.

### 3. Deploy
```bash
git push origin main
# Vercel desplegará automáticamente
```

### 4. Verificar
```bash
# Probar endpoint
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola"}'
```

## Monitoreo

### Logs en Vercel
1. Dashboard → Deployments
2. Seleccionar deployment
3. Click en "Logs"

### Métricas
- Requests por usuario
- Tiempo de respuesta
- Errores (401, 429, 500)
- Uso de APIs externas

## Mejoras Futuras

### Fase 1 (Actual)
- ✅ Rate limiting en memoria
- ✅ Validación de input
- ✅ Logging básico

### Fase 2 (Próxima)
- [ ] Rate limiting con Redis
- [ ] Caché de respuestas
- [ ] Métricas detalladas
- [ ] Alertas de errores

### Fase 3 (Escalado)
- [ ] Autenticación OAuth
- [ ] Webhooks para eventos
- [ ] Análisis de uso
- [ ] Facturación por API

## Troubleshooting

### "Unauthorized" (401)
- Verificar que el token es válido
- Verificar que el token no ha expirado
- Verificar header Authorization

### "Too many requests" (429)
- Esperar 1 minuto
- Reducir frecuencia de requests
- Contactar soporte para aumentar límite

### "Internal server error" (500)
- Revisar logs en Vercel
- Verificar que API keys son válidas
- Verificar que las APIs están disponibles

## Costos

### OpenAI
- Chat: ~$0.003 por 1K tokens
- Con proxy: mismo costo, pero más seguro

### ElevenLabs
- TTS: $0.30 por 1M caracteres
- Con proxy: mismo costo, pero más seguro

### Vercel
- Serverless Functions: incluido en plan Pro
- Ejecutable gratis hasta cierto límite

## Comparativa: Con/Sin Proxy

| Aspecto | Sin Proxy | Con Proxy |
|---------|-----------|----------|
| API Keys | En frontend | En servidor |
| Seguridad | Baja | Alta |
| Rate Limiting | No | Sí |
| Auditoría | No | Sí |
| Costo | Igual | Igual |
| Complejidad | Baja | Media |

---

**Recomendación: Usar proxy en producción para corporates**

El proxy añade seguridad sin aumentar costos significativamente.
