import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://behzshbeuqwevruxvvuw.supabase.co';

// En el CRM local usamos la clave con permisos completos para que la lectura y drag&drop
// de Clientes funcione inmediatamente sin requerir login previo de Supabase Auth
const supabaseKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlaHpzaGJldXF3ZXZydXh2dnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM2OTc0MCwiZXhwIjoyMTA3OTQ1NzQwfQ.AkbTYtCenGqeGe5B0WhN3E38yuNVJqSZUQCpxAw4QwQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
