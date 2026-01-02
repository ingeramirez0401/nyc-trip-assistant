export const baseLocation = { 
  lat: 40.7592, 
  lng: -73.9846, 
  title: "Hotel RIU Plaza Times Square", 
  desc: "Nuestra Base de Operaciones",
  img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80" 
};

export const initialItinerary = [
  {
    id: 1, 
    title: "Iconos de Midtown", 
    color: "#ef4444",
    stops: [
      { 
        id: "s1-1", 
        lat: 40.7580, 
        lng: -73.9855, 
        title: "Times Square", 
        cat: "Icono", 
        img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80", 
        tip: "Mejor vista desde las escaleras rojas TKTS.", 
        time: "45 min" 
      },
      { 
        id: "s1-2", 
        lat: 40.7532, 
        lng: -73.9822, 
        title: "NY Public Library", 
        cat: "Cultura", 
        img: "https://images.unsplash.com/photo-1551042784-0761e1fa429f?w=800&q=80", 
        tip: "Entra a ver la Rose Main Reading Room (3er piso).", 
        time: "1 hora" 
      },
      { 
        id: "s1-3", 
        lat: 40.7536, 
        lng: -73.9832, 
        title: "Bryant Park", 
        cat: "Relax", 
        img: "https://images.unsplash.com/photo-1510908072721-6fbd31198610?w=800&q=80", 
        tip: "Ideal para tomar un café y descansar pies.", 
        time: "30 min" 
      },
      { 
        id: "s1-4", 
        lat: 40.7484, 
        lng: -73.9857, 
        title: "Empire State", 
        cat: "Vista", 
        img: "https://images.unsplash.com/photo-1550664776-5a7a7837053e?w=800&q=80", 
        tip: "La foto clásica se toma desde abajo.", 
        time: "15 min" 
      },
      { 
        id: "s1-5", 
        lat: 40.7527, 
        lng: -73.9772, 
        title: "SUMMIT One", 
        cat: "Experiencia", 
        img: "https://images.unsplash.com/photo-1662998394986-e0474668b577?w=800&q=80", 
        tip: "Lleva gafas de sol, el reflejo es muy fuerte.", 
        time: "2 horas" 
      },
      { 
        id: "s1-6", 
        lat: 40.7587, 
        lng: -73.9787, 
        title: "Rockefeller Center", 
        cat: "Icono", 
        img: "https://images.unsplash.com/photo-1543714909-0d195679905d?w=800&q=80", 
        tip: "Busca la estatua de Atlas en la entrada.", 
        time: "30 min" 
      }
    ]
  },
  {
    id: 2, 
    title: "Central Park & Lujo", 
    color: "#10b981",
    stops: [
      { 
        id: "s2-1", 
        lat: 40.7644, 
        lng: -73.9738, 
        title: "Central Park", 
        cat: "Naturaleza", 
        img: "https://images.unsplash.com/photo-1585860472019-95e3477150a8?w=800&q=80", 
        tip: "Alquila bici o camina hacia Bethesda Terrace.", 
        time: "3 horas" 
      },
      { 
        id: "s2-2", 
        lat: 40.7648, 
        lng: -73.9730, 
        title: "Apple 5th Ave", 
        cat: "Shopping", 
        img: "https://images.unsplash.com/photo-1594910398032-680456c63b65?w=800&q=80", 
        tip: "Abierto 24/7, increíble arquitectura de cristal.", 
        time: "20 min" 
      },
      { 
        id: "s2-3", 
        lat: 40.7789, 
        lng: -73.9637, 
        title: "MET Museum", 
        cat: "Arte", 
        img: "https://images.unsplash.com/photo-1629837905872-c515a45b6342?w=800&q=80", 
        tip: "No te pierdas el Templo de Dendur.", 
        time: "3+ horas" 
      }
    ]
  },
  {
    id: 3, 
    title: "Historia Natural", 
    color: "#3b82f6",
    stops: [
      { 
        id: "s3-1", 
        lat: 40.7813, 
        lng: -73.9735, 
        title: "Museo Hist. Natural", 
        cat: "Museo", 
        img: "https://images.unsplash.com/photo-1584952085794-2794c489b02c?w=800&q=80", 
        tip: "La sala de la ballena azul es obligatoria.", 
        time: "3 horas" 
      },
      { 
        id: "s3-2", 
        lat: 40.7756, 
        lng: -73.9761, 
        title: "Upper West Side", 
        cat: "Paseo", 
        img: "https://images.unsplash.com/photo-1559828854-8e42f993d05e?w=800&q=80", 
        tip: "Arquitectura clásica neoyorquina de películas.", 
        time: "1 hora" 
      }
    ]
  },
  {
    id: 4, 
    title: "Downtown Vibes", 
    color: "#f97316",
    stops: [
      { 
        id: "s4-1", 
        lat: 40.7240, 
        lng: -74.0000, 
        title: "SoHo", 
        cat: "Moda", 
        img: "https://images.unsplash.com/photo-1555541604-5834928b9cb9?w=800&q=80", 
        tip: "Edificios de hierro fundido y tiendas de diseño.", 
        time: "2 horas" 
      },
      { 
        id: "s4-2", 
        lat: 40.7158, 
        lng: -73.9970, 
        title: "Chinatown", 
        cat: "Cultura", 
        img: "https://images.unsplash.com/photo-1534947963628-973715d97f22?w=800&q=80", 
        tip: "Compra souvenirs baratos aquí.", 
        time: "1 hora" 
      },
      { 
        id: "s4-3", 
        lat: 40.7127, 
        lng: -74.0134, 
        title: "One World Trade", 
        cat: "Icono", 
        img: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=800&q=80", 
        tip: "La zona más moderna y conmovedora.", 
        time: "1 hora" 
      },
      { 
        id: "s4-4", 
        lat: 40.7115, 
        lng: -74.0134, 
        title: "9/11 Memorial", 
        cat: "Memoria", 
        img: "https://images.unsplash.com/photo-1566847844007-8e622941584d?w=800&q=80", 
        tip: "Silencio y respeto. Muy impactante.", 
        time: "45 min" 
      }
    ]
  },
  {
    id: 5, 
    title: "Brooklyn Iconic", 
    color: "#8b5cf6",
    stops: [
      { 
        id: "s5-1", 
        lat: 40.7061, 
        lng: -73.9969, 
        title: "Brooklyn Bridge", 
        cat: "Icono", 
        img: "https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80", 
        tip: "Cruza caminando al atardecer para mejores fotos.", 
        time: "1 hora" 
      },
      { 
        id: "s5-2", 
        lat: 40.7033, 
        lng: -73.9881, 
        title: "DUMBO", 
        cat: "Foto", 
        img: "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?w=800&q=80", 
        tip: "Foto clásica del puente entre edificios de ladrillo.", 
        time: "1 hora" 
      },
      { 
        id: "s5-3", 
        lat: 40.8296, 
        lng: -73.9262, 
        title: "Yankee Stadium", 
        cat: "Deporte", 
        img: "https://images.unsplash.com/photo-1518175066347-9755b412e612?w=800&q=80", 
        tip: "Aunque no haya juego, la tienda es genial.", 
        time: "1.5 horas" 
      }
    ]
  }
];
