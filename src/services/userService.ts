
'use server';
import { db, auth } from '@/firebase/config'; // Import auth
import type { UserDocument } from '@/types';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';

const usersCollectionRef = collection(db, 'users');
const UNAUTHENTICATED_SERVER_ACTION_ERROR = "Server Action Error: User is not authenticated in the server context. Admin operations require server-side authentication.";


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
    console.error("SERVER: userService.getAllUsers: Error fetching users from Firestore: ", error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Invoked for userId: ${userId}, newRole: ${newRole}`);
  
  const serverAuthUser = auth.currentUser;
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Firebase auth.currentUser?.uid on server: ${serverAuthUser?.uid || 'N/A (not authenticated in this server context or no user)'}`);
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Firebase auth.currentUser?.email on server: ${serverAuthUser?.email || 'N/A'}`);

  if (!serverAuthUser) {
      console.error("SERVER: UPDATE_USER_ROLE_SERVICE: " + UNAUTHENTICATED_SERVER_ACTION_ERROR);
      return UNAUTHENTICATED_SERVER_ACTION_ERROR;
  }
  if (!serverAuthUser.uid) { // Should be redundant if !serverAuthUser is caught, but good practice
      console.error("SERVER: UPDATE_USER_ROLE_SERVICE: CRITICAL - Authenticated user object present, but UID is missing.");
      return "Server Action Error: Authenticated user object is invalid (missing UID).";
  }
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Firebase auth.currentUser on server for UID ${serverAuthUser.uid}. Proceeding with Firestore operation.`);
  

  try {
    const userDocRef = doc(db, 'users', userId);
    const updatePayload = { role: newRole };
    
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: --- PREPARING TO CALL FIRESTORE updateDoc ---`);
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Target document path: users/${userId}`);
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Payload for updateDoc: ${JSON.stringify(updatePayload)}`);
    
    await updateDoc(userDocRef, updatePayload);
    
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: User role updated successfully in Firestore for userId: ${userId} to ${newRole}`);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Error (Code: ${errorCode}): ${errorMessage}`;
    
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(`SERVER: UPDATE_USER_ROLE_SERVICE: CRITICAL ERROR while updating role for user ID ${userId} to ${newRole}`);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Error Object:", error);
    console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Firebase Error Code:", errorCode);
    console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Firebase Error Message:", errorMessage);
    
    if (errorCode === 'permission-denied') {
        console.error("SERVER: UPDATE_USER_ROLE_SERVICE: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: This typically means the server action's call to Firestore was not authenticated as a user with the required role ('admin') according to Firestore Security Rules. Check that the rules are published correctly and that the user making the client-side request (whose auth state is used by the server action) has 'role: \"admin\"' in their Firestore 'users' document.");
        if (serverAuthUser?.uid === 'spgUt9pSZ4UXpQ3HqeF9V3GUnsh2' && errorCode === 'permission-denied') { 
            console.error(`SERVER: UPDATE_USER_ROLE_SERVICE: PERMISSION DENIED despite server-side auth.currentUser (${serverAuthUser.uid}) matching expected admin. This points strongly to how request.auth is interpreted by rules, subtle rule logic, or an issue with the TARGET user document IF rules depend on it.`);
        } else if (errorCode === 'permission-denied') {
            console.error(`SERVER: UPDATE_USER_ROLE_SERVICE: PERMISSION DENIED and server-side auth.currentUser (${serverAuthUser?.uid || 'N/A'}) did NOT match expected admin UID (spgUt9pSZ4UXpQ3HqeF9V3GUnsh2), or was N/A. This is the most likely cause.`);
        }
    }
    if (error.stack) {
        console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Please check Firestore rules. The client's Firebase Authentication context must be correctly propagated to the server action's execution environment for Firestore rules to validate the user's admin role.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
    return `Server Error: ${fullError}`;
  }
}

