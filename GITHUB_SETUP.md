# 🔧 Configuración de GitHub y Vercel

## Paso 1: Crear Repositorio en GitHub

### Opción A: Desde GitHub Web
1. Ir a https://github.com/new
2. Nombre del repositorio: `aria-hr`
3. Descripción: `ARIA - Asistente de Recursos Inteligente Automatizado con IA`
4. Seleccionar "Public" o "Private"
5. **NO** inicializar con README (ya lo tenemos)
6. Click "Create repository"

### Opción B: Desde CLI
```bash
gh repo create aria-hr --public --source=. --remote=origin --push
```

---

## Paso 2: Conectar Repositorio Local

```bash
cd /home/ubuntu/aria-project

# Añadir remoto (reemplazar TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/aria-hr.git

# Cambiar rama a main si no está ya
git branch -M main

# Subir código
git push -u origin main
```

---

## Paso 3: Configurar Vercel

### Opción A: Despliegue Manual
1. Ir a https://vercel.com/new
2. Importar repositorio de GitHub
3. Vercel detectará automáticamente:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Opción B: Despliegue con CLI
```bash
npm install -g vercel
vercel
```

---

## Paso 4: Configurar Variables de Entorno en Vercel

1. En el dashboard de Vercel, ir a:
   - Project Settings → Environment Variables

2. Añadir las siguientes variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co

VITE_SUPABASE_ANON_KEY=your_anon_key_here

VITE_OPENAI_API_KEY=sk-proj-your-key-here

VITE_ELEVENLABS_API_KEY=sk_your-key-here

VITE_ELEVENLABS_AGENT_ID=agent_your-id-here
```

**⚠️ IMPORTANTE**: Reemplaza los valores con tus credenciales reales en Vercel. Las credenciales NO deben estar en el código fuente.

3. Seleccionar "Production" para cada variable
4. Click "Save"

---

## Paso 5: Primer Deploy

1. En Vercel, click "Deploy"
2. Esperar 2-3 minutos
3. Vercel te dará una URL como: `https://aria-hr-xxxxx.vercel.app`

---

## Paso 6: Configurar GitHub Actions (Opcional)

Para despliegue automático en cada push:

1. En GitHub, ir a Settings → Secrets and variables → Actions

2. Añadir secretos:
   - `VERCEL_TOKEN`: Obtener en https://vercel.com/account/tokens
   - `VERCEL_ORG_ID`: Obtener en Vercel dashboard
   - `VERCEL_PROJECT_ID`: Obtener en Project Settings

3. El archivo `.github/workflows/deploy.yml` ya está configurado

---

## Verificación Post-Deploy

Después de desplegar, verifica:

- [ ] La aplicación carga en la URL de Vercel
- [ ] El login funciona
- [ ] Puedes enviar mensajes
- [ ] Las integraciones con APIs funcionan
- [ ] No hay errores en la consola (F12)

---

## Dominio Personalizado

### Conectar dominio personalizado a Vercel

1. En Vercel, ir a Project Settings → Domains
2. Añadir tu dominio (ej: aria.tuempresa.com)
3. Seguir instrucciones para configurar DNS
4. Esperar propagación de DNS (5-48 horas)

---

## Monitoreo y Logs

### Ver logs en Vercel
1. Dashboard → Deployments
2. Seleccionar deployment
3. Click en "Logs"

### Ver logs en GitHub Actions
1. GitHub → Actions
2. Seleccionar workflow
3. Click en el run para ver detalles

---

## Troubleshooting

### Build falla en Vercel
```bash
# Verificar localmente
npm run build

# Si falla, revisar errores
npm run lint
```

### Variables de entorno no funcionan
- Verificar que están en "Production" en Vercel
- Redeploy después de cambiar variables
- Verificar que no hay espacios en blanco

### Aplicación en blanco
- Abrir DevTools (F12)
- Revisar Console para errores
- Verificar Network tab para requests fallidos

---

## Próximos Pasos

1. ✅ Código en GitHub
2. ✅ Despliegue en Vercel
3. ⏭️ Configurar dominio personalizado
4. ⏭️ Configurar SSL/HTTPS (automático)
5. ⏭️ Monitoreo y alertas

---

## Comandos Útiles

```bash
# Ver estado del repositorio
git status

# Ver commits
git log --oneline

# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push

# Ver ramas
git branch -a

# Crear rama de desarrollo
git checkout -b develop
git push -u origin develop
```

---

## Recursos

- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)
- [Git Docs](https://git-scm.com/doc)
