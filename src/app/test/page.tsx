'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ConnectionTestPage() {
  const [clientStatus, setClientStatus] = useState('Probando cliente...');
  
  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();
        // Intentamos consultar una tabla que no existe ('test_connection').
        // Si las credenciales son válidas, Supabase responderá con un error 42P01 (relation does not exist).
        // Si las credenciales (URL o KEY) son inválidas, fallará la autenticación o conexión de red antes de buscar la tabla.
        const { error } = await supabase.from('test_connection').select('*').limit(1);
        
        if (error && error.code === '42P01') {
           setClientStatus('✅ Conectado correctamente a Supabase (Credenciales válidas)');
        } else if (error) {
           setClientStatus(`❌ Error de conexión: ${error.message} (Código: ${error.code})`);
        } else {
           setClientStatus('✅ Conectado (Pero la tabla test_connection existe misteriosamente)');
        }
      } catch (e: any) {
        setClientStatus(`❌ Excepción al conectar: ${e.message}`);
      }
    }
    
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Validación de Conexión TEKIRA ⚡️ Supabase</h1>
        
        <div className="p-6 bg-white shadow-sm rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Estado del Cliente de Navegador</h2>
          <div className={`p-4 rounded-lg font-medium ${clientStatus.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : clientStatus.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-800'}`}>
            {clientStatus}
          </div>
        </div>

        <div className="p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-sm">
          <strong>¿Cómo funciona esta prueba?</strong><br/>
          El sistema intenta leer una tabla inexistente. Si TEKIRA logra llegar a la base de datos y PostgreSQL responde que la tabla no existe (Código 42P01), confirmamos que la comunicación a través de Internet usando tus llaves (`URL` y `ANON_KEY`) es perfecta y segura.
        </div>
      </div>
    </div>
  );
}
