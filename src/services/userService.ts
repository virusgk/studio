
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
  // console.log(`SERVER: userService.updateUserRole invoked for userId: ${userId}, newRole: ${newRole}`);
  try {
    const userDocRef = doc(db, 'users', userId);
    // Firestore security rules MUST allow the calling admin to update the 'role' field.
    await updateDoc(userDocRef, { role: newRole });
    // console.log(`SERVER: User role updated successfully for userId: ${userId} to ${newRole}`);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER: userService.updateUserRole: CRITICAL ERROR while updating role for user ID ${userId}:`, fullError);
    console.error("SERVER: userService.updateUserRole: Error Object:", error);
    return `Server Error: ${fullError}`;
  }
}
