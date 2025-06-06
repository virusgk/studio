
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import type { User, Address } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  adminLogin: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  userAddress: Address | null;
  saveAddress: (address: Address) => Promise<void>;
  fetchAddress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@stickerverse.com').trim();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email?.trim() === ADMIN_EMAIL;
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isUserAdmin, 
        };
        setCurrentUser(user);
        if (isUserAdmin) setIsAdmin(true);
        if (user.uid !== 'admin-static-id') { // Don't fetch for static admin
            await fetchAddressInternal(firebaseUser.uid);
        }
      } else {
        if (currentUser?.uid !== 'admin-static-id') {
            setCurrentUser(null);
            setIsAdmin(false);
            setUserAddress(null);
        }
      }
      setLoading(false);
    });

    // Handle redirect result from Google Sign-In
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User is signed in. onAuthStateChanged will handle setting state.
          // You can access the user from result.user if needed immediately.
          // const user = result.user;
          // console.log("Google Sign-In via redirect successful for user:", user?.displayName);
          // Redirect to home or intended page after successful sign-in from redirect.
          // The onAuthStateChanged listener will also fire and set user state.
          const redirectPath = sessionStorage.getItem('firebaseRedirectPath') || '/';
          sessionStorage.removeItem('firebaseRedirectPath');
          router.push(redirectPath);
        }
      })
      .catch((error) => {
        console.error("Google Sign-In Redirect Error:", error);
        // Handle specific errors (e.g., auth/account-exists-with-different-credential)
      })
      .finally(() => {
        // Ensure loading is false after attempting to get redirect result,
        // especially if onAuthStateChanged hasn't fired yet.
        // Be cautious here, as onAuthStateChanged might set it true then false again.
        // setLoading(false); // This might cause a flash if onAuthStateChanged takes time.
      });


    return () => unsubscribe();
  }, [currentUser?.uid, router]);
  
  const fetchAddressInternal = async (uid: string) => {
    if (!uid || uid === 'admin-static-id') return;
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
    if (currentUser?.uid && currentUser.uid !== 'admin-static-id') {
      await fetchAddressInternal(currentUser.uid);
    }
  };


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      // Store the current path to redirect back after sign-in
      sessionStorage.setItem('firebaseRedirectPath', window.location.pathname);
      await signInWithRedirect(auth, provider);
      // After this call, the browser will redirect to Google.
      // The result is handled by getRedirectResult in the useEffect hook when the page reloads.
    } catch (error) {
      console.error("Google Sign-In Error (signInWithRedirect initiation):", error);
      setLoading(false); // Ensure loading is false if the redirect initiation fails
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    console.warn(
        "Using static admin login. This is for UI demonstration only and will NOT work for database operations requiring Firebase authentication (e.g., adding products with restrictive Firestore rules). For full admin functionality, sign in via Google with the designated admin email."
      );
    if (password === 'admin') { 
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local',
        displayName: 'Admin User (Static)',
        isAdmin: true,
      };
      setCurrentUser(adminUser);
      setIsAdmin(true);
      setUserAddress(null);
      setLoading(false); // setLoading false for static admin login
      router.push('/admin/dashboard');
      return true;
    }
    setLoading(false); // setLoading false if static admin login fails
    return false;
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (currentUser?.uid === 'admin-static-id') {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserAddress(null);
      } else {
        await firebaseSignOut(auth);
         setCurrentUser(null); 
         setIsAdmin(false);
         setUserAddress(null);
      }
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
        setLoading(false);
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser?.uid || currentUser.uid === 'admin-static-id') {
      console.error("No real user logged in or static admin cannot save address this way");
      throw new Error("User not authenticated to save address.");
    }
    try {
      const addressDocRef = doc(db, 'users', currentUser.uid, 'profile', 'address');
      await setDoc(addressDocRef, address);
      setUserAddress(address);
      console.log("Address saved successfully");
    } catch (error) {
      console.error("Error saving address:", error);
      throw error; // Re-throw to be caught by caller
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

