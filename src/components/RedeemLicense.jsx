import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { licenseService } from '../services/licenseService';
import LoginScreen from './auth/LoginScreen';

// Con verificación de correo activa, signUp() no deja sesión de una vez --
// el usuario tiene que ir a su bandeja y volver por OTRO link, que llega a
// "/" sin el ?code=. localStorage sobrevive ese salto entre pestañas/cargas
// de página, así que es lo que usamos para no perder el canje pendiente.
const PENDING_CODE_KEY = 'tp_pending_redeem_code';

const RedeemLicense = ({ onRedeemed }) => {
  const { t } = useTranslation('agency');
  const { user, refreshLicenses } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRedeem, setPendingRedeem] = useState(false);

  // Si llegan desde el link del email (?code=XXXX): un solo clic -- si ya
  // tienen sesión, canjear directo; si no, abrir el registro de una vez en
  // lugar de esperar a que encuentren y pulsen "Canjear" ellos mismos.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramCode = params.get('code');

    if (paramCode) {
      const upperCode = paramCode.toUpperCase();
      setCode(upperCode);

      if (user) {
        doRedeem(upperCode);
      } else {
        localStorage.setItem(PENDING_CODE_KEY, upperCode);
        setPendingRedeem(true);
        setShowLogin(true);
      }
      return;
    }

    // Sin ?code= en la URL: puede ser que volvamos de confirmar el correo
    // con un canje que quedó pendiente de la visita anterior.
    const pending = localStorage.getItem(PENDING_CODE_KEY);
    if (pending && user) {
      localStorage.removeItem(PENDING_CODE_KEY);
      setCode(pending);
      doRedeem(pending);
    }
  }, []);

  const doRedeem = async (codeToRedeem) => {
    setLoading(true);
    try {
      await licenseService.redeem(codeToRedeem);
      await refreshLicenses();
      localStorage.removeItem(PENDING_CODE_KEY);
      toast.success(t('agency:redeem.success'));
      setCode('');

      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url);

      if (onRedeemed) onRedeemed();
    } catch (error) {
      toast.error(error.message || t('agency:redeem.genericError'));
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
            {t('agency:redeem.label')}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('agency:redeem.placeholder')}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none uppercase tracking-wider font-mono"
            maxLength={12}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="self-end sm:self-auto shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('agency:redeem.redeeming') : t('agency:redeem.redeem')}
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
