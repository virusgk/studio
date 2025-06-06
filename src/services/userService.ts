
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig';
import type { UserDocument } from '@/types';

// This function is now THE gatekeeper for admin operations.
// It uses the Firebase Admin SDK.
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
    
    if (!adminAuth || !adminDb) {
      console.error(`${logPrefix}: Firebase Admin Auth or DB SDK is not initialized. Check server startup logs.`);
      return null;
    }
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

    if (!userDocSnap.exists) {
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
  // This function is typically called by an admin, so it might also need verifyAdmin
  // However, if it's just reading data that Firestore rules allow admins to read,
  // it might be okay with client SDK if the client is an admin.
  // For consistency and security, making it admin-only via verifyAdmin is safer if called from client.
  // For now, assuming it's called in a context where client SDK's auth is sufficient or rules allow.
  // If this needs to be callable from a generic client that isn't necessarily admin, rules must permit.
  // Sticking with existing client SDK for this read, as it doesn't modify data.
  // Firestore rules would control if a non-admin client can call this.
  // If this should *only* be callable by an admin *client*, then the client page needs to handle this.
  // Or, if it's a server action used by an admin page, it should also use verifyAdmin.
  // Let's assume for now this is a read operation that the client page (AdminUsersPage) ensures only an admin can trigger.
  
  // To be truly secure if called from a client as a server action, it *should* use verifyAdmin.
  // However, just to get the `updateUserRole` working, I'll leave this for now.
  // The `getAllUsers` function in AdminUsersPage already uses client-side `db`.

  // Client-side function to get users (does not require admin auth for the action itself, rules handle access)
  // This one can continue to use the client 'db' if appropriate.
  // Firestore rules need to allow an admin client to read all user docs.
  // The existing AdminUsersPage fetches users directly with client SDK for now.
  // So, this server action `getAllUsers` might be redundant or needs to be admin-protected if exposed.
  // For simplicity, I am commenting out the previous implementation that used client 'db'
  // as AdminUsersPage fetches its own data. If this was meant to be an admin-only secure fetch, it would use verifyAdmin.
  console.warn("SERVER (userService.getAllUsers): This function is currently not designed to be securely called as a server action by non-admins. AdminUsersPage fetches users client-side. If this is intended as a secure server action, it needs an idToken and verifyAdmin().");
  return []; // Return empty, as AdminUsersPage handles its own data fetching.
}


export async function updateUserRole(idToken: string, userId: string, newRole: 'admin' | 'user'): Promise<boolean | string> {
  const serviceName = 'updateUserRole';
  console.log(`SERVER (${serviceName}): Invoked for userId: ${userId}, newRole: ${newRole}`);
  
  const adminUid = await verifyAdmin(idToken, serviceName);
  if (!adminUid) {
    console.error(`SERVER (${serviceName}): Admin verification failed for updating role of user ${userId}.`);
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }
  
  if (adminUid === userId && newRole === 'user') {
     console.warn(`SERVER (${serviceName}): Admin ${adminUid} attempting to revoke their own admin status. Denied by service.`);
     return "Server Action Error: Admins cannot revoke their own admin status through this service.";
  }

  console.log(`SERVER (${serviceName}): Admin UID ${adminUid} verified. Proceeding to update role for ${userId}.`);
  try {
    const adminDb = getAdminDb(); // Use Admin SDK's Firestore instance
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
