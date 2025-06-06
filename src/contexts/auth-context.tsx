
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/firebase/config'; // Assuming db is exported for user profile data
import type { User, Address } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  adminLogin: (password: string) => Promise<boolean>; // Simplified admin login
  logout: () => Promise<void>;
  userAddress: Address | null;
  saveAddress: (address: Address) => Promise<void>;
  fetchAddress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@stickerverse.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email === ADMIN_EMAIL;
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isUserAdmin, 
        };
        setCurrentUser(user);
        if (isUserAdmin) setIsAdmin(true);
        await fetchAddressInternal(firebaseUser.uid);

      } else {
        // Only reset if not the static admin
        if (currentUser?.uid !== 'admin-static-id') {
            setCurrentUser(null);
            setIsAdmin(false);
            setUserAddress(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]); // Added currentUser?.uid to dependencies to re-evaluate if static admin logs out
  
  const fetchAddressInternal = async (uid: string) => {
    if (!uid || uid === 'admin-static-id') return; // Don't fetch for static admin
    try {
      const addressDocRef = doc(db, 'users', uid, 'profile', 'address');
      const addressSnap = await getDoc(addressDocRef);
      if (addressSnap.exists()) {
        setUserAddress(addressSnap.data() as Address);
      } else {
        setUserAddress(null);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setUserAddress(null);
    }
  };
  
  const fetchAddress = async () => {
    if (currentUser?.uid) {
      await fetchAddressInternal(currentUser.uid);
    }
  };


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting user & admin state
      router.push('/');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // Handle error (e.g., show toast)
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    console.warn(
        "Using static admin login. This is for UI demonstration only and will NOT work for database operations requiring Firebase authentication (e.g., adding products with restrictive Firestore rules). For full admin functionality, sign in via Google with the designated admin email."
      );
    if (password === 'admin') { 
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local', // This email is not checked against ADMIN_EMAIL for static login
        displayName: 'Admin User (Static)',
        isAdmin: true, // Static admin is always admin
      };
      setCurrentUser(adminUser);
      setIsAdmin(true);
      setUserAddress(null); // Static admin doesn't have an address
      router.push('/admin/dashboard');
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (currentUser?.uid === 'admin-static-id') {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserAddress(null);
        router.push('/login');
      } else {
        await firebaseSignOut(auth);
        // onAuthStateChanged will handle resetting user state
         setCurrentUser(null); // Explicitly clear user state immediately
         setIsAdmin(false);
         setUserAddress(null);
        router.push('/login');
      }
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
        setLoading(false);
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser?.uid || currentUser.uid === 'admin-static-id') {
      console.error("No real user logged in or static admin cannot save address this way");
      return;
    }
    try {
      const addressDocRef = doc(db, 'users', currentUser.uid, 'profile', 'address');
      await setDoc(addressDocRef, address);
      setUserAddress(address);
      console.log("Address saved successfully");
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, signInWithGoogle, adminLogin, logout, userAddress, saveAddress, fetchAddress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

