
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('ERROR: Las variables de entorno están vacías.');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('EXITO: Conexión validada correctamente (relación no existe)');
    } else if (error) {
      console.log('FALLO:', error.message, error.code);
    } else {
      console.log('EXITO: Conexión validada (tabla test_connection encontrada)');
    }
  } catch (e) {
    console.log('EXCEPCION:', e.message);
  }
}

testConnection();
