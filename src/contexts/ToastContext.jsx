import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem = ({ id, message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Auto dismiss
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      default: return 'fa-info-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div 
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 mb-3
        ${getColors()}
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
        animate-fade-in-up
      `}
      role="alert"
    >
      <div className="p-4 flex items-start gap-3 relative bg-white/40 dark:bg-slate-900/40">
        <div className={`shrink-0 mt-0.5 ${getIconColor()}`}>
          <i className={`fas ${getIcon()} text-xl`}></i>
        </div>
        <div className="flex-1 pt-0.5">
          <p className="font-medium text-sm leading-5">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      {/* Progress bar line at bottom */}
      <div className={`h-1 w-full absolute bottom-0 left-0 bg-current opacity-20 origin-left animate-[shrink_4s_linear_forwards]`} />
    </div>
  );
};

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10 animate-fade-in-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-amber-500 text-xl"></i>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Confirmar acción
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const show = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const success = useCallback((message) => show(message, 'success'), [show]);
  const error = useCallback((message) => show(message, 'error'), [show]);
  const warning = useCallback((message) => show(message, 'warning'), [show]);
  const info = useCallback((message) => show(message, 'info'), [show]);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
      });
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, confirm }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none w-full max-w-sm px-4 md:px-0">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              {...toast}
              onClose={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
      {confirmDialog && createPortal(
        <ConfirmDialog {...confirmDialog} />,
        document.body
      )}
    </ToastContext.Provider>
  );
};
