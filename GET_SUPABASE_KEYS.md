# 🔑 Obtener Claves Reales de Supabase

## ❌ Problema Actual

La clave `anon` que estamos usando es inválida. Necesitamos obtener la clave real de tu servidor Supabase.

---

## 🔧 Opción 1: Desde el Panel Web de Supabase

1. Abre: `https://devsupabase.cambiosapp.com`
2. Inicia sesión (si tiene panel web)
3. Ve a **Settings** → **API**
4. Copia la clave **"anon public"**

---

## 🔧 Opción 2: Desde el Servidor (SSH)

### Conectarse al servidor

```bash
ssh usuario@tu-servidor-supabase
```

### Buscar las claves en el archivo de configuración

```bash
# Opción A: Si usas Docker Compose
cd /opt/supabase  # o donde esté instalado
cat .env | grep ANON_KEY

# Opción B: Si está en otro lugar
find / -name ".env" -type f 2>/dev/null | xargs grep -l "ANON_KEY" 2>/dev/null

# Opción C: Buscar en variables de entorno de Docker
docker inspect supabase-kong | grep -i anon

# Opción D: Ver variables del contenedor de Kong
docker exec supabase-kong env | grep ANON
```

### Extraer la clave directamente

```bash
# Si encuentras el archivo .env
grep ANON_KEY /opt/supabase/.env
```

Deberías ver algo como:
```
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

---

## 🔧 Opción 3: Generar Nueva Clave (Si no encuentras la original)

Si no encuentras la clave, puedes generar una nueva:

### 1. Obtener el JWT_SECRET

```bash
# En tu servidor Supabase
grep JWT_SECRET /opt/supabase/.env
```

### 2. Generar nueva clave anon

Usa esta herramienta online:
- https://jwt.io

**Payload:**
```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1715050800,
  "exp": 1872817200
}
```

**Secret:** (usa el JWT_SECRET de tu servidor)

---

## 🔧 Opción 4: Verificar con curl

Una vez que tengas la clave, verifica que funcione:

```bash
curl -X GET https://devsupabase.cambiosapp.com/rest/v1/trips \
  -H "apikey: TU-ANON-KEY-AQUI" \
  -H "Authorization: Bearer TU-ANON-KEY-AQUI"
```

Si funciona, deberías ver:
- `[]` (array vacío si no hay datos)
- O un error de tabla no encontrada (pero sin error de autenticación)

Si ves `Invalid authorization credentials`, la clave sigue siendo incorrecta.

---

## ✅ Una Vez que Tengas la Clave Correcta

### 1. Actualizar .env.local

```bash
VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com
VITE_SUPABASE_ANON_KEY=LA-CLAVE-REAL-AQUI
```

### 2. Rebuild de Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com \
  --build-arg VITE_SUPABASE_ANON_KEY=LA-CLAVE-REAL-AQUI \
  -t ghcr.io/ingeramirez0401/nyc-trip-assistant:latest \
  .

docker push ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
```

### 3. Pull and Redeploy en Portainer

---

## 🔍 Verificar el Formato de la Clave

Una clave `anon` válida tiene este formato:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzE1MDUwODAwLCJleHAiOjE4NzI4MTcyMDB9.FIRMA-AQUI
```

Tiene 3 partes separadas por puntos:
1. **Header** (algoritmo y tipo)
2. **Payload** (role: "anon", iss, iat, exp)
3. **Signature** (firma con el JWT_SECRET)

Puedes decodificar el payload en https://jwt.io para verificar que tenga `"role": "anon"`.

---

## 📝 Comandos Resumidos

```bash
# 1. SSH al servidor
ssh usuario@servidor-supabase

# 2. Buscar la clave
grep ANON_KEY /opt/supabase/.env

# 3. Copiar la clave

# 4. Verificar que funcione
curl -X GET https://devsupabase.cambiosapp.com/rest/v1/trips \
  -H "apikey: LA-CLAVE" \
  -H "Authorization: Bearer LA-CLAVE"

# 5. Si funciona, rebuild Docker con la clave correcta
```

---

**¿Tienes acceso SSH al servidor de Supabase? Si sí, conéctate y ejecuta los comandos para obtener la clave real.**
