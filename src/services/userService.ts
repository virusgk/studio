
'use server';
import { adminDb, adminAuth } from '@/firebase/adminConfig'; // Use Admin SDK
import type { UserDocument } from '@/types';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'; // client SDK for reads
import { db } from '@/firebase/config'; // client SDK 'db'

const usersCollectionRef = collection(db, 'users'); // For client-side reads if any, or public reads
const adminUsersCollectionRef = adminDb.collection('users'); // For admin writes/reads

async function verifyAdmin(idToken: string): Promise<string | null> {
  if (!idToken) {
    console.error("SERVER_ACTION_AUTH_USER_SVC: ID token is missing.");
    return null;
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDocRef = adminUsersCollectionRef.doc(uid); // Use adminDb here
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

// Reading all users might still be fine with client SDK if rules allow admin read,
// but for consistency and if more sensitive data is read, Admin SDK might be preferred.
// For now, keeping client SDK read as it's simpler if rules permit.
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
    const userDocRef = adminUsersCollectionRef.doc(userId);
    const updatePayload = { role: newRole };
    
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
