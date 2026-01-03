# 🐳 Comandos Docker para TripPulse

## 📦 Build de la Imagen

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com \
  --build-arg VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key \
  --build-arg VITE_SUPABASE_SERVICE_KEY=tu_supabase_service_key \
  --build-arg VITE_SUPABASE_JWT_SECRET=tu_supabase_jwt_secret \
  --build-arg VITE_OPENAI_API_KEY=tu_openai_api_key \
  -t trippulse:latest \
  -t trippulse:1.0.0 \
  .
```

## 🚀 Publish a Docker Hub

### 1. Login en Docker Hub
```bash
docker login
```

### 2. Tag de la imagen (si usas otro registry)
```bash
# Para Docker Hub
docker tag trippulse:latest tu-usuario/trippulse:latest
docker tag trippulse:1.0.0 tu-usuario/trippulse:1.0.0

# Para otro registry (ej: AWS ECR, Google GCR)
docker tag trippulse:latest registry.ejemplo.com/trippulse:latest
```

### 3. Push de la imagen
```bash
# Docker Hub
docker push tu-usuario/trippulse:latest
docker push tu-usuario/trippulse:1.0.0

# Otro registry
docker push registry.ejemplo.com/trippulse:latest
```

## 🧪 Probar Localmente

```bash
docker run -d \
  -p 8080:80 \
  --name trippulse-app \
  trippulse:latest
```

Luego abre: http://localhost:8080

## 🛑 Detener y Limpiar

```bash
# Detener contenedor
docker stop trippulse-app

# Eliminar contenedor
docker rm trippulse-app

# Eliminar imagen
docker rmi trippulse:latest
```

## 📝 Notas Importantes

1. **Variables de Entorno:** Reemplaza los valores de ejemplo con tus credenciales reales.
2. **Seguridad:** Nunca hagas commit de las API keys en el código. Úsalas solo en build time.
3. **Registry:** Cambia `tu-usuario` por tu username de Docker Hub o la URL de tu registry privado.
4. **Tags:** Usa versionado semántico (1.0.0, 1.0.1, etc.) para mejor control de versiones.

## 🔐 Variables de Entorno Requeridas

- `VITE_SUPABASE_URL`: URL de tu instancia de Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key de Supabase
- `VITE_SUPABASE_SERVICE_KEY`: Service key de Supabase (opcional)
- `VITE_SUPABASE_JWT_SECRET`: JWT secret de Supabase (opcional)
- `VITE_OPENAI_API_KEY`: API key de OpenAI para generación de itinerarios con IA

## 🌐 Deploy en Producción

### Opción 1: Docker Compose
Ver `docker-compose.yml` para deployment con todas las variables.

### Opción 2: Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trippulse
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: trippulse
        image: tu-usuario/trippulse:latest
        ports:
        - containerPort: 80
```

### Opción 3: Cloud Run / App Engine / Elastic Beanstalk
Sube la imagen a tu registry y configura las variables de entorno en la plataforma.
