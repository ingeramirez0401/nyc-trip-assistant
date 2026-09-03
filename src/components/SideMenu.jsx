import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { quotaUnitLabel } from '../lib/licenseFormat';
import { LOCALE_MAP } from '../i18n';
import { isSuperAdmin } from '../lib/superAdmin';
import LoginScreen from './auth/LoginScreen';

const LANGUAGES = ['es', 'en'];

const SideMenu = ({ isOpen, onClose, isDarkMode, toggleTheme, onOpenList, onExitTrip, onOpenAgencyPanel, onOpenAdminPanel, hasActiveTrip = true }) => {
  const { t, i18n } = useTranslation(['sideMenu', 'common']);
  const { user, profile, licenses, signOut, agencyBranding, changeLanguage } = useAuth();
  const toast = useToast();
  const [showLogin, setShowLogin] = useState(false);

  const handleSignOut = async () => {
    if (await toast.confirm(t('sideMenu:confirmSignOut'))) {
      const { error } = await signOut();
      // signOut() ya limpia la sesión local pase lo que pase -- esto es
      // solo un aviso de que el servidor no pudo revocar el token (típico
      // si ya estaba vencido), no algo que bloquee salir.
      if (error) {
        console.warn('signOut server-side error (sesión local ya se cerró igual):', error);
      }
      onClose();
    }
  };

  const handleChangeLanguage = async (lang) => {
    if (lang === i18n.language) return;
    const { error } = await changeLanguage(lang);
    if (error) toast.error(error.message);
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
        <div className="p-6 border-b border-white/10 bg-gradient-to-br from-slate-800 to-slate-900" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))' }}>
          {user ? (
            <div className="flex items-center gap-3 mb-2">
               <div
                 className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg ring-2 ring-white/10 text-lg font-bold overflow-hidden ${
                   agencyBranding
                     ? 'bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-700)]'
                     : 'bg-gradient-to-tr from-blue-600 to-purple-500'
                 }`}
               >
                  {agencyBranding?.logo_url ? (
                    <img src={agencyBranding.logo_url} alt={agencyBranding.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                  )}
              </div>
              <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-white tracking-tight truncate">
                    {profile?.full_name || t('sideMenu:defaultUserName')}
                  </h1>
                  <p className="text-xs text-blue-400 font-medium truncate">{user.email}</p>
                  {profile?.tier === 'vip' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-bold border border-amber-500/30">
                      {t('sideMenu:vipBadge')}
                    </span>
                  )}
                  {profile?.role === 'agency_admin' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full font-bold border border-indigo-500/30">
                      {t('sideMenu:agencyBadge')}
                    </span>
                  )}
                  {licenses.map((lic) => (
                    <div
                      key={lic.id}
                      className="inline-flex flex-col mt-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/25 rounded-lg"
                    >
                      <span className="flex items-center gap-1.5 text-green-400 text-[10px] font-bold">
                        <i className="fas fa-ticket"></i>
                        {lic.quota_remaining}/{lic.quota_amount}{' '}
                        {quotaUnitLabel(t, lic.quota_type)}
                      </span>
                      {lic.expires_at && (
                        <span className="text-[9px] text-green-400/70 mt-0.5">
                          {t('sideMenu:license.expiresOn', {
                            date: new Date(lic.expires_at).toLocaleDateString(LOCALE_MAP[i18n.language], {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }),
                          })}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
               <div className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-white/10 overflow-hidden">
                  <img src="/icons/icon-192x192.png" alt="TripPulse" className="w-full h-full object-cover" />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">TripPulse</h1>
                  <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">{t('sideMenu:guestBrand.tagline')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4 overflow-y-auto">
            {!user && (
              <button
                  onClick={() => {
                      setShowLogin(true);
                      onClose();
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group mb-2"
              >
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fas fa-sign-in-alt"></i>
                  </div>
                  <div>
                      <span className="font-bold block">{t('sideMenu:menu.loginLabel')}</span>
                      <span className="text-xs text-slate-400">{t('sideMenu:menu.loginHint')}</span>
                  </div>
                  <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
              </button>
            )}

            {hasActiveTrip && (
              <>
                <div className="px-4 mb-2 mt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">{t('sideMenu:menu.navigationSection')}</p>
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
                        <span className="font-bold block">{t('sideMenu:menu.itineraryLabel')}</span>
                        <span className="text-xs text-slate-400">{t('sideMenu:menu.itineraryHint')}</span>
                    </div>
                    <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
                </button>

                <button
                    onClick={async () => {
                        if (await toast.confirm(t('sideMenu:menu.confirmExitTrip'))) {
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
                    <span className="font-bold block">{t('sideMenu:menu.switchTripLabel')}</span>
                    <span className="text-xs text-slate-400">{t('sideMenu:menu.switchTripHint')}</span>
                </div>
                <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
                </button>
              </>
            )}

            {profile?.role === 'agency_admin' && (
              <button
                  onClick={() => {
                      onOpenAgencyPanel();
                      onClose();
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group"
              >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fas fa-building"></i>
                  </div>
                  <div>
                      <span className="font-bold block">{t('sideMenu:menu.agencyPanelLabel')}</span>
                      <span className="text-xs text-slate-400">{t('sideMenu:menu.agencyPanelHint')}</span>
                  </div>
                  <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
              </button>
            )}

            {isSuperAdmin(user) && (
              <button
                  onClick={() => {
                      onOpenAdminPanel();
                      onClose();
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group"
              >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fas fa-user-shield"></i>
                  </div>
                  <div>
                      <span className="font-bold block">{t('sideMenu:menu.adminPanelLabel')}</span>
                      <span className="text-xs text-slate-400">{t('sideMenu:menu.adminPanelHint')}</span>
                  </div>
                  <i className="fas fa-chevron-right ml-auto text-slate-600 text-xs"></i>
              </button>
            )}

            <div className="my-4 border-t border-white/5 mx-6"></div>

            <div className="px-4 mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">{t('sideMenu:menu.settingsSection')}</p>
            </div>

            <button
                onClick={toggleTheme}
                className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-white group"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-white'}`}>
                    <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </div>
                <div>
                    <span className="font-bold block">{isDarkMode ? t('sideMenu:menu.darkModeOn') : t('sideMenu:menu.darkModeOff')}</span>
                    <span className="text-xs text-slate-400">{t('sideMenu:menu.themeHint')}</span>
                </div>

                {/* Switch Toggle */}
                <div className={`ml-auto w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </button>

            {/* Selector de idioma -- control segmentado en vez de switch
                binario: con 2 idiomas hoy pero pensado para escalar a más,
                un on/off no es la metáfora correcta para "elegir entre N". */}
            <div className="w-full px-6 py-4 flex items-center gap-4 text-white">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <i className="fas fa-globe"></i>
                </div>
                <div className="flex-1">
                    <span className="font-bold block">{t('sideMenu:menu.languageLabel')}</span>
                </div>
                <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => handleChangeLanguage(lang)}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-colors ${
                                i18n.language === lang ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {user && (
              <button
                  onClick={handleSignOut}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors flex items-center gap-4 text-slate-400 hover:text-white group mt-4"
              >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                      <i className="fas fa-sign-out-alt"></i>
                  </div>
                  <div>
                      <span className="font-bold block">{t('sideMenu:menu.signOut')}</span>
                  </div>
              </button>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-slate-500">
                {t('sideMenu:footerBefore')} <i className="fas fa-heart text-red-500 mx-1"></i> {t('sideMenu:footerAfter')}
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
