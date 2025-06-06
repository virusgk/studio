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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check for admin (e.g., specific UID or custom claim if set up)
        // For this example, we'll assume a specific email might be admin, or rely on manual adminLogin
        const isUserAdmin = firebaseUser.email === 'admin@stickerverse.com'; // Example admin email
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isUserAdmin, // Initial check based on Google user
        };
        setCurrentUser(user);
        if (isUserAdmin) setIsAdmin(true); // If Google user is admin
        await fetchAddressInternal(firebaseUser.uid);

      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserAddress(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const fetchAddressInternal = async (uid: string) => {
    if (!uid) return;
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
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting user
      router.push('/');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // Handle error (e.g., show toast)
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    // This is a simplified, "fake" admin login for UI demonstration
    // In a real app, this would involve checking credentials against a secure backend or Firebase Auth with custom claims
    if (password === 'admin') { // Static password
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local',
        displayName: 'Admin User',
        isAdmin: true,
      };
      setCurrentUser(adminUser);
      setIsAdmin(true);
      router.push('/admin/dashboard');
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      // If the current user is the static admin, just reset state
      if (currentUser?.uid === 'admin-static-id') {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserAddress(null);
        router.push('/login');
      } else {
        await firebaseSignOut(auth);
        // onAuthStateChanged will handle resetting user
        router.push('/login');
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser?.uid || currentUser.uid === 'admin-static-id') {
      console.error("No user logged in or admin cannot save address this way");
      return;
    }
    try {
      // Store address in Firestore: users/{uid}/profile/address
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
