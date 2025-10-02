# Guía de Instalación - DevMeet AI

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js 18+** y **npm 9+**
   - Descargar: https://nodejs.org/
   - Verificar versión: `node --version && npm --version`

2. **PostgreSQL 14+**
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`
   - Verificar: `psql --version`

3. **Git**
   - Descargar: https://git-scm.com/downloads
   - Verificar: `git --version`

4. **API Keys**
   - Claude API key: https://console.anthropic.com/
   - OpenAI API key: https://platform.openai.com/api-keys

---

## 🚀 Instalación Paso a Paso

### Paso 1: Instalar Dependencias

**IMPORTANTE**: La instalación puede tardar 5-10 minutos debido a las dependencias de Electron.

```bash
# Desde el root del proyecto
npm install
```

**Nota**: Si ves warnings de deprecación, son normales y no afectan la funcionalidad.

### Paso 2: Configurar PostgreSQL

#### 2.1 Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;

# Para PostgreSQL 15+, también ejecutar:
\c devmeet_db
GRANT ALL ON SCHEMA public TO devmeet_user;

# Salir
\q
```

#### 2.2 Ejecutar Migrations

```bash
# Crear carpeta de migrations
mkdir -p packages/backend/migrations

# Copiar el contenido de docs/DATABASE_SCHEMA.md (sección "Migration 001")
# al archivo packages/backend/migrations/001_initial_schema.sql

# Ejecutar migration
psql -U devmeet_user -d devmeet_db -f packages/backend/migrations/001_initial_schema.sql
```

**Verificar que las tablas se crearon**:
```bash
psql -U devmeet_user -d devmeet_db -c "\dt"
```

Deberías ver las tablas: `meetings`, `transcriptions`, `notes`, `action_items`, `participants`, `documentation_references`.

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# (Usa tu editor favorito: code .env, notepad .env, nano .env, etc.)
```

**Contenido del .env**:
```env
# Backend
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://devmeet_user:dev_password_123@localhost:5432/devmeet_db

# Claude API (obtener en https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI Whisper (obtener en https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Security
JWT_SECRET=local_dev_secret_change_in_production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

### Paso 4: Verificar Instalación

```bash
# 1. Verificar que las dependencias se instalaron
ls node_modules/@typescript-eslint

# 2. Verificar workspaces
npm ls --workspace=@devmeet/backend --depth=0
npm ls --workspace=@devmeet/frontend --depth=0
npm ls --workspace=@devmeet/desktop --depth=0

# 3. Verificar TypeScript
npx tsc --version

# 4. Verificar linting
npm run lint
```

Si todos los comandos funcionan sin errores críticos, ¡la instalación fue exitosa! ✅

---

## 🏃 Ejecutar el Proyecto

### Opción 1: Ejecutar Todo en Paralelo

```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`
- Electron app (ventana de escritorio)

### Opción 2: Ejecutar Servicios Individualmente

En terminales separadas:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Electron (cuando los otros dos estén listos)
npm run dev:desktop
```

---

## 🧪 Verificar que Todo Funciona

### 1. Backend (API)

```bash
# Health check
curl http://localhost:3000/health
# Debe devolver: {"status":"ok","timestamp":"..."}
```

### 2. Frontend

Abre `http://localhost:5173` en tu navegador.
Deberías ver: "DevMeet AI - Coming Soon"

### 3. Base de Datos

```bash
# Verificar conexión desde backend (después de iniciar el backend)
# El log debería mostrar "DevMeet Backend running on port 3000"
# sin errores de conexión a PostgreSQL
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"

```bash
# Limpiar e reinstalar
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### Error: PostgreSQL "connection refused"

```bash
# Verificar que PostgreSQL esté corriendo
# Windows: Abrir "Services" y buscar "postgresql"
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Error: "ECONNREFUSED" en backend

- Verifica que `DATABASE_URL` en `.env` sea correcta
- Verifica que PostgreSQL esté corriendo
- Verifica que el usuario y contraseña sean correctos

### Error: "Permission denied" en migrations

```bash
# PostgreSQL 15+: Dar permisos al schema
psql -U postgres -d devmeet_db -c "GRANT ALL ON SCHEMA public TO devmeet_user;"
```

### Error: Electron no abre

- Asegúrate de que backend y frontend estén corriendo primero
- Verifica que no haya otro proceso usando el puerto 5173

---

## 📝 Próximos Pasos

Una vez que todo esté instalado y funcionando:

1. Lee [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) para entender el proyecto
2. Revisa [`tasks/IN_PROGRESS.md`](./tasks/IN_PROGRESS.md) para ver el estado actual
3. Consulta [`tasks/BACKLOG.md`](./tasks/BACKLOG.md) para ver las tareas pendientes
4. Lee [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para entender la arquitectura

---

## 💡 Tips para Desarrollo

### Hot Reload

- **Backend**: Usa `tsx watch` (ya configurado en `npm run dev:backend`)
- **Frontend**: Vite tiene hot reload automático
- **Electron**: Requiere reinicio manual (por ahora)

### Debugging

- **Backend**: Agrega `debugger;` y ejecuta con `--inspect`
- **Frontend**: DevTools del navegador o de Electron
- **PostgreSQL**: Usa pgAdmin, DBeaver, o TablePlus

### Linting Automático

Configura tu editor para ejecutar ESLint y Prettier al guardar:
- VS Code: Instala extensiones "ESLint" y "Prettier"
- Configura format on save en settings

---

**¿Problemas?** Abre un issue o consulta la documentación en `/docs`
