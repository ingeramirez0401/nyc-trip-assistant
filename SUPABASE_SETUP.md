# 🚀 Guía de Configuración de Supabase

Esta guía te llevará paso a paso para configurar Supabase en tu aplicación NYC Trip Assistant.

---

## 📋 Requisitos Previos

- Cuenta de Supabase (gratuita o de pago)
- Acceso a tu servidor donde está instalado Supabase
- Node.js y npm instalados

---

## 🔧 Paso 1: Crear las Tablas en Supabase

### Opción A: Usando el SQL Editor de Supabase

1. Ve a tu panel de Supabase: `https://app.supabase.com` (o tu URL de servidor)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**
5. Copia y pega el contenido completo del archivo `supabase/schema.sql`
6. Haz clic en **Run** (o presiona `Ctrl + Enter`)
7. Verifica que todas las tablas se hayan creado correctamente

### Opción B: Usando psql (Línea de Comandos)

```bash
# Conéctate a tu base de datos Supabase
psql -h tu-host.supabase.co -U postgres -d postgres

# Ejecuta el script
\i supabase/schema.sql
```

### ✅ Verificación

Después de ejecutar el script, deberías ver:
- ✅ Tabla `trips` creada
- ✅ Tabla `days` creada
- ✅ Tabla `stops` creada
- ✅ Bucket `trip-images` creado en Storage
- ✅ Políticas de acceso configuradas
- ✅ Triggers para `updated_at` activos

---

## 🔑 Paso 2: Obtener las Credenciales de Supabase

1. Ve a tu panel de Supabase
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Settings** (⚙️)
4. Haz clic en **API**
5. Copia los siguientes valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: Una clave larga que empieza con `eyJ...`

---

## 🔐 Paso 3: Configurar Variables de Entorno

1. En la raíz del proyecto, copia el archivo `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

2. Abre `.env.local` y reemplaza los valores:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. Ya está en `.gitignore`.

---

## 📦 Paso 4: Instalar Dependencias

Si aún no lo has hecho, instala el cliente de Supabase:

```bash
npm install @supabase/supabase-js
```

---

## 🧪 Paso 5: Probar la Conexión

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la consola del navegador (F12)
3. Deberías ver un mensaje:
   ```
   ✅ Supabase connection successful
   ```

4. Si ves un error, verifica:
   - ✅ Las credenciales en `.env.local` son correctas
   - ✅ El archivo `.env.local` está en la raíz del proyecto
   - ✅ Reiniciaste el servidor después de crear `.env.local`

---

## 🎨 Paso 6: Configurar Storage (Imágenes)

### Verificar Bucket

1. Ve a **Storage** en el panel de Supabase
2. Deberías ver un bucket llamado `trip-images`
3. Si no existe, créalo manualmente:
   - Haz clic en **New Bucket**
   - Nombre: `trip-images`
   - Marca como **Public**

### Configurar Políticas

Si las políticas no se crearon automáticamente:

1. Ve a **Storage** → `trip-images` → **Policies**
2. Crea las siguientes políticas:

**Política de Lectura (SELECT)**:
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-images');
```

**Política de Subida (INSERT)**:
```sql
CREATE POLICY "Anyone can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trip-images');
```

**Política de Eliminación (DELETE)**:
```sql
CREATE POLICY "Anyone can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-images');
```

---

## 🚀 Paso 7: ¡Listo para Usar!

Tu aplicación ahora está completamente integrada con Supabase. Puedes:

1. **Crear viajes**: Desde la pantalla de bienvenida
2. **Configurar días**: Define cuántos días durará tu viaje
3. **Agregar sitios**: Busca y agrega lugares con fotos
4. **Gestionar todo**: Edita, elimina y marca como visitado

---

## 🔄 Migración de Datos Existentes (Opcional)

Si tenías datos en `localStorage`, puedes migrarlos manualmente:

1. Crea un nuevo viaje desde la UI
2. Configura los días
3. Agrega los sitios uno por uno usando la búsqueda

O ejecuta este script en la consola del navegador (ajusta según tus datos):

```javascript
// Ejemplo de migración (ajustar según tu estructura)
const oldData = JSON.parse(localStorage.getItem('itinerary'));
// Luego usa la UI para crear el viaje y agregar sitios
```

---

## 🐛 Solución de Problemas

### Error: "Supabase credentials not found"
- Verifica que `.env.local` existe y tiene las credenciales correctas
- Reinicia el servidor de desarrollo

### Error: "Failed to fetch"
- Verifica que la URL de Supabase es correcta
- Verifica que tu servidor Supabase está activo
- Revisa las políticas de CORS si usas un dominio personalizado

### Las imágenes no se suben
- Verifica que el bucket `trip-images` existe
- Verifica que las políticas de Storage están configuradas
- Revisa la consola del navegador para errores específicos

### No se crean las tablas
- Verifica que ejecutaste el script SQL completo
- Revisa los logs de Supabase para errores
- Asegúrate de tener permisos de administrador

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## 🎉 ¡Felicidades!

Tu aplicación ahora está respaldada por una base de datos real y escalable. Todos tus viajes, días y sitios se guardan automáticamente en Supabase.
