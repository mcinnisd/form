import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  setAuth: (user: any | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  
  // Update auth state
  setAuth: (user) => set({ 
    isAuthenticated: !!user,
    user 
  }),
  
  // Handle sign out
  signOut: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null });
  },
}));

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setAuth(session?.user ?? null);
}); 