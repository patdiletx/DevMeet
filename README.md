# DevMeet AI

Asistente IA para desarrolladores que toma notas y responde en tiempo real durante reuniones técnicas.

## 🚀 Características

- **Captura de audio** en tiempo real desde tu escritorio
- **Transcripción automática** con Whisper AI
- **Análisis inteligente** con Claude AI
- **Notas automáticas** estructuradas y accionables
- **Búsqueda de documentación** relevante durante reuniones
- **Identificación de action items** y decisiones clave

## 📋 Requisitos

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** 9+
- **API Keys**:
  - Anthropic Claude API key
  - OpenAI API key (para Whisper)

## 🏗️ Estructura del Proyecto

```
DevMeet/
├── packages/
│   ├── backend/                    # Servidor Node.js/Express + PostgreSQL
│   │   ├── src/
│   │   │   ├── config/            # Configuración (DB, logger)
│   │   │   ├── controllers/       # Controladores de rutas
│   │   │   ├── routes/            # Definición de rutas
│   │   │   ├── services/          # Lógica de negocio
│   │   │   ├── models/            # Modelos de datos
│   │   │   ├── middleware/        # Middleware (auth, error handling)
│   │   │   └── types/             # Tipos TypeScript
│   │   ├── migrations/            # SQL migrations
│   │   └── package.json
│   │
│   ├── desktop/                    # Aplicación Electron
│   │   ├── src/
│   │   │   ├── main/              # Main process (Node.js)
│   │   │   ├── preload/           # Preload scripts (IPC bridge)
│   │   │   └── renderer/          # Renderer process (carga frontend)
│   │   └── package.json
│   │
│   └── frontend/                   # React SPA
│       ├── src/
│       │   ├── components/        # Componentes reutilizables
│       │   ├── pages/             # Páginas/vistas
│       │   ├── hooks/             # Custom React hooks
│       │   ├── services/          # API clients
│       │   ├── types/             # Tipos TypeScript
│       │   └── styles/            # CSS global
│       └── package.json
│
├── docs/                           # Documentación técnica
│   ├── ARCHITECTURE.md             # Arquitectura detallada del sistema
│   └── DATABASE_SCHEMA.md          # Diseño de base de datos
│
├── tasks/                          # Gestión de tareas del proyecto
│   ├── BACKLOG.md                  # Backlog priorizado
│   └── IN_PROGRESS.md              # Estado actual y próximos pasos
│
├── .vscode/                        # Configuración VS Code
├── PROJECT_CONTEXT.md              # Contexto general del proyecto
├── package.json                    # Workspace root
├── tsconfig.json                   # TypeScript config base
├── .eslintrc.json                  # ESLint config
├── .prettierrc.json                # Prettier config
├── .env.example                    # Ejemplo de variables de entorno
└── .gitignore                      # Git ignore
```

## ⚡ Quick Start

### 1. Clonar e Instalar Dependencias

```bash
git clone <repo-url>
cd DevMeet
npm install
```

### 2. Configurar PostgreSQL

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Crear base de datos
psql -U postgres
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;
\q

# Ejecutar migration
psql -U devmeet_user -d devmeet_db -f packages/backend/migrations/001_initial_schema.sql
```

### 3. Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.example .env

# Editar .env con tus credenciales
# - DATABASE_URL
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
```

### 4. Ejecutar en Desarrollo

```bash
# Iniciar todos los servicios
npm run dev

# O ejecutar individualmente:
npm run dev:backend    # Backend en http://localhost:3000
npm run dev:frontend   # Frontend en http://localhost:5173
npm run dev:desktop    # Electron app
```

## 📦 Scripts Disponibles

### Scripts Principales (desde root)

```bash
# Desarrollo
npm run dev              # Ejecutar todos los servicios en paralelo
npm run dev:backend      # Solo backend (http://localhost:3000)
npm run dev:frontend     # Solo frontend (http://localhost:5173)
npm run dev:desktop      # Solo Electron app

# Build
npm run build            # Build de todos los packages
npm run build:backend    # Build solo backend
npm run build:frontend   # Build solo frontend
npm run build:desktop    # Build solo desktop

# Calidad de código
npm run lint             # Linting de TypeScript en todos los packages
npm run lint:fix         # Fix automático de problemas de linting
npm run format           # Formatear todo el código con Prettier
npm run format:check     # Verificar formato sin modificar archivos

# Testing
npm run test             # Ejecutar tests en todos los packages (si existen)

# Limpieza
npm run clean            # Limpiar node_modules y builds de todos los packages
```

### Scripts por Package

**Backend** (`cd packages/backend`)
```bash
npm run dev              # Desarrollo con hot reload (tsx watch)
npm run build            # Compilar TypeScript a dist/
npm start                # Ejecutar versión compilada
npm test                 # Ejecutar tests con Jest
```

**Desktop** (`cd packages/desktop`)
```bash
npm run dev              # Desarrollo con Electron
npm run build            # Build de la app
npm run package          # Empaquetar app (sin instalador)
npm run make             # Crear instaladores para la plataforma actual
```

**Frontend** (`cd packages/frontend`)
```bash
npm run dev              # Desarrollo con Vite (hot reload)
npm run build            # Build de producción
npm run preview          # Preview del build de producción
npm run lint             # Linting específico de React
```

## 🔧 Stack Tecnológico

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL
- WebSocket (ws)
- Claude API + Whisper API

### Desktop
- Electron
- Audio capture nativo

### Frontend
- React 18
- Vite
- Zustand (state)
- React Query
- Axios

## 📚 Documentación

- [**PROJECT_CONTEXT.md**](./PROJECT_CONTEXT.md) - Contexto completo del proyecto
- [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Arquitectura detallada
- [**docs/DATABASE_SCHEMA.md**](./docs/DATABASE_SCHEMA.md) - Schema de base de datos
- [**tasks/BACKLOG.md**](./tasks/BACKLOG.md) - Tareas priorizadas
- [**tasks/IN_PROGRESS.md**](./tasks/IN_PROGRESS.md) - Estado actual

## 🗺️ Roadmap

### ✅ Fase 1: Setup e Infraestructura (Completada)
- Configuración del monorepo
- Estructura de packages
- Documentación base

### 🚧 Fase 2: Backend Core (En Progreso)
- Base de datos PostgreSQL
- API REST de meetings
- WebSocket para real-time
- Integración con Whisper y Claude

### ⏳ Fase 3: Desktop App
- Captura de audio nativo
- IPC con frontend
- Packaging

### ⏳ Fase 4: Frontend UI
- Dashboard de reuniones
- Vista de reunión activa
- Panels de transcripción y notas

### ⏳ Fase 5: Integración IA
- Análisis en tiempo real
- Generación de notas
- Búsqueda de documentación

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Consulta [BACKLOG.md](./tasks/BACKLOG.md) para ver tareas pendientes.

## 📄 Licencia

MIT

---

**Estado**: MVP en desarrollo - Fase 2
**Versión**: 0.1.0
**Última actualización**: 2025-10-02
