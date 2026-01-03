# 🚀 Despliegue con Supabase en Producción

## 📋 Problema Resuelto

Las variables de entorno de Vite deben estar disponibles **durante el build**, no en runtime. El Dockerfile ha sido actualizado para aceptar build arguments.

---

## 🔧 Opción 1: Build Manual con Docker

### En tu máquina local:

```bash
# 1. Hacer build con las variables de entorno
docker build \
  --build-arg VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com \
  --build-arg VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui \
  -t ghcr.io/ingeramirez0401/nyc-trip-assistant:latest \
  .

# 2. Push a GitHub Container Registry
docker push ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
```

---

## 🔧 Opción 2: GitHub Actions (Recomendado)

Crea o actualiza `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### Configurar Secrets en GitHub:

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Agrega:
   - `VITE_SUPABASE_URL` = `https://devsupabase.cambiosapp.com`
   - `VITE_SUPABASE_ANON_KEY` = `tu-anon-key`

---

## 🔧 Opción 3: Build en el Servidor (Más Rápido)

Si prefieres hacer el build directamente en tu servidor:

```bash
# 1. SSH a tu servidor
ssh usuario@tu-servidor

# 2. Clonar o actualizar el repo
cd /opt/docker
git clone https://github.com/ingeramirez0401/nyc-trip-assistant.git
cd nyc-trip-assistant

# 3. Crear archivo .env.build con las credenciales
cat > .env.build << EOF
VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
EOF

# 4. Build con las variables
docker build \
  --build-arg VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.build | cut -d '=' -f2) \
  --build-arg VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.build | cut -d '=' -f2) \
  -t nyc-trip-assistant:latest \
  .

# 5. Eliminar archivo temporal
rm .env.build
```

---

## 📦 Desplegar en Portainer

### Opción A: Usar imagen de GHCR (después del build)

1. **Portainer** → **Stacks** → Tu stack
2. En el `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nyc-trip-assistant:
    image: ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
    container_name: nyc-trip-assistant
    restart: unless-stopped
    networks:
      - CambiosNet
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.travel.rule=Host(`travel.nodalyst.ai`)"
      - "traefik.http.routers.travel.entrypoints=websecure"
      - "traefik.http.routers.travel.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.travel.loadbalancer.server.port=80"

networks:
  CambiosNet:
    external: true
```

3. **Update the stack**
4. **Pull and redeploy**

### Opción B: Build local en el servidor

Si hiciste el build en el servidor:

```yaml
version: '3.8'

services:
  nyc-trip-assistant:
    image: nyc-trip-assistant:latest  # Imagen local
    container_name: nyc-trip-assistant
    restart: unless-stopped
    networks:
      - CambiosNet
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.travel.rule=Host(`travel.nodalyst.ai`)"
      - "traefik.http.routers.travel.entrypoints=websecure"
      - "traefik.http.routers.travel.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.travel.loadbalancer.server.port=80"

networks:
  CambiosNet:
    external: true
```

---

## ✅ Verificar que Funciona

Después del despliegue:

1. Abre: `https://travel.nodalyst.ai`
2. Abre la consola del navegador (F12)
3. Deberías ver:
   - `✅ Supabase connection successful`
   - `✅ INSERT successful` (del test automático)
4. Intenta crear un viaje

---

## 🐛 Troubleshooting

### Error: "Supabase credentials not found"
- Las variables no se inyectaron durante el build
- Rehaz el build con los `--build-arg`

### Error: CORS
- Configura CORS en Supabase para permitir `travel.nodalyst.ai`

### Error: Connection failed
- Verifica que `devsupabase.cambiosapp.com` sea accesible desde internet
- Verifica que el puerto esté abierto en el firewall

---

## 🎯 Resumen Rápido

**Para desplegar ahora mismo:**

```bash
# En tu máquina local
docker build \
  --build-arg VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com \
  --build-arg VITE_SUPABASE_ANON_KEY=tu-anon-key \
  -t ghcr.io/ingeramirez0401/nyc-trip-assistant:latest \
  .

docker push ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
```

Luego en Portainer:
1. Update stack
2. Pull and redeploy

¡Listo! 🎉
