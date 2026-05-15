import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface StoreData {
  storeName: string;
  storeSlug: string;
  categories?: string[];
  themeColor?: string;
  backgroundColor?: string;
  textColor?: string;
  whatsappNumber?: string;
  subscriptionPlan?: 'free' | 'essential' | 'pro';
  subscriptionValidUntil?: any;
}

interface AuthContextType {
  user: User | null;
  storeData: StoreData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  storeData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setStoreData(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen to store data changes in real-time
    const storeRef = doc(db, 'users', user.uid);
    const unsubStore = onSnapshot(storeRef, (docSnap) => {
      if (docSnap.exists()) {
        setStoreData(docSnap.data() as StoreData);
      } else {
        setStoreData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching store data:", error);
      setLoading(false);
    });

    return unsubStore;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, storeData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
