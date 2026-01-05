# Configuración de Supabase en Portainer para Habilitar Email Signup

## Problema
El registro por email está bloqueado (`Email signups are disabled`) porque el servicio GoTrue (auth) de Supabase tiene deshabilitada esta funcionalidad.

## Solución: Modificar Variables de Entorno

### Paso 1: Acceder al Stack en Portainer
1. Abre **Portainer** en tu navegador
2. Ve a **Stacks** en el menú lateral
3. Busca y selecciona el stack de **Supabase** (probablemente se llama `supabase` o similar)
4. Haz clic en **Editor** para ver el archivo `docker-compose.yml` o YAML del stack

### Paso 2: Localizar el Servicio `auth` (GoTrue)
Busca la sección del servicio de autenticación. Debería verse algo así:

```yaml
services:
  auth:
    image: supabase/gotrue:v2.x.x
    environment:
      # ... otras variables ...
      GOTRUE_DISABLE_SIGNUP: "true"  # <-- ESTA ES LA LÍNEA PROBLEMÁTICA
      # ... más variables ...
```

### Paso 3: Modificar las Variables de Entorno
Necesitas **cambiar o agregar** estas variables en la sección `environment:` del servicio `auth`:

```yaml
auth:
  image: supabase/gotrue:v2.x.x
  environment:
    # CAMBIAR ESTA (si existe):
    GOTRUE_DISABLE_SIGNUP: "false"  # <-- Cambiar de "true" a "false"
    
    # AGREGAR ESTAS (si no existen):
    GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
    ENABLE_SIGNUP: "true"
    
    # Configuración de Email (verificar que existan):
    GOTRUE_SMTP_HOST: "tu-servidor-smtp"
    GOTRUE_SMTP_PORT: "587"
    GOTRUE_SMTP_USER: "tu-email@ejemplo.com"
    GOTRUE_SMTP_PASS: "tu-contraseña"
    GOTRUE_SMTP_ADMIN_EMAIL: "admin@ejemplo.com"
    GOTRUE_MAILER_AUTOCONFIRM: "true"  # <-- IMPORTANTE: Poner en "true" para testing
```

### Paso 4: Configuración Recomendada para Testing
Para facilitar las pruebas, agrega/modifica estas variables:

```yaml
# Desactivar confirmación de email (útil para desarrollo)
GOTRUE_MAILER_AUTOCONFIRM: "true"

# Permitir registros
GOTRUE_DISABLE_SIGNUP: "false"

# Habilitar proveedor de email
GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
```

### Paso 5: Aplicar Cambios
1. Haz clic en **Update the stack** (botón azul en la parte inferior)
2. Portainer reiniciará automáticamente los contenedores afectados
3. Espera 30-60 segundos a que el servicio `auth` se reinicie completamente

### Paso 6: Verificar
1. Ve a tu aplicación TripPulse
2. Intenta crear una cuenta nueva con un email de prueba
3. Deberías poder registrarte sin el error `Email signups are disabled`

---

## Variables Clave Explicadas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GOTRUE_DISABLE_SIGNUP` | `false` | Permite que usuarios nuevos se registren |
| `GOTRUE_EXTERNAL_EMAIL_ENABLED` | `true` | Habilita el proveedor de autenticación por email |
| `GOTRUE_MAILER_AUTOCONFIRM` | `true` | Confirma emails automáticamente (útil para desarrollo) |
| `ENABLE_SIGNUP` | `true` | Flag adicional para habilitar registros |

---

## Troubleshooting

### Si el error persiste después de los cambios:
1. Verifica que el contenedor `auth` se haya reiniciado correctamente en Portainer
2. Revisa los logs del contenedor `auth` para ver errores
3. Asegúrate de que no haya otra variable que esté bloqueando los registros

### Para ver los logs:
1. En Portainer, ve a **Containers**
2. Busca el contenedor `supabase-auth` o similar
3. Haz clic en **Logs** para ver mensajes de error

### Si no tienes SMTP configurado:
Puedes usar `GOTRUE_MAILER_AUTOCONFIRM: "true"` para evitar la necesidad de enviar emails de confirmación durante el desarrollo.

---

## Configuración Mínima para Testing (Sin SMTP)

Si no tienes un servidor SMTP configurado, usa esta configuración mínima:

```yaml
auth:
  environment:
    GOTRUE_DISABLE_SIGNUP: "false"
    GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
    GOTRUE_MAILER_AUTOCONFIRM: "true"  # Confirma automáticamente
    GOTRUE_MAILER_URLPATHS_CONFIRMATION: "/auth/confirm"
```

Esto permitirá registros sin necesidad de verificación por email.
