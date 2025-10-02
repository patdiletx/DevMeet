# Arquitectura de DevMeet AI

## Visión General

DevMeet AI es una aplicación de escritorio basada en Electron que integra un backend Node.js y un frontend React para proporcionar análisis de reuniones en tiempo real usando IA.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APP (Desktop)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  FRONTEND (React/Vite)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │ │
│  │  │Dashboard │  │ Meeting  │  │  Transcription    │   │ │
│  │  │   Page   │  │   View   │  │     Panel         │   │ │
│  │  └──────────┘  └──────────┘  └───────────────────┘   │ │
│  │         │             │                  │             │ │
│  │         └─────────────┴──────────────────┘             │ │
│  │                       │                                 │ │
│  │              ┌────────▼────────┐                       │ │
│  │              │  API Services   │                       │ │
│  │              │  (Axios/Query)  │                       │ │
│  │              └────────┬────────┘                       │ │
│  └───────────────────────┼─────────────────────────────────┘ │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────────┐ │
│  │              ELECTRON MAIN PROCESS                       │ │
│  │  ┌────────────────┐        ┌──────────────────────┐   │ │
│  │  │ Audio Capture  │        │   IPC Bridge         │   │ │
│  │  │  (Native API)  │        │  (Main ↔ Renderer)   │   │ │
│  │  └────────────────┘        └──────────────────────┘   │ │
│  └───────────────────────┬─────────────────────────────────┘ │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                     API ROUTES                            │ │
│  │  /api/v1/meetings    /api/v1/transcriptions   /api/v1/ai │ │
│  └────────────┬──────────────────┬────────────────┬─────────┘ │
│               │                  │                │           │
│  ┌────────────▼─────┐  ┌────────▼───────┐  ┌────▼────────┐  │
│  │    Meeting       │  │ Transcription  │  │   AI        │  │
│  │   Controller     │  │  Controller    │  │ Controller  │  │
│  └────────┬─────────┘  └────────┬───────┘  └────┬────────┘  │
│           │                     │                │           │
│  ┌────────▼────────────────────▼────────────────▼────────┐  │
│  │                   SERVICE LAYER                        │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │ Meeting  │  │ Transcription│  │   AI Analysis   │ │  │
│  │  │ Service  │  │   Service    │  │     Service     │ │  │
│  │  └─────┬────┘  └──────┬───────┘  └────────┬────────┘ │  │
│  └────────┼───────────────┼───────────────────┼──────────┘  │
│           │               │                   │             │
│  ┌────────▼───────────────▼───────────────────▼──────────┐  │
│  │                    DATA LAYER                          │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │ Meeting  │  │ Transcription│  │      Note       │ │  │
│  │  │  Model   │  │    Model     │  │     Model       │ │  │
│  │  └─────┬────┘  └──────┬───────┘  └────────┬────────┘ │  │
│  └────────┼───────────────┼───────────────────┼──────────┘  │
│           └───────────────┴───────────────────┘             │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  PostgreSQL DB  │                        │
│                  └─────────────────┘                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              EXTERNAL SERVICES                        │  │
│  │  ┌────────────────┐      ┌───────────────────────┐  │  │
│  │  │  Claude API    │      │    Whisper API        │  │  │
│  │  │  (Anthropic)   │      │    (OpenAI)           │  │  │
│  │  └────────────────┘      └───────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. Desktop App (Electron)

#### Main Process
- **Responsabilidades**:
  - Gestión del ciclo de vida de la aplicación
  - Captura de audio nativo del sistema
  - Comunicación IPC con renderer process
  - Gestión de ventanas

- **Tecnologías**: Electron, Node.js, TypeScript

#### Renderer Process (Frontend)
- **Responsabilidades**:
  - UI/UX de la aplicación
  - Gestión de estado local
  - Comunicación con backend
  - Visualización de datos en tiempo real

- **Tecnologías**: React, Vite, Zustand, React Query

### 2. Backend API (Node.js)

#### API Layer
- **Express Routes**: Endpoints RESTful
- **WebSocket Server**: Comunicación bidireccional en tiempo real
- **Middleware**: Auth, CORS, Rate limiting, Error handling

#### Service Layer
- **MeetingService**: Lógica de negocio de reuniones
- **TranscriptionService**: Procesamiento de audio y transcripción
- **AIService**: Integración con Claude para análisis
- **DocumentationService**: Búsqueda de docs relevantes

#### Data Layer
- **Models**: Definiciones de esquemas
- **Database Client**: Pool de conexiones PostgreSQL
- **Migrations**: Versionado de schema

### 3. Base de Datos (PostgreSQL)

#### Tablas Principales
- `meetings`: Información de reuniones
- `transcriptions`: Segmentos transcritos
- `notes`: Notas generadas por IA
- `action_items`: Acciones identificadas
- `participants`: Participantes de reuniones

Ver detalles completos en [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)

## Flujos de Datos

### Flujo 1: Iniciar Reunión

