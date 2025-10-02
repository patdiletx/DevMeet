# Database Schema - DevMeet AI

## Visión General

PostgreSQL será la base de datos principal para DevMeet AI, almacenando reuniones, transcripciones, notas generadas por IA, y metadata relacionada.

## Diagrama ER

```
┌─────────────────┐
│    meetings     │
├─────────────────┤
│ id (PK)         │───┐
│ title           │   │
│ started_at      │   │
│ ended_at        │   │
│ status          │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
         ┌────────────┴───────────┬──────────────┐
         │                        │              │
         │                        │              │
┌────────▼─────────┐   ┌──────────▼────────┐   │
│ transcriptions   │   │      notes        │   │
├──────────────────┤   ├───────────────────┤   │
│ id (PK)          │   │ id (PK)           │   │
│ meeting_id (FK)  │   │ meeting_id (FK)   │   │
│ content          │   │ content           │   │
│ speaker          │   │ type              │   │
│ timestamp        │   │ generated_at      │   │
│ confidence       │   │ created_at        │   │
│ created_at       │   └───────────────────┘   │
└──────────────────┘                           │
                                               │
                      ┌────────────────────────┤
                      │                        │
             ┌────────▼─────────┐   ┌──────────▼────────┐
             │  action_items    │   │   participants    │
             ├──────────────────┤   ├───────────────────┤
             │ id (PK)          │   │ id (PK)           │
             │ meeting_id (FK)  │   │ meeting_id (FK)   │
             │ description      │   │ name              │
             │ assigned_to      │   │ role              │
             │ priority         │   │ joined_at         │
             │ status           │   │ left_at           │
             │ due_date         │   │ created_at        │
             │ created_at       │   └───────────────────┘
             │ updated_at       │
             └──────────────────┘

┌──────────────────┐
│ documentation_   │
│    references    │
├──────────────────┤
│ id (PK)          │
│ meeting_id (FK)  │
│ technology       │
│ url              │
│ title            │
│ relevance_score  │
│ created_at       │
└──────────────────┘
```

## Tablas

### 1. meetings

Almacena información principal de cada reunión.

```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- 'active', 'ended', 'processing', 'completed'
  audio_file_path VARCHAR(500),
  metadata JSONB,
    -- Datos adicionales flexibles (tags, settings, etc.)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_started_at ON meetings(started_at DESC);
CREATE INDEX idx_meetings_metadata ON meetings USING GIN(metadata);
```

**Campos clave**:
- `id`: Identificador único
- `title`: Nombre de la reunión
- `status`: Estado actual (active, ended, processing, completed)
- `started_at`: Timestamp de inicio
- `ended_at`: Timestamp de finalización (NULL si está activa)
- `metadata`: JSONB para datos flexibles (tags, participantes externos, etc.)

### 2. transcriptions

Segmentos transcritos del audio de la reunión.

```sql
CREATE TABLE transcriptions (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker VARCHAR(100),
    -- Identificación del hablante (si disponible)
  timestamp TIMESTAMP NOT NULL,
    -- Momento en que se dijo (relativo al audio)
  confidence DECIMAL(5,4),
    -- Confianza de Whisper (0.0000 - 1.0000)
  language VARCHAR(10),
    -- Idioma detectado (es, en, etc.)
  duration_seconds DECIMAL(6,2),
    -- Duración del segmento de audio
  audio_offset_ms INTEGER,
    -- Offset en ms desde el inicio de la reunión
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcriptions_meeting ON transcriptions(meeting_id);
CREATE INDEX idx_transcriptions_timestamp ON transcriptions(timestamp);
CREATE INDEX idx_transcriptions_content_fts ON transcriptions
  USING GIN(to_tsvector('spanish', content));
  -- Full-text search index
```

**Campos clave**:
- `content`: Texto transcrito
- `speaker`: Quién habló (si se puede identificar)
- `timestamp`: Momento de la transcripción
- `confidence`: Score de confianza de Whisper
- `audio_offset_ms`: Posición en el audio para sincronización

