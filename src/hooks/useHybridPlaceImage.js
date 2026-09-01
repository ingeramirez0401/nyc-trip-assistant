import { useState, useEffect } from 'react';

// Estrategia híbrida de imagen (antes solo vivía en BottomSheet.jsx,
// duplicada a mano hubiera sido fácil de desincronizar): si `rawImg` ya es
// una URL real (foto de Google Places, subida por el usuario, o base64), se
// usa directo. Si es solo una palabra clave -- lugares agregados a mano o
// generados por IA sin foto real de Google, ver PlaceSearch.jsx -- se pide
// una imagen fotorrealista generada con IA usando esa palabra como prompt.
// Sin nada (o si la generación falla), devuelve null: cada consumidor decide
// su propio placeholder final según el contexto (miniatura chica vs hero
// grande).
export function useHybridPlaceImage(rawImg, seedId, city = 'travel destination') {
  const [imgSrc, setImgSrc] = useState(() =>
    rawImg && (rawImg.startsWith('http') || rawImg.startsWith('data:image')) ? rawImg : null
  );

  useEffect(() => {
    if (!rawImg) {
      setImgSrc(null);
      return;
    }
    if (rawImg.startsWith('http') || rawImg.startsWith('data:image')) {
      setImgSrc(rawImg);
      return;
    }

    setImgSrc(null);
    const query = encodeURIComponent(`${rawImg} in ${city} photorealistic 4k`);
    const url = `https://image.pollinations.ai/prompt/${query}?width=800&height=600&nologo=true&seed=${seedId}`;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setImgSrc(url); };
    img.onerror = () => { if (!cancelled) setImgSrc(null); };
    img.src = url;
    return () => { cancelled = true; };
  }, [rawImg, seedId, city]);

  return imgSrc;
}
