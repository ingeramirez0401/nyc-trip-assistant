import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { licenseService } from '../services/licenseService';
import LoginScreen from './auth/LoginScreen';

const RedeemLicense = ({ onRedeemed }) => {
  const { user, refreshLicense } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRedeem, setPendingRedeem] = useState(false);

  // Si llegan desde el link del email (?code=XXXX), prellenar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramCode = params.get('code');
    if (paramCode) {
      setCode(paramCode.toUpperCase());
    }
  }, []);

  const doRedeem = async (codeToRedeem) => {
    setLoading(true);
    try {
      await licenseService.redeem(codeToRedeem);
      await refreshLicense();
      toast.success('¡Código activado! Ya tienes acceso.');
      setCode('');

      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url);

      if (onRedeemed) onRedeemed();
    } catch (error) {
      toast.error(error.message || 'No se pudo canjear el código');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (!user) {
      setPendingRedeem(true);
      setShowLogin(true);
      return;
    }

    await doRedeem(code.trim());
  };

  return (
    <div className="max-w-md w-full mb-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-stretch shadow-lg dark:shadow-none"
      >
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            ¿Vienes de una agencia de viajes?
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none uppercase tracking-wider font-mono"
            maxLength={12}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="self-end sm:self-auto shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Canjeando...' : 'Canjear'}
        </button>
      </form>

      {showLogin && (
        <LoginScreen
          initialMode="signup"
          onClose={() => {
            setShowLogin(false);
            setPendingRedeem(false);
          }}
          onLoginSuccess={() => {
            setShowLogin(false);
            if (pendingRedeem) {
              setPendingRedeem(false);
              doRedeem(code.trim());
            }
          }}
        />
      )}
    </div>
  );
};

export default RedeemLicense;
