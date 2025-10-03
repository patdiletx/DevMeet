# Configuración de PostgreSQL para DevMeet AI

PostgreSQL no está instalado actualmente en el sistema. Sigue estos pasos para instalarlo y configurarlo.

## 📥 Instalación de PostgreSQL

### Windows

1. **Descargar PostgreSQL**
   - Ir a: https://www.postgresql.org/download/windows/
   - Descargar el instalador de EDB (versión 14 o superior recomendada)
   - Ejecutar el instalador

2. **Durante la instalación**
   - Password del superusuario (postgres): Elige una contraseña y **anótala**
   - Puerto: Dejar el default (5432)
   - Locale: Spanish, Spain o el que prefieras

3. **Verificar instalación**
   ```bash
   # En PowerShell o CMD (reinicia la terminal después de instalar)
   psql --version
   ```

### macOS

```bash
# Con Homebrew
brew install postgresql@14
brew services start postgresql@14

# Verificar
psql --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar
psql --version
```

---

## 🔧 Configuración Inicial

### 1. Crear Base de Datos y Usuario

#### Windows
```bash
# Abrir PowerShell o CMD como Administrador
# Conectar a PostgreSQL (te pedirá la contraseña que elegiste)
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;

# Conectar a la base de datos
\c devmeet_db

# Para PostgreSQL 15+ (dar permisos al schema)
GRANT ALL ON SCHEMA public TO devmeet_user;

# Salir
\q
```

#### macOS/Linux
```bash
# Conectar como usuario postgres
sudo -u postgres psql

# O directamente:
psql -U postgres

# Luego ejecutar los mismos comandos de arriba
CREATE DATABASE devmeet_db;
CREATE USER devmeet_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE devmeet_db TO devmeet_user;
\c devmeet_db
GRANT ALL ON SCHEMA public TO devmeet_user;
\q
```

### 2. Verificar Conexión

```bash
# Intenta conectar con el nuevo usuario
psql -U devmeet_user -d devmeet_db

# Si funciona, verás el prompt:
# devmeet_db=>

# Salir con:
\q
```

---

## 🚀 Ejecutar Migrations

Una vez que PostgreSQL esté configurado:

```bash
cd C:\Repos\DevMeet\packages\backend

# Ejecutar migrations
npm run migrate

# Deberías ver:
# ✅ Migrations table ready
# 📦 Running migration: 001_initial_schema.sql
# ✅ Migration applied: 001_initial_schema.sql
# ✨ All migrations completed successfully!
```

### Verificar que las tablas se crearon

```bash
psql -U devmeet_user -d devmeet_db

# Dentro de psql:
\dt

# Deberías ver:
#  public | action_items              | table | devmeet_user
#  public | documentation_references | table | devmeet_user
#  public | meetings                  | table | devmeet_user
#  public | notes                     | table | devmeet_user
#  public | participants              | table | devmeet_user
#  public | schema_migrations         | table | devmeet_user
#  public | transcriptions            | table | devmeet_user

\q
```

---

## 🐛 Troubleshooting

### Error: "psql: command not found"

**Windows**: Agregar PostgreSQL al PATH
1. Buscar "Variables de entorno" en Windows
2. Editar la variable PATH
3. Agregar: `C:\Program Files\PostgreSQL\14\bin`
4. Reiniciar terminal

**macOS**:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux**: Debería funcionar automáticamente después de instalar

### Error: "FATAL: password authentication failed"

- Verifica que estés usando la contraseña correcta
- En Windows, usa el usuario `postgres` con la contraseña que elegiste
- Reinicia el servicio PostgreSQL

**Windows**:
```
Servicios → postgresql-x64-14 → Reiniciar
```

**macOS**:
```bash
brew services restart postgresql@14
```

**Linux**:
```bash
sudo systemctl restart postgresql
```

### Error: "could not connect to server"

El servicio PostgreSQL no está corriendo.

**Windows**: Ir a Servicios y buscar "postgresql", iniciarlo

**macOS**: `brew services start postgresql@14`

**Linux**: `sudo systemctl start postgresql`

### Error: "permission denied for schema public" (PostgreSQL 15+)

```bash
psql -U postgres -d devmeet_db
GRANT ALL ON SCHEMA public TO devmeet_user;
\q
```

---

## 🔐 Seguridad (Producción)

⚠️ **IMPORTANTE**: La contraseña `dev_password_123` es solo para desarrollo local.

Para producción:
1. Usar contraseña fuerte y segura
2. No commitear el archivo `.env`
3. Usar variables de entorno del sistema
4. Habilitar SSL en PostgreSQL
5. Restringir acceso por IP

---

## 📊 Comandos Útiles de PostgreSQL

```bash
# Conectar a base de datos
psql -U devmeet_user -d devmeet_db

# Listar bases de datos
\l

# Listar tablas
\dt

# Ver estructura de una tabla
\d meetings

# Ver datos de una tabla
SELECT * FROM meetings;

# Contar registros
SELECT COUNT(*) FROM meetings;

# Salir
\q
```

---

## ✅ Verificación Final

Después de completar estos pasos:

1. ✅ PostgreSQL instalado y corriendo
2. ✅ Base de datos `devmeet_db` creada
3. ✅ Usuario `devmeet_user` con permisos
4. ✅ Migrations ejecutadas exitosamente
5. ✅ 7 tablas creadas

**Siguiente paso**: Probar el backend
```bash
cd C:\Repos\DevMeet
npm run dev:backend
```

---

**Links Útiles**:
- PostgreSQL Windows: https://www.postgresql.org/download/windows/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- pgAdmin (GUI): https://www.pgadmin.org/download/

**Última actualización**: 2025-10-02
