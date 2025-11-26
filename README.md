# 🤖 ARIA - Asistente de Recursos Inteligente Automatizado

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/tuusuario/aria-hr)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-green)](package.json)
[![Vercel Deployed](https://img.shields.io/badge/vercel-deployed-blue)](https://vercel.com)

**ARIA** es un asistente de inteligencia artificial especializado en Recursos Humanos que integra chat inteligente, reconocimiento de voz y gestión de conversaciones en tiempo real.

## ✨ Características Principales

- 🤖 **IA Conversacional**: Powered by GPT-4 Turbo
- 🎤 **Voz Natural**: Text-to-Speech y Speech-to-Text con ElevenLabs
- 💬 **Chat en Tiempo Real**: Mensajes instantáneos con Supabase Realtime
- 🔐 **Autenticación Robusta**: Supabase Auth con Row Level Security
- 📊 **Dashboard Analítico**: Métricas de uso y satisfacción
- ⚡ **Rendimiento**: Build ultra-rápido con Vite (3s)
- 📱 **Responsive**: Funciona en móvil, tablet y desktop

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- API keys de OpenAI y ElevenLabs

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/aria-hr.git
cd aria-hr

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Configuración de Supabase

1. Ejecutar SQL en Supabase:
   - Ir a SQL Editor
   - Copiar contenido de `supabase-schema.sql`
   - Ejecutar

2. Crear usuarios de prueba:
   - Admin: `admin@techcorp.es` / `Admin123!`
   - Empleado: `juan.perez@techcorp.es` / `Empleado123!`

## 📁 Estructura del Proyecto

```
aria-hr/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Login.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── CompanyDashboard.tsx
│   │   └── Loading.tsx
│   ├── services/            # Servicios de negocio
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   └── voiceService.ts
│   ├── lib/
│   │   └── supabase.ts      # Cliente Supabase + Types
│   ├── App.tsx              # Componente raíz
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globales
├── .env.example             # Template de variables
├── .env.local               # Variables (NO subir a Git)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json              # Config para Vercel
└── README.md
```

## 🔧 Configuración de Variables de Entorno

Crear archivo `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI
VITE_OPENAI_API_KEY=sk-proj-your_key_here

# ElevenLabs
VITE_ELEVENLABS_API_KEY=sk_your_key_here
VITE_ELEVENLABS_AGENT_ID=agent_your_id_here
```

⚠️ **IMPORTANTE**: Nunca subir `.env.local` a GitHub. Está en `.gitignore`

## 📚 Servicios Integrados

### Supabase
- Autenticación de usuarios
- Base de datos PostgreSQL
- Realtime subscriptions
- Row Level Security (RLS)

### OpenAI
- Modelo: GPT-4 Turbo
- Contexto empresarial
- Respuestas personalizadas

### ElevenLabs
- Text-to-Speech multilingual
- Speech-to-Text en español
- Agente conversacional

## 🎯 Flujo de Uso

### Como Empleado
1. Login con email/password
2. Ver dashboard personalizado
3. Iniciar chat con ARIA
4. Hacer preguntas sobre RRHH
5. ARIA responde usando GPT-4
6. Opcionalmente usar voz

### Como Admin/HR Manager
1. Login con credenciales admin
2. Ver dashboard con métricas
3. Revisar conversaciones
4. Analizar satisfacción
5. Gestionar documentos

## 🏗️ Stack Tecnológico

**Frontend:**
- React 18.2
- TypeScript 5.2
- Vite 5.0
- Lucide Icons
- Recharts

**Backend/Servicios:**
- Supabase (PostgreSQL + Auth + Realtime)
- OpenAI API (GPT-4 Turbo)
- ElevenLabs API (Voice AI)

**DevOps:**
- Vercel (Hosting)
- GitHub Actions (CI/CD)
- Git (Version Control)

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor con hot reload

# Producción
npm run build        # Compilar para producción
npm run preview      # Preview del build

# Calidad de código
npm run lint         # Revisar código con ESLint
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Vercel desplegará automáticamente

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas.

### Netlify (Alternativa)

```bash
npm run build
# Subir carpeta 'dist' a Netlify
```

## 🔐 Seguridad

- ✅ Variables de entorno en `.env.local` (no en Git)
- ✅ Row Level Security en Supabase
- ✅ Autenticación con JWT
- ✅ HTTPS automático en Vercel
- ⚠️ API keys en frontend (mejora: backend proxy)

## 📊 Monitoreo

### Vercel Analytics
- Rendimiento de la aplicación
- Métricas de usuario
- Errores en tiempo real

### Supabase Logs
- Queries a base de datos
- Autenticación
- Realtime events

## 🐛 Troubleshooting

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Cannot read properties of undefined (supabase)"
- Verificar que ejecutaste el SQL en Supabase
- Verificar credenciales en `.env.local`

### "OpenAI API key invalid"
- Verificar que la key es válida
- Verificar que tienes créditos

### "Build fails en Vercel"
- Revisar logs en Vercel dashboard
- Ejecutar `npm run build` localmente

## 📈 Roadmap

### Próximas Features
- [ ] Upload de documentos empresa
- [ ] RAG con búsqueda semántica
- [ ] Dashboard analytics avanzado
- [ ] Notificaciones push
- [ ] App móvil (React Native)

### Optimizaciones
- [ ] Backend proxy para API keys
- [ ] Caché de respuestas
- [ ] Compresión de audio

## 💰 Costos Aproximados

### Plan Free (Desarrollo)
- Supabase: Gratis (500MB BD)
- OpenAI: ~$0.01-0.03 por conversación
- ElevenLabs: 10,000 caracteres/mes gratis

### Plan Producción (50 empleados)
- Supabase Pro: $25/mes
- OpenAI: ~$50-100/mes
- ElevenLabs Starter: $5/mes

**Total: ~$80-130/mes**

## 📞 Soporte

### Documentación
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guía de despliegue
- [GITHUB_SETUP.md](GITHUB_SETUP.md) - Configuración de GitHub/Vercel
- [NEXT_JS_MIGRATION.md](NEXT_JS_MIGRATION.md) - Análisis de Next.js

### Recursos Externos
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [ElevenLabs Docs](https://elevenlabs.io/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

**Desarrollado con ❤️ para revolucionar RRHH con IA**

**Versión:** 2.0.0  
**Última actualización:** Noviembre 2025  
**Estado:** ✅ Producción
