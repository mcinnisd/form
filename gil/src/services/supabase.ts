import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Memory } from '../types'

// Using type assertion for environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export const subscribeToMemories = (
  userId: string,
  onUpdate: (memories: Memory[]) => void
) => {
  // Initial fetch
  supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .then(({ data }) => {
      if (data) onUpdate(data);
    });

  // Real-time subscription
  const subscription = supabase
    .channel('memories_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'memories',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Fetch updated data
        const { data } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (data) onUpdate(data);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}; 