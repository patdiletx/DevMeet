# DevMeet AI - Ejemplos de API

Ejemplos prácticos de uso de la API REST de DevMeet.

---

## 🌐 Base URL

```
http://localhost:3000
```

---

## 🏥 Health Check

### Verificar Estado del Servidor

```bash
curl http://localhost:3000/health
```

**Respuesta**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T23:50:00.000Z",
  "uptime": 123.456
}
```

---

## 📅 Meetings API

### 1. Crear una Nueva Reunión

```bash
curl -X POST http://localhost:3000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Standup",
    "description": "Reunión diaria del equipo de desarrollo",
    "metadata": {
      "tags": ["standup", "daily"],
      "team": "engineering"
    }
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Daily Standup",
    "description": "Reunión diaria del equipo de desarrollo",
    "started_at": "2025-10-02T23:50:00.000Z",
    "ended_at": null,
    "status": "active",
    "audio_file_path": null,
    "metadata": {
      "tags": ["standup", "daily"],
      "team": "engineering"
    },
    "created_at": "2025-10-02T23:50:00.000Z",
    "updated_at": "2025-10-02T23:50:00.000Z"
  },
  "message": "Meeting created successfully"
}
```

### 2. Listar Todas las Reuniones

```bash
# Sin paginación
curl http://localhost:3000/api/v1/meetings

# Con paginación
curl "http://localhost:3000/api/v1/meetings?page=1&limit=10"

# Filtrar por estado
curl "http://localhost:3000/api/v1/meetings?status=active"
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Daily Standup",
      "status": "active",
      "started_at": "2025-10-02T23:50:00.000Z",
      "ended_at": null,
      "created_at": "2025-10-02T23:50:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. Obtener Reunión por ID

```bash
curl http://localhost:3000/api/v1/meetings/1
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Daily Standup",
    "description": "Reunión diaria del equipo de desarrollo",
    "started_at": "2025-10-02T23:50:00.000Z",
    "ended_at": null,
    "status": "active",
    "metadata": {
      "tags": ["standup", "daily"],
      "team": "engineering"
    },
    "created_at": "2025-10-02T23:50:00.000Z",
    "updated_at": "2025-10-02T23:50:00.000Z"
  }
}
```

### 4. Obtener Reunión con Todas las Relaciones

```bash
curl http://localhost:3000/api/v1/meetings/1/full
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Daily Standup",
    "transcriptions": [
      {
        "id": 1,
        "content": "Hola a todos, empecemos con el standup",
        "speaker": "Juan",
        "timestamp": "2025-10-02T23:51:00.000Z",
        "confidence": 0.95
      }
    ],
    "notes": [
      {
        "id": 1,
        "content": "El equipo reportó progreso en la feature X",
        "type": "key_point",
        "generated_at": "2025-10-02T23:52:00.000Z"
      }
    ],
    "action_items": [
      {
        "id": 1,
        "description": "Revisar el PR #123",
        "assigned_to": "María",
        "priority": "high",
        "status": "pending"
      }
    ],
    "participants": [
      {
        "id": 1,
        "name": "Juan Pérez",
        "role": "organizer"
      }
    ]
  }
}
```

### 5. Actualizar una Reunión

```bash
curl -X PATCH http://localhost:3000/api/v1/meetings/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Standup - Updated",
    "description": "Reunión actualizada"
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Daily Standup - Updated",
    "description": "Reunión actualizada",
    "updated_at": "2025-10-02T23:55:00.000Z"
  },
  "message": "Meeting updated successfully"
}
```

### 6. Finalizar una Reunión

```bash
curl -X POST http://localhost:3000/api/v1/meetings/1/end
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Daily Standup",
    "status": "ended",
    "started_at": "2025-10-02T23:50:00.000Z",
    "ended_at": "2025-10-02T23:55:00.000Z"
  },
  "message": "Meeting ended successfully"
}
```

### 7. Eliminar una Reunión

