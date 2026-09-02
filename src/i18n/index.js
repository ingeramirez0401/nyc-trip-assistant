import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esCommon from './locales/es/common.json';
import esAgency from './locales/es/agency.json';
import esAuth from './locales/es/auth.json';
import esWelcome from './locales/es/welcome.json';
import esSideMenu from './locales/es/sideMenu.json';
import esItinerary from './locales/es/itinerary.json';
import esPlaceDetail from './locales/es/placeDetail.json';
import esEditPlace from './locales/es/editPlace.json';
import esPlaceSearch from './locales/es/placeSearch.json';
import esTripSetup from './locales/es/tripSetup.json';
import esConnectivity from './locales/es/connectivity.json';

import enCommon from './locales/en/common.json';
import enAgency from './locales/en/agency.json';
import enAuth from './locales/en/auth.json';
import enWelcome from './locales/en/welcome.json';
import enSideMenu from './locales/en/sideMenu.json';
import enItinerary from './locales/en/itinerary.json';
import enPlaceDetail from './locales/en/placeDetail.json';
import enEditPlace from './locales/en/editPlace.json';
import enPlaceSearch from './locales/en/placeSearch.json';
import enTripSetup from './locales/en/tripSetup.json';
import enConnectivity from './locales/en/connectivity.json';

// Recursos bundleados estáticamente (nada de i18next-http-backend/fetch a
// /locales/*.json) -- con solo 2 idiomas, y dado que la app debe seguir
// funcionando offline (ver vite.config.js, Workbox precachea el bundle JS
// pero no hace fetch a rutas nuevas), lo más simple y confiable es que
// estos JSON terminen empaquetados dentro del JS que Workbox ya cachea.
const resources = {
  es: {
    common: esCommon,
    agency: esAgency,
    auth: esAuth,
    welcome: esWelcome,
    sideMenu: esSideMenu,
    itinerary: esItinerary,
    placeDetail: esPlaceDetail,
    editPlace: esEditPlace,
    placeSearch: esPlaceSearch,
    tripSetup: esTripSetup,
    connectivity: esConnectivity,
  },
  en: {
    common: enCommon,
    agency: enAgency,
    auth: enAuth,
    welcome: enWelcome,
    sideMenu: enSideMenu,
    itinerary: enItinerary,
    placeDetail: enPlaceDetail,
    editPlace: enEditPlace,
    placeSearch: enPlaceSearch,
    tripSetup: enTripSetup,
    connectivity: enConnectivity,
  },
};

// Locale para Intl/.toLocaleDateString/.toLocaleString -- 'es' a secas no
// alcanza para el formato regional que ya se usaba (es-CO); 'en' cae a un
// genérico razonable en vez de inventar un país.
export const LOCALE_MAP = { es: 'es-CO', en: 'en-US' };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS: 'common',
    ns: Object.keys(resources.es),
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tp_language',
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export default i18n;
