# DevMeet AI - Backlog de Tareas

## Prioridad: CRÍTICA (MVP Blocker)

### Backend Core
- [ ] **DB-001**: Crear script de migration inicial (001_initial_schema.sql)
- [ ] **DB-002**: Implementar database client con pool de conexiones
- [ ] **DB-003**: Crear models para todas las tablas (meetings, transcriptions, notes, etc.)
- [ ] **API-001**: Implementar CRUD de meetings
  - POST /api/v1/meetings (crear)
  - GET /api/v1/meetings (listar)
  - GET /api/v1/meetings/:id (detalle)
  - PATCH /api/v1/meetings/:id (actualizar)
  - DELETE /api/v1/meetings/:id (eliminar)
- [ ] **API-002**: Implementar endpoints de transcriptions
  - GET /api/v1/meetings/:id/transcriptions
  - POST /api/v1/transcriptions (crear segmento)
- [ ] **WS-001**: Configurar WebSocket server básico
- [ ] **WS-002**: Implementar evento para recibir audio chunks
- [ ] **WS-003**: Implementar evento para emitir transcripciones
- [ ] **AI-001**: Integrar Whisper API para transcripción
- [ ] **AI-002**: Implementar retry logic y error handling para Whisper
- [ ] **AI-003**: Integrar Claude API para análisis básico
- [ ] **AI-004**: Implementar generación de notas con Claude

### Desktop App
- [ ] **DESK-001**: Configurar captura de audio nativo (Windows)
- [ ] **DESK-002**: Implementar IPC handlers para audio
- [ ] **DESK-003**: Implementar IPC handlers para meeting controls
- [ ] **DESK-004**: Configurar packaging con electron-builder
- [ ] **DESK-005**: Crear assets (iconos para Windows, Mac, Linux)

### Frontend
- [ ] **UI-001**: Crear componente Dashboard de reuniones
- [ ] **UI-002**: Crear página de Meeting activa
- [ ] **UI-003**: Crear componente TranscriptionPanel (live)
- [ ] **UI-004**: Crear componente NotesPanel
- [ ] **UI-005**: Crear componente ActionItemsList
- [ ] **UI-006**: Implementar React Query hooks para meetings
- [ ] **UI-007**: Implementar WebSocket client para real-time updates
- [ ] **UI-008**: Crear store de Zustand para meeting state
- [ ] **UI-009**: Implementar routing (Dashboard, MeetingView, History)
- [ ] **UI-010**: Diseño responsive básico

### Integración
- [ ] **INT-001**: Conectar frontend con backend API
- [ ] **INT-002**: Conectar desktop app con backend WebSocket
- [ ] **INT-003**: Testing del flujo completo: Start → Capture → Transcribe → Display
- [ ] **INT-004**: Testing del flujo de generación de notas

---

## Prioridad: ALTA (MVP Nice-to-Have)

### Backend Features
- [ ] **API-005**: Implementar endpoints de notes
- [ ] **API-006**: Implementar endpoints de action_items
- [ ] **API-007**: Implementar búsqueda full-text en transcripciones
- [ ] **API-008**: Implementar paginación en todos los listados
- [ ] **DOC-001**: Implementar DocumentationService (búsqueda de docs)
- [ ] **DOC-002**: Integrar con DevDocs API o similar
- [ ] **PERF-001**: Implementar rate limiting en API
- [ ] **PERF-002**: Agregar logging comprehensivo con Winston

### Desktop Features
- [ ] **DESK-006**: Implementar notificaciones de sistema
- [ ] **DESK-007**: Implementar tray icon con menú contextual
- [ ] **DESK-008**: Agregar keyboard shortcuts (start/stop meeting)
- [ ] **DESK-009**: Captura de audio en macOS
- [ ] **DESK-010**: Captura de audio en Linux

### Frontend Features
- [ ] **UI-011**: Agregar filtros y búsqueda en Dashboard
- [ ] **UI-012**: Implementar vista de historial detallada
- [ ] **UI-013**: Agregar export de notas (MD, PDF)
- [ ] **UI-014**: Implementar DocumentationPanel (links relevantes)
- [ ] **UI-015**: Agregar indicadores de estado (recording, processing)
- [ ] **UI-016**: Implementar dark mode
- [ ] **UI-017**: Agregar settings page (API keys, preferencias)

### IA Avanzado
- [ ] **AI-005**: Implementar detección de speakers (diarization)
- [ ] **AI-006**: Mejorar prompts de Claude para mejor análisis
- [ ] **AI-007**: Implementar identificación automática de action items
- [ ] **AI-008**: Implementar sugerencias de documentación en tiempo real
- [ ] **AI-009**: Crear sistema de memoria contextual (recordar meetings previas)

---

## Prioridad: MEDIA (Post-MVP)

### Testing
- [ ] **TEST-001**: Unit tests para services (backend)
- [ ] **TEST-002**: Unit tests para models (backend)
- [ ] **TEST-003**: Integration tests para API endpoints
- [ ] **TEST-004**: E2E tests con Playwright (flujo completo)
- [ ] **TEST-005**: Tests de componentes React (Testing Library)
- [ ] **TEST-006**: Mock de APIs externas para testing

