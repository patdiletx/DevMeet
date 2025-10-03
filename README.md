# DevMeet AI

> **Asistente IA para desarrolladores** que captura, transcribe y analiza reuniones técnicas en tiempo real.

[![Status](https://img.shields.io/badge/status-MVP%20Development-orange)]()
[![Node](https://img.shields.io/badge/node-18+-green)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)]()
[![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue)]()

## ✨ Características Principales

- 🎙️ **Captura de audio** en tiempo real desde tu escritorio
- 📝 **Transcripción automática** con Whisper AI
- 🧠 **Análisis inteligente** con Claude AI
- 📋 **Notas automáticas** estructuradas y accionables
- 🔍 **Búsqueda de documentación** relevante durante reuniones
- ✅ **Identificación de action items** y decisiones clave
- 🔎 **Full-text search** en transcripciones
- 💾 **Persistencia** en PostgreSQL con schema optimizado

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

**¿Primera vez?** → Lee [**QUICKSTART.md**](./QUICKSTART.md) para configurar todo en 15 minutos.

```bash
# 1. Instalar dependencias (si aún no lo hiciste)
npm install

# 2. Configurar PostgreSQL y ejecutar migrations
cd packages/backend
npm run migrate

# 3. Iniciar el backend
cd ../..
npm run dev:backend

# 4. Probar la API
curl http://localhost:3000/health
```

✅ **Backend corriendo en http://localhost:3000**

### 📖 Documentación de Inicio

| Documento | Descripción | Tiempo |
|-----------|-------------|--------|
| [**QUICKSTART.md**](./QUICKSTART.md) | Configuración paso a paso | 15 min |
| [**INSTALL.md**](./INSTALL.md) | Instalación detallada | 30 min |
| [**API_EXAMPLES.md**](./API_EXAMPLES.md) | Ejemplos de uso de API REST | 10 min |
| [**WEBSOCKET_EXAMPLES.md**](./WEBSOCKET_EXAMPLES.md) | Ejemplos de WebSocket en tiempo real | 10 min |
| [**COMMANDS.md**](./COMMANDS.md) | Referencia de comandos | 5 min |

### 🧪 Probar la API

```bash
# Crear una reunión
curl -X POST http://localhost:3000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi Primera Reunión","description":"Testing DevMeet AI"}'

# Listar reuniones
curl http://localhost:3000/api/v1/meetings

# Ver ejemplos completos en API_EXAMPLES.md
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

## 📚 Documentación Completa

### 🚀 Para Empezar
- [**QUICKSTART.md**](./QUICKSTART.md) - Configuración rápida (15 min)
- [**INSTALL.md**](./INSTALL.md) - Instalación paso a paso
- [**API_EXAMPLES.md**](./API_EXAMPLES.md) - Ejemplos de la API REST
- [**WEBSOCKET_EXAMPLES.md**](./WEBSOCKET_EXAMPLES.md) - Ejemplos de WebSocket
- [**COMMANDS.md**](./COMMANDS.md) - Referencia de comandos npm
- [**SETUP_POSTGRESQL.md**](./SETUP_POSTGRESQL.md) - Configuración de PostgreSQL
- [**CONTINUE_PROMPT.md**](./CONTINUE_PROMPT.md) - Prompts para continuar desarrollo

### 📖 Documentación Técnica
- [**PROJECT_CONTEXT.md**](./PROJECT_CONTEXT.md) - Contexto y visión del proyecto
- [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Arquitectura detallada
- [**docs/DATABASE_SCHEMA.md**](./docs/DATABASE_SCHEMA.md) - Schema de base de datos

### 📋 Gestión del Proyecto
- [**STATUS.md**](./STATUS.md) - Estado actual del proyecto
- [**MILESTONE_1_SUMMARY.md**](./MILESTONE_1_SUMMARY.md) - Resumen Milestone 1 ✅
- [**tasks/BACKLOG.md**](./tasks/BACKLOG.md) - Backlog de tareas (100+)
- [**tasks/IN_PROGRESS.md**](./tasks/IN_PROGRESS.md) - Tareas en progreso

## 🗺️ Roadmap del MVP

### ✅ Milestone 1: Backend Core (100% COMPLETADO) 🎉
- [x] Monorepo con npm workspaces
- [x] TypeScript + ESLint + Prettier
- [x] PostgreSQL schema (7 tablas)
- [x] Migration system
- [x] API REST completa (10 endpoints)
- [x] Logging con Winston
- [x] Error handling middleware
- [x] WebSocket server
- [x] Whisper API integration
- [x] Claude API integration
- [x] Audio processing pipeline
- [x] Action items detection

### ⏳ Milestone 2: Desktop App (0%)
- [ ] Electron main process
- [ ] Audio capture nativo
- [ ] IPC bridge con frontend
- [ ] System tray integration
- [ ] Packaging con electron-builder

### ⏳ Milestone 3: Frontend UI (0%)
- [ ] Dashboard de reuniones
- [ ] Vista de reunión activa
- [ ] Panel de transcripción en tiempo real
- [ ] Panel de notas generadas
- [ ] Búsqueda full-text

### ⏳ Milestone 4: IA Integration (0%)
- [ ] Análisis de transcripciones con Claude
- [ ] Generación automática de notas
- [ ] Detección de action items
- [ ] Búsqueda de documentación relevante

### ⏳ Milestone 5: Testing & Polish (0%)
- [ ] Tests unitarios (Jest)
- [ ] Tests de integración
- [ ] Tests E2E (Playwright)
- [ ] Performance optimization
- [ ] Documentación de usuario

**Progreso del MVP**: 20% completado (Milestone 1/5 ✅)

## 🎯 Estado Actual

**Fase**: Milestone 1 - Backend Core (100% ✅)
**Backend API**: ✅ Funcional (10 endpoints REST + 8 eventos WebSocket)
**WebSocket**: ✅ Implementado con streaming en tiempo real
**IA Integration**: ✅ Whisper + Claude completamente integrados
**Base de datos**: ⏳ Pendiente instalación de PostgreSQL
**Próximo paso**: Configurar PostgreSQL y testing end-to-end

Ver [**MILESTONE_1_SUMMARY.md**](./MILESTONE_1_SUMMARY.md) para el resumen completo del milestone.

---

## 🔗 API Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check del servidor |
| `GET` | `/api/v1/meetings` | Listar reuniones (paginado) |
| `GET` | `/api/v1/meetings/:id` | Obtener reunión por ID |
| `GET` | `/api/v1/meetings/:id/full` | Reunión con todas las relaciones |
| `POST` | `/api/v1/meetings` | Crear nueva reunión |
| `PATCH` | `/api/v1/meetings/:id` | Actualizar reunión |
| `POST` | `/api/v1/meetings/:id/end` | Finalizar reunión |
| `DELETE` | `/api/v1/meetings/:id` | Eliminar reunión |
| `GET` | `/api/v1/transcriptions/search` | Búsqueda full-text |
| `POST` | `/api/v1/transcriptions` | Crear transcripción |
| `DELETE` | `/api/v1/transcriptions/:id` | Eliminar transcripción |

Ver [**API_EXAMPLES.md**](./API_EXAMPLES.md) para ejemplos completos.

---

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Para contribuir:

1. Consulta [**tasks/BACKLOG.md**](./tasks/BACKLOG.md) para ver tareas disponibles
2. Lee [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) para entender la arquitectura
3. Sigue las convenciones de código (TypeScript strict, ESLint, Prettier)

---

## 📄 Licencia

MIT License - Ver LICENSE para más detalles

---

**Versión**: 0.1.0-alpha
**Última actualización**: 2025-10-02
**Estado**: 🟢 Activo - MVP en desarrollo
