// src/utils/userPreferences.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/supabase';

const KEY = 'product_view_mode'; // 'modern' | 'traditional'

export async function getProductViewMode() {
  // 1) Try cache first
  const cached = await AsyncStorage.getItem(KEY);
  if (cached === 'modern' || cached === 'traditional') return cached;

  // 2) Fallback to DB
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user?.id) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('product_view_mode')
    .eq('id', authData.user.id)
    .single();

  if (error) throw error;

  const mode =
    data?.product_view_mode === 'traditional' ? 'traditional' : 'modern';
  await AsyncStorage.setItem(KEY, mode);
  return mode;
}

export async function setProductViewMode(nextMode) {
  if (nextMode !== 'modern' && nextMode !== 'traditional') {
    throw new Error('Invalid view mode');
  }

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user?.id) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ product_view_mode: nextMode })
    .eq('id', authData.user.id);

  if (error) throw error;

  await AsyncStorage.setItem(KEY, nextMode);
  return nextMode;
}

export async function clearProductViewModeCache() {
  await AsyncStorage.removeItem(KEY);
}
