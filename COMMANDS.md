# DevMeet AI - Comandos Útiles

Referencia rápida de comandos comunes para desarrollo.

---

## 🚀 Setup Inicial

### Instalación Completa
```bash
# Instalar todas las dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
code .env  # o notepad .env
```

### Configurar PostgreSQL
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos y usuario
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;
\c devmeet_db
GRANT ALL ON SCHEMA public TO devmeet_user;
\q

# Ejecutar migrations
cd packages/backend
npm run migrate

# Ver estado de migrations
npm run migrate:status
```

---

## 💻 Desarrollo

### Iniciar Todo
```bash
# Desde el root - inicia backend, frontend y desktop en paralelo
npm run dev
```

### Iniciar Servicios Individualmente
```bash
# Backend (API + WebSocket)
npm run dev:backend
# → http://localhost:3000

# Frontend (React + Vite)
npm run dev:frontend
# → http://localhost:5173

# Desktop (Electron)
npm run dev:desktop
```

### Por Package
```bash
# Backend
cd packages/backend
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar versión compilada

# Frontend
cd packages/frontend
npm run dev          # Desarrollo con Vite
npm run build        # Build de producción
npm run preview      # Preview del build

# Desktop
cd packages/desktop
npm run dev          # Desarrollo con Electron
npm run build        # Build de la app
npm run package      # Crear package (sin instalador)
npm run make         # Crear instalador
```

---

## 🗄️ Base de Datos

### Migrations
```bash
cd packages/backend

# Ejecutar todas las migrations pendientes
npm run migrate

# Ver estado de migrations
npm run migrate:status

# Conectar a la base de datos
psql -U devmeet_user -d devmeet_db

# Ver tablas
\dt

# Ver estructura de una tabla
\d meetings

# Salir
\q
```

### Queries Útiles
```bash
# Contar reuniones
psql -U devmeet_user -d devmeet_db -c "SELECT COUNT(*) FROM meetings;"

# Ver últimas reuniones
psql -U devmeet_user -d devmeet_db -c "SELECT id, title, started_at, status FROM meetings ORDER BY started_at DESC LIMIT 10;"

# Ver transcripciones de una reunión
psql -U devmeet_user -d devmeet_db -c "SELECT id, content, timestamp FROM transcriptions WHERE meeting_id = 1 ORDER BY timestamp;"
```

### Backup y Restore
```bash
# Hacer backup
pg_dump -U devmeet_user devmeet_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U devmeet_user devmeet_db < backup_20251002.sql

# Limpiar base de datos (CUIDADO!)
psql -U devmeet_user -d devmeet_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO devmeet_user;"
# Luego ejecutar migrations de nuevo
```

---

## 🧹 Calidad de Código

### Linting
```bash
# Lint todo el proyecto
npm run lint

# Fix automático
npm run lint:fix

# Lint por package
cd packages/backend
npm run lint  # Si está configurado
```

### Formateo
```bash
# Formatear todo
npm run format

# Solo verificar (no modificar)
npm run format:check

# Formatear archivos específicos
npx prettier --write "packages/backend/src/**/*.ts"
```

### TypeScript
```bash
# Verificar tipos en todo el proyecto
npx tsc --noEmit

# Por package
cd packages/backend
npx tsc --noEmit
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests por package
cd packages/backend
npm run test
npm run test:watch  # Watch mode

# Coverage
npm run test -- --coverage
```

---

## 📦 Build y Deploy

### Build
```bash
# Build de todo
npm run build

# Build por package
npm run build:backend
npm run build:frontend
npm run build:desktop
```

### Desktop App
```bash
cd packages/desktop

# Crear package para tu plataforma
npm run package

# Crear instalador
npm run make

# Los archivos estarán en packages/desktop/out/
```

---

## 🔍 Debugging

### Backend
```bash
# Ejecutar con debugger
node --inspect dist/index.js

# Con tsx (desarrollo)
tsx --inspect src/index.ts

# Ver logs
tail -f logs/app.log  # Si tienes logging a archivo
```

### Frontend
```bash
# Abrir con React DevTools
npm run dev:frontend
# Luego abrir http://localhost:5173
# F12 → Components/Profiler tabs
```

### Database
```bash
# Ver queries lentas (PostgreSQL config)
psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 100;"
psql -U postgres -c "SELECT pg_reload_conf();"

# Ver logs de PostgreSQL
# Windows: C:\Program Files\PostgreSQL\14\data\log\
# Mac: /usr/local/var/postgres/
# Linux: /var/log/postgresql/
```

---

## 🔧 Mantenimiento

### Limpiar
```bash
# Limpiar builds
npm run clean

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar todo (incluyendo packages)
rm -rf node_modules packages/*/node_modules package-lock.json
npm install
```

### Actualizar Dependencias
```bash
# Ver outdated
npm outdated

# Actualizar todas (cuidado!)
npm update

# Actualizar una específica
npm install express@latest --workspace=@devmeet/backend

# Audit de seguridad
npm audit
npm audit fix
```

---

## 📊 Monitoreo

### Ver Procesos
```bash
# Ver procesos Node.js
ps aux | grep node

# Ver procesos Electron
ps aux | grep electron

# Ver conexiones a PostgreSQL
psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE datname = 'devmeet_db';"
```

### Logs
```bash
# Backend logs (si usas Winston)
tail -f logs/combined.log
tail -f logs/error.log

# npm logs
cat npm-debug.log
```

---

## 🐛 Troubleshooting

### Reset Completo
```bash
# 1. Limpiar todo
npm run clean
rm -rf node_modules packages/*/node_modules package-lock.json

# 2. Reinstalar
npm install

# 3. Reset DB
psql -U devmeet_user -d devmeet_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO devmeet_user;"
cd packages/backend
npm run migrate

# 4. Probar
cd ../..
npm run dev:backend
```

### Puerto en Uso
```bash
# Ver qué está usando el puerto 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Matar proceso
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### PostgreSQL no Conecta
```bash
# Verificar que está corriendo
# Mac: brew services list
# Linux: sudo systemctl status postgresql
# Windows: Services → postgresql-x64-14

# Reiniciar
# Mac: brew services restart postgresql
# Linux: sudo systemctl restart postgresql
# Windows: Services → restart
```

---

## 📝 Git

### Workflow Común
```bash
# Ver estado
git status

# Agregar archivos
git add .

# Commit
git commit -m "feat: add feature X"

# Ver historial
git log --oneline --graph --all

# Crear rama
git checkout -b feature/nueva-feature

# Volver a main
git checkout main
```

### Ignorar Cambios Locales
```bash
# Ver archivos ignorados
git check-ignore -v *

# Agregar a .gitignore
echo "archivo_temporal.log" >> .gitignore
```

---

## 🚀 Atajos y Aliases (Opcional)

Agregar al `.bashrc` o `.zshrc`:

```bash
# DevMeet aliases
alias dm='cd ~/DevMeet'
alias dmd='npm run dev'
alias dmb='npm run dev:backend'
alias dmf='npm run dev:frontend'
alias dml='npm run lint'
alias dmdb='psql -U devmeet_user -d devmeet_db'
```

---

## 📚 Referencias Rápidas

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432
- **Docs**: `./docs/` folder

---

**Última actualización**: 2025-10-02
