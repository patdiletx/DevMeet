# DevMeet AI - Quick Start 🚀

Guía rápida para tener DevMeet AI corriendo en **menos de 15 minutos**.

---

## ⚡ Inicio Rápido (3 comandos)

Si ya tienes PostgreSQL instalado:

```bash
# 1. Instalar dependencias (ya hecho si vienes de la instalación)
npm install

# 2. Ejecutar migrations
cd packages/backend
npm run migrate

# 3. Iniciar el servidor
cd ../..
npm run dev:backend
```

✅ Servidor corriendo en **http://localhost:3000**

---

## 📋 Checklist Pre-requisitos

Antes de comenzar, verifica que tienes:

- [x] Node.js 18+ instalado (`node --version`)
- [ ] PostgreSQL 14+ instalado (`psql --version`)
- [ ] Git instalado (`git --version`)
- [ ] Editor de código (VS Code recomendado)

---

## 🔧 Setup Completo (15 minutos)

### 1️⃣ Instalar PostgreSQL (5 min)

**Windows**:
```bash
# Descargar desde: https://www.postgresql.org/download/windows/
# Ejecutar instalador, elegir password para "postgres" user
# Verificar instalación:
psql --version
```

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
psql --version
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
psql --version
```

### 2️⃣ Crear Base de Datos (3 min)

```bash
# Conectar como superusuario
psql -U postgres

# Ejecutar estos comandos en la consola de PostgreSQL:
```

```sql
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;

-- Conectar a la nueva base de datos
\c devmeet_db

-- Otorgar permisos en el schema
GRANT ALL ON SCHEMA public TO devmeet_user;

-- Salir
\q
```

### 3️⃣ Verificar Conexión (1 min)

```bash
psql -U devmeet_user -d devmeet_db -c "SELECT version();"
```

Deberías ver la versión de PostgreSQL.

### 4️⃣ Ejecutar Migrations (1 min)

```bash
cd packages/backend
npm run migrate
```

Salida esperada:
```
[INFO] Running migration: 001_initial_schema.sql
[INFO] Migration 001_initial_schema.sql applied successfully
[INFO] All migrations completed!
```

### 5️⃣ Iniciar Backend (1 min)

```bash
cd ../..
npm run dev:backend
```

Salida esperada:
```
[INFO] Server started on port 3000
[INFO] Environment: development
```

### 6️⃣ Probar API (2 min)

**Opción A: Browser**
- Abrir: http://localhost:3000/health

**Opción B: curl**
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T23:50:00.000Z",
  "uptime": 5.123
}
```

---

## 🧪 Crear Tu Primera Reunión

```bash
# Crear una reunión
curl -X POST http://localhost:3000/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Primera Reunión",
    "description": "Testing DevMeet AI"
  }'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Mi Primera Reunión",
    "status": "active",
    "started_at": "2025-10-02T23:50:00.000Z"
  }
}
```

**Copiar el ID de la reunión** (en el ejemplo es `1`).

Agregar una transcripción:
```bash
curl -X POST http://localhost:3000/api/v1/transcriptions \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": 1,
    "content": "Hola equipo, esta es una prueba de DevMeet AI",
    "speaker": "Tu Nombre"
  }'
```

Ver la reunión completa:
```bash
curl http://localhost:3000/api/v1/meetings/1/full | jq
```

Buscar en transcripciones:
```bash
curl "http://localhost:3000/api/v1/transcriptions/search?q=prueba" | jq
```

Finalizar la reunión:
```bash
curl -X POST http://localhost:3000/api/v1/meetings/1/end
```

---

## 🎯 Próximos Pasos

Ahora que tienes el backend funcionando:

1. **Configurar API Keys** (opcional para MVP básico)
   - Editar `.env`
   - Agregar Claude API key: https://console.anthropic.com/
   - Agregar OpenAI API key: https://platform.openai.com/api-keys

2. **Explorar la API**
   - Ver `API_EXAMPLES.md` para más ejemplos
   - Probar todos los endpoints
   - Experimentar con búsqueda full-text

3. **Iniciar Desktop App** (próximo milestone)
   ```bash
   npm run dev:desktop
   ```

4. **Iniciar Frontend** (próximo milestone)
   ```bash
   npm run dev:frontend
   ```

---

## 🐛 Solución de Problemas

### Error: "psql: command not found"
PostgreSQL no está instalado o no está en el PATH.
- Windows: Agregar `C:\Program Files\PostgreSQL\14\bin` al PATH
- macOS/Linux: Reinstalar PostgreSQL

### Error: "FATAL: password authentication failed"
Contraseña incorrecta o usuario no existe.
- Verificar `.env` tiene la contraseña correcta
- Re-crear el usuario en PostgreSQL

### Error: "relation does not exist"
Las migrations no se ejecutaron.
- Ejecutar: `cd packages/backend && npm run migrate`

### Error: "ECONNREFUSED localhost:5432"
PostgreSQL no está corriendo.
- Windows: Verificar servicios de Windows
- macOS: `brew services start postgresql@14`
- Linux: `sudo systemctl start postgresql`

### El servidor no inicia (puerto 3000 ocupado)
Otro proceso está usando el puerto 3000.
- Cambiar `PORT=3001` en `.env`
- O detener el otro proceso: `npx kill-port 3000`

---

## 📊 Verificar Estado del Sistema

Script de diagnóstico completo:

```bash
#!/bin/bash

echo "🔍 DevMeet AI - Diagnóstico del Sistema"
echo "========================================"

echo -e "\n✓ Node.js:"
node --version

echo -e "\n✓ npm:"
npm --version

echo -e "\n✓ PostgreSQL:"
psql --version

echo -e "\n✓ Base de datos:"
psql -U devmeet_user -d devmeet_db -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';"

echo -e "\n✓ Backend health:"
curl -s http://localhost:3000/health | jq

echo -e "\n✓ Meetings count:"
curl -s http://localhost:3000/api/v1/meetings | jq '.pagination.total'

echo -e "\n✅ Todo OK!"
```

Guardar como `check-system.sh` y ejecutar: `bash check-system.sh`

---

## 📚 Documentación Completa

- **README.md** - Visión general del proyecto
- **INSTALL.md** - Instalación detallada
- **COMMANDS.md** - Referencia de comandos
- **API_EXAMPLES.md** - Ejemplos de uso de la API
- **SETUP_POSTGRESQL.md** - Guía detallada de PostgreSQL
- **docs/ARCHITECTURE.md** - Arquitectura del sistema
- **docs/DATABASE_SCHEMA.md** - Schema de la base de datos

---

## 🎉 ¡Listo!

Tienes DevMeet AI corriendo localmente. Ahora puedes:

- ✅ Crear y gestionar reuniones
- ✅ Agregar transcripciones
- ✅ Buscar en el contenido
- ✅ Exportar datos

**Siguiente milestone**: Integración de WebSocket y transcripción en tiempo real.

---

**Tiempo estimado total**: 15 minutos
**Dificultad**: Principiante
**Última actualización**: 2025-10-02
