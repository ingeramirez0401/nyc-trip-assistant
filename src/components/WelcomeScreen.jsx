import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { dayService } from '../services/dayService';
import { stopService } from '../services/stopService';
import { generateItinerary } from '../services/aiService';
import LocationSearchInput from './LocationSearchInput';
import AIItineraryGenerator from './AIItineraryGenerator';
import LoginScreen from './auth/LoginScreen';
import PlansSection from './PlansSection';
import RedeemLicense from './RedeemLicense';
import LandingIntro from './LandingIntro';
import AgencyPitch from './AgencyPitch';
import OnboardingTour from './OnboardingTour';
import SideMenu from './SideMenu';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';
import { licenseService } from '../services/licenseService';
import { notifyActionError } from '../lib/connectivity';

const WelcomeScreen = ({ onSelectTrip, onCreateTrip, isDarkMode, toggleTheme, onOpenAgencyPanel }) => {
  const { user, profile, licenses, refreshLicenses, agencyBranding } = useAuth();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [loginAudience, setLoginAudience] = useState('traveler');
  const [newTripData, setNewTripData] = useState({
    name: '',
    city: '',
    country: '',
    baseLocation: null,
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [openMenuTripId, setOpenMenuTripId] = useState(null);
  const [deletingTripId, setDeletingTripId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [user]); // Reload trips when user auth state changes

  // Tour de bienvenida: una sola vez por viajero, la primera vez que entra.
  useEffect(() => {
    if (user && profile && profile.role !== 'agency_admin' && !profile.has_completed_onboarding) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);
    if (!user) return;
    try {
      await profileService.updateProfile(user.id, { has_completed_onboarding: true });
    } catch (error) {
      console.error('Error guardando estado de onboarding:', error);
    }
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuTripId && !event.target.closest('.trip-menu-container')) {
        setOpenMenuTripId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuTripId]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading trips...');
      
      const data = await tripService.getAll();
      console.log('✅ Trips loaded:', data?.length || 0);
      
      setTrips(data || []);
    } catch (error) {
      console.error('❌ Error loading trips:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      toast.error('Error al cargar los viajes. Por favor recarga la página.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId, tripName) => {
    const confirmDelete = await toast.confirm(`¿Eliminar el viaje "${tripName}"? Esta acción no se puede deshacer.`);
    
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingTripId(tripId);
      console.log('🗑️ Deleting trip:', tripId);
      
      await tripService.delete(tripId);
      
      toast.success(`Viaje "${tripName}" eliminado exitosamente`);
      console.log('✅ Trip deleted successfully');
      
      // Recargar lista de viajes
      await loadTrips();
    } catch (error) {
      console.error('❌ Error deleting trip:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      toast.error(`Error al eliminar el viaje: ${error.message || 'Por favor intenta de nuevo'}`);
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleLocationSelect = (locationData) => {
    setNewTripData({
      ...newTripData,
      city: locationData.city,
      country: locationData.country,
      baseLocation: {
        lat: locationData.lat,
        lng: locationData.lng,
        title: locationData.city,
        desc: locationData.address,
        img: locationData.img,
      }
    });
  };

  const handleStartFree = () => {
    setLoginAudience('traveler');
    setLoginMode('signup');
    setShowLogin(true);
  };

  const handleTravelerLogin = () => {
    setLoginAudience('traveler');
    setLoginMode('login');
    setShowLogin(true);
  };

  const handleAgencyLogin = () => {
    setLoginAudience('agency');
    setLoginMode('login');
    setShowLogin(true);
  };

  // Cupo disponible vía licencia de agencia para un tipo de acción dado.
  // Puede haber hasta una licencia activa por tipo (trips y ai_generations
  // no compiten entre sí). /licenses/my ya filtra por vigencia y cupo
  // restante, pero se revalida acá también por si el estado quedó viejo.
  const findActiveLicense = (quotaType) =>
    licenses.find(
      (l) =>
        l.quota_type === quotaType &&
        l.quota_remaining > 0 &&
        (!l.expires_at || new Date(l.expires_at) > new Date())
    );

  const hasLicenseQuota = (quotaType) => !!findActiveLicense(quotaType);

  const handleStartCreate = () => {
    if (!user) {
      setLoginAudience('traveler');
      setLoginMode('login');
      setShowLogin(true);
      return;
    }
    // Vía libre: VIP, licencia de agencia con cupo de viajes, o dentro del
    // límite de 3 viajes gratuitos del plan Free
    const isFreeTierOk = profile?.tier === 'vip' || trips.length < 3;
    if (!hasLicenseQuota('trips') && !isFreeTierOk) {
      toast.warning('Has alcanzado el límite de 3 viajes gratuitos. ¡Actualiza a VIP o usa tu código de agencia para más!');
      return;
    }
    setShowCreateForm(true);
  };

  const handleOpenAIGenerator = () => {
    if (!user) {
      setLoginAudience('traveler');
      setShowLogin(true);
      return;
    }
    // VIP o licencia de agencia con cupo de generaciones IA
    if (profile?.tier !== 'vip' && !hasLicenseQuota('ai_generations')) {
      toast.info('🔒 La generación con IA es exclusiva para usuarios VIP o con una licencia de agencia. Contáctanos para actualizar tu cuenta.');
      return;
    }
    setShowAIGenerator(true);
  };

  const handleCreateTrip = async () => {
    if (!user) {
      setLoginAudience('traveler');
      setShowLogin(true);
      return;
    }

    if (!newTripData.city.trim()) {
      toast.warning('Por favor busca y selecciona una ubicación');
      return;
    }

    try {
      const tripName = newTripData.name.trim() || `Viaje a ${newTripData.city}`;
      
      console.log('🚀 Creating trip with data:', {
        name: tripName,
        city: newTripData.city,
        country: newTripData.country || null,
        baseLocation: newTripData.baseLocation,
        user_id: user.id
      });
      
      const trip = await tripService.create({
        name: tripName,
        city: newTripData.city,
        country: newTripData.country || null,
        baseLocation: newTripData.baseLocation,
        user_id: user.id,
      });
      
      // Track usage
      await profileService.incrementTripCount(user.id);
      if (hasLicenseQuota('trips')) {
        await licenseService.consumeQuota('trips');
        await refreshLicenses();
      }

      toast.success('¡Viaje creado exitosamente!');
      console.log('✅ Trip created successfully:', trip);
      setShowCreateForm(false);
      setNewTripData({ name: '', city: '', country: '', baseLocation: null });
      // Flujo manual: ir a TripSetup para configurar días
      onCreateTrip(trip);
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      notifyActionError(toast, error, 'Error al crear el viaje');
    }
  };

  const handleGenerateWithAI = async ({ numDays, interests, budget, baseLocation }) => {
    if (!user) {
      setLoginAudience('traveler');
      setShowLogin(true);
      return;
    }

    try {
      setGeneratingAI(true);
      console.log('🤖 Generando itinerario con IA...');

      // Usar la ubicación base específica si se seleccionó, o la genérica de la ciudad
      const tripBaseLocation = baseLocation || newTripData.baseLocation;

      // Generar itinerario con IA
      const itinerary = await generateItinerary({
        city: newTripData.city,
        country: newTripData.country,
        numDays,
        interests,
        budget
      });

      console.log('✅ Itinerario generado:', itinerary);

      // Track AI usage
      await profileService.incrementAIUsage(user.id);
      if (hasLicenseQuota('ai_generations')) {
        await licenseService.consumeQuota('ai_generations');
        await refreshLicenses();
      }

      // Crear el viaje
      const tripName = newTripData.name.trim() || `Viaje a ${newTripData.city}`;
      const trip = await tripService.create({
        name: tripName,
        city: newTripData.city,
        country: newTripData.country || null,
        baseLocation: tripBaseLocation,
        user_id: user.id
      });

      // Track usage
      await profileService.incrementTripCount(user.id);

      console.log('✅ Trip created:', trip.id);

      // Crear días y lugares
      for (const day of itinerary.days) {
        const createdDay = await dayService.create({
          tripId: trip.id,
          dayNumber: day.dayNumber,
          title: day.title,
          color: day.color
        });

        console.log(`✅ Day ${day.dayNumber} created:`, createdDay.id);

        // Crear lugares para este día
        for (const stop of day.stops) {
          await stopService.create({
            dayId: createdDay.id,
            title: stop.title,
            lat: stop.lat,
            lng: stop.lng,
            category: stop.category,
            img: stop.title, // Usará generación de IA de imágenes
            tip: stop.tip,
            time: stop.time,
            address: stop.address
          });
        }
      }

      toast.success('¡Itinerario generado con éxito!');
      console.log('✅ Itinerario completo creado');
      setShowAIGenerator(false);
      setShowCreateForm(false);
      setNewTripData({ name: '', city: '', country: '', baseLocation: null });
      // Llamar onSelectTrip en lugar de onCreateTrip para ir directo al mapa
      onSelectTrip(trip);

    } catch (error) {
      console.error('❌ Error generando itinerario:', error);

      // Sin señal, ofrecer "crearlo manual" es una salida falsa -- esa
      // ruta también necesita red (tripService.create) y fallaría por lo
      // mismo. Se corta acá con el aviso claro en vez del diálogo de
      // fallback que solo iba a repetir el problema.
      if (error.isOfflineError) {
        toast.warning(error.message);
        return;
      }

      // Fallback manual
      if (await toast.confirm('Hubo un problema al generar el itinerario con IA. ¿Deseas crear el viaje manualmente y configurarlo tú mismo?')) {
        try {
          const tripName = newTripData.name.trim() || `Viaje a ${newTripData.city}`;
          const tripBaseLocation = baseLocation || newTripData.baseLocation;

          const trip = await tripService.create({
            name: tripName,
            city: newTripData.city,
            country: newTripData.country || null,
            baseLocation: tripBaseLocation,
            user_id: user.id
          });

          // Track usage
          await profileService.incrementTripCount(user.id);
          if (hasLicenseQuota('trips')) {
            await licenseService.consumeQuota('trips');
            await refreshLicenses();
          }

          console.log('✅ Trip created manually (fallback):', trip);
          setShowAIGenerator(false);
          setShowCreateForm(false);
          setNewTripData({ name: '', city: '', country: '', baseLocation: null });
          onCreateTrip(trip);
        } catch (createError) {
          console.error('Error creating trip manually:', createError);
          toast.error('Error al crear el viaje. Por favor intenta de nuevo.');
        }
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando viajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 overflow-y-auto transition-colors duration-300">
      {/* Barra superior fija: logo + acceso. El botón de "Iniciar sesión"
          vive acá, siempre visible sin importar el scroll. Reemplaza los
          botones flotantes sueltos que había antes (menú de cuenta y tema). */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className={`flex items-center justify-between gap-3 rounded-2xl px-3 sm:px-4 py-2.5 backdrop-blur-xl border shadow-lg shadow-black/5 transition-colors ${isDarkMode ? 'bg-slate-900/30 border-white/10' : 'bg-white/30 border-slate-200/60'}`}>
            {/* Marca */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-700)] rounded-lg flex items-center justify-center shadow-md shrink-0">
                {agencyBranding?.logo_url ? (
                  <img src={agencyBranding.logo_url} alt={agencyBranding.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <i className="fas fa-route text-sm text-white"></i>
                )}
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">TripPulse</span>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${isDarkMode ? 'bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              {!user ? (
                <>
                  <button
                    onClick={handleTravelerLogin}
                    className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'}`}
                  >
                    <i className="fas fa-right-to-bracket mr-2"></i>
                    Iniciar sesión
                  </button>
                  <button
                    onClick={handleStartFree}
                    className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-95 transition-all"
                  >
                    <i className="fas fa-rocket mr-2"></i>
                    Crear cuenta gratis
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsMenuOpen(true)}
                  title="Mi cuenta"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${isDarkMode ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <i className="fas fa-bars"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-dvh flex flex-col items-center justify-center p-6 pt-28 md:pt-32">
        
        {/* Header -- el logo/color de la agencia (si el viajero llegó vía
            una licencia) reemplaza el ícono y tiñe el degradé vía las
            variables --brand-*, que AuthContext ya dejó puestas en :root. */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in-down">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-700)] rounded-2xl md:rounded-[2rem] mx-auto mb-4 md:mb-6 flex items-center justify-center shadow-2xl shadow-blue-900/50 transform rotate-3 hover:rotate-6 transition-transform duration-500 border border-white/10 overflow-hidden">
            {agencyBranding?.logo_url ? (
              <img src={agencyBranding.logo_url} alt={agencyBranding.name} className="w-full h-full object-cover" />
            ) : (
              <img src="/icons/icon-192x192.png" alt="TripPulse" className="w-full h-full object-cover" />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] dark:from-white dark:via-blue-100 dark:to-blue-200 mb-2 md:mb-4 tracking-tight drop-shadow-lg">TripPulse</h1>
          <p className="text-slate-600 dark:text-blue-300 text-base md:text-lg font-medium tracking-wide">Descubre. Planifica. Vive.</p>
        </div>

        {/* El acceso (Iniciar sesión / Crear cuenta) ahora vive fijo en la
            barra superior, siempre visible. Acá el hero deja paso directo
            al contenido de la landing. */}

        {/* Marca de la agencia que regaló el acceso */}
        {agencyBranding && (
          <div
            className="flex items-center gap-2.5 mb-8 -mt-4 px-4 py-2 rounded-full bg-white dark:bg-white/5 border shadow-sm animate-fade-in-down"
            style={{ borderColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(agencyBranding.primary_color || '') ? agencyBranding.primary_color : undefined }}
          >
            {agencyBranding.logo_url && (
              <img src={agencyBranding.logo_url} alt={agencyBranding.name} className="w-6 h-6 rounded-full object-cover" />
            )}
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Un regalo de <span className="text-slate-900 dark:text-white">{agencyBranding.name}</span>
            </span>
          </div>
        )}

        {/* Estado de licencia activa -- antes esto solo se veía dentro del
            menú lateral (había que abrirlo para notarlo), que fue parte del
            problema real: un viajero con licencia activada no tenía forma
            de confirmarlo de un vistazo al entrar. Ahora se ve de una vez
            en la pantalla principal, apenas hay sesión. */}
        {user && profile?.role !== 'agency_admin' && licenses.length > 0 && !showCreateForm && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 -mt-2 animate-fade-in-down">
            {licenses.map((lic) => (
              <div
                key={lic.id}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 shadow-sm"
              >
                <i className="fas fa-ticket text-green-600 dark:text-green-400 text-sm"></i>
                <span className="text-xs font-bold text-green-700 dark:text-green-400">
                  {lic.quota_remaining}/{lic.quota_amount} {lic.quota_type === 'trips' ? 'viajes' : 'gen. IA'}
                </span>
                {lic.expires_at && (
                  <span className="text-[11px] text-green-600/70 dark:text-green-400/60">
                    · vence {new Date(lic.expires_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Landing: hero + propuesta de valor, solo para visitantes sin cuenta */}
        {!user && !showCreateForm && <LandingIntro />}

        {/* Sección viajeros: planes + canje de licencia */}
        <div id="viajeros" className="scroll-mt-24 w-full flex flex-col items-center">
          {!user && !showCreateForm && (
            <PlansSection onStartFree={handleStartFree} onLogin={handleTravelerLogin} />
          )}

          {/* Canje de licencia de agencia: mientras le quede al menos un tipo
              de cupo por activar (trips y ai_generations no compiten) */}
          {profile?.role !== 'agency_admin' &&
            !showCreateForm &&
            ['trips', 'ai_generations'].some((t) => !licenses.some((l) => l.quota_type === t)) && (
              <RedeemLicense onRedeemed={loadTrips} />
            )}
        </div>

        {/* Sección agencias: propuesta de valor + acceso, solo para visitantes sin cuenta */}
        {!user && !showCreateForm && <AgencyPitch onAgencyLogin={handleAgencyLogin} />}

        {/* Trips List or Empty State (solo con sesión activa) */}
        {user && trips.length === 0 && !showCreateForm ? (
          <div className="max-w-md w-full text-center mb-8">
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-12 mb-6 shadow-xl dark:shadow-none">
              <i className="fas fa-map-marked-alt text-6xl text-blue-400 mb-6 opacity-50"></i>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">¡Bienvenido!</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Aún no tienes viajes planeados. Comienza creando tu primer itinerario.
              </p>
            </div>
          </div>
        ) : user && !showCreateForm ? (
          <div className="max-w-2xl w-full mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Tus Viajes</h2>
            <div className="grid gap-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-lg dark:hover:bg-white/10 transition-all group relative"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onSelectTrip(trip)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
                        <i className="fas fa-map-pin text-2xl text-white"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate mb-1">{trip.name}</h3>
                        <p className="text-slate-500 dark:text-blue-300 text-sm">
                          <i className="fas fa-location-dot mr-2"></i>
                          {trip.city}{trip.country ? `, ${trip.country}` : ''}
                        </p>
                      </div>
                      <i className="fas fa-chevron-right text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"></i>
                    </button>
                    <div className="relative trip-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuTripId(openMenuTripId === trip.id ? null : trip.id);
                        }}
                        className={`w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center ${openMenuTripId === trip.id ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuTripId === trip.id && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                          <div className="p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrip(trip.id, trip.name);
                                setOpenMenuTripId(null);
                              }}
                              disabled={deletingTripId === trip.id}
                              className="w-full px-4 py-2.5 text-left text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingTripId === trip.id ? (
                                <>
                                  <i className="fas fa-spinner fa-spin w-4"></i>
                                  <span>Eliminando...</span>
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-trash-alt w-4"></i>
                                  <span>Eliminar Viaje</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Create Form */}
        {showCreateForm ? (
          <div className="max-w-md w-full bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 animate-fade-in shadow-xl dark:shadow-none">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Nuevo Viaje</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Buscar Destino *
                </label>
                <LocationSearchInput
                  onLocationSelect={handleLocationSelect}
                  placeholder="Busca tu ciudad o destino..."
                />
                {newTripData.baseLocation && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                      <i className="fas fa-check-circle"></i>
                      <span className="font-medium">{newTripData.city}</span>
                      {newTripData.country && <span className="text-green-600/70 dark:text-green-500/70">• {newTripData.country}</span>}
                    </p>
                    <p className="text-green-600/50 dark:text-green-500/50 text-xs mt-1">
                      📍 {newTripData.baseLocation.lat.toFixed(4)}, {newTripData.baseLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Nombre del Viaje (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Vacaciones de Verano 2026"
                  value={newTripData.name}
                  onChange={(e) => setNewTripData({ ...newTripData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTripData({ name: '', city: '', country: '', baseLocation: null });
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenAIGenerator}
                className="flex-[2] bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-wand-magic-sparkles"></i>
                <span>Generar con IA</span>
              </button>
              <button
                onClick={handleCreateTrip}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Manual
              </button>
            </div>
          </div>
        ) : user ? (
          <button
            onClick={handleStartCreate}
            className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-95 transition-all w-full md:w-auto"
          >
            <i className="fas fa-plus-circle mr-2 md:mr-3"></i>
            Crear Nuevo Viaje
          </button>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 dark:text-slate-300 text-sm">
          <p>Planifica, explora y disfruta cada momento</p>
        </div>
      </div>

      {/* Tour de bienvenida */}
      {showOnboarding && <OnboardingTour onComplete={handleCompleteOnboarding} />}

      {/* AI Generator Modal */}
      {showAIGenerator && newTripData.baseLocation && (
        <AIItineraryGenerator
          city={newTripData.city}
          country={newTripData.country}
          onGenerate={handleGenerateWithAI}
          onCancel={() => setShowAIGenerator(false)}
        />
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginScreen
          initialMode={loginMode}
          audience={loginAudience}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => {
            setShowLogin(false);
            // Optionally refresh data or show success message
          }}
        />
      )}

      {/* Account Menu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        hasActiveTrip={false}
        onOpenList={() => {}}
        onExitTrip={() => {}}
        onOpenAgencyPanel={onOpenAgencyPanel}
      />
    </div>
  );
};

export default WelcomeScreen;
