import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { StoreData } from '../types/index';

interface AuthContextType {
  user: User | null;
  storeData: StoreData | null;
  loading: boolean;
  refreshStoreData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  storeData: null,
  loading: true,
  refreshStoreData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      // Map DB row directly — column names match StoreData interface (snake_case)
      setStoreData(data as StoreData);
    } else {
      setStoreData(null);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStoreData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStoreData(session.user.id);
      } else {
        setStoreData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshStoreData = async () => {
    if (user) await fetchStoreData(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, storeData, loading, refreshStoreData }}>
      {children}
    </AuthContext.Provider>
  );
};
