# ✅ Imagen Docker Lista para Desplegar

## 📦 Imagen Construida y Subida

```
✅ Imagen: ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
✅ Digest: sha256:f9ddbaebddd0d181317fde0fb88989c4579ea01445c5662c68c7561350cc5d91
✅ Variables de Supabase incluidas en el build
```

---

## 🚀 Pasos para Actualizar en Portainer

### 1. Accede a Portainer

```
https://tu-portainer.nodalyst.ai
```

### 2. Ve a tu Stack

1. **Stacks** (menú lateral)
2. Busca el stack: **nyc_trip_assistant** o **travel**
3. Click en el nombre del stack

### 3. Actualizar el Stack

**Opción A: Pull and Redeploy (Más Rápido)**
1. Click en **Pull and redeploy** (botón arriba a la derecha)
2. Espera a que descargue la nueva imagen
3. El contenedor se reiniciará automáticamente

**Opción B: Update Stack (Si necesitas cambiar algo)**
1. Click en **Editor**
2. Verifica que el `docker-compose.yml` tenga:
   ```yaml
   version: "3.7"
   
   services:
     nyc_trip_assistant:
       image: ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
       container_name: nyc_trip_assistant
       networks:
         - CambiosNet
       deploy:
         mode: replicated
         replicas: 1
         placement:
           constraints:
             - node.role == manager
         labels:
           - traefik.enable=true
           - traefik.http.routers.nyc_trip_assistant.rule=Host(`travel.nodalyst.ai`)
           - traefik.http.routers.nyc_trip_assistant.entrypoints=websecure
           - traefik.http.routers.nyc_trip_assistant.tls.certresolver=letsencryptresolver
           - traefik.http.services.nyc_trip_assistant.loadbalancer.server.port=80
           - traefik.http.services.nyc_trip_assistant.loadbalancer.passHostHeader=true
           - traefik.http.routers.nyc_trip_assistant.service=nyc_trip_assistant
   
   networks:
     CambiosNet:
       external: true
   ```
3. Click en **Update the stack**
4. Marca **Pull latest image version**
5. Click en **Update**

---

## 🔍 Verificar el Despliegue

### 1. Ver Logs del Contenedor

En Portainer:
1. **Containers** → **nyc_trip_assistant**
2. Click en **Logs**
3. Deberías ver que Nginx está corriendo

### 2. Probar la App

1. Abre: `https://travel.nodalyst.ai`
2. Abre la consola del navegador (F12)
3. Busca estos mensajes:
   ```
   🔍 Testing Supabase connection...
   URL: https://devsupabase.cambiosapp.com
   ✅ Supabase connection successful
   🧪 Testing INSERT capability...
   ✅ INSERT successful
   ```

### 3. Crear un Viaje de Prueba

1. En la pantalla de bienvenida, click **Crear Nuevo Viaje**
2. Llena los datos:
   - Ciudad: Nueva York
   - País: USA
   - Nombre: Viaje de Prueba
3. Click **Crear Viaje**
4. Debería llevarte a la configuración de días

---

## 🐛 Si Sigue Sin Funcionar

### Verificar Variables en la Imagen

```bash
# En tu máquina local
docker run --rm ghcr.io/ingeramirez0401/nyc-trip-assistant:latest sh -c "cat /usr/share/nginx/html/assets/*.js | grep -o 'devsupabase.cambiosapp.com' | head -1"
```

Debería mostrar: `devsupabase.cambiosapp.com`

Si no muestra nada, las variables no se inyectaron correctamente.

### Verificar CORS en Supabase

En tu servidor de Supabase, verifica que CORS permita `travel.nodalyst.ai`:

```bash
# SSH a tu servidor de Supabase
ssh usuario@tu-servidor-supabase

# Verificar configuración de Kong
docker exec -it supabase-kong cat /usr/local/kong/kong.conf | grep cors
```

### Limpiar Caché del Navegador

1. Abre `https://travel.nodalyst.ai`
2. Presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
3. Esto forzará la recarga sin caché

---

## 📊 Información de la Imagen

```
Repository: ghcr.io/ingeramirez0401/nyc-trip-assistant
Tag: latest
Digest: sha256:f9ddbaebddd0d181317fde0fb88989c4579ea01445c5662c68c7561350cc5d91
Size: ~50MB
Build Date: 2026-01-03
Variables Incluidas:
  ✅ VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com
  ✅ VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Resumen

1. ✅ Imagen construida con variables de Supabase
2. ✅ Imagen subida a GHCR
3. 🔄 **Siguiente paso:** Pull and redeploy en Portainer
4. ✅ Verificar que funcione en `travel.nodalyst.ai`

---

## 💡 Comandos Útiles

### Ver logs en tiempo real
```bash
docker logs -f nyc_trip_assistant
```

### Reiniciar el contenedor manualmente
```bash
docker restart nyc_trip_assistant
```

### Verificar que el contenedor está corriendo
```bash
docker ps | grep nyc_trip_assistant
```

---

¡La imagen está lista! Solo necesitas hacer **Pull and redeploy** en Portainer. 🚀
