# 🚀 Guía de Despliegue - ARIA

## Despliegue en Vercel

### Opción 1: Despliegue Manual

1. **Crear cuenta en Vercel**
   - Ir a https://vercel.com
   - Registrarse con GitHub

2. **Importar proyecto**
   - Click en "New Project"
   - Seleccionar repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configurar variables de entorno**
   - En la sección "Environment Variables", añadir:
   ```
   VITE_SUPABASE_URL=https://cyvdvaggjfxzxsdwbtzj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_OPENAI_API_KEY=sk-proj-RbBRJ4pDI8LIv0dbNmKG3iwotN...
   VITE_ELEVENLABS_API_KEY=sk_4a014ffd720e0b89596830b5d54ffc62...
   VITE_ELEVENLABS_AGENT_ID=agent_4401katqp8rqfe1vyakstn2fn8na
   ```

4. **Deploy**
   - Click en "Deploy"
   - Esperar a que se complete (2-3 minutos)
   - ¡Tu aplicación estará en vivo!

### Opción 2: Despliegue Automático con GitHub Actions

1. **Configurar secretos en GitHub**
   - Ir a Settings → Secrets and variables → Actions
   - Añadir:
     - `VERCEL_TOKEN`: Token de Vercel (obtener en https://vercel.com/account/tokens)
     - `VERCEL_ORG_ID`: ID de la organización en Vercel
     - `VERCEL_PROJECT_ID`: ID del proyecto en Vercel

2. **El flujo se ejecutará automáticamente**
   - Cada push a `main` o `develop` disparará el deploy
   - Ver estado en la pestaña "Actions" de GitHub

## Despliegue en Netlify (Alternativa)

1. **Conectar repositorio**
   - Ir a https://app.netlify.com
   - Click en "New site from Git"
   - Seleccionar GitHub y autorizar

2. **Configurar build**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Añadir variables de entorno**
   - En Site settings → Build & deploy → Environment
   - Añadir las mismas variables que en Vercel

4. **Deploy**
   - Netlify desplegará automáticamente

## Variables de Entorno en Producción

⚠️ **IMPORTANTE**: Nunca subir `.env.local` a GitHub

Las variables deben configurarse en el panel de Vercel/Netlify:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `VITE_OPENAI_API_KEY` | Clave API de OpenAI |
| `VITE_ELEVENLABS_API_KEY` | Clave API de ElevenLabs |
| `VITE_ELEVENLABS_AGENT_ID` | ID del agente de ElevenLabs |

## Verificación Post-Despliegue

Después de desplegar, verifica:

1. ✅ La aplicación carga correctamente
2. ✅ El login funciona
3. ✅ Las integraciones con APIs funcionan
4. ✅ No hay errores en la consola del navegador

## Troubleshooting

### "Module not found"
```bash
npm install
npm run build
```

### "API key invalid"
- Verificar que las variables de entorno están configuradas correctamente en Vercel
- Verificar que las claves no tienen espacios en blanco

### "CORS error"
- Las APIs (OpenAI, ElevenLabs) deben permitir requests desde tu dominio
- Configurar CORS en Supabase si es necesario

### "Build fails"
- Verificar logs en Vercel/Netlify
- Asegurar que `npm run build` funciona localmente
- Verificar que todas las dependencias están en `package.json`

## Dominios Personalizados

### En Vercel
1. Settings → Domains
2. Añadir tu dominio
3. Configurar DNS según las instrucciones

### En Netlify
1. Domain settings
2. Añadir dominio personalizado
3. Configurar DNS

## SSL/HTTPS

- ✅ Vercel: Automático con certificado Let's Encrypt
- ✅ Netlify: Automático con certificado Let's Encrypt

## Monitoreo

### Vercel Analytics
- Ir a Analytics en el dashboard
- Ver métricas de rendimiento

### Logs
- Vercel: Deployments → Logs
- Netlify: Deploys → Deploy log

## Rollback

Si algo falla en producción:

### Vercel
1. Deployments
2. Seleccionar versión anterior
3. Click en "Promote to Production"

### Netlify
1. Deploys
2. Seleccionar versión anterior
3. Click en "Publish deploy"

---

**¿Necesitas ayuda?** Consulta la documentación oficial:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
