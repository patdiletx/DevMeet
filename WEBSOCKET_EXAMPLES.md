# DevMeet AI - WebSocket Examples

Ejemplos de uso del WebSocket server para comunicación en tiempo real.

---

## 🔌 Conexión WebSocket

### URL de Conexión

```
ws://localhost:3000/ws
```

---

## 📋 Tipos de Mensajes

### Client → Server

| Tipo | Descripción |
|------|-------------|
| `start_meeting` | Iniciar una nueva reunión |
| `end_meeting` | Finalizar una reunión |
| `audio_chunk` | Enviar chunk de audio para transcribir |
| `ping` | Keepalive ping |

### Server → Client

| Tipo | Descripción |
|------|-------------|
| `meeting_started` | Confirmación de reunión iniciada |
| `meeting_ended` | Confirmación de reunión finalizada |
| `transcription` | Nueva transcripción disponible |
| `note_generated` | Nota generada por IA |
| `action_item` | Nuevo action item detectado |
| `error` | Error ocurrido |
| `pong` | Respuesta a ping |

---

## 🟢 Ejemplos con JavaScript/Node.js

### Conexión Básica

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('✅ Connected to DevMeet WebSocket');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('📨 Received:', message);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 Disconnected from WebSocket');
});
```

### Iniciar una Reunión

```javascript
const startMeeting = {
  type: 'start_meeting',
  timestamp: new Date().toISOString(),
  data: {
    title: 'Daily Standup',
    description: 'Reunión diaria del equipo',
    metadata: {
      team: 'engineering',
      tags: ['standup', 'daily']
    }
  }
};

ws.send(JSON.stringify(startMeeting));
```

**Respuesta del servidor**:
```javascript
{
  type: 'meeting_started',
  timestamp: '2025-10-02T23:50:00.000Z',
  data: {
    meetingId: 1,
    title: 'Daily Standup',
    startedAt: '2025-10-02T23:50:00.000Z'
  }
}
```

### Enviar Audio Chunk

```javascript
// Simular audio chunk (en producción vendría del micrófono)
const audioChunk = {
  type: 'audio_chunk',
  timestamp: new Date().toISOString(),
  data: {
    meetingId: 1,
    chunk: 'base64_encoded_audio_data_here', // Base64 del audio
    sequence: 1,
    format: 'webm',
    sampleRate: 44100
  }
};

ws.send(JSON.stringify(audioChunk));
```

**Respuesta del servidor** (cuando Whisper esté integrado):
```javascript
{
  type: 'transcription',
  timestamp: '2025-10-02T23:51:00.000Z',
  data: {
    meetingId: 1,
    transcriptionId: 1,
    content: 'Hola a todos, empecemos con el standup',
    speaker: 'Juan',
    confidence: 0.95,
    timestamp: '2025-10-02T23:51:00.000Z'
  }
}
```

### Finalizar Reunión

```javascript
const endMeeting = {
  type: 'end_meeting',
  timestamp: new Date().toISOString(),
  data: {
    meetingId: 1
  }
};

ws.send(JSON.stringify(endMeeting));
```

**Respuesta del servidor**:
```javascript
{
  type: 'meeting_ended',
  timestamp: '2025-10-02T23:55:00.000Z',
  data: {
    meetingId: 1,
    endedAt: '2025-10-02T23:55:00.000Z',
    duration: 300 // Duration in seconds
  }
}
```

---

## 🐍 Ejemplo con Python

### Cliente WebSocket Básico

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)
    print(f"📨 Received: {data['type']}")
    print(json.dumps(data, indent=2))

def on_error(ws, error):
    print(f"❌ Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("🔌 Connection closed")

def on_open(ws):
    print("✅ Connected to DevMeet WebSocket")

    # Start a meeting
    start_meeting = {
        "type": "start_meeting",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "data": {
            "title": "Python Test Meeting",
            "description": "Testing from Python client"
        }
    }
    ws.send(json.dumps(start_meeting))

# Connect to WebSocket
ws = websocket.WebSocketApp(
    "ws://localhost:3000/ws",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

ws.run_forever()
```

---

## 🌐 Ejemplo con HTML/Browser

### Cliente en el Browser

```html
<!DOCTYPE html>
<html>
<head>
  <title>DevMeet WebSocket Client</title>
</head>
<body>
  <h1>DevMeet WebSocket Test</h1>
  <div id="status">Disconnected</div>
  <button onclick="startMeeting()">Start Meeting</button>
  <button onclick="endMeeting()">End Meeting</button>
  <div id="messages"></div>

  <script>
    let ws;
    let currentMeetingId;

    // Connect to WebSocket
    function connect() {
      ws = new WebSocket('ws://localhost:3000/ws');

      ws.onopen = () => {
        document.getElementById('status').textContent = '✅ Connected';
        console.log('Connected to DevMeet WebSocket');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received:', message);

        // Display message
        const messagesDiv = document.getElementById('messages');
        const messageEl = document.createElement('div');
        messageEl.textContent = `${message.type}: ${JSON.stringify(message.data)}`;
        messagesDiv.appendChild(messageEl);

        // Handle different message types
        if (message.type === 'meeting_started') {
          currentMeetingId = message.data.meetingId;
          console.log('Meeting started:', currentMeetingId);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        document.getElementById('status').textContent = '❌ Disconnected';
        console.log('Disconnected from WebSocket');
      };
    }

    function startMeeting() {
      const message = {
        type: 'start_meeting',
        timestamp: new Date().toISOString(),
        data: {
          title: 'Browser Test Meeting',
          description: 'Testing from browser'
        }
      };
      ws.send(JSON.stringify(message));
    }

    function endMeeting() {
      if (!currentMeetingId) {
        alert('No active meeting');
        return;
      }

      const message = {
        type: 'end_meeting',
        timestamp: new Date().toISOString(),
        data: {
          meetingId: currentMeetingId
        }
      };
      ws.send(JSON.stringify(message));
    }

    // Auto-connect on page load
    connect();
  </script>
</body>
</html>
```