### 3. notes

Notas generadas automáticamente por Claude.

```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
    -- 'summary', 'key_point', 'decision', 'question', 'insight'
  section VARCHAR(100),
    -- Categoría/sección (opcional)
  referenced_transcription_ids INTEGER[],
    -- IDs de transcriptions que originaron esta nota
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50),
    -- Versión de Claude usada
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_meeting ON notes(meeting_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_generated_at ON notes(generated_at DESC);
```

**Campos clave**:
- `type`: Tipo de nota (summary, key_point, decision, etc.)
- `content`: Contenido de la nota
- `referenced_transcription_ids`: Array de IDs de transcriptions relacionadas
- `model_version`: Versión de Claude para trazabilidad

### 4. action_items

Items de acción identificados por la IA.

```sql
CREATE TABLE action_items (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to VARCHAR(255),
    -- A quién se asignó (nombre o email)
  priority VARCHAR(20) DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date DATE,
  completed_at TIMESTAMP,
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_priority ON action_items(priority);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);
```

**Campos clave**:
- `description`: Qué hay que hacer
- `assigned_to`: Responsable
- `priority`: Prioridad del item
- `status`: Estado actual
- `due_date`: Fecha límite (si se mencionó)

### 5. participants

Participantes de las reuniones.

```sql
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
    -- Rol en la reunión (organizer, presenter, attendee, etc.)
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  speaking_time_seconds INTEGER DEFAULT 0,
    -- Tiempo total hablado (si se puede detectar)
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_participants_email ON participants(email);
```

**Campos clave**:
- `name`: Nombre del participante
- `role`: Rol en la reunión
- `speaking_time_seconds`: Cuánto tiempo habló (si se detecta)

### 6. documentation_references

Referencias a documentación encontrada durante la reunión.

```sql
CREATE TABLE documentation_references (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  technology VARCHAR(100) NOT NULL,
    -- Tecnología mencionada (React, PostgreSQL, etc.)
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  relevance_score DECIMAL(3,2),
    -- Score de relevancia (0.00 - 1.00)
  mentioned_at TIMESTAMP,
    -- Cuándo se mencionó en la reunión
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_refs_meeting ON documentation_references(meeting_id);
CREATE INDEX idx_doc_refs_technology ON documentation_references(technology);
CREATE INDEX idx_doc_refs_relevance ON documentation_references(relevance_score DESC);
```

**Campos clave**:
- `technology`: Qué tecnología se mencionó
- `url`: Link a la documentación
- `relevance_score`: Qué tan relevante es
- `mentioned_at`: Cuándo se mencionó en la reunión

## Migrations

### Migration 001: Initial Schema

```sql
-- 001_initial_schema.sql

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create meetings table
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  audio_file_path VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_started_at ON meetings(started_at DESC);
CREATE INDEX idx_meetings_metadata ON meetings USING GIN(metadata);

-- Create transcriptions table
CREATE TABLE transcriptions (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker VARCHAR(100),
  timestamp TIMESTAMP NOT NULL,
  confidence DECIMAL(5,4),
  language VARCHAR(10),
  duration_seconds DECIMAL(6,2),
  audio_offset_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcriptions_meeting ON transcriptions(meeting_id);
CREATE INDEX idx_transcriptions_timestamp ON transcriptions(timestamp);
CREATE INDEX idx_transcriptions_content_fts ON transcriptions
  USING GIN(to_tsvector('spanish', content));

-- Create notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  section VARCHAR(100),
  referenced_transcription_ids INTEGER[],
  generated_at TIMESTAMP NOT NULL,
  model_version VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_meeting ON notes(meeting_id);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_generated_at ON notes(generated_at DESC);

-- Create action_items table
CREATE TABLE action_items (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP,
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_priority ON action_items(priority);
CREATE INDEX idx_action_items_due_date ON action_items(due_date);

-- Create participants table
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  speaking_time_seconds INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_participants_email ON participants(email);

-- Create documentation_references table
CREATE TABLE documentation_references (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  technology VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  relevance_score DECIMAL(3,2),
  mentioned_at TIMESTAMP,
  referenced_transcription_ids INTEGER[],
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_refs_meeting ON documentation_references(meeting_id);
CREATE INDEX idx_doc_refs_technology ON documentation_references(technology);
CREATE INDEX idx_doc_refs_relevance ON documentation_references(relevance_score DESC);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

## Queries Comunes

### Obtener reunión con todas sus relaciones

```sql
SELECT
  m.*,
  json_agg(DISTINCT t.*) AS transcriptions,
  json_agg(DISTINCT n.*) AS notes,
  json_agg(DISTINCT a.*) AS action_items,
  json_agg(DISTINCT p.*) AS participants
