import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { licenseService } from '../services/licenseService';
import { profileService } from '../services/profileService';
import { applyBrandTheme, clearBrandTheme } from '../lib/theme';
import { assertOnline } from '../lib/connectivity';
import { clearOfflineDb } from '../lib/offlineDb';
import i18n from '../i18n';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [agencyBranding, setAgencyBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLicenses([]);
        setAgencyBranding(null);
        clearBrandTheme();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    let profileData = null;
    try {
      const { data, error } = await supabase
        .from('trippulse_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        profileData = data;
        setProfile(data);
        // El idioma del perfil manda sobre lo que haya en localStorage --
        // mismo criterio que ya usa refreshAgencyBranding/applyBrandTheme
        // para la marca de agencia: una preferencia guardada en la cuenta
        // debe aplicarse sola al iniciar sesión, sin que el viajero tenga
        // que volver a elegirla en cada dispositivo.
        if (profileData?.language) i18n.changeLanguage(profileData.language);
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
    } finally {
      setLoading(false);
    }
    refreshLicenses();
    refreshAgencyBranding(profileData);
  };

  // A diferencia del modo oscuro (que hoy no se persiste en ningún lado,
  // ver App.jsx), el idioma sí debe sobrevivir un reload y viajar entre
  // dispositivos: i18next-browser-languagedetector ya deja la elección en
  // localStorage (tp_language) apenas cambia, y acá además se sincroniza
  // a la cuenta si hay sesión activa.
  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    if (user) {
      try {
        const updated = await profileService.updateProfile(user.id, { language: lang });
        setProfile(updated);
        return { error: null };
      } catch (error) {
        return { error };
      }
    }
    return { error: null };
  };

  const refreshLicenses = async () => {
    try {
      const active = await licenseService.getMine();
      setLicenses(active || []);
    } catch (error) {
      // No romper el flujo de auth por esto -- simplemente queda sin licencias.
      console.error('Error fetching licenses:', error);
    }
  };

  // Marca blanca de la agencia a la que el viajero quedó vinculado al
  // canjear una licencia (profile.agency_id, ver licenseRoutes.js). El
  // propio agency_admin no ve su marca reflejada acá -- la edita en
  // AgencyAdminPanel, no tiene sentido "tematizar" su propia sesión con
  // ella. Aplicar/limpiar el theme acá (no en cada pantalla) es lo que
  // hace que el color de marca llegue a toda la app, no solo a WelcomeScreen.
  const refreshAgencyBranding = async (profileData) => {
    if (!profileData?.agency_id || profileData.role === 'agency_admin') {
      setAgencyBranding(null);
      clearBrandTheme();
      return;
    }
    try {
      const branding = await licenseService.getMyAgencyBranding();
      setAgencyBranding(branding);
      applyBrandTheme(branding?.primary_color);
    } catch (error) {
      console.error('Error fetching agency branding:', error);
      setAgencyBranding(null);
      clearBrandTheme();
    }
  };

  const signUp = async (email, password, metadata = {}, captchaToken) => {
    assertOnline('signUp');
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // full_name, etc.
        emailRedirectTo: `${window.location.origin}/`,
        ...(captchaToken && { captchaToken }),
      },
    });
  };

  const signIn = async (email, password, captchaToken) => {
    assertOnline('login');
    return await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        ...(captchaToken && { captchaToken }),
      },
    });
  };

  const signInWithGoogle = async () => {
    assertOnline('loginWithGoogle');
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const resetPassword = async (email, captchaToken) => {
    assertOnline('resetPassword');
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
      ...(captchaToken && { captchaToken }),
    });
  };

  // Reenvía el correo de confirmación de signup -- para la pantalla
  // "revisa tu correo" cuando el usuario dice que nunca le llegó.
  const resendConfirmation = async (email) => {
    assertOnline('resendConfirmation');
    return await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
  };

  const updatePassword = async (newPassword) => {
    assertOnline('updatePassword');
    const result = await supabase.auth.updateUser({ password: newPassword });
    if (!result.error) {
      setIsPasswordRecovery(false);
    }
    return result;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    // Limpiar el estado local SIEMPRE, incluso si supabase.auth.signOut()
    // falla -- si falla es casi siempre porque el token ya estaba
    // inválido/expirado en el servidor (AuthApiError / "session not
    // found"), lo cual significa que la sesión YA no era válida de todos
    // modos. Antes, con el `if (!error)`, ese caso dejaba a el usuario
    // atrapado viéndose logueado sin ninguna forma de salir -- el botón de
    // cerrar sesión no hacía nada visible. El estado local es la fuente de
    // verdad de "¿la UI me muestra como logueado?", y debe reflejar
    // "cerrado" apenas el usuario lo pide, haya podido el servidor revocar
    // el token o no.
    setSession(null);
    setUser(null);
    setProfile(null);
    setLicenses([]);
    setAgencyBranding(null);
    clearBrandTheme();
    // El espejo offline vive en el dispositivo, no atado a una cuenta --
    // dejarlo entre sesiones filtraría el itinerario de este usuario al
    // siguiente que inicie sesión en un dispositivo compartido.
    clearOfflineDb().catch((err) => console.error('Error limpiando datos offline:', err));
    return { error };
  };

  const value = {
    session,
    user,
    profile,
    licenses,
    refreshLicenses,
    agencyBranding,
    refreshAgencyBranding: () => refreshAgencyBranding(profile),
    loading,
    isPasswordRecovery,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    resendConfirmation,
    updatePassword,
    changeLanguage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
