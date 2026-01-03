import { supabase } from '../lib/supabase';

// =====================================================
// STORAGE (Almacenamiento de imágenes)
// =====================================================

const BUCKET_NAME = 'trip-images';

export const storageService = {
  // Subir una imagen desde un archivo File
  async uploadImage(file, folder = 'stops') {
    try {
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Subir archivo
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Subir imagen desde base64 (data URL)
  async uploadBase64Image(base64String, folder = 'stops') {
    try {
      // Extraer el tipo MIME y los datos
      const matches = base64String.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 string');

      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Convertir base64 a Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Determinar extensión
      const ext = mimeType.split('/')[1];
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Subir blob
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading base64 image:', error);
      throw error;
    }
  },

  // Eliminar una imagen
  async deleteImage(imageUrl) {
    try {
      // Extraer el path del archivo de la URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
      if (pathParts.length < 2) throw new Error('Invalid image URL');
      
      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Obtener URL pública de una imagen
  getPublicUrl(filePath) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Listar archivos en una carpeta
  async listFiles(folder = '') {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;
    return data;
  },
};
