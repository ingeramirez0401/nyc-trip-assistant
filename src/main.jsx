import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SupabaseDiagnostic from './components/SupabaseDiagnostic.jsx'
import './index.css'

// Simple router based on URL path
const Router = () => {
  const path = window.location.pathname;
  
  if (path === '/debug' || path === '/diagnostic') {
    return <SupabaseDiagnostic />;
  }
  
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
