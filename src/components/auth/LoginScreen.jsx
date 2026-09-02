import React, { useState, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const RESEND_COOLDOWN_S = 45;
const LANGUAGES = ['es', 'en'];

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

const LoginScreen = ({ onClose, onLoginSuccess, initialMode = 'login', audience = 'traveler' }) => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const { signIn, signUp, resetPassword, resendConfirmation, changeLanguage } = useAuth();
  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';
  const isCheckEmail = mode === 'check-email';

  // Este modal tapa (z-[2000]) el botón de menú de WelcomeScreen (z-50), que
  // es donde vive el selector de idioma normalmente -- sin esto, un
  // invitado que ya llegó hasta acá no tiene forma de corregir el idioma
  // justo antes del paso donde más importa (el correo de confirmación sale
  // en el idioma que quede fijado en este momento).
  const handleChangeLanguage = async (lang) => {
    if (lang === i18n.language) return;
    await changeLanguage(lang);
  };

  // Cuenta regresiva del botón "Reenviar" -- evita que el usuario lo
  // martille y choque con el rate limit de envío de GoTrue.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      const { error } = await resendConfirmation(pendingEmail);
      if (error) throw error;
      setMessage(t('auth:checkEmail.resendSuccess'));
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(err.message || t('auth:checkEmail.resendError'));
    } finally {
      setResending(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setMessage(null);
    setCaptchaToken(null);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // GoTrue exige captcha en /auth/v1/recover igual que en login/signup
    // (mismo GOTRUE_SECURITY_CAPTCHA_SECRET a nivel de servidor) -- pero
    // este formulario nunca renderizaba el widget, así que el request
    // llegaba sin token y GoTrue lo rechazaba con "captcha verification
    // process failed" pase lo que pase, sin importar qué escribiera el
    // usuario.
    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError(t('auth:forgot.captchaRequired'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email, captchaToken);
      if (error) throw error;
      setCaptchaToken(null);
      setMessage(t('auth:forgot.success'));
    } catch (err) {
      setError(err.message || t('common:errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (HCAPTCHA_SITE_KEY && !captchaToken) {
      setError(t('auth:forgot.captchaRequired'));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, captchaToken);
        if (error) throw error;
        if (onLoginSuccess) onLoginSuccess();
      } else {
        const { error } = await signUp(email, password, { full_name: fullName }, captchaToken);
        if (error) throw error;
        setCaptchaToken(null);
        setPendingEmail(email);
        setMode('check-email');
        setResendCooldown(RESEND_COOLDOWN_S);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'email_provider_disabled' || err.message?.includes('Email signups are disabled')) {
        setError(t('auth:errors.signupDisabled'));
      } else {
        setError(err.message || t('common:errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const headerAudience = audience === 'agency' ? 'agency' : 'traveler';
  const headerMode = mode === 'check-email' ? 'checkEmail' : mode;
  const headerCopy = t(`auth:header.${headerAudience}.${headerMode}`, { returnObjects: true });
  const isAgency = audience === 'agency';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('common:actions.close')}
          className="absolute top-4 right-4 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 z-10"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Selector de idioma -- mismo patrón de pastillas que SideMenu */}
        <div className="absolute top-4 left-4 z-10 flex gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleChangeLanguage(lang)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-colors ${
                i18n.language === lang
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30 overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600">
              {isCheckEmail ? (
                <i className="fas fa-envelope-circle-check text-3xl text-white"></i>
              ) : isAgency ? (
                <i className="fas fa-building text-3xl text-white"></i>
              ) : (
                <img src="/icons/icon-192x192.png" alt="TripPulse" className="w-full h-full object-cover" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{headerCopy.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{headerCopy.subtitle}</p>
            {isAgency && (
              <span className="inline-block mt-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                {t('auth:agencyBadge')}
              </span>
            )}
          </div>

          {/* Revisa tu correo -- pantalla dedicada post-signup, con reenvío
              real (supabase.auth.resend). Antes esto era un mensajito verde
              arriba del formulario de login, fácil de perder y sin forma
              de reenviar si nunca llegaba. */}
          {isCheckEmail ? (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-center">
                <p className="text-sm text-slate-600 dark:text-slate-200">
                  {t('auth:checkEmail.sentTo')}
                </p>
                <p className="text-slate-900 dark:text-white font-bold break-all mt-1">{pendingEmail}</p>
              </div>

              <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400 text-xs">
                <i className="fas fa-circle-info mt-0.5 shrink-0"></i>
                <p>{t('auth:checkEmail.instructions')}</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                  <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 dark:text-green-400 mt-0.5"></i>
                  <p className="text-sm text-green-600 dark:text-green-300">{message}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resending ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    {t('auth:checkEmail.resending')}
                  </>
                ) : resendCooldown > 0 ? (
                  t('auth:checkEmail.resendIn', { seconds: resendCooldown })
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    {t('auth:checkEmail.resend')}
                  </>
                )}
              </button>

              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  <i className="fas fa-arrow-left mr-1"></i> {t('auth:checkEmail.backToLogin')}
                </button>
              </p>
            </div>
          ) : isForgot ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('auth:forgot.emailLabel')}</label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth:forgot.emailPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {HCAPTCHA_SITE_KEY && (
                <div className="flex justify-center pt-1">
                  <HCaptcha
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    theme="dark"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                  <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 dark:text-green-400 mt-0.5"></i>
                  <p className="text-sm text-green-600 dark:text-green-300">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i>
                    {t('auth:forgot.sending')}
                  </span>
                ) : (
                  t('auth:forgot.submit')
                )}
              </button>

              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  <i className="fas fa-arrow-left mr-1"></i> {t('auth:forgot.backToLogin')}
                </button>
              </p>
            </form>
          ) : (
            <>
              {isAgency && !isLogin && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-start gap-3">
                  <i className="fas fa-circle-info text-blue-500 dark:text-blue-400 mt-0.5"></i>
                  <p className="text-xs text-blue-700 dark:text-blue-200">
                    {t('auth:agencyNotice')}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('auth:form.fullNameLabel')}</label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('auth:form.fullNamePlaceholder')}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('auth:form.emailLabel')}</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth:form.emailPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('auth:form.passwordLabel')}</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
                      >
                        {t('auth:form.forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('common:password.hide') : t('common:password.show')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-90"
                      tabIndex={-1}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {HCAPTCHA_SITE_KEY && (
                  <div className="flex justify-center pt-1">
                    <HCaptcha
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      theme="dark"
                    />
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                    <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                    <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-start gap-3">
                    <i className="fas fa-check-circle text-green-500 dark:text-green-400 mt-0.5"></i>
                    <p className="text-sm text-green-600 dark:text-green-300">{message}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-circle-notch fa-spin"></i>
                      {t('auth:form.processing')}
                    </span>
                  ) : (
                    isLogin ? t('auth:form.loginSubmit') : t('auth:form.signupSubmit')
                  )}
                </button>
              </form>

              {/* Toggle Login/Register */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {isLogin
                    ? (isAgency ? t('auth:toggle.agencyLoginPrompt') : t('auth:toggle.travelerLoginPrompt'))
                    : t('auth:toggle.signupPrompt')}
                  <button
                    onClick={() => switchMode(isLogin ? 'signup' : 'login')}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
                  >
                    {isLogin ? (isAgency ? t('auth:toggle.agencyActivate') : t('auth:toggle.signupLink')) : t('auth:toggle.loginLink')}
                  </button>
                </p>
                {isAgency && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t('auth:toggle.notPartnerYet')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        document.getElementById('agencias')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors"
                    >
                      {t('auth:toggle.requestAccess')}
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default LoginScreen;
