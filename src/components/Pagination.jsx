import React from 'react';
import { useTranslation } from 'react-i18next';

// Compartido entre SuperAdminPanel y AgencyAdminPanel. Anterior/Siguiente
// + "Página X de Y" en vez de una lista de números -- evita la lógica de
// elipsis para listas largas sin que aporte nada acá.
const Pagination = ({ page, totalPages, onPageChange }) => {
  const { t } = useTranslation('common');

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <i className="fas fa-chevron-left mr-1"></i>{t('common:pagination.prev')}
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {t('common:pagination.pageOf', { page, totalPages })}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('common:pagination.next')}<i className="fas fa-chevron-right ml-1"></i>
      </button>
    </div>
  );
};

export default Pagination;
