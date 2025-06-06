
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Changed back to signInWithPopup
import { auth, db } from '@/firebase/config';
import type { User, Address } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams to get redirect query

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

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'hervastrajsr@gmail.com').trim();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params

  useEffect(() => {
    console.log("AUTH_CONTEXT: Initializing AuthProvider effect. Current user UID (before onAuthStateChanged):", currentUser?.uid);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AUTH_CONTEXT: onAuthStateChanged triggered. Firebase user UID:", firebaseUser?.uid || 'null');
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isUserAdmin, 
        };
        console.log("AUTH_CONTEXT: User object created/updated by onAuthStateChanged:", { uid: user.uid, email: user.email, isAdmin: user.isAdmin });
        setCurrentUser(user);
        setIsAdmin(isUserAdmin);
        if (user.uid !== 'admin-static-id') { 
            await fetchAddressInternal(firebaseUser.uid);
        }
      } else {
        if (currentUser?.uid !== 'admin-static-id') {
            console.log("AUTH_CONTEXT: No Firebase user (onAuthStateChanged), clearing non-static user state.");
            setCurrentUser(null);
            setIsAdmin(false);
            setUserAddress(null);
        } else {
            console.log("AUTH_CONTEXT: No Firebase user (onAuthStateChanged), but current user is static admin. State retained.");
        }
      }
      console.log("AUTH_CONTEXT: Setting loading to false after onAuthStateChanged.");
      setLoading(false);
    });

    return () => {
      console.log("AUTH_CONTEXT: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
          
  const fetchAddressInternal = async (uid: string) => {
    if (!uid || uid === 'admin-static-id') {
      console.log("AUTH_CONTEXT: Skipping address fetch for static admin or no UID.");
      return;
    }
    console.log("AUTH_CONTEXT: Fetching address for UID:", uid);
    try {
      const addressDocRef = doc(db, 'users', uid, 'profile', 'address');
      const addressSnap = await getDoc(addressDocRef);
      if (addressSnap.exists()) {
        console.log("AUTH_CONTEXT: Address found for UID:", uid, addressSnap.data());
        setUserAddress(addressSnap.data() as Address);
      } else {
        console.log("AUTH_CONTEXT: No address found for UID:", uid);
        setUserAddress(null);
      }
    } catch (error) {
      console.error("AUTH_CONTEXT: Error fetching address for UID:", uid, error);
      setUserAddress(null);
    }
  };
  
  const fetchAddress = async () => {
    if (currentUser?.uid && currentUser.uid !== 'admin-static-id') {
      console.log("AUTH_CONTEXT: fetchAddress called for user:", currentUser.uid);
      await fetchAddressInternal(currentUser.uid);
    } else {
      console.log("AUTH_CONTEXT: fetchAddress called but no current user or user is static admin.");
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log("AUTH_CONTEXT: Attempting Google Sign-In with popup...");
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      console.log("AUTH_CONTEXT: Google Sign-In via popup successful. User:", loggedInUser?.displayName, "UID:", loggedInUser?.uid);
      
      // onAuthStateChanged will handle setting user state, but we can redirect here
      const isUserAdminResult = loggedInUser.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const redirectParam = searchParams.get('redirect');
      let redirectTo = '/';
      if (isUserAdminResult) {
        redirectTo = (redirectParam && redirectParam.startsWith('/admin')) ? redirectParam : '/admin/dashboard';
      } else {
        redirectTo = (redirectParam && !redirectParam.startsWith('/admin') && redirectParam !== '/login') ? redirectParam : '/profile';
      }
      console.log(`AUTH_CONTEXT: Redirecting to ${redirectTo} after popup sign-in.`);
      router.push(redirectTo);

    } catch (error: any) {
      console.error("AUTH_CONTEXT: Google Sign-In with popup error:", error.code, error.message, error);
      if (error.code === 'auth/popup-blocked') {
        alert("Popup blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log("AUTH_CONTEXT: Google Sign-In popup cancelled or closed by user.");
      } else {
        // Handle other errors
        alert(`Sign-in error: ${error.message}`);
      }
    } finally {
      // setLoading(false); // Let onAuthStateChanged handle the final loading state
      console.log("AUTH_CONTEXT: Finished signInWithGoogle attempt.");
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    console.warn(
        "AUTH_CONTEXT: Static admin login initiated. This is for UI demonstration only and will NOT work for database operations requiring Firebase authentication. For full admin functionality, sign in via Google with the designated admin email: " + ADMIN_EMAIL
      );
    if (password === 'admin') { 
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local',
        displayName: 'Admin User (Static)',
        photoURL: null,
        isAdmin: true,
      };
      setCurrentUser(adminUser);
      setIsAdmin(true);
      setUserAddress(null); 
      console.log("AUTH_CONTEXT: Static admin login successful.");
      setLoading(false);
      router.push('/admin/dashboard');
      return true;
    }
    console.log("AUTH_CONTEXT: Static admin login failed (invalid password).");
    setLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      console.log("AUTH_CONTEXT: Logout initiated for user:", currentUser?.uid);
      setLoading(true);
      const isStaticAdminLogout = currentUser?.uid === 'admin-static-id';
      
      setCurrentUser(null);
      setIsAdmin(false);
      setUserAddress(null);

      if (isStaticAdminLogout) {
        console.log("AUTH_CONTEXT: Logging out static admin.");
      } else {
        console.log("AUTH_CONTEXT: Signing out Firebase user.");
        await firebaseSignOut(auth);
      }
      router.push('/login');
    } catch (error) {
      console.error("AUTH_CONTEXT: Logout Error:", error);
    } finally {
      // setLoading(false); // onAuthStateChanged handles this
      console.log("AUTH_CONTEXT: Logout process finished on client.");
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser?.uid || currentUser.uid === 'admin-static-id') {
      const errorMsg = "AUTH_CONTEXT: Save address failed. User not authenticated or is static admin.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    console.log("AUTH_CONTEXT: Saving address for user:", currentUser.uid, "Data:", address);
    try {
      const addressDocRef = doc(db, 'users', currentUser.uid, 'profile', 'address');
      await setDoc(addressDocRef, address);
      setUserAddress(address);
      console.log("AUTH_CONTEXT: Address saved successfully for UID:", currentUser.uid);
    } catch (error) {
      console.error("AUTH_CONTEXT: Error saving address for UID:", currentUser.uid, error);
      throw error;
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

