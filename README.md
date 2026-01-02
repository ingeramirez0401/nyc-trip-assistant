# 🗽 NYC Trip Assistant

Una aplicación web interactiva y moderna para planificar tu viaje de 5 días a Nueva York. Diseñada con una experiencia mobile-first, glassmorphism UI, y funcionalidades completas de gestión de itinerario.

![NYC Trip Assistant](https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80)

## ✨ Características

### 🗺️ Mapa Interactivo
- Mapa de Leaflet con marcadores personalizados
- Visualización de rutas entre lugares
- Geolocalización en tiempo real
- Marcadores que cambian de color al visitar lugares

### 📱 Gestión de Itinerario
- **5 días de itinerario predefinido** con los mejores lugares de NYC
- **Agregar lugares personalizados** mediante búsqueda (OpenStreetMap API)
- **Eliminar lugares** del itinerario
- **Marcar como visitado** con animación de confetti
- **Persistencia local** - tus datos se guardan en el navegador

### 📸 Gestión de Imágenes
- **Imágenes reales de Unsplash** para lugares predefinidos
- **Subir fotos desde tu dispositivo** (cámara o galería)
- **Cambiar fotos** de cualquier lugar en cualquier momento
- **IA generada** como fallback para lugares sin foto (Pollinations.ai)

### 🎨 UI/UX Moderna
- Diseño **glassmorphism** con efectos de blur
- **Bottom sheet** con detalles completos de cada lugar
- **Animaciones fluidas** y transiciones suaves
- **Mobile-first** - optimizado para smartphones
- **Responsive** - funciona en todos los dispositivos

### 🧭 Navegación
- Botón directo a **Google Maps** con indicaciones
- Selector de días con scroll horizontal
- Búsqueda de lugares con autocompletado
- Tips y tiempos sugeridos para cada lugar

## 🛠️ Stack Tecnológico

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rápido
- **Leaflet** - Mapas interactivos
- **Tailwind CSS** - Styling moderno
- **LocalStorage** - Persistencia de datos
- **OpenStreetMap Nominatim** - Búsqueda de lugares
- **Canvas Confetti** - Animaciones celebratorias
- **Docker** - Containerización
- **Nginx** - Web server
- **GitHub Actions** - CI/CD automático

## 🚀 Desarrollo Local

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/ingeramirez0401/nyc-trip-assistant.git
cd nyc-trip-assistant

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## 🐳 Despliegue con Docker

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas de despliegue en producción.

### Build Local

```bash
# Build de la imagen
docker build -t nyc-trip-assistant .

# Ejecutar localmente
docker run -p 8080:80 nyc-trip-assistant
```

### Despliegue en Producción

La aplicación se despliega automáticamente mediante GitHub Actions:

1. Push a `main` → GitHub Actions construye la imagen
2. Imagen se publica en GitHub Container Registry
3. Actualizar el servicio en tu servidor Docker Swarm
4. Acceder a `https://travel.nodalyst.ai`

## 📂 Estructura del Proyecto

```
nyc-trip-assistant/
├── src/
│   ├── components/
│   │   ├── MapComponent.jsx      # Mapa de Leaflet
│   │   ├── BottomSheet.jsx       # Panel de detalles
│   │   ├── DaySelector.jsx       # Selector de días
│   │   └── PlaceSearch.jsx       # Búsqueda de lugares
│   ├── hooks/
│   │   └── useItinerary.js       # Hook de gestión de estado
│   ├── data/
│   │   └── itinerary.js          # Datos del itinerario
│   ├── App.jsx                   # Componente principal
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Estilos globales
├── public/                       # Assets estáticos
├── Dockerfile                    # Configuración Docker
├── docker-compose.yml            # Stack de Docker Swarm
├── nginx.conf                    # Configuración Nginx
└── package.json                  # Dependencias
```

## 🎯 Características Técnicas

### Optimizaciones
- **Code splitting** automático con Vite
- **Lazy loading** de imágenes
- **Cache de assets** estáticos (1 año)
- **Compresión gzip** en nginx
- **Minificación** de JS/CSS
- **Tree shaking** automático

### Seguridad
- Headers de seguridad configurados
- HTTPS con Let's Encrypt
- XSS protection
- Content Security Policy headers

### Performance
- Lighthouse Score: 95+
- First Contentful Paint < 1s
- Time to Interactive < 2s
- Tamaño de bundle optimizado

## 🗺️ Itinerario Incluido

### Día 1: Iconos de Midtown
- Times Square
- NY Public Library
- Bryant Park
- Empire State Building
- SUMMIT One Vanderbilt
- Rockefeller Center

### Día 2: Central Park & Lujo
- Central Park
- Apple 5th Avenue
- MET Museum

### Día 3: Historia Natural
- Museo de Historia Natural
- Upper West Side

### Día 4: Downtown Vibes
- SoHo
- Chinatown
- One World Trade Center
- 9/11 Memorial

### Día 5: Brooklyn Iconic
- Brooklyn Bridge
- DUMBO
- Yankee Stadium

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

**Joel Ramírez**
- GitHub: [@ingeramirez0401](https://github.com/ingeramirez0401)
- Web: [nodalyst.ai](https://nodalyst.ai)

## 🙏 Agradecimientos

- Imágenes de [Unsplash](https://unsplash.com)
- Mapas de [OpenStreetMap](https://www.openstreetmap.org)
- IA de imágenes de [Pollinations.ai](https://pollinations.ai)
- Iconos de [FontAwesome](https://fontawesome.com)

---

**¡Disfruta tu viaje a Nueva York! 🗽✨**
