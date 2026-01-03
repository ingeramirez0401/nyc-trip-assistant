-- Verificar constraints y estructura de la tabla trips
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'trips';

-- Test manual de inserción con los datos exactos
INSERT INTO trips (name, city, country)
VALUES ('Vacaciones Soñadas', 'Nueva York', 'USA')
RETURNING *;

-- Limpiar
DELETE FROM trips WHERE name = 'Vacaciones Soñadas';