```
User Action (Frontend)
  ↓
Create Meeting Request
  ↓
Backend API (POST /api/v1/meetings)
  ↓
MeetingService.create()
  ↓
PostgreSQL INSERT
  ↓
Return Meeting ID
  ↓
Frontend: Navigate to Meeting View
  ↓
Electron: Start Audio Capture
```

### Flujo 2: Captura y Transcripción en Tiempo Real

```
Electron Main Process
  ↓
Capture Audio Chunk (every 1-2s)
  ↓
Send via WebSocket to Backend
  ↓
TranscriptionService receives audio
  ↓
Call Whisper API
  ↓
Receive transcription text
  ↓
Save to PostgreSQL (transcriptions table)
  ↓
Emit WebSocket event with transcript
  ↓
Frontend receives and displays
```

### Flujo 3: Análisis con IA

```
Transcription Event
  ↓
AIService.analyzeContext()
  ↓
Build context from recent transcriptions
  ↓
Call Claude API with prompt
  ↓
Claude returns:
  - Identified topics
  - Key decisions
  - Action items
  - Documentation suggestions
  ↓
Save to PostgreSQL (notes, action_items)
  ↓
Emit WebSocket event
  ↓
Frontend displays in real-time
```

### Flujo 4: Búsqueda de Documentación

```
AIService detects tech mention (e.g., "React hooks")
  ↓
DocumentationService.search()
  ↓
Query documentation sources:
  - DevDocs API
  - MDN
  - Official docs
  ↓
Return relevant links
  ↓
Save to meeting context
  ↓
Display in Documentation Panel
```

## Patrones de Arquitectura

### 1. Layered Architecture
- **Presentation Layer**: React components
- **API Layer**: Express routes
- **Business Logic Layer**: Services
- **Data Access Layer**: Models y database client

### 2. Repository Pattern
- Abstracción de acceso a datos
- Facilita testing con mocks
- Permite cambiar DB en el futuro

### 3. Service Pattern
- Lógica de negocio encapsulada
- Reutilizable entre controladores
- Testeable de forma aislada

### 4. IPC Pattern (Electron)
- Comunicación segura main ↔ renderer
- Context isolation habilitado
- Preload script como bridge

## Consideraciones de Seguridad

### 1. API Security
- Helmet.js para headers HTTP seguros
- CORS configurado con whitelist
- Rate limiting para prevenir abuse
- Input validation con Zod

### 2. Electron Security
- `nodeIntegration: false`
- `contextIsolation: true`
- Preload script con whitelist de APIs
- Content Security Policy

### 3. Datos Sensibles
- API keys en variables de entorno
- JWT para autenticación (futura)
- Encriptación de datos sensibles en DB

### 4. Audio/Transcripciones
- Almacenamiento seguro
- Opción de borrado permanente
- No compartir con terceros sin consentimiento

## Escalabilidad

### Fase Actual (MVP)
- Monolito backend
- Base de datos única
- Single user (local)

### Futuro (Multi-usuario)
- Separación de servicios:
  - Authentication Service
  - Transcription Service (workers)
  - AI Service (queue-based)
- Redis para caching
- Message queue (RabbitMQ/Bull)
- Multi-tenancy en PostgreSQL

## Monitoreo y Logging

### Logging
- Winston para structured logging
- Levels: error, warn, info, debug
- Logs rotados por día
- Centralización futura (ELK Stack)

### Métricas
- Request/response times
- WebSocket connections activas
- API externa usage (Claude, Whisper)
- Database query performance

### Error Tracking
- Try/catch comprehensivo
- Error boundaries en React
- Sentry integration (futuro)

## Testing Strategy

### Unit Tests
- Services: Lógica de negocio aislada
- Models: Validaciones y transformaciones
- Utils: Funciones puras

### Integration Tests
- API endpoints
- Database operations
- External API integrations

### E2E Tests
- Flujos completos de usuario
- Electron + frontend + backend
- Playwright/Cypress

## Tecnologías y Librerías

### Backend
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express",
  "database": "PostgreSQL",
  "orm": "pg (native driver)",
  "websocket": "ws",
  "validation": "Zod",
  "logging": "Winston",
  "testing": "Jest"
}
```

### Desktop
```json
{
  "framework": "Electron 28+",
  "ipc": "Electron IPC",
  "audio": "Native APIs",
  "packaging": "electron-builder"
}
```

### Frontend
```json
{
  "framework": "React 18",
  "build": "Vite",
  "state": "Zustand",
  "http": "Axios",
  "queries": "@tanstack/react-query",
  "router": "React Router",
  "styling": "CSS Modules / Tailwind (TBD)",
  "testing": "Vitest + Testing Library"
}
```

## Próximos Pasos Arquitectónicos

1. Definir schema completo de base de datos
2. Implementar autenticación y autorización
3. Optimizar WebSocket para latencia baja
4. Implementar retry logic para APIs externas
5. Configurar CI/CD pipeline
6. Implementar caching estratégico
7. Definir estrategia de backup

---

**Última actualización**: 2025-10-02
**Versión**: 0.1.0
