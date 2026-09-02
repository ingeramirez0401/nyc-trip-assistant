import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import App from './App.jsx'
import SupabaseDiagnostic from './components/SupabaseDiagnostic.jsx'
import ApproveAgencyScreen from './components/admin/ApproveAgencyScreen.jsx'
import PwaUpdateBanner from './components/PwaUpdateBanner.jsx'
import ConnectivityBanner from './components/ConnectivityBanner.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import './index.css'

// Simple router based on URL path
const Router = () => {
  const path = window.location.pathname;
  
  if (path === '/debug' || path === '/diagnostic') {
    return <SupabaseDiagnostic />;
  }

  if (path === '/admin/approve-agency') {
    return <ApproveAgencyScreen />;
  }

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <PwaUpdateBanner />
        <ConnectivityBanner />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ToastProvider>
    </I18nextProvider>
  </React.StrictMode>,
)
