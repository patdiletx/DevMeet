# DevMeet AI - Project Context

## Vision
DevMeet AI es un asistente inteligente para desarrolladores que captura, transcribe y analiza reuniones técnicas en tiempo real, proporcionando notas automáticas, respuestas contextuales y búsqueda de documentación relevante.

## Problema que Resuelve
Los desarrolladores pierden tiempo valioso en reuniones técnicas:
- Tomando notas manualmente mientras intentan participar activamente
- Buscando documentación durante las discusiones
- Recordando detalles técnicos después de la reunión
- Repasando grabaciones completas para encontrar información específica

## Solución
Una aplicación de escritorio que:
1. **Captura audio** de reuniones en tiempo real
2. **Transcribe** automáticamente usando Whisper AI
3. **Analiza contexto** técnico con Claude AI
4. **Genera notas** estructuradas y accionables
5. **Busca documentación** relevante durante la conversación
6. **Responde preguntas** sobre el contenido de la reunión

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL
- **APIs IA**:
  - Claude API (Anthropic) - Análisis y generación
  - Whisper API (OpenAI) - Transcripción de audio
- **WebSocket**: ws (comunicación tiempo real)
- **Lenguaje**: TypeScript

### Desktop
- **Framework**: Electron
- **Captura de audio**: API nativa del sistema
- **Lenguaje**: TypeScript

### Frontend
- **Framework**: React 18
- **Build tool**: Vite
- **Estado**: Zustand
- **HTTP**: Axios + React Query
- **Routing**: React Router
- **UI**: Lucide Icons
- **Lenguaje**: TypeScript

## Arquitectura del Proyecto

```
DevMeet/
├── packages/
│   ├── backend/          # Servidor Node.js/Express
│   ├── desktop/          # App Electron
│   └── frontend/         # React SPA
├── docs/                 # Documentación técnica
├── tasks/                # Gestión de tareas
└── [archivos config]     # Configs del monorepo
```

## Funcionalidades Principales (MVP)

### 1. Gestión de Reuniones
- Crear/iniciar/finalizar reuniones
- Metadata: título, participantes, tags, fecha

### 2. Captura y Transcripción
- Captura de audio en tiempo real desde el escritorio
- Transcripción automática con Whisper
- Visualización de transcripción en vivo

### 3. Análisis con IA
- Detección de temas técnicos
- Generación automática de notas
- Identificación de action items
- Extracción de decisiones clave

### 4. Búsqueda de Documentación
- Detectar menciones de tecnologías/frameworks
- Buscar y mostrar documentación relevante
- Enlaces contextuales durante la reunión

### 5. Interfaz de Usuario
- Dashboard de reuniones
- Vista de reunión activa con transcripción
- Panel de notas generadas
- Historial de reuniones

## Flujo de Trabajo Principal

1. **Usuario inicia reunión** en la app de escritorio
2. **Electron captura audio** del sistema
3. **Audio se envía al backend** vía WebSocket
4. **Backend transcribe** con Whisper API
5. **Claude analiza** la transcripción en tiempo real
6. **Frontend muestra**:
   - Transcripción en vivo
   - Notas generadas
   - Documentación relevante
   - Sugerencias de IA
7. **Usuario finaliza reunión**
8. **Sistema genera** resumen final y lo almacena

## Casos de Uso Prioritarios

### UC1: Iniciar Reunión Rápida
- Abrir app → Botón "Nueva Reunión" → Comenzar captura
- Tiempo objetivo: < 5 segundos

### UC2: Ver Transcripción en Tiempo Real
- Durante reunión activa
- Latencia objetivo: < 2 segundos

### UC3: Consultar Notas Después
- Buscar reunión en historial
- Ver resumen, notas y transcripción completa

### UC4: Búsqueda de Documentación Automática
- Mencionar "React hooks" → Ver docs de React
- Sin intervención manual

## Métricas de Éxito (MVP)

- **Rendimiento**:
  - Latencia transcripción: < 2s
  - Tiempo carga app: < 3s
  - Generación notas: < 10s post-reunión

- **Funcionalidad**:
  - 95% precisión en transcripción (español/inglés)
  - 100% de reuniones guardadas correctamente
  - 0 pérdidas de datos durante captura

- **UX**:
  - Flujo completo sin interrupciones
  - UI responsive y clara
  - Fácil navegación por historial

## Fases de Desarrollo

### Fase 1: Setup e Infraestructura (ACTUAL)
- ✅ Configurar monorepo
- ⏳ Configurar base de datos
- ⏳ Setup APIs (Claude, Whisper)
- ⏳ Crear estructura base de cada package

### Fase 2: Backend Core
- Endpoints de reuniones (CRUD)
- WebSocket para audio/transcripción
- Integración con Whisper
- Integración con Claude
- Almacenamiento en PostgreSQL

### Fase 3: Desktop App
- Configurar Electron
- Captura de audio del sistema
- IPC con frontend
- Packaging y distribución

### Fase 4: Frontend UI
- Dashboard de reuniones
- Vista de reunión activa
- Componentes de transcripción
- Panel de notas
- Historial y búsqueda

### Fase 5: Integración IA
- Análisis de contexto en tiempo real
- Generación de notas
- Búsqueda de documentación
- Sistema de sugerencias

### Fase 6: Testing y Pulido
- Tests unitarios e integración
- Optimización de rendimiento
- Mejoras de UX
- Documentación final

## Decisiones Técnicas Clave

### ¿Por qué Monorepo?
- Compartir tipos TypeScript entre packages
- Desarrollo más ágil con cambios sincronizados
- Mejor para equipos pequeños/solopreneur

### ¿Por qué Electron?
- Acceso nativo a captura de audio
- Deploy multiplataforma (Windows, Mac, Linux)
- Integración directa con React

### ¿Por qué PostgreSQL?
- Relaciones complejas (reuniones, transcripciones, notas)
- Búsqueda full-text para historial
- Escalabilidad futura

### ¿Por qué Claude + Whisper?
- **Claude**: Mejor análisis de contexto técnico, generación de notas
- **Whisper**: Estado del arte en transcripción multiidioma

## Próximos Pasos Inmediatos

1. Configurar base de datos PostgreSQL
2. Crear schema inicial (ver `docs/DATABASE_SCHEMA.md`)
3. Implementar endpoints básicos de reuniones
4. Configurar WebSocket para comunicación real-time
5. Crear UI básica del dashboard

## Referencias

- [Documentación de Arquitectura](./docs/ARCHITECTURE.md)
- [Schema de Base de Datos](./docs/DATABASE_SCHEMA.md)
- [Backlog de Tareas](./tasks/BACKLOG.md)
- [Claude API Docs](https://docs.anthropic.com/)
- [Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [Electron Docs](https://www.electronjs.org/docs/latest)

---

**Última actualización**: 2025-10-02
**Estado del proyecto**: Inicialización - Fase 1
**Versión**: 0.1.0
