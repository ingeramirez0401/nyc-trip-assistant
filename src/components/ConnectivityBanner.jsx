import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// Franja fija arriba de todo, visible mientras dure la falta de señal --
// a diferencia de los Toast normales (se autodesaparecen en 4s), esta se
// queda porque el estado que describe también se queda. Se avisa tanto al
// caer la señal como, implícitamente, al recuperarla (la franja desaparece
// sola -- no hace falta un segundo aviso de "ya volvió").
const ConnectivityBanner = () => {
  const { t } = useTranslation('connectivity');
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[9998] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-xs font-bold py-2 px-4 text-center shadow-md"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
      role="status"
    >
      <i className="fas fa-triangle-exclamation"></i>
      {t('connectivity:offlineBanner')}
    </div>
  );
};

export default ConnectivityBanner;
