// Script para desregistrar service workers existentes
// Esto limpiará la caché de PWA en navegadores de usuarios
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('✅ Service Worker unregistered successfully');
        }
      });
    }
  });

  // Limpiar todas las cachés
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        caches.delete(cacheName).then(function(success) {
          if (success) {
            console.log('✅ Cache deleted:', cacheName);
          }
        });
      });
    });
  }
}
