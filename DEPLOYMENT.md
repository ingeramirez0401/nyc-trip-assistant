# 🚀 Guía de Despliegue - NYC Trip Assistant

## 📋 Requisitos Previos

- Servidor Ubuntu con Docker y Docker Swarm
- Portainer instalado
- Traefik configurado como reverse proxy
- Dominio `nodalyst.ai` en CloudFlare
- Cuenta de GitHub con acceso al repositorio

## 🔧 Configuración Inicial

### 1. Configurar CloudFlare

#### Crear el Subdominio
1. Accede a tu panel de CloudFlare
2. Selecciona el dominio `nodalyst.ai`
3. Ve a **DNS** → **Records**
4. Agrega un nuevo registro:
   - **Type**: `A`
   - **Name**: `travel`
   - **IPv4 address**: `[IP de tu servidor Ubuntu]`
   - **Proxy status**: 🟠 DNS only (desactivar proxy de CloudFlare)
   - **TTL**: Auto

> ⚠️ **Importante**: Desactiva el proxy de CloudFlare (DNS only) para que Traefik pueda manejar el certificado SSL con Let's Encrypt.

#### Configuración SSL/TLS
1. Ve a **SSL/TLS** → **Overview**
2. Selecciona **Full** o **Full (strict)**

### 2. Preparar el Repositorio en GitHub

#### Crear el Repositorio
```bash
cd c:\Users\jrami\CascadeProjects\nyc-trip-assistant

# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .
git commit -m "Initial commit - NYC Trip Assistant"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/ingeramirez0401/nyc-trip-assistant.git
git branch -M main
git push -u origin main
```

#### Configurar GitHub Container Registry
1. Ve a tu repositorio en GitHub
2. **Settings** → **Actions** → **General**
3. En **Workflow permissions**, selecciona:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 3. Build y Push de la Imagen Docker

El workflow de GitHub Actions se ejecutará automáticamente al hacer push. Para forzar un build manual:

1. Ve a tu repositorio en GitHub
2. **Actions** → **Build and Push Docker Image**
3. Click en **Run workflow** → **Run workflow**

Espera a que termine el build (2-5 minutos). La imagen estará disponible en:
```
ghcr.io/ingeramirez0401/nyc-trip-assistant:latest
```

### 4. Desplegar en Portainer

#### Opción A: Desde Portainer UI
1. Accede a Portainer
2. Ve a **Stacks** → **Add stack**
3. Nombre: `nyc-trip-assistant`
4. Copia el contenido de `docker-compose.yml`
5. Click en **Deploy the stack**

#### Opción B: Desde SSH
```bash
# Conectar al servidor
ssh usuario@tu-servidor

# Crear directorio para el stack
mkdir -p ~/stacks/nyc-trip-assistant
cd ~/stacks/nyc-trip-assistant

# Copiar el docker-compose.yml al servidor
# (puedes usar scp, nano, vim, etc.)

# Desplegar el stack
docker stack deploy -c docker-compose.yml nyc_trip_assistant
```

### 5. Verificar el Despliegue

```bash
# Ver servicios corriendo
docker service ls

# Ver logs del servicio
docker service logs nyc_trip_assistant_nyc_trip_assistant -f

# Verificar que Traefik detectó el servicio
docker service inspect nyc_trip_assistant_nyc_trip_assistant
```

### 6. Acceder a la Aplicación

Espera 1-2 minutos para que:
- El contenedor inicie
- Traefik genere el certificado SSL
- DNS propague (si es primera vez)

Luego accede a: **https://travel.nodalyst.ai**

## 🔄 Actualizar la Aplicación

### Método 1: Push a GitHub (Recomendado)
```bash
# Hacer cambios en el código
git add .
git commit -m "Update: descripción de cambios"
git push

# Esperar a que GitHub Actions construya la imagen
# Luego en el servidor:
docker service update --image ghcr.io/ingeramirez0401/nyc-trip-assistant:latest nyc_trip_assistant_nyc_trip_assistant
```

### Método 2: Desde Portainer
1. Ve a **Stacks** → `nyc-trip-assistant`
2. Click en **Update the stack**
3. Activa **Re-pull image and redeploy**
4. Click en **Update**

## 🐛 Troubleshooting

### La aplicación no carga
```bash
# Verificar que el servicio está corriendo
docker service ps nyc_trip_assistant_nyc_trip_assistant

# Ver logs
docker service logs nyc_trip_assistant_nyc_trip_assistant --tail 100
```

### Error de certificado SSL
- Verifica que el DNS apunte correctamente: `dig travel.nodalyst.ai`
- Verifica que el proxy de CloudFlare esté desactivado (DNS only)
- Espera 2-3 minutos para que Let's Encrypt genere el certificado

### No se puede acceder al subdominio
```bash
# Verificar DNS
nslookup travel.nodalyst.ai

# Verificar que Traefik detectó el servicio
docker service inspect nyc_trip_assistant_nyc_trip_assistant | grep -A 10 Labels
```

### La imagen no se actualiza
```bash
# Forzar pull de la imagen
docker pull ghcr.io/ingeramirez0401/nyc-trip-assistant:latest

# Actualizar el servicio
docker service update --force nyc_trip_assistant_nyc_trip_assistant
```

## 📊 Monitoreo

### Ver recursos utilizados
```bash
docker stats nyc_trip_assistant_nyc_trip_assistant
```

### Ver logs en tiempo real
```bash
docker service logs -f nyc_trip_assistant_nyc_trip_assistant
```

## 🔒 Seguridad

- ✅ HTTPS automático con Let's Encrypt
- ✅ Headers de seguridad configurados en nginx
- ✅ Compresión gzip habilitada
- ✅ Cache optimizado para assets estáticos

## 📝 Notas Adicionales

- El puerto interno del contenedor es **80** (nginx)
- Traefik maneja el SSL y redirige el tráfico al puerto 80
- Los datos se persisten en LocalStorage del navegador
- No hay base de datos backend necesaria
- La aplicación es completamente estática después del build

## 🎯 Arquitectura del Despliegue

```
Internet
    ↓
CloudFlare DNS (travel.nodalyst.ai)
    ↓
Servidor Ubuntu
    ↓
Traefik (Reverse Proxy + SSL)
    ↓
Docker Container (nginx:alpine)
    ↓
NYC Trip Assistant (React App)
```
