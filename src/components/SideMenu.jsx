import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import LoginScreen from './auth/LoginScreen';

const SideMenu = ({ isOpen, onClose, isDarkMode, toggleTheme, onOpenList, onExitTrip }) => {
  const { user, profile, signOut } = useAuth();
  const toast = useToast();
  const [showLogin, setShowLogin] = useState(false);

  const handleSignOut = async () => {
    if (await toast.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await signOut();
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-[280px] z-[2001] bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header - User Profile or Brand */}
        <div className="p-6 pt-12 border-b border-white/10 bg-gradient-to-br from-slate-800 to-slate-900">
          {user ? (
            <div className="flex items-center gap-3 mb-2">
               <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 text-lg font-bold">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-white tracking-tight truncate">
                    {profile?.full_name || 'Usuario'}
                  </h1>
                  <p className="text-xs text-blue-400 font-medium truncate">{user.email}</p>
                  {profile?.tier === 'vip' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-bold border border-amber-500/30">
                      VIP
                    </span>
                  )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
               <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg ring-2 ring-white/10">
                  <i className="fas fa-heart-pulse"></i>
              </div>
              <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">TripPulse</h1>
                  <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Tu Ritmo, Tu Viaje</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4 overflow-y-auto">
            {!user && (
              <button 
                  onClick={() => setShowLogin(true)}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group mb-2"
              >
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fas fa-sign-in-alt"></i>
                  </div>
                  <div>
                      <span className="font-bold block">Iniciar Sesión</span>
                      <span className="text-xs text-slate-400">Guarda tus viajes</span>
                  </div>
                  <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
              </button>
            )}

            <div className="px-4 mb-2 mt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Navegación</p>
            </div>
            
            <button 
                onClick={() => {
                    onOpenList();
                    onClose();
                }}
                className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group"
            >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-list-ul"></i>
                </div>
                <div>
                    <span className="font-bold block">Itinerario del Día</span>
                    <span className="text-xs text-slate-400">Ver y gestionar paradas</span>
                </div>
                <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
            </button>

            <button 
                onClick={async () => {
                    if (await toast.confirm('¿Salir de este viaje y volver al selector?')) {
                        onExitTrip();
                        onClose();
                    }
                }}
                className="w-full text-left px-6 py-4 hover:bg-red-500/10 transition-colors flex items-center gap-4 text-white group"
            >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-arrow-left"></i>
                </div>
                <div>
                    <span className="font-bold block">Cambiar de Viaje</span>
                    <span className="text-xs text-slate-400">Volver al selector</span>
                </div>
                <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
            </button>

            <div className="my-4 border-t border-white/5 mx-6"></div>

            <div className="px-4 mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Configuración</p>
            </div>

            <button 
                onClick={toggleTheme}
                className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-white'}`}>
                    <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </div>
                <div>
                    <span className="font-bold block">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    <span className="text-xs text-slate-400">Cambiar apariencia del mapa</span>
                </div>
                
                {/* Switch Toggle */}
                <div className={`ml-auto w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </button>

            {user && (
              <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-slate-400 hover:text-white group mt-4"
              >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                      <i className="fas fa-sign-out-alt"></i>
                  </div>
                  <div>
                      <span className="font-bold block">Cerrar Sesión</span>
                  </div>
              </button>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-500">
                Hecho con <i className="fas fa-heart text-red-500 mx-1"></i> para viajeros
            </p>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginScreen 
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => setShowLogin(false)}
        />
      )}
    </>
  );
};

export default SideMenu;
