// Normaliza cualquier imagen subida por una agencia a un logo cuadrado
// consistente -- para que todas las agencias encajen igual en el badge del
// viajero y el avatar del menú, sin importar qué tamaño/proporción hayan
// subido originalmente.
const MIN_SOURCE_DIMENSION = 128;
const OUTPUT_SIZE = 512;
const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen. ¿Es un archivo válido?'));
    img.src = src;
  });
}

export async function normalizeSquareLogo(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (PNG, JPG o WEBP).');
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error('La imagen pesa más de 5MB. Sube un archivo más liviano.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    if (img.width < MIN_SOURCE_DIMENSION || img.height < MIN_SOURCE_DIMENSION) {
      throw new Error(
        `La imagen es muy pequeña (${img.width}x${img.height}px). Usa al menos ${MIN_SOURCE_DIMENSION}x${MIN_SOURCE_DIMENSION}px para que se vea nítida.`
      );
    }

    // Recorte centrado a cuadrado (cover) + reescalado a un tamaño fijo:
    // así todos los logos ocupan el mismo espacio en el diseño de la app,
    // sin importar si la agencia subió un rectángulo o un cuadrado.
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen.'))), 'image/png')
    );

    return new File([blob], 'agency-logo.png', { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const LOGO_REQUIREMENTS_LABEL = `Mínimo ${MIN_SOURCE_DIMENSION}x${MIN_SOURCE_DIMENSION}px · Se recorta a cuadrado automáticamente · Máx. 5MB`;
