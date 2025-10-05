# DevMeet - Documentación de Funcionalidades

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Gestión de Proyectos](#gestión-de-proyectos)
- [Gestión de Meetings](#gestión-de-meetings)
- [Sistema de Grabación y Transcripción](#sistema-de-grabación-y-transcripción)
- [Análisis con IA](#análisis-con-ia)
- [Sistema de Chat con IA](#sistema-de-chat-con-ia)
- [Documentación de Proyectos](#documentación-de-proyectos)
- [Notas de Usuario](#notas-de-usuario)
- [Arquitectura Técnica](#arquitectura-técnica)

---

## Visión General

**DevMeet** es una aplicación de escritorio para capturar, transcribir y analizar reuniones técnicas en tiempo real, potenciada por IA. La aplicación permite organizar reuniones por proyectos, grabar audio del sistema o micrófono, transcribir automáticamente el contenido, y obtener análisis inteligentes y respuestas a preguntas específicas.

### Tecnologías Principales

- **Frontend**: React + TypeScript + Electron
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL
- **IA**: Anthropic Claude (Claude 3.5 Sonnet)
- **Transcripción**: OpenAI Whisper
- **Audio**: Web Audio API

---

## Gestión de Proyectos

### 1. Crear Proyectos

**Ubicación**: Vista de Settings > Proyectos

**Características**:
- Asignar nombre y descripción al proyecto
- Seleccionar color identificativo
- Tracking automático de cantidad de meetings

**Endpoints API**:
```
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

### 2. Vista de Detalles del Proyecto

**Ubicación**: Click en cualquier proyecto desde Settings

**Información Mostrada**:
- Lista de todos los meetings asociados
- Documentación del proyecto
- Chat global del proyecto
- Estadísticas (cantidad de meetings)

---

## Gestión de Meetings

### 1. Crear Meeting

**Ubicación**: Dashboard principal

**Opciones**:
- Título del meeting (requerido)
- Asociación opcional a un proyecto
- Selector de proyecto desde dropdown

**Flujo**:
1. Seleccionar proyecto (opcional)
2. Ingresar título del meeting
3. Click en "Start Meeting"

### 2. Asociar/Cambiar Proyecto del Meeting

**Ubicación**: Header del meeting activo

**Características**:
- Selector compacto de proyectos
- Cambio en tiempo real
- Actualización inmediata en base de datos

**Endpoint API**:
```
PATCH /api/v1/meetings/:id
```

### 3. Estados del Meeting

- **active**: Meeting en curso
- **ended**: Meeting finalizado

### 4. Finalizar Meeting

**Ubicación**: Botón "End Meeting" en header

**Proceso**:
- Confirmación del usuario
- Detiene grabación si está activa
- Marca meeting como "ended"
- Guarda timestamp de finalización

**Endpoints API**:
```
POST   /api/v1/meetings
GET    /api/v1/meetings
GET    /api/v1/meetings/:id
PATCH  /api/v1/meetings/:id
```

---

## Sistema de Grabación y Transcripción

### 1. Tipos de Audio Soportados

#### Micrófono
- Captura audio desde micrófono del sistema
- Ideal para reuniones presenciales
- Control de volumen y calidad

#### Audio del Sistema
- Captura audio de aplicaciones (ej: Zoom, Teams, Meet)
- Graba el sonido que se reproduce en el sistema
- Útil para meetings virtuales

### 2. Proceso de Grabación

**Ubicación**: Tab "Controles" en vista de meeting

**Flujo**:
1. Seleccionar tipo de audio (Micrófono/Sistema)
2. Click en "Iniciar Grabación"
3. Audio se captura en chunks de 10 segundos
4. Chunks se envían automáticamente para transcripción

**Configuración Técnica**:
- Formato: WAV/WebM
- Tamaño de chunks: 10 segundos
- Tasa de muestreo: Configurable
- Canales: Mono/Stereo

### 3. Transcripción Automática

**Servicio**: OpenAI Whisper API

**Proceso**:
1. Audio chunk enviado al backend
2. Backend procesa con Whisper
3. Detección automática de idioma
4. Identificación de speaker (Speaker 1, Speaker 2, etc.)
5. Timestamp de cada transcripción
6. Almacenamiento en base de datos
7. Actualización en tiempo real en UI

**Características**:
- Detección automática de idioma
- Identificación de speakers
- Timestamps precisos
- Actualización en tiempo real vía WebSocket

**Endpoints API**:
```
POST /api/v1/transcriptions
GET  /api/v1/transcriptions/meeting/:meetingId
```

### 4. Vista de Transcripciones

**Ubicación**: Tab "Transcripción" en vista de meeting

**Características**:
- Lista en tiempo real de transcripciones
- Identificación de speaker
- Timestamps
- Idioma detectado
- Auto-scroll al final
- Indicador visual de idioma

---

## Análisis con IA

### 1. Análisis Automático de Meeting

**Ubicación**: Tab "Análisis" en vista de meeting

**Proceso**:
1. Click en "Analizar Reunión"
2. IA procesa todas las transcripciones
3. Incluye documentación del proyecto (si existe)
4. Incluye notas del usuario (si existen)
5. Genera análisis completo

**Componentes del Análisis**:

#### a) Resumen
- Síntesis ejecutiva de la reunión
- Temas principales discutidos
- Contexto general

#### b) Puntos Clave
- Aspectos más importantes mencionados
- Lista de bullet points
- Información destacada

#### c) Tareas Pendientes (Action Items)
- Tareas identificadas automáticamente
- Checkbox interactivos
- Asignación implícita de responsabilidades

#### d) Decisiones Tomadas
- Decisiones explícitas durante la reunión
- Acuerdos alcanzados
- Compromisos establecidos

#### e) Temas Discutidos
- Tags de temas principales
- Categorización automática
- Navegación visual

#### f) Participantes
- Lista de speakers identificados
- Avatares generados automáticamente

#### g) Sentimiento/Tono
- Análisis del tono general
- Clasificación: Positivo / Neutral / Negativo
- Indicador visual con emoji

### 2. Caché de Análisis

**Características**:
- Análisis se guarda automáticamente
- Recarga instantánea al volver al meeting
- Opción de "Actualizar" para re-analizar
- Flag `forceRefresh` para forzar nuevo análisis

**Endpoint API**:
```
POST /api/v1/ai/analyze/:meetingId
GET  /api/v1/ai/analysis/:meetingId
```

### 3. Análisis Multi-idioma

**Características**:
- Detección automática del idioma de las transcripciones
- Respuestas en el mismo idioma de la reunión
- Soporte para: Español, Inglés, Portugués, Francés, Alemán, Italiano

**Proceso**:
1. Extrae idioma de transcripciones (`language` field)
2. Genera instrucción en el idioma detectado
3. Claude responde en el mismo idioma

---

## Sistema de Chat con IA

### 1. Chat de Meeting Individual

**Ubicación**: Tab "Chat IA" en vista de meeting

**Contexto Disponible**:
- Todas las transcripciones del meeting
- Documentación del proyecto asociado
- Notas del usuario del meeting
- Historial de conversación

**Características**:
- Historial persistente en base de datos
- Carga automática al abrir el meeting
- Respuestas contextualizadas
- Indicadores de carga (typing animation)
- Auto-scroll al final
- Timestamps de mensajes

**Ejemplos de Preguntas**:
- "¿Cuáles fueron los temas principales?"
- "¿Qué decisiones se tomaron?"
- "Resume las tareas pendientes"
- "¿Quién habló sobre X tema?"

**Endpoint API**:
```
POST /api/v1/ai/chat/:meetingId
GET  /api/v1/ai/chat/:meetingId/messages
```

### 2. Chat Global del Proyecto

**Ubicación**: Vista de detalles del proyecto (scroll down)

**Contexto Disponible**:
- **TODOS** los meetings del proyecto
- **TODAS** las transcripciones de todos los meetings
- **TODA** la documentación del proyecto
- Historial de conversación del proyecto

**Características Únicas**:
- Análisis cross-meeting
- Estadísticas mostradas (meetings analizados, transcripciones procesadas)
- Contexto agrupado por meeting
- Identificación de meetings en el contexto

**Ejemplos de Preguntas**:
- "¿Cuáles son los temas principales en todos los meetings?"
- "¿Qué decisiones importantes se han tomado en el proyecto?"
- "Resume el progreso del proyecto"
- "¿Qué tareas pendientes tenemos acumuladas?"
- "¿Qué patrones encuentras en las reuniones?"

**Endpoint API**:
```
POST /api/v1/ai/project/:projectId/chat
GET  /api/v1/ai/project/:projectId/chat/messages
```

**Proceso Interno**:
1. Obtiene todos los meetings del proyecto
2. Obtiene todas las transcripciones de cada meeting
3. Obtiene documentación del proyecto
4. Construye contexto completo agrupado por meeting
5. Envía pregunta con todo el contexto a Claude
6. Retorna respuesta + estadísticas

### 3. Gestión de Documentos de Contexto (Deprecated - Ver Documentación de Proyectos)

Nota: Esta funcionalidad fue reemplazada por el sistema de Documentación de Proyectos.

---

## Documentación de Proyectos

### 1. Agregar Documentación

**Ubicación**: Vista de detalles del proyecto > Sección "Documentación"

**Métodos de Ingreso**:

#### a) Escritura Manual
- Campo de título
- Textarea para contenido
- Botón "Guardar Documento"

#### b) Carga de Archivo
- Selector de archivo
- Tipos soportados: `.txt`, `.md`, `.json`, `.csv`, `.log`
- Auto-fill del título (nombre del archivo)
- Auto-fill del contenido (lectura automática)

### 2. Gestión de Documentos

**Características**:
- Lista de documentos con título
- Preview del contenido
- Fecha de creación
- Botón de eliminar

**Funcionalidad**:
- Visualización completa del contenido
- Metadata (tipo de archivo, tamaño)
- Búsqueda full-text (backend)

### 3. Integración con IA

**Uso Automático**:
- Análisis de meetings incluye documentación del proyecto
- Chat de meeting incluye documentación del proyecto
- Chat global del proyecto incluye documentación del proyecto

**Formato en Contexto**:
```
=== Project Documentation ===

=== Título del Documento ===
Contenido del documento...

=== Otro Documento ===
Contenido del otro documento...
```

**Endpoints API**:
```
POST   /api/v1/projects/:projectId/documents
GET    /api/v1/projects/:projectId/documents
GET    /api/v1/projects/:projectId/documents/:docId
DELETE /api/v1/projects/:projectId/documents/:docId
```

---

## Notas de Usuario

### 1. Apuntes del Meeting

**Ubicación**: Tab "Apuntes" en vista de meeting

**Características**:
- Textarea grande para escritura libre
- Auto-guardado con debounce (2 segundos)
- Contador de caracteres
- Botón de limpiar
- Persistencia automática

**Uso**:
- Agregar contexto adicional
- Notas personales
- Referencias a documentos
- Objetivos del meeting
- Preguntas pendientes

### 2. Integración con IA

**Análisis de Meeting**:
- Las notas se incluyen en el análisis si existen
- Formato: `=== Apuntes del Usuario === \n {notas}`

**Chat de Meeting**:
- Las notas se incluyen automáticamente en el contexto
- Indicador visual "📌 Apuntes incluidos"

**Endpoint API**:
```
GET  /api/v1/ai/notes/:meetingId
POST /api/v1/ai/notes/:meetingId
```

---

## Arquitectura Técnica

### Base de Datos (PostgreSQL)

#### Tablas Principales

**projects**
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- color (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**meetings**
```sql
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- description (TEXT)
- project_id (INTEGER, FK to projects)
- status (VARCHAR: 'active', 'ended')
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
- audio_file_path (VARCHAR)
- metadata (JSONB)
```

**transcriptions**
```sql
- id (SERIAL PRIMARY KEY)
- meeting_id (INTEGER, FK to meetings)
- content (TEXT)
- speaker (VARCHAR)
- timestamp (VARCHAR)
- language (VARCHAR)
- confidence (FLOAT)
- created_at (TIMESTAMP)
```

**meeting_analysis**
```sql
- id (SERIAL PRIMARY KEY)
- meeting_id (INTEGER, UNIQUE, FK to meetings)
- summary (TEXT)
- key_points (JSONB array)
- action_items (JSONB array)
- decisions (JSONB array)
- topics (JSONB array)
- participants (JSONB array)
- sentiment (VARCHAR)
- user_notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**chat_messages**
```sql
- id (SERIAL PRIMARY KEY)
- meeting_id (INTEGER, FK to meetings)
- role (VARCHAR: 'user', 'assistant')
- content (TEXT)
- context (TEXT)
- created_at (TIMESTAMP)
```

**user_notes**
```sql
- id (SERIAL PRIMARY KEY)
- meeting_id (INTEGER, UNIQUE, FK to meetings)
- content (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**project_documents**
```sql
- id (SERIAL PRIMARY KEY)
- project_id (INTEGER, FK to projects)
- title (VARCHAR)
- content (TEXT)
- file_type (VARCHAR)
- file_size (INTEGER)
- file_url (VARCHAR)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**project_chat_messages**
```sql
- id (SERIAL PRIMARY KEY)
- project_id (INTEGER, FK to projects)
- role (VARCHAR: 'user', 'assistant')
- content (TEXT)
- context (TEXT)
- created_at (TIMESTAMP)
```

### APIs Principales

#### Projects API
```
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
GET    /api/v1/projects/:id/with-meetings
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
```

#### Meetings API
```
GET    /api/v1/meetings
POST   /api/v1/meetings
GET    /api/v1/meetings/:id
PATCH  /api/v1/meetings/:id
DELETE /api/v1/meetings/:id
```

#### Transcriptions API
```
POST /api/v1/transcriptions
GET  /api/v1/transcriptions/meeting/:meetingId
GET  /api/v1/transcriptions/:id
```

#### AI API
```
POST /api/v1/ai/analyze/:meetingId
GET  /api/v1/ai/analysis/:meetingId
POST /api/v1/ai/chat/:meetingId
GET  /api/v1/ai/chat/:meetingId/messages
GET  /api/v1/ai/notes/:meetingId
POST /api/v1/ai/notes/:meetingId
POST /api/v1/ai/project/:projectId/chat
GET  /api/v1/ai/project/:projectId/chat/messages
```

#### Project Documents API
```
POST   /api/v1/projects/:projectId/documents
GET    /api/v1/projects/:projectId/documents
GET    /api/v1/projects/:projectId/documents/:docId
DELETE /api/v1/projects/:projectId/documents/:docId
```

### Servicios de IA

#### aiService.ts

**Métodos**:
- `analyzeMeeting(transcript, language?)`: Análisis completo del meeting
- `detectActionItems(transcript, language?)`: Extracción de tareas
- `detectTopics(transcript, language?)`: Identificación de temas
- `analyzeSentiment(transcript, language?)`: Análisis de sentimiento
- `askQuestion(question, context, language?)`: Responder preguntas

#### claude.ts

**Configuración**:
- Cliente Anthropic SDK
- Modelo: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- Max tokens: 4096
- Temperature: 0.3

**Prompts**:
- System prompt para análisis de meetings
- System prompt para chat conversacional
- Instrucciones multi-idioma

### Frontend - Configuración Centralizada

**api.ts**
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  WS_URL: 'ws://localhost:3001',
};

export const API_ENDPOINTS = {
  // Meetings
  MEETINGS: `${BASE_URL}/api/v1/meetings`,
  MEETING_BY_ID: (id) => `${BASE_URL}/api/v1/meetings/${id}`,

  // Projects
  PROJECTS: `${BASE_URL}/api/v1/projects`,
  PROJECT_BY_ID: (id) => `${BASE_URL}/api/v1/projects/${id}`,

  // AI
  AI_ANALYZE: (meetingId) => `${BASE_URL}/api/v1/ai/analyze/${meetingId}`,
  AI_CHAT: (meetingId) => `${BASE_URL}/api/v1/ai/chat/${meetingId}`,
  PROJECT_CHAT: (projectId) => `${BASE_URL}/api/v1/ai/project/${projectId}/chat`,

  // ... etc
};
```

### WebSocket

**Eventos**:
- `transcription:new`: Nueva transcripción disponible
- `meeting:updated`: Meeting actualizado
- `error`: Errores en tiempo real

---

## Flujos de Usuario Completos

### Flujo 1: Meeting Básico

1. Abrir aplicación
2. Crear/seleccionar proyecto
3. Ingresar título de meeting
4. Start Meeting
5. Seleccionar tipo de audio
6. Iniciar grabación
7. Ver transcripciones en tiempo real
8. Detener grabación
9. Analizar reunión
10. Revisar análisis
11. Hacer preguntas en el chat
12. End Meeting

### Flujo 2: Proyecto con Documentación

1. Ir a Settings > Proyectos
2. Crear nuevo proyecto
3. Abrir detalles del proyecto
4. Agregar documentación (manual o archivo)
5. Crear meeting asociado al proyecto
6. Realizar meeting
7. Analizar (incluye documentación)
8. Chat con contexto de documentación
9. Usar chat global del proyecto

### Flujo 3: Análisis Cross-Meeting

1. Crear proyecto
2. Realizar múltiples meetings en el proyecto
3. Ir a detalles del proyecto
4. Usar chat global
5. Hacer preguntas que abarquen todos los meetings
6. Obtener insights del proyecto completo

---

## Configuración y Variables de Entorno

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/devmeet

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Server
PORT=3001
NODE_ENV=development

# WebSocket
WS_PORT=3001
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

---

## Roadmap de Funcionalidades Futuras

- [ ] Exportar análisis a PDF/Word
- [ ] Compartir meetings y análisis
- [ ] Colaboración multi-usuario
- [ ] Integración con calendarios
- [ ] Grabación de video
- [ ] Transcripción offline
- [ ] Soporte para más idiomas
- [ ] Dashboard de analytics
- [ ] Búsqueda global avanzada
- [ ] Tags y categorías personalizadas
- [ ] Notificaciones de tareas pendientes
- [ ] Integración con herramientas de gestión (Jira, Trello, etc.)

---

## Licencia y Contacto

**DevMeet** © 2025

Para soporte o consultas, contactar al equipo de desarrollo.
