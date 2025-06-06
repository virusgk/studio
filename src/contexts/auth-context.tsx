
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import type { User, Address, UserDocument } from '@/types';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

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
  getIdToken: () => Promise<string | null>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rawFirebaseUser, setRawFirebaseUser] = useState<FirebaseUser | null>(null); // Store raw FirebaseUser
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const manageUserDocument = async (firebaseUser: FirebaseUser): Promise<UserDocument> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
      return userSnap.data() as UserDocument;
    } else {
      const newUserDoc: UserDocument = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserDoc);
      return newUserDoc;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setRawFirebaseUser(fbUser); // Store the raw FirebaseUser
      if (fbUser) {
        const userDocData = await manageUserDocument(fbUser);
        const userRole = userDocData.role;
        const isUserAdmin = userRole === 'admin';

        const user: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          isAdmin: isUserAdmin,
          role: userRole,
        };
        setCurrentUser(user);
        setIsAdmin(isUserAdmin);

        if (user.uid !== 'admin-static-id') {
          await fetchAddressInternal(fbUser.uid);
        }
        setLoading(false);
      } else {
        if (currentUser?.uid !== 'admin-static-id') {
          setCurrentUser(null);
          setIsAdmin(false);
          setUserAddress(null);
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAddressInternal = async (uid: string) => {
    if (!uid || uid === 'admin-static-id') return;
    try {
      const addressDocRef = doc(db, 'users', uid, 'profile', 'address');
      const addressSnap = await getDoc(addressDocRef);
      setUserAddress(addressSnap.exists() ? (addressSnap.data() as Address) : null);
    } catch (error) {
      console.error("AUTH_CONTEXT: Error fetching address for UID:", uid, error);
      setUserAddress(null);
    }
  };

  const fetchAddress = async () => {
    if (currentUser?.uid && currentUser.uid !== 'admin-static-id') {
      await fetchAddressInternal(currentUser.uid);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (rawFirebaseUser) {
      try {
        return await rawFirebaseUser.getIdToken(true); // true to force refresh token
      } catch (error) {
        console.error("AUTH_CONTEXT: Error getting ID token:", error);
        // Potentially handle specific errors like auth/network-request-failed
        // or auth/user-token-expired and prompt re-login
        return null;
      }
    }
    // console.warn("AUTH_CONTEXT: getIdToken called but no rawFirebaseUser available.");
    return null;
  };


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      if (loggedInUser) {
        const userDocData = await manageUserDocument(loggedInUser);
        const isUserAdminResult = userDocData.role === 'admin';
        const redirectParam = searchParams.get('redirect');
        let redirectTo = '/';
        if (isUserAdminResult) {
          redirectTo = (redirectParam && redirectParam.startsWith('/admin')) ? redirectParam : '/admin/dashboard';
        } else {
          redirectTo = (redirectParam && !redirectParam.startsWith('/admin') && redirectParam !== '/login') ? redirectParam : '/profile';
        }
        router.push(redirectTo);
      } else {
         setLoading(false);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.info(
          "AUTH_CONTEXT: Google Sign-In popup was closed. This might be due to direct user cancellation, " +
          "browser blocking third-party cookies, a browser extension interfering, or the popup closing " +
          "unexpectedly. Please check browser settings (cookies, extensions) if not cancelled intentionally.",
          error.message
        );
      } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/unauthorized-domain') {
        console.error(
          "AUTH_CONTEXT: Google Sign-In error: ", error.code, error.message,
          "\nTROUBLESHOOTING: This error usually indicates a Firebase project configuration issue." +
          "\nPlease check in Firebase Console:" +
          "\n1. Authentication -> Sign-in method -> Google: Ensure it is ENABLED." +
          "\n2. Authentication -> Settings -> Authorized domains: Ensure your application's domain is listed."
        );
      } else {
        console.error("AUTH_CONTEXT: Google Sign-In error:", error.code, error.message);
      }
      setLoading(false);
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    if (password === 'admin') {
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local',
        displayName: 'Admin User (Static)',
        photoURL: null,
        isAdmin: true,
        role: 'admin',
      };
      setCurrentUser(adminUser);
      setRawFirebaseUser(null); // Static admin doesn't have a raw Firebase user
      setIsAdmin(true);
      setUserAddress(null);
      setLoading(false);
      router.push('/admin/dashboard');
      return true;
    }
    setLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      setLoading(true);
      const isStaticAdminLogout = currentUser?.uid === 'admin-static-id';
      if (!isStaticAdminLogout && auth.currentUser) {
        await firebaseSignOut(auth);
      }
      // onAuthStateChanged will handle resetting state for Firebase users
      // For static admin, manually reset:
      if (isStaticAdminLogout) {
        setCurrentUser(null);
        setRawFirebaseUser(null);
        setIsAdmin(false);
        setUserAddress(null);
      }
      router.push('/login');
    } catch (error) {
      console.error("AUTH_CONTEXT: Logout Error:", error);
    } finally {
       // Ensure loading is set to false even if onAuthStateChanged doesn't fire quickly
       // or if it was a static admin logout.
       setLoading(false);
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser?.uid || currentUser.uid === 'admin-static-id') {
      const errorMsg = "AUTH_CONTEXT: Save address failed. User not authenticated or is static admin.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const addressDocRef = doc(db, 'users', currentUser.uid, 'profile', 'address');
      await setDoc(addressDocRef, address);
      setUserAddress(address);
    } catch (error) {
      console.error("AUTH_CONTEXT: Error saving address for UID:", currentUser.uid, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, signInWithGoogle, adminLogin, logout, userAddress, saveAddress, fetchAddress, getIdToken }}>
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
