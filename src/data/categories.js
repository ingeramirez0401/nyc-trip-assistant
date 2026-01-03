export const categories = [
  { id: 'icono', name: 'Icono', icon: 'fa-landmark', color: '#ef4444' },
  { id: 'cultura', name: 'Cultura', icon: 'fa-book', color: '#8b5cf6' },
  { id: 'relax', name: 'Relax', icon: 'fa-leaf', color: '#10b981' },
  { id: 'vista', name: 'Vista', icon: 'fa-eye', color: '#3b82f6' },
  { id: 'experiencia', name: 'Experiencia', icon: 'fa-star', color: '#f59e0b' },
  { id: 'naturaleza', name: 'Naturaleza', icon: 'fa-tree', color: '#22c55e' },
  { id: 'arte', name: 'Arte', icon: 'fa-palette', color: '#ec4899' },
  { id: 'museo', name: 'Museo', icon: 'fa-building-columns', color: '#6366f1' },
  { id: 'paseo', name: 'Paseo', icon: 'fa-walking', color: '#14b8a6' },
  { id: 'moda', name: 'Moda', icon: 'fa-shirt', color: '#a855f7' },
  { id: 'memoria', name: 'Memoria', icon: 'fa-heart', color: '#64748b' },
  { id: 'foto', name: 'Foto', icon: 'fa-camera', color: '#06b6d4' },
  { id: 'deporte', name: 'Deporte', icon: 'fa-baseball', color: '#f97316' },
  { id: 'restaurante', name: 'Restaurante', icon: 'fa-utensils', color: '#dc2626' },
  { id: 'compras', name: 'Compras', icon: 'fa-shopping-bag', color: '#7c3aed' },
  { id: 'monumento', name: 'Monumento', icon: 'fa-monument', color: '#78716c' },
  { id: 'historia', name: 'Historia', icon: 'fa-scroll', color: '#92400e' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: 'fa-ticket', color: '#db2777' },
  { id: 'interes', name: 'Interés', icon: 'fa-map-pin', color: '#059669' }
];

export const getCategoryById = (id) => {
  const normalized = id?.toLowerCase();
  return categories.find(cat => cat.id === normalized) || categories[categories.length - 1];
};

export const getCategoryIcon = (categoryName) => {
  const normalized = categoryName?.toLowerCase();
  const category = categories.find(cat => 
    cat.id === normalized || cat.name.toLowerCase() === normalized
  );
  return category || categories[categories.length - 1];
};
