
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig'; // Use Admin SDK getters
import type { UserDocument } from '@/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // client SDK for reads
import { db } from '@/firebase/config'; // client SDK 'db'

const usersCollectionRef = collection(db, 'users'); // For client-side reads if any, or public reads

async function verifyAdmin(idToken: string): Promise<string | null> {
  if (!idToken) {
    console.error("SERVER_ACTION_AUTH_USER_SVC: ID token is missing.");
    return null;
  }
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDocRef = adminDb.collection('users').doc(uid); 
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists() || userDocSnap.data()?.role !== 'admin') {
      console.error(`SERVER_ACTION_AUTH_USER_SVC: User ${uid} is not authorized (not found or not admin). Role: ${userDocSnap.data()?.role}`);
      return null;
    }
    console.log(`SERVER_ACTION_AUTH_USER_SVC: User ${uid} verified as admin.`);
    return uid; // Return UID if admin
  } catch (error) {
    console.error("SERVER_ACTION_AUTH_USER_SVC: ID token verification failed or user lookup error.", error);
    return null;
  }
}

export async function getAllUsers(): Promise<UserDocument[]> {
  try {
    const q = query(usersCollectionRef, orderBy('email')); 
    const data = await getDocs(q);
    const users = data.docs.map((doc) => {
      const docData = doc.data();
      return {
        ...docData,
        uid: doc.id, 
        createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : null, 
        lastLogin: docData.lastLogin?.toDate ? docData.lastLogin.toDate().toISOString() : null, 
      } as UserDocument;
    });
    return users;
  } catch (error: any) {
    console.error("SERVER: userService.getAllUsers: Error fetching users from Firestore (Client SDK): ", error);
    return [];
  }
}

export async function updateUserRole(idToken: string, userId: string, newRole: 'admin' | 'user'): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Invoked for userId: ${userId}, newRole: ${newRole}`);
  
  const adminUid = await verifyAdmin(idToken);
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }
  
  if (adminUid === userId && newRole === 'user') {
     console.warn(`SERVER: UPDATE_USER_ROLE_SERVICE: Admin ${adminUid} attempting to revoke their own admin status. Denied by service.`);
     return "Server Action Error: Admins cannot revoke their own admin status through this service.";
  }

  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Admin ${adminUid} verified. Proceeding to update role for ${userId}.`);
  try {
    const adminDb = getAdminDb();
    const userDocRef = adminDb.collection('users').doc(userId);
    const updatePayload = { 
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() // Add updatedAt timestamp
    };
    
    await userDocRef.update(updatePayload);
    
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: User role updated successfully using Admin SDK for userId: ${userId} to ${newRole}`);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    
    console.error(`SERVER: UPDATE_USER_ROLE_SERVICE: CRITICAL ERROR while updating role for user ID ${userId} to ${newRole} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`;
  }
}
