
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig';
import type { UserDocument } from '@/types';

// This function is now THE gatekeeper for admin operations.
// It uses the Firebase Admin SDK.
async function verifyAdmin(idToken: string, serviceName: string = 'USER_SERVICE'): Promise<{ uid: string } | { error: string; isInitializationError?: boolean }> {
  const logPrefix = `VERIFY_ADMIN (${serviceName})`;
  if (!idToken) {
    const errorMsg = `${logPrefix}: ID token is missing or empty.`;
    console.error(errorMsg);
    return { error: "ID token is missing or empty." };
  }
  console.log(`${logPrefix}: Received ID token (first 10 chars): ${idToken.substring(0, 10)}...`);

  try {
    const adminAuth = getAdminAuth(); 
    const adminDb = getAdminDb();   
    
    if (!adminAuth || !adminDb) {
      const errorMsg = `${logPrefix}: Firebase Admin Auth or DB SDK is not initialized. Check server startup logs. This usually means the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is missing or invalid.`;
      console.error(errorMsg);
      // This case should ideally be caught by getAdminAuth/getAdminDb throwing, but as a fallback:
      return { error: "Firebase Admin Auth or DB SDK is not initialized. Check server startup logs.", isInitializationError: true };
    }
    console.log(`${logPrefix}: Firebase Admin Auth and DB SDKs obtained.`);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`${logPrefix}: ID token successfully verified. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`);
    } catch (tokenError: any) {
      const errorMsg = `${logPrefix}: ID token verification FAILED. Error code: ${tokenError.code}, Message: ${tokenError.message}`;
      console.error(errorMsg, tokenError);
      return { error: `ID token verification FAILED. ${tokenError.message}` }; 
    }

    const uid = decodedToken.uid;
    const userDocRef = adminDb.collection('users').doc(uid);
    
    console.log(`${logPrefix}: Looking up user document at users/${uid}`);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      const errorMsg = `${logPrefix}: User document for UID ${uid} does NOT exist in Firestore. Cannot verify admin status.`;
      console.error(errorMsg);
      return { error: `User document for UID ${uid} not found. Cannot verify admin status.` }; 
    }
    
    const userData = userDocSnap.data();
    const userRole = userData?.role;
    console.log(`${logPrefix}: User document for UID ${uid} exists. Role found: '${userRole}'`);

    if (userRole !== 'admin') {
      const errorMsg = `${logPrefix}: User ${uid} is NOT an admin. Role is '${userRole}'. Access denied.`;
      console.error(errorMsg);
      return { error: `User ${uid} (Email: ${decodedToken.email}) is not authorized (role: ${userRole}). Access denied.` }; 
    }

    console.log(`${logPrefix}: User ${uid} (Email: ${decodedToken.email}) successfully verified as admin. Role: '${userRole}'.`);
    return { uid }; 
  } catch (error: any) {
    // This catch block will now primarily catch errors from getAdminAuth() or getAdminDb() if they throw.
    const isInitializationError = error.message.includes("Firebase Admin Auth is not initialized") || 
                                  error.message.includes("Firebase Admin Firestore is not initialized");
    const specificMessage = `${logPrefix}: Admin verification failed. Error: ${error.message}`;
    console.error(specificMessage, error);
    return { error: error.message, isInitializationError };
  }
}

export async function getAllUsers(): Promise<UserDocument[]> {
  // This server action is not currently used by the client, 
  // as AdminUsersPage fetches its own data using the client SDK.
  // If it were to be used as a secure admin-only endpoint, it would need an idToken and verifyAdmin.
  // For now, returning empty as per previous state.
  console.warn("SERVER (userService.getAllUsers): This function is currently not designed to be securely called as a server action by non-admins. AdminUsersPage fetches users client-side. If this is intended as a secure server action, it needs an idToken and verifyAdmin().");
  return []; 
}


export async function updateUserRole(idToken: string, userId: string, newRole: 'admin' | 'user'): Promise<boolean | string> {
  const serviceName = 'updateUserRole';
  console.log(`SERVER (${serviceName}): Invoked for userId: ${userId}, newRole: ${newRole}`);
  
  const verificationResult = await verifyAdmin(idToken, serviceName);
  if ('error' in verificationResult) {
    let errorMessage = verificationResult.error;
    if (verificationResult.isInitializationError) {
      errorMessage = `Critical Firebase Admin SDK issue: ${verificationResult.error}`;
    } else {
      errorMessage = `Authorization failed: ${verificationResult.error}`;
    }
    console.error(`SERVER (${serviceName}): Admin verification failed for updating role of user ${userId}. Error: ${errorMessage}`);
    return `Server Action Error: ${errorMessage}`;
  }
  const adminUid = verificationResult.uid;
  
  if (adminUid === userId && newRole === 'user') {
     const selfRevokeError = `Server Action Error: Admins (UID: ${adminUid}) cannot revoke their own admin status through this service.`;
     console.warn(`SERVER (${serviceName}): ${selfRevokeError}`);
     return selfRevokeError;
  }

  console.log(`SERVER (${serviceName}): Admin UID ${adminUid} verified. Proceeding to update role for ${userId}.`);
  try {
    const adminDb = getAdminDb(); 
    const userDocRef = adminDb.collection('users').doc(userId);
    const updatePayload = { 
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userDocRef.update(updatePayload);
    
    console.log(`SERVER (${serviceName}): User role updated successfully using Admin SDK for userId: ${userId} to ${newRole}`);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    
    console.error(`SERVER (${serviceName}): CRITICAL ERROR while updating role for user ID ${userId} to ${newRole} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`;
  }
}
