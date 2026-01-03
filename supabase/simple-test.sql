-- Test simple de inserción
INSERT INTO trips (name, city, country)
VALUES ('Test Simple', 'Test City', 'Test Country')
RETURNING *;

-- Si funciona, eliminar
DELETE FROM trips WHERE name = 'Test Simple';

-- Verificar si hay triggers o funciones que puedan estar causando problemas
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'trips';