FROM meetings m
LEFT JOIN transcriptions t ON m.id = t.meeting_id
LEFT JOIN notes n ON m.id = n.meeting_id
LEFT JOIN action_items a ON m.id = a.meeting_id
LEFT JOIN participants p ON m.id = p.meeting_id
WHERE m.id = $1
GROUP BY m.id;
```

### Búsqueda full-text en transcripciones

```sql
SELECT
  t.*,
  m.title AS meeting_title,
  ts_rank(to_tsvector('spanish', t.content), query) AS rank
FROM transcriptions t
JOIN meetings m ON t.meeting_id = m.id,
  plainto_tsquery('spanish', $1) query
WHERE to_tsvector('spanish', t.content) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Action items pendientes por prioridad

```sql
SELECT
  a.*,
  m.title AS meeting_title,
  m.started_at AS meeting_date
FROM action_items a
JOIN meetings m ON a.meeting_id = m.id
WHERE a.status = 'pending'
ORDER BY
  CASE a.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  a.due_date ASC NULLS LAST;
```

### Reuniones recientes con estadísticas

```sql
SELECT
  m.*,
  COUNT(DISTINCT t.id) AS transcription_count,
  COUNT(DISTINCT n.id) AS notes_count,
  COUNT(DISTINCT a.id) AS action_items_count,
  COUNT(DISTINCT p.id) AS participants_count
FROM meetings m
LEFT JOIN transcriptions t ON m.id = t.meeting_id
LEFT JOIN notes n ON m.id = n.meeting_id
LEFT JOIN action_items a ON m.id = a.meeting_id
LEFT JOIN participants p ON m.id = p.meeting_id
WHERE m.started_at >= NOW() - INTERVAL '30 days'
GROUP BY m.id
ORDER BY m.started_at DESC;
```

## Consideraciones de Performance

### Índices
- Índices en foreign keys para JOINs rápidos
- GIN index en JSONB para queries en metadata
- Full-text search index en transcriptions.content
- Índices compuestos si se detectan slow queries

### Particionamiento (Futuro)
- Particionar `transcriptions` por meeting_id o timestamp
- Particionar `meetings` por año si el volumen crece

### Archivado
- Mover meetings antiguos (>1 año) a tabla de archivo
- Mantener solo meetings activos y recientes en tabla principal

### Caching
- Redis para meetings frecuentemente accedidos
- Cache de aggregations (stats, counts)

## Backup y Recuperación

### Estrategia de Backup
- Backup completo diario (pg_dump)
- WAL archiving para point-in-time recovery
- Backups almacenados en S3 o storage local seguro

### Retención
- Backups diarios: 7 días
- Backups semanales: 4 semanas
- Backups mensuales: 12 meses

## Próximos Pasos

1. Crear script de migration inicial
2. Seed data para development
3. Implementar models en backend
4. Crear funciones helper para queries comunes
5. Setup de pg_dump automatizado
6. Monitoreo de performance de queries

---

**Última actualización**: 2025-10-02
**Versión**: 0.1.0
