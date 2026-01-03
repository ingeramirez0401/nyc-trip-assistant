import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno estén configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials not found. Please create .env.local file with your credentials.');
  console.error('See .env.example for instructions.');
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Exportar URL para debugging
supabase.supabaseUrl = supabaseUrl;

// Helper para verificar conexión
export const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key length:', supabaseAnonKey?.length);
    
    const { data, error } = await supabase.from('trips').select('count');
    if (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Helper para test de inserción
export const testInsert = async () => {
  try {
    console.log('🧪 Testing INSERT capability...');
    const { data, error } = await supabase
      .from('trips')
      .insert([{
        name: 'Test Trip',
        city: 'Test City',
        country: 'Test Country'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ INSERT failed:', error);
      throw error;
    }
    
    console.log('✅ INSERT successful:', data);
    
    // Limpiar
    await supabase.from('trips').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned');
    
    return true;
  } catch (error) {
    console.error('❌ INSERT test failed:', error.message);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return false;
  }
};
