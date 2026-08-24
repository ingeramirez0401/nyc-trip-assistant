import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { licenseService } from '../services/licenseService';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [license, setLicense] = useState(null);
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
        setLicense(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('trippulse_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
    } finally {
      setLoading(false);
    }
    refreshLicense();
  };

  const refreshLicense = async () => {
    try {
      const active = await licenseService.getMine();
      setLicense(active);
    } catch (error) {
      // No romper el flujo de auth por esto -- simplemente queda sin licencia.
      console.error('Error fetching license:', error);
    }
  };

  const signUp = async (email, password, metadata = {}, captchaToken) => {
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
    return await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        ...(captchaToken && { captchaToken }),
      },
    });
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
  };

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword });
    if (!result.error) {
      setIsPasswordRecovery(false);
    }
    return result;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLicense(null);
    }
    return { error };
  };

  const value = {
    session,
    user,
    profile,
    license,
    refreshLicense,
    loading,
    isPasswordRecovery,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