---

## 🧪 Testing con wscat

### Instalar wscat

```bash
npm install -g wscat
```

### Conectar al WebSocket

```bash
wscat -c ws://localhost:3000/ws
```

### Enviar Mensajes

```bash
# Start meeting
> {"type":"start_meeting","timestamp":"2025-10-02T23:50:00.000Z","data":{"title":"Test Meeting"}}

# Server responds:
< {"type":"meeting_started","timestamp":"2025-10-02T23:50:00.000Z","data":{"meetingId":1,"title":"Test Meeting","startedAt":"2025-10-02T23:50:00.000Z"}}

# End meeting
> {"type":"end_meeting","timestamp":"2025-10-02T23:55:00.000Z","data":{"meetingId":1}}

# Server responds:
< {"type":"meeting_ended","timestamp":"2025-10-02T23:55:00.000Z","data":{"meetingId":1,"endedAt":"2025-10-02T23:55:00.000Z","duration":300}}
```

---

## 🔄 Flujo Completo

### Escenario: Reunión con Transcripción

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/ws');

let meetingId;

ws.on('open', async () => {
  console.log('✅ Connected');

  // 1. Start meeting
  ws.send(JSON.stringify({
    type: 'start_meeting',
    timestamp: new Date().toISOString(),
    data: {
      title: 'Sprint Planning',
      description: 'Planificación del Sprint 5'
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
    case 'meeting_started':
      console.log('✅ Meeting started:', message.data.meetingId);
      meetingId = message.data.meetingId;

      // 2. Simulate sending audio (in production, capture from microphone)
      setTimeout(() => {
        console.log('🎤 Sending audio chunk...');
        ws.send(JSON.stringify({
          type: 'audio_chunk',
          timestamp: new Date().toISOString(),
          data: {
            meetingId: meetingId,
            chunk: 'base64_audio_data',
            sequence: 1,
            format: 'webm'
          }
        }));
      }, 1000);
      break;

    case 'transcription':
      console.log('📝 Transcription:', message.data.content);
      console.log('   Speaker:', message.data.speaker);
      console.log('   Confidence:', message.data.confidence);
      break;

    case 'note_generated':
      console.log('📋 Note generated:', message.data.content);
      break;

    case 'action_item':
      console.log('✅ Action item:', message.data.description);
      console.log('   Assigned to:', message.data.assignedTo);
      break;

    case 'error':
      console.error('❌ Error:', message.data.message);
      break;
  }
});

// 3. End meeting after 5 minutes (example)
setTimeout(() => {
  console.log('⏰ Ending meeting...');
  ws.send(JSON.stringify({
    type: 'end_meeting',
    timestamp: new Date().toISOString(),
    data: { meetingId }
  }));

  setTimeout(() => ws.close(), 1000);
}, 5 * 60 * 1000);
```

---

## 🚨 Manejo de Errores

### Errores Comunes

```javascript
// Error: No active meeting
{
  type: 'error',
  timestamp: '2025-10-02T23:50:00.000Z',
  data: {
    code: 'NO_ACTIVE_MEETING',
    message: 'No active meeting for this client'
  }
}

// Error: Unauthorized
{
  type: 'error',
  timestamp: '2025-10-02T23:50:00.000Z',
  data: {
    code: 'UNAUTHORIZED',
    message: 'Meeting does not belong to this client'
  }
}

// Error: Invalid message
{
  type: 'error',
  timestamp: '2025-10-02T23:50:00.000Z',
  data: {
    code: 'INVALID_MESSAGE',
    message: 'Failed to parse message'
  }
}
```

---

## ⚙️ Heartbeat / Keepalive

El servidor envía pings automáticamente cada 30 segundos. Los clientes deben responder con pong (automático en la mayoría de librerías WebSocket).

```javascript
// Manual ping (opcional)
ws.send(JSON.stringify({
  type: 'ping',
  timestamp: new Date().toISOString()
}));

// Server responds
{
  type: 'pong',
  timestamp: '2025-10-02T23:50:00.000Z'
}
```

**Timeout**: Los clientes que no respondan en 60 segundos serán desconectados.

---

## 🔍 Debugging

### Logs del Servidor

El servidor loguea todos los eventos WebSocket:

```
[INFO] WebSocket server initialized on path: /ws
[INFO] WebSocket client connected: abc-123-def
[INFO] Meeting started: 1 by client abc-123-def
[DEBUG] Received audio chunk 1 for meeting 1
[INFO] Meeting ended: 1 by client abc-123-def
[INFO] WebSocket client disconnected: abc-123-def
```

### Monitoreo en Tiempo Real

Ver clientes conectados (implementar endpoint):
```bash
curl http://localhost:3000/api/v1/websocket/stats
```

---

## 📊 Estadísticas del WebSocket

- **Clientes conectados**: Disponible en `wsService.getClientCount()`
- **Heartbeat interval**: 30 segundos
- **Client timeout**: 60 segundos
- **Path**: `/ws`

---

## 🚀 Próximas Funcionalidades

Estas funcionalidades se activarán cuando se integren Whisper y Claude:

- ✅ `transcription` - Transcripciones en tiempo real (pendiente integración Whisper)
- ✅ `note_generated` - Notas automáticas (pendiente integración Claude)
- ✅ `action_item` - Detección de action items (pendiente integración Claude)

---

**Última actualización**: 2025-10-02
**Versión**: 1.0.0
**Estado**: ✅ Funcional (sin integración IA)