```bash
curl -X DELETE http://localhost:3000/api/v1/meetings/1
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

---

## 📝 Transcriptions API

### 1. Crear una Transcripción

```bash
curl -X POST http://localhost:3000/api/v1/transcriptions \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": 1,
    "content": "Hola a todos, empecemos con el standup de hoy",
    "speaker": "Juan Pérez",
    "timestamp": "2025-10-02T23:51:00.000Z",
    "confidence": 0.95,
    "language": "es",
    "duration_seconds": 3.5,
    "audio_offset_ms": 1000
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "meeting_id": 1,
    "content": "Hola a todos, empecemos con el standup de hoy",
    "speaker": "Juan Pérez",
    "timestamp": "2025-10-02T23:51:00.000Z",
    "confidence": 0.95,
    "language": "es",
    "duration_seconds": 3.5,
    "audio_offset_ms": 1000,
    "created_at": "2025-10-02T23:51:00.000Z"
  },
  "message": "Transcription created successfully"
}
```

### 2. Buscar en Transcripciones (Full-Text Search)

```bash
# Búsqueda simple
curl "http://localhost:3000/api/v1/transcriptions/search?q=standup"

# Búsqueda en una reunión específica
curl "http://localhost:3000/api/v1/transcriptions/search?q=standup&meeting_id=1"

# Limitar resultados
curl "http://localhost:3000/api/v1/transcriptions/search?q=standup&limit=5"
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "meeting_id": 1,
      "content": "Hola a todos, empecemos con el standup de hoy",
      "speaker": "Juan Pérez",
      "timestamp": "2025-10-02T23:51:00.000Z",
      "rank": 0.875
    }
  ]
}
```

### 3. Eliminar una Transcripción

```bash
curl -X DELETE http://localhost:3000/api/v1/transcriptions/1
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Transcription deleted successfully"
}
```

---

## 🔄 Flujo Completo de Uso

### Escenario: Crear y Gestionar una Reunión

```bash
# 1. Crear una nueva reunión
MEETING_ID=$(curl -s -X POST http://localhost:3000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{"title":"Sprint Planning","description":"Planificación del Sprint 5"}' \
  | jq -r '.data.id')

echo "Meeting ID: $MEETING_ID"

# 2. Agregar transcripciones (simular audio transcrito)
curl -X POST http://localhost:3000/api/v1/transcriptions \
  -H "Content-Type: application/json" \
  -d "{
    \"meeting_id\": $MEETING_ID,
    \"content\": \"Vamos a planificar el sprint 5\",
    \"speaker\": \"María\",
    \"timestamp\": \"$(date -Iseconds)\"
  }"

curl -X POST http://localhost:3000/api/v1/transcriptions \
  -H "Content-Type: application/json" \
  -d "{
    \"meeting_id\": $MEETING_ID,
    \"content\": \"Tenemos 10 user stories priorizadas\",
    \"speaker\": \"Carlos\",
    \"timestamp\": \"$(date -Iseconds)\"
  }"

# 3. Ver la reunión completa con transcripciones
curl "http://localhost:3000/api/v1/meetings/$MEETING_ID/full" | jq

# 4. Buscar en las transcripciones
curl "http://localhost:3000/api/v1/transcriptions/search?q=user+stories&meeting_id=$MEETING_ID" | jq

# 5. Finalizar la reunión
curl -X POST "http://localhost:3000/api/v1/meetings/$MEETING_ID/end" | jq
```

---

## 🧪 Testing con Scripts

### Script Bash para Testing Completo

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🏥 Health Check..."
curl -s "$BASE_URL/health" | jq

echo -e "\n📅 Crear reunión..."
MEETING=$(curl -s -X POST "$BASE_URL/api/v1/meetings" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Meeting","description":"Reunión de prueba"}')

MEETING_ID=$(echo $MEETING | jq -r '.data.id')
echo "Meeting ID: $MEETING_ID"

echo -e "\n📝 Agregar transcripción..."
curl -s -X POST "$BASE_URL/api/v1/transcriptions" \
  -H "Content-Type: application/json" \
  -d "{\"meeting_id\":$MEETING_ID,\"content\":\"Esta es una prueba\",\"speaker\":\"Test\"}" | jq

echo -e "\n📊 Ver reunión completa..."
curl -s "$BASE_URL/api/v1/meetings/$MEETING_ID/full" | jq

echo -e "\n🔍 Buscar transcripciones..."
curl -s "$BASE_URL/api/v1/transcriptions/search?q=prueba" | jq

echo -e "\n✅ Finalizar reunión..."
curl -s -X POST "$BASE_URL/api/v1/meetings/$MEETING_ID/end" | jq

echo -e "\n🗑️  Eliminar reunión..."
curl -s -X DELETE "$BASE_URL/api/v1/meetings/$MEETING_ID" | jq
```

