# 🔓 Solución: Error de Permisos RLS

## ❌ Problema Detectado

El error en la consola muestra:
```
new row violates row-level security policy for table "trips"
```

Esto significa que **Row Level Security (RLS)** está bloqueando las inserciones porque no hay políticas configuradas.

---

## ✅ Solución Rápida (Recomendada para Desarrollo)

### Ejecuta este SQL en Supabase:

1. Ve a tu panel de Supabase
2. **SQL Editor** → **New Query**
3. Copia y pega:

```sql
-- Deshabilitar RLS para acceso público total
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE days DISABLE ROW LEVEL SECURITY;
ALTER TABLE stops DISABLE ROW LEVEL SECURITY;
```

4. **Run** (Ejecutar)
5. Recarga la app en el navegador

---

## 🔐 Solución Alternativa (Con RLS Activo)

Si prefieres mantener RLS activo pero con acceso público:

```sql
-- Habilitar RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

-- TRIPS: Políticas públicas
CREATE POLICY "Public access" ON trips FOR ALL USING (true) WITH CHECK (true);

-- DAYS: Políticas públicas
CREATE POLICY "Public access" ON days FOR ALL USING (true) WITH CHECK (true);

-- STOPS: Políticas públicas
CREATE POLICY "Public access" ON stops FOR ALL USING (true) WITH CHECK (true);
```

---

## 🎯 ¿Cuál Usar?

### Opción 1: DISABLE RLS (Más Simple)
- ✅ Perfecto para desarrollo
- ✅ Perfecto para uso personal
- ✅ Sin complicaciones
- ⚠️ Cualquiera con la URL puede acceder

### Opción 2: RLS con Políticas Públicas
- ✅ Más "correcto" técnicamente
- ✅ Preparado para futuras mejoras
- ⚠️ Requiere más configuración

---

## 📝 Para Producción (Futuro)

Cuando quieras implementar usuarios con autenticación:

```sql
-- Habilitar autenticación
ALTER TABLE trips ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Política por usuario
CREATE POLICY "Users see own trips" 
ON trips FOR ALL 
USING (auth.uid() = user_id);
```

---

## ✨ Después de Ejecutar el Script

1. Recarga la app: `http://localhost:5173`
2. Intenta crear un viaje de nuevo
3. Debería funcionar perfectamente ✅
