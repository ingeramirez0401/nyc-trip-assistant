import Dexie from 'dexie';

// Espejo local (por dispositivo) de lo que el usuario ya vio con señal --
// viajes, días y paradas. Nunca es la fuente de verdad (esa sigue siendo
// Supabase); solo se lee cuando un fetch real falló por red. Se llena por
// escritura directa (bulkPut/put) desde los propios servicios cada vez que
// una lectura online tiene éxito -- ver withOfflineFallback en
// connectivity.js.
export const offlineDb = new Dexie('trippulse-offline');

offlineDb.version(1).stores({
  trips: 'id',
  days: 'id, trip_id',
  stops: 'id, day_id',
});

// Se llama al cerrar sesión -- este espejo vive en el dispositivo, no
// atado a ninguna cuenta; dejarlo entre sesiones en un dispositivo
// compartido filtraría el itinerario de un usuario al siguiente que
// inicie sesión ahí.
export async function clearOfflineDb() {
  await Promise.all([
    offlineDb.trips.clear(),
    offlineDb.days.clear(),
    offlineDb.stops.clear(),
  ]);
}
