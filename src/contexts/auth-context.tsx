
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Removed ADMIN_EMAIL constant

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const manageUserDocument = async (firebaseUser: FirebaseUser): Promise<UserDocument> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      // User exists, update last login
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
        // Optionally update displayName and photoURL if they changed
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });
      console.log("AUTH_CONTEXT: User document updated for UID:", firebaseUser.uid);
      return userSnap.data() as UserDocument;
    } else {
      // User does not exist, create new document
      const newUserDoc: UserDocument = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserDoc);
      console.log("AUTH_CONTEXT: New user document created for UID:", firebaseUser.uid, "with role 'user'");
      return newUserDoc;
    }
  };

  useEffect(() => {
    console.log("AUTH_CONTEXT: Initializing AuthProvider effect.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AUTH_CONTEXT: onAuthStateChanged triggered. Firebase user UID:", firebaseUser?.uid || 'null');
      if (firebaseUser) {
        const userDocData = await manageUserDocument(firebaseUser);
        const userRole = userDocData.role;
        const isUserAdmin = userRole === 'admin';

        console.log(`AUTH_CONTEXT: User role from Firestore for ${firebaseUser.email}: ${userRole}. Is admin: ${isUserAdmin}`);

        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: isUserAdmin,
          role: userRole,
        };
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
          console.log("AUTH_CONTEXT: No Firebase user (onAuthStateChanged), but current user is static admin. State retained for UI.");
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
        setUserAddress(addressSnap.data() as Address);
      } else {
        setUserAddress(null);
      }
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

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log("AUTH_CONTEXT: Attempting Google Sign-In with popup...");
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      if (loggedInUser) {
        const userDocData = await manageUserDocument(loggedInUser); // This will also set state via onAuthStateChanged
        const userRole = userDocData.role;
        const isUserAdminResult = userRole === 'admin';

        console.log(`AUTH_CONTEXT: Google Sign-In successful for ${loggedInUser.email}. Role from Firestore: ${userRole}. Is admin: ${isUserAdminResult}`);
        
        const redirectParam = searchParams.get('redirect');
        let redirectTo = '/';
        if (isUserAdminResult) {
          redirectTo = (redirectParam && redirectParam.startsWith('/admin')) ? redirectParam : '/admin/dashboard';
        } else {
          redirectTo = (redirectParam && !redirectParam.startsWith('/admin') && redirectParam !== '/login') ? redirectParam : '/profile';
        }
        console.log(`AUTH_CONTEXT: Redirecting to ${redirectTo} after popup sign-in.`);
        router.push(redirectTo);
      } else {
         console.error("AUTH_CONTEXT: Google Sign-In popup successful but no user object returned.");
      }

    } catch (error: any) {
      console.error("AUTH_CONTEXT: Google Sign-In with popup error:", error.code, error.message, error);
      // Error handling for popup blocked etc.
    } finally {
      // setLoading(false); // onAuthStateChanged will handle setting loading to false
      console.log("AUTH_CONTEXT: Finished signInWithGoogle attempt.");
    }
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    console.warn(
      "AUTH_CONTEXT: Static admin login initiated. This user can manage user roles. For other database operations (like managing products), dynamic admin status from Firestore is required."
    );
    if (password === 'admin') {
      const adminUser: User = {
        uid: 'admin-static-id',
        email: 'admin@stickerverse.local',
        displayName: 'Admin User (Static)',
        photoURL: null,
        isAdmin: true, // Static admin is always admin for UI purposes
        role: 'admin', // Assign role for consistency, though not from DB
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

      if (!isStaticAdminLogout && auth.currentUser) {
        console.log("AUTH_CONTEXT: Signing out Firebase user.");
        await firebaseSignOut(auth);
      } else {
         console.log("AUTH_CONTEXT: Clearing static admin session or no Firebase user to sign out.");
      }
      // onAuthStateChanged will handle resetting currentUser, isAdmin, etc.
      // For static admin, we clear explicitly if onAuthStateChanged doesn't pick up a new user
      if(isStaticAdminLogout){
          setCurrentUser(null);
          setIsAdmin(false);
          setUserAddress(null);
      }
      router.push('/login');
    } catch (error) {
      console.error("AUTH_CONTEXT: Logout Error:", error);
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged or explicitly if static
      console.log("AUTH_CONTEXT: Logout process finished on client.");
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
