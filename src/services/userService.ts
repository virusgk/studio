
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig';
import type { UserDocument } from '@/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config'; 

const usersCollectionRef = collection(db, 'users');

async function verifyAdmin(idToken: string, serviceName: string = 'USER_SERVICE'): Promise<string | null> {
  const logPrefix = `VERIFY_ADMIN (${serviceName})`;
  if (!idToken) {
    console.error(`${logPrefix}: ID token is missing or empty.`);
    return null;
  }
  console.log(`${logPrefix}: Received ID token (first 10 chars): ${idToken.substring(0, 10)}...`);

  try {
    const adminAuth = getAdminAuth(); 
    const adminDb = getAdminDb();   
    
    console.log(`${logPrefix}: Firebase Admin Auth and DB SDKs obtained.`);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`${logPrefix}: ID token successfully verified. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`);
    } catch (tokenError: any) {
      console.error(`${logPrefix}: ID token verification FAILED. Error code: ${tokenError.code}, Message: ${tokenError.message}`, tokenError);
      return null; 
    }

    const uid = decodedToken.uid;
    const userDocRef = adminDb.collection('users').doc(uid);
    
    console.log(`${logPrefix}: Looking up user document at users/${uid}`);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists()) {
      console.error(`${logPrefix}: User document for UID ${uid} does NOT exist in Firestore.`);
      return null; 
    }
    
    const userData = userDocSnap.data();
    const userRole = userData?.role;
    console.log(`${logPrefix}: User document for UID ${uid} exists. Role found: '${userRole}'`);

    if (userRole !== 'admin') {
      console.error(`${logPrefix}: User ${uid} is NOT an admin. Role is '${userRole}'. Access denied.`);
      return null; 
    }

    console.log(`${logPrefix}: User ${uid} successfully verified as admin. Role: '${userRole}'.`);
    return uid; 
  } catch (error: any) {
    console.error(`${logPrefix}: An unexpected error occurred during admin verification. Message: ${error.message}`, error);
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
  
  const adminUid = await verifyAdmin(idToken, 'updateUserRole'); // Pass service name for better logging
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
