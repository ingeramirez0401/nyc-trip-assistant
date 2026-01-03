import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseDiagnostic = () => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState({});

  const addTest = (name, status, details = '', error = null) => {
    setTests(prev => [...prev, { name, status, details, error, timestamp: new Date().toISOString() }]);
  };

  const clearTests = () => setTests([]);

  const runAllTests = async () => {
    setIsRunning(true);
    clearTests();

    // 1. Verificar configuración
    addTest('📋 Configuración', 'running', 'Verificando variables de entorno...');
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setConfig({ url, keyLength: key?.length, keyPreview: key?.substring(0, 50) + '...' });

    if (!url || !key) {
      addTest('📋 Configuración', 'error', 'Variables de entorno no encontradas', { url: !!url, key: !!key });
      setIsRunning(false);
      return;
    }
    addTest('📋 Configuración', 'success', `URL: ${url}, Key length: ${key.length}`);

    // 2. Test de conectividad básica (fetch directo)
    addTest('🌐 Conectividad HTTP', 'running', 'Probando conexión directa...');
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        }
      });
      
      if (response.ok) {
        addTest('🌐 Conectividad HTTP', 'success', `Status: ${response.status} ${response.statusText}`);
      } else {
        const text = await response.text();
        addTest('🌐 Conectividad HTTP', 'warning', `Status: ${response.status}`, { statusText: response.statusText, body: text });
      }
    } catch (err) {
      addTest('🌐 Conectividad HTTP', 'error', 'Error de red', err.message);
    }

    // 3. Test de endpoint REST - listar tablas disponibles
    addTest('📊 Endpoint REST', 'running', 'Verificando endpoint REST...');
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      addTest('📊 Endpoint REST', 'success', `Tablas disponibles: ${JSON.stringify(data)}`);
    } catch (err) {
      addTest('📊 Endpoint REST', 'error', 'Error al listar tablas', err.message);
    }

    // 4. Test de tabla trips (SELECT)
    addTest('🔍 SELECT trips', 'running', 'Intentando leer tabla trips...');
    try {
      const { data, error, status, statusText } = await supabase
        .from('trips')
        .select('*')
        .limit(1);
      
      if (error) {
        addTest('🔍 SELECT trips', 'error', `Error: ${error.message}`, { 
          code: error.code, 
          hint: error.hint, 
          details: error.details,
          status,
          statusText
        });
      } else {
        addTest('🔍 SELECT trips', 'success', `Registros encontrados: ${data?.length || 0}`, data);
      }
    } catch (err) {
      addTest('🔍 SELECT trips', 'error', 'Excepción', err.message);
    }

    // 5. Test de INSERT en trips
    addTest('➕ INSERT trips', 'running', 'Intentando insertar en trips...');
    try {
      const testData = {
        name: `Test_${Date.now()}`,
        city: 'DiagnosticCity',
        country: 'DiagnosticCountry'
      };
      
      const { data, error, status, statusText } = await supabase
        .from('trips')
        .insert([testData])
        .select()
        .single();
      
      if (error) {
        addTest('➕ INSERT trips', 'error', `Error: ${error.message}`, { 
          code: error.code, 
          hint: error.hint, 
          details: error.details,
          status,
          statusText,
          sentData: testData
        });
      } else {
        addTest('➕ INSERT trips', 'success', `Registro creado con ID: ${data?.id}`, data);
        
        // 6. Test de DELETE (limpiar)
        addTest('🗑️ DELETE trips', 'running', 'Limpiando registro de prueba...');
        const { error: deleteError } = await supabase
          .from('trips')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          addTest('🗑️ DELETE trips', 'warning', 'No se pudo eliminar', deleteError.message);
        } else {
          addTest('🗑️ DELETE trips', 'success', 'Registro de prueba eliminado');
        }
      }
    } catch (err) {
      addTest('➕ INSERT trips', 'error', 'Excepción', err.message);
    }

    // 7. Test directo con fetch (bypass Supabase client)
    addTest('🔧 Fetch Directo', 'running', 'Probando INSERT con fetch nativo...');
    try {
      const testData = {
        name: `FetchTest_${Date.now()}`,
        city: 'FetchCity',
        country: 'FetchCountry'
      };
      
      const response = await fetch(`${url}/rest/v1/trips`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testData)
      });
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      if (response.ok) {
        addTest('🔧 Fetch Directo', 'success', `Status: ${response.status}`, responseData);
        
        // Limpiar
        if (responseData && responseData[0]?.id) {
          await fetch(`${url}/rest/v1/trips?id=eq.${responseData[0].id}`, {
            method: 'DELETE',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            }
          });
        }
      } else {
        addTest('🔧 Fetch Directo', 'error', `Status: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          body: responseData,
          headers: Object.fromEntries(response.headers.entries())
        });
      }
    } catch (err) {
      addTest('🔧 Fetch Directo', 'error', 'Excepción en fetch', err.message);
    }

    // 8. Verificar headers de respuesta
    addTest('📨 Headers de Respuesta', 'running', 'Analizando headers...');
    try {
      const response = await fetch(`${url}/rest/v1/trips?select=count`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        }
      });
      
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      addTest('📨 Headers de Respuesta', response.ok ? 'success' : 'warning', `Status: ${response.status}`, headers);
    } catch (err) {
      addTest('📨 Headers de Respuesta', 'error', 'Error', err.message);
    }

    // 9. Test de RPC (si existe alguna función)
    addTest('⚡ Test RPC', 'running', 'Verificando funciones RPC...');
    try {
      const { data, error } = await supabase.rpc('version');
      if (error) {
        addTest('⚡ Test RPC', 'info', 'No hay función version() disponible (normal)', error.message);
      } else {
        addTest('⚡ Test RPC', 'success', 'RPC funcionando', data);
      }
    } catch (err) {
      addTest('⚡ Test RPC', 'info', 'RPC no disponible', err.message);
    }

    // 10. Resumen final
    const successCount = tests.filter(t => t.status === 'success').length;
    const errorCount = tests.filter(t => t.status === 'error').length;
    addTest('📊 RESUMEN', errorCount > 0 ? 'warning' : 'success', 
      `Tests completados. Éxitos: ${successCount}, Errores: ${errorCount}`);

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'running': return '⏳';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-900/50 border-green-500';
      case 'error': return 'bg-red-900/50 border-red-500';
      case 'warning': return 'bg-yellow-900/50 border-yellow-500';
      case 'running': return 'bg-blue-900/50 border-blue-500 animate-pulse';
      case 'info': return 'bg-gray-900/50 border-gray-500';
      default: return 'bg-gray-900/50 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">🔧 Supabase Diagnostic</h1>
        <p className="text-gray-400 text-center mb-6">Herramienta de diagnóstico para conexión con Supabase</p>

        {/* Configuración actual */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">📋 Configuración Actual</h2>
          <div className="font-mono text-sm space-y-1">
            <p><span className="text-gray-400">URL:</span> {config.url || 'No configurado'}</p>
            <p><span className="text-gray-400">Key Length:</span> {config.keyLength || 0} caracteres</p>
            <p><span className="text-gray-400">Key Preview:</span> {config.keyPreview || 'N/A'}</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isRunning ? '⏳ Ejecutando tests...' : '🚀 Ejecutar Todos los Tests'}
          </button>
          <button
            onClick={clearTests}
            disabled={isRunning}
            className="py-3 px-6 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 transition-all"
          >
            🗑️ Limpiar
          </button>
        </div>

        {/* Resultados de tests */}
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div 
              key={index} 
              className={`rounded-lg p-4 border ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">
                  {getStatusIcon(test.status)} {test.name}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(test.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{test.details}</p>
              {test.error && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                    Ver detalles del error
                  </summary>
                  <pre className="mt-2 p-2 bg-black/50 rounded text-xs overflow-x-auto">
                    {typeof test.error === 'object' 
                      ? JSON.stringify(test.error, null, 2) 
                      : test.error}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Instrucciones */}
        {tests.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-6xl mb-4">🔍</p>
            <p>Haz clic en "Ejecutar Todos los Tests" para diagnosticar la conexión con Supabase</p>
          </div>
        )}

        {/* Link para volver */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Volver a la aplicación
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDiagnostic;
