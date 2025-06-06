
'use server';
import { db } from '@/firebase/config';
import type { UserDocument } from '@/types';
import { collection, getDocs, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // For checking admin status on server if needed, but rules should handle it

const usersCollectionRef = collection(db, 'users');

export async function getAllUsers(): Promise<UserDocument[]> {
  try {
    // console.log("SERVER: userService.getAllUsers invoked.");
    // Note: Server actions execute with the privileges of the authenticated user making the call.
    // Firestore security rules MUST allow the calling admin to read the 'users' collection.
    const q = query(usersCollectionRef, orderBy('email')); // Order by email or displayName
    const data = await getDocs(q);
    const users = data.docs.map((doc) => {
      const docData = doc.data();
      return {
        ...docData,
        uid: doc.id, // Firestore doc ID is the UID
        createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : null, // Convert Timestamp
        lastLogin: docData.lastLogin?.toDate ? docData.lastLogin.toDate().toISOString() : null, // Convert Timestamp
      } as UserDocument;
    });
    // console.log("SERVER: Fetched users successfully from Firestore:", users.length);
    return users;
  } catch (error: any) {
    console.error("SERVER: userService.getAllUsers: Error fetching users from Firestore: ", error);
    // Consider how to propagate this error. Returning an empty array for now.
    // Or throw new Error(`Failed to fetch users: ${error.message}`);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Invoked for userId: ${userId}, newRole: ${newRole}`);
  try {
    const userDocRef = doc(db, 'users', userId);
    const updatePayload = { role: newRole };
    
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: --- PREPARING TO CALL FIRESTORE updateDoc ---`);
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Target document path: users/${userId}`);
    console.log(`SERVER: UPDATE_USER_ROLE_SERVICE: Payload for updateDoc: ${JSON.stringify(updatePayload)}`);
    
    // Firestore security rules MUST allow the calling admin to update the 'role' field.
    // If called by static admin via a server action, Firestore might see request.auth as null.
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
    if (error.stack) {
        console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: UPDATE_USER_ROLE_SERVICE: Please check Firestore rules. If the static admin is making this call, Firestore rules might see the request as unauthenticated or without the expected 'admin-static-id' in 'request.auth.uid' when the server action executes.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
    return `Server Error: ${fullError}`;
  }
}

