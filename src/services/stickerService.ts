
'use server';
import { db } from '@/firebase/config';
import type { Sticker } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

const stickersCollectionRef = collection(db, 'stickers');

export async function getStickersFromDB(): Promise<Sticker[]> {
  try {
    const q = query(stickersCollectionRef, orderBy('name'));
    console.log("SERVER: GET_STICKERS_FROM_DB: Attempting to fetch stickers from Firestore...");
    const data = await getDocs(q);
    const stickers = data.docs.map((doc) => {
      const docData = doc.data();
      return {
        ...docData,
        id: doc.id,
      } as Sticker;
    });
    console.log("SERVER: GET_STICKERS_FROM_DB: Fetched stickers successfully from Firestore. Count:", stickers.length);
    return stickers;
  } catch (error) {
    console.error("SERVER: GET_STICKERS_FROM_DB: Error fetching stickers from Firestore: ", error);
    return [];
  }
}

export async function addStickerToDB(stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  console.log("SERVER: ADD_STICKER_TO_DB: Service function invoked.");
  console.log("SERVER: ADD_STICKER_TO_DB: Received sticker data for add:", JSON.stringify(stickerData, null, 2));
  try {
    const dataWithTimestamps = {
      ...stickerData,
      // createdAt: Timestamp.now(), // Example: consider adding timestamps
      // updatedAt: Timestamp.now(),
    };
    console.log("SERVER: ADD_STICKER_TO_DB: --- PREPARING TO CALL FIRESTORE addDoc ---");
    console.log("SERVER: ADD_STICKER_TO_DB: Data being sent to addDoc:", JSON.stringify(dataWithTimestamps, null, 2));
    const docRef = await addDoc(stickersCollectionRef, dataWithTimestamps);
    console.log("SERVER: ADD_STICKER_TO_DB: Sticker added successfully to Firestore. Document ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Error (Code: ${errorCode}): ${errorMessage}`;
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: CRITICAL ERROR WHILE ADDING STICKER TO FIRESTORE");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: Error Object:", error);
    console.error("SERVER: ADD_STICKER_TO_DB: Firebase Error Code:", errorCode);
    console.error("SERVER: ADD_STICKER_TO_DB: Firebase Error Message:", errorMessage);
    if (errorCode === 'permission-denied') {
        console.error("SERVER: ADD_STICKER_TO_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: This typically means the server action's call to Firestore was not authenticated as a user with the required role ('admin') according to Firestore Security Rules. Check that the rules are published correctly and that the user making the client-side request has 'role: \"admin\"' in their Firestore 'users' document. The server action's Firebase Authentication context (derived from the client's context) must allow this operation according to your Firestore rules.");
    }
    if (error.stack) {
        console.error("SERVER: ADD_STICKER_TO_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: Please check Firestore rules, data payload, and Firebase project config. Ensure the server action is invoked with proper Firebase Authentication context if rules require it.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; // Return detailed error message
  }
}

export async function updateStickerInDB(stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Service function invoked for ID: ${stickerId}.`);
  console.log("SERVER: UPDATE_STICKER_IN_DB: Received sticker data for update:", JSON.stringify(stickerData, null, 2));
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      // updatedAt: Timestamp.now(), // Example: consider adding timestamps
    };
    console.log("SERVER: UPDATE_STICKER_IN_DB: --- PREPARING TO CALL FIRESTORE updateDoc ---");
    console.log("SERVER: UPDATE_STICKER_IN_DB: Data being sent to updateDoc for ID " + stickerId + ":", JSON.stringify(dataWithTimestamps, null, 2));
    await updateDoc(stickerDoc, dataWithTimestamps);
    console.log("SERVER: UPDATE_STICKER_IN_DB: Sticker updated successfully in Firestore for ID:", stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Error (Code: ${errorCode}): ${errorMessage}`;
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(`SERVER: UPDATE_STICKER_IN_DB: CRITICAL ERROR WHILE UPDATING STICKER ID ${stickerId}`);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: UPDATE_STICKER_IN_DB: Error Object:", error);
    console.error("SERVER: UPDATE_STICKER_IN_DB: Firebase Error Code:", errorCode);
    console.error("SERVER: UPDATE_STICKER_IN_DB: Firebase Error Message:", errorMessage);
     if (errorCode === 'permission-denied') {
        console.error("SERVER: UPDATE_STICKER_IN_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: This typically means the server action's call to Firestore was not authenticated as a user with the required role ('admin') according to Firestore Security Rules. Check that the rules are published correctly and that the user making the client-side request has 'role: \"admin\"' in their Firestore 'users' document. The server action's Firebase Authentication context (derived from the client's context) must allow this operation according to your Firestore rules.");
    }
    if (error.stack) {
        console.error("SERVER: UPDATE_STICKER_IN_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; // Return detailed error message
  }
}

export async function deleteStickerFromDB(stickerId: string): Promise<boolean | string> {
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Service function invoked for ID: ${stickerId}.`);
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    console.log("SERVER: DELETE_STICKER_FROM_DB: --- PREPARING TO CALL FIRESTORE deleteDoc ---");
    console.log("SERVER: DELETE_STICKER_FROM_DB: Attempting to delete document with ID:", stickerId);
    await deleteDoc(stickerDoc);
    console.log("SERVER: DELETE_STICKER_FROM_DB: Sticker deleted successfully from Firestore for ID:", stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Error (Code: ${errorCode}): ${errorMessage}`;
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(`SERVER: DELETE_STICKER_FROM_DB: CRITICAL ERROR WHILE DELETING STICKER ID ${stickerId}`);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: DELETE_STICKER_FROM_DB: Error Object:", error);
    console.error("SERVER: DELETE_STICKER_FROM_DB: Firebase Error Code:", errorCode);
    console.error("SERVER: DELETE_STICKER_FROM_DB: Firebase Error Message:", errorMessage);
    if (errorCode === 'permission-denied') {
        console.error("SERVER: DELETE_STICKER_FROM_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: This typically means the server action's call to Firestore was not authenticated as a user with the required role ('admin') according to Firestore Security Rules. Check that the rules are published correctly and that the user making the client-side request has 'role: \"admin\"' in their Firestore 'users' document. The server action's Firebase Authentication context (derived from the client's context) must allow this operation according to your Firestore rules.");
    }
     if (error.stack) {
        console.error("SERVER: DELETE_STICKER_FROM_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; // Return detailed error message
  }
}

