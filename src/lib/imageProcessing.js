import i18n from '../i18n';

// Normaliza cualquier imagen subida por una agencia a un logo cuadrado
// consistente -- para que todas las agencias encajen igual en el badge del
// viajero y el avatar del menú, sin importar qué tamaño/proporción hayan
// subido originalmente.
const MIN_SOURCE_DIMENSION = 128;
const OUTPUT_SIZE = 512;
const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_FILE_MB = MAX_SOURCE_FILE_BYTES / (1024 * 1024);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(i18n.t('agency:admin.brand.errors.invalidImage')));
    img.src = src;
  });
}

export async function normalizeSquareLogo(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error(i18n.t('agency:admin.brand.errors.mustBeImage'));
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error(i18n.t('agency:admin.brand.errors.tooLarge', { maxMb: MAX_SOURCE_FILE_MB }));
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    if (img.width < MIN_SOURCE_DIMENSION || img.height < MIN_SOURCE_DIMENSION) {
      throw new Error(
        i18n.t('agency:admin.brand.errors.tooSmall', {
          width: img.width,
          height: img.height,
          minDimension: MIN_SOURCE_DIMENSION,
        })
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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(i18n.t('agency:admin.brand.errors.processingFailed')))), 'image/png')
    );

    return new File([blob], 'agency-logo.png', { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const getLogoRequirementsLabel = () =>
  i18n.t('agency:admin.brand.logoRequirements', { minDimension: MIN_SOURCE_DIMENSION, maxMb: MAX_SOURCE_FILE_MB });
