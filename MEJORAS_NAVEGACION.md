# 🗺️ Mejoras de Navegación y Gestión

He implementado las nuevas funcionalidades solicitadas:

## 1. 🍔 Menú Hamburguesa Nativo
Un menú lateral deslizable que ofrece acceso rápido a la gestión de la aplicación.
- **Ubicación:** Botón flotante superior izquierdo (estilo app nativa).
- **Contenido:**
  - Perfil del viaje (NYC 2026).
  - Acceso directo al "Itinerario del Día".
  - Toggle de Modo Oscuro/Claro.

## 2. 📋 Lista de Itinerario (Gestión Completa)
Una nueva vista de lista completa para gestionar el día sin depender solo del mapa.
- **Acceso:** Desde el menú lateral → "Itinerario del Día".
- **Características:**
  - **Línea de tiempo visual**: Conecta los puntos en orden de visita.
  - **Estado**: Muestra claramente qué está visitado y qué falta.
  - **Acciones Rápidas**:
    - ✅ Marcar como visitado.
    - 🗺️ Ver en el mapa (cierra la lista y centra el mapa).
    - ✏️ Editar detalles.
    - 🗑️ Eliminar parada.
  - **Feedback visual**: Miniaturas de fotos, iconos de categoría y tiempos.

## 3. 🌓 Modo Claro/Oscuro (Toggle)
Ahora el usuario tiene el control total sobre la apariencia.
- **Default:** Modo Claro (Mapa legible estándar).
- **Toggle:** Interruptor en el menú lateral.
- **Efectos:**
  - Cambia el mapa base (Voyager vs Dark Matter).
  - Cambia el color de la ruta (Azul intenso vs Azul neón).
  - Ajusta los botones flotantes para mantener contraste.
  - El resto de la UI (Bottom Sheet, Modales) mantiene el estilo "Dark Brutal" para consistencia y elegancia, pero el mapa se adapta a la preferencia de lectura.

## 📱 Flujo de Usuario Mejorado
1. **Abrir App** → Mapa Claro (Fácil de leer bajo el sol).
2. **Menú** → "Itinerario del Día" → Revisar lista ordenada.
3. **Lista** → Clic en parada → Mapa centra y abre detalles.
4. **Noche** → Menú → Activar Modo Oscuro → Mapa descansa la vista.

Todo está integrado y listo para desplegar.