### DevOps
- [ ] **DEVOPS-001**: Configurar CI/CD con GitHub Actions
- [ ] **DEVOPS-002**: Automatizar builds de Electron
- [ ] **DEVOPS-003**: Setup de linting automático en PR
- [ ] **DEVOPS-004**: Configurar auto-release con semantic-release
- [ ] **DEVOPS-005**: Implementar health checks en backend

### Documentación
- [ ] **DOCS-001**: Crear README principal con quick start
- [ ] **DOCS-002**: Documentar API con OpenAPI/Swagger
- [ ] **DOCS-003**: Crear guía de contribución
- [ ] **DOCS-004**: Documentar proceso de build y deploy
- [ ] **DOCS-005**: Crear user guide para la aplicación

### Mejoras de Performance
- [ ] **PERF-003**: Implementar caching con Redis
- [ ] **PERF-004**: Optimizar queries de PostgreSQL
- [ ] **PERF-005**: Implementar lazy loading en frontend
- [ ] **PERF-006**: Comprimir audio antes de enviar a backend
- [ ] **PERF-007**: Implementar streaming de audio (vs chunks grandes)

### Seguridad
- [ ] **SEC-001**: Implementar autenticación básica (local users)
- [ ] **SEC-002**: Encriptar API keys en configuración
- [ ] **SEC-003**: Implementar Content Security Policy en Electron
- [ ] **SEC-004**: Sanitizar inputs en API
- [ ] **SEC-005**: Audit de dependencias (npm audit)

---

## Prioridad: BAJA (Futuro)

### Features Avanzados
- [ ] **FEAT-001**: Soporte multi-usuario (cloud sync)
- [ ] **FEAT-002**: Compartir reuniones con otros usuarios
- [ ] **FEAT-003**: Colaboración en tiempo real en notas
- [ ] **FEAT-004**: Integraciones (Slack, Teams, Discord)
- [ ] **FEAT-005**: Calendario de reuniones
- [ ] **FEAT-006**: Recordatorios de action items
- [ ] **FEAT-007**: Analytics de reuniones (tiempo, frecuencia, etc.)
- [ ] **FEAT-008**: Templates de reuniones
- [ ] **FEAT-009**: Soporte para múltiples idiomas en UI
- [ ] **FEAT-010**: Transcripción en vivo de video (Zoom, Meet, etc.)

### Optimizaciones
- [ ] **OPT-001**: Migrar a PostgreSQL particionado
- [ ] **OPT-002**: Implementar CDN para assets
- [ ] **OPT-003**: Optimizar bundle size de frontend
- [ ] **OPT-004**: Implementar service workers (offline mode)
- [ ] **OPT-005**: Lazy loading de dependencias en Electron

### Infraestructura
- [ ] **INFRA-001**: Dockerizar backend
- [ ] **INFRA-002**: Kubernetes deployment configs
- [ ] **INFRA-003**: Terraform scripts para cloud infra
- [ ] **INFRA-004**: Monitoring con Prometheus/Grafana
- [ ] **INFRA-005**: Log aggregation con ELK Stack

---

## Notas de Implementación

### Dependencias entre Tareas

**Bloque 1: Base de Datos**
```
DB-001 → DB-002 → DB-003
```
Todo lo demás depende de que la DB esté configurada.

**Bloque 2: Backend API**
```
DB-003 → API-001 → API-002
              ↓
           WS-001 → WS-002 → WS-003
```

**Bloque 3: IA Services**
```
API-002 → AI-001 → AI-002
              ↓
           AI-003 → AI-004
```

**Bloque 4: Desktop**
```
DESK-001 → DESK-002 → DESK-003
```

**Bloque 5: Frontend**
```
UI-001 → UI-009 (routing)
UI-002 → UI-003 → UI-004 → UI-005
UI-006 → UI-007 → UI-008
```

**Bloque 6: Integración**
```
[Todos los bloques anteriores] → INT-001 → INT-002 → INT-003 → INT-004
```

### Estimaciones de Tiempo (Solo MVP - Prioridad CRÍTICA)

- **Backend Core**: ~40 horas
- **Desktop App**: ~20 horas
- **Frontend**: ~30 horas
- **Integración y Testing**: ~15 horas

**Total MVP**: ~105 horas (~3 semanas a tiempo completo, ~6-8 semanas part-time)

### Hitos del MVP

**Milestone 1: Base de Datos y API Básica** (Semana 1)
- DB-001, DB-002, DB-003
- API-001, API-002
- WS-001

**Milestone 2: Captura y Transcripción** (Semana 2)
- DESK-001, DESK-002
- WS-002, WS-003
- AI-001, AI-002

**Milestone 3: Frontend y IA Analysis** (Semana 3)
- UI-001 a UI-010
- AI-003, AI-004

**Milestone 4: Integración Final** (Semana 4)
- INT-001 a INT-004
- Bug fixes y pulido
- DESK-004 (packaging)

---

**Última actualización**: 2025-10-02
**Estado**: Fase 1 - Inicialización completada