---

## 🐍 Ejemplos en Python

### Cliente Python Simple

```python
import requests
import json

BASE_URL = "http://localhost:3000"

# Crear reunión
response = requests.post(
    f"{BASE_URL}/api/v1/meetings",
    json={
        "title": "Python Test Meeting",
        "description": "Testing desde Python"
    }
)

meeting = response.json()
meeting_id = meeting['data']['id']
print(f"Meeting created: {meeting_id}")

# Agregar transcripción
requests.post(
    f"{BASE_URL}/api/v1/transcriptions",
    json={
        "meeting_id": meeting_id,
        "content": "Hola desde Python",
        "speaker": "Bot"
    }
)

# Obtener reunión completa
response = requests.get(f"{BASE_URL}/api/v1/meetings/{meeting_id}/full")
print(json.dumps(response.json(), indent=2))

# Finalizar reunión
requests.post(f"{BASE_URL}/api/v1/meetings/{meeting_id}/end")
```

---

## 🟢 JavaScript/Node.js Ejemplos

### Cliente con Axios

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  // Crear reunión
  const { data: meeting } = await axios.post(`${BASE_URL}/api/v1/meetings`, {
    title: 'JavaScript Test Meeting',
    description: 'Testing desde JavaScript'
  });

  const meetingId = meeting.data.id;
  console.log('Meeting created:', meetingId);

  // Agregar transcripción
  await axios.post(`${BASE_URL}/api/v1/transcriptions`, {
    meeting_id: meetingId,
    content: 'Hola desde JavaScript',
    speaker: 'Bot'
  });

  // Obtener reunión completa
  const { data: fullMeeting } = await axios.get(
    `${BASE_URL}/api/v1/meetings/${meetingId}/full`
  );
  console.log('Full meeting:', fullMeeting);

  // Buscar transcripciones
  const { data: search } = await axios.get(
    `${BASE_URL}/api/v1/transcriptions/search?q=JavaScript`
  );
  console.log('Search results:', search);

  // Finalizar reunión
  await axios.post(`${BASE_URL}/api/v1/meetings/${meetingId}/end`);
  console.log('Meeting ended');
}

testAPI().catch(console.error);
```

---

## 🚨 Manejo de Errores

### Error: Meeting no encontrado

```bash
curl http://localhost:3000/api/v1/meetings/999
```

**Respuesta (404)**:
```json
{
  "success": false,
  "error": "Meeting not found"
}
```

### Error: Validación fallida

```bash
curl -X POST http://localhost:3000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta (400)**:
```json
{
  "success": false,
  "error": "Meeting title is required"
}
```

### Error: ID inválido

```bash
curl http://localhost:3000/api/v1/meetings/abc
```

**Respuesta (400)**:
```json
{
  "success": false,
  "error": "Invalid meeting ID"
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error de validación |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔗 Próximos Endpoints (Roadmap)

Estos endpoints se implementarán en futuros milestones:

- `POST /api/v1/meetings/:id/notes` - Crear nota manual
- `GET /api/v1/meetings/:id/action-items` - Obtener action items
- `POST /api/v1/meetings/:id/participants` - Agregar participante
- `GET /api/v1/meetings/:id/summary` - Generar resumen con IA
- `POST /api/v1/audio/upload` - Subir archivo de audio
- `GET /api/v1/meetings/:id/export` - Exportar a PDF/Markdown

---

**Última actualización**: 2025-10-02
**Versión API**: v1
