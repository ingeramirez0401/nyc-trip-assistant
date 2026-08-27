// Theming ligero de marca blanca: en vez de reescribir cada clase Tailwind
// con el color de cada agencia, los puntos de la UI que sí deben reflejar
// la marca (ver WelcomeScreen/SideMenu) usan var(--brand-*) y esta función
// sobreescribe esas variables en :root cuando el viajero está vinculado a
// una agencia con color propio. Sin marca, index.css ya trae el azul/índigo
// de TripPulse como valor por defecto -- no hace falta limpiar nada al
// cargar la app, solo al pasar de "con marca" a "sin marca" en caliente
// (cambio de cuenta) vía clearBrandTheme().
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(hex) {
  if (hex.length === 4) {
    return `#${[...hex.slice(1)].map((c) => c + c).join('')}`;
  }
  return hex;
}

function clamp255(n) {
  return Math.max(0, Math.min(255, n));
}

// percent negativo oscurece, positivo aclara -- desplaza cada canal RGB
// hacia 0/255 proporcionalmente, no una simple resta fija.
function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel) =>
    percent < 0 ? clamp255(Math.round(channel * (1 + percent))) : clamp255(Math.round(channel + (255 - channel) * percent));
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function applyBrandTheme(primaryColor) {
  if (!primaryColor || !HEX_RE.test(primaryColor)) {
    clearBrandTheme();
    return;
  }
  const hex = normalizeHex(primaryColor);
  const root = document.documentElement;
  root.style.setProperty('--brand-500', hex);
  root.style.setProperty('--brand-600', hex);
  root.style.setProperty('--brand-700', shade(hex, -0.22));
}

export function clearBrandTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--brand-500');
  root.style.removeProperty('--brand-600');
  root.style.removeProperty('--brand-700');
}
