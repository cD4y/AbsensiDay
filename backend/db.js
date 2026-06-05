const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL atau SUPABASE_KEY belum diisi di file backend/.env');
}

const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'missing-key'
);

module.exports = supabase;
