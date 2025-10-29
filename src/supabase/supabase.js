import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ygyzitvjqxazhatnrxir.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneXppdHZqcXhhemhhdG5yeGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Njk3MzksImV4cCI6MjA3MzE0NTczOX0.pzvRXPkepfsFNt7xVg-blMWHGFuiCWK2ihfg5Mwsc_I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
