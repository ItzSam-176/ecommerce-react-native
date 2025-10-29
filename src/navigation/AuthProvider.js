import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase user
  const [role, setRole] = useState(null); // 'admin' | 'customer'
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  // Helper: fetch role from your public users table
  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('fetchRole error:', error);
        return null;
      }
      return data?.role ?? null;
    } catch (e) {
      console.log('fetchRole exception:', e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Supabase client is configured to persist session in AsyncStorage.
        // Just read current session and set state accordingly.
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session?.user) {
          const r = await fetchRole(session.user.id);
          if (!isMounted) return;
          setUser(session.user);
          setRole(r);
          if (r) await AsyncStorage.setItem('role', r);
        } else {
          if (!isMounted) return;
          setUser(null);
          setRole(null);
          await AsyncStorage.removeItem('role');
        }
      } catch (err) {
        console.log('Auth init error:', err);
      } finally {
        if (isMounted) setLoading(false);
        initializedRef.current = true;
      }
    };

    init();

    // Listen for any future auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Avoid flicker during first init; ensure loading is cleared once
        if (!initializedRef.current) return;
        if (!session) {
          setUser(null);
          setRole(null);
          await AsyncStorage.removeItem('role');
          return;
        }
        const r = await fetchRole(session.user.id);
        setUser(session.user);
        setRole(r);
        if (r) await AsyncStorage.setItem('role', r);
      }
    );

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const sessionUser = data.user;
    const r = await fetchRole(sessionUser.id);

    setUser(sessionUser);
    setRole(r);
    if (r) await AsyncStorage.setItem('role', r);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    await AsyncStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
