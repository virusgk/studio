
'use server';
import { db, auth } from '@/firebase/config'; // Import auth
import type { Sticker } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

const stickersCollectionRef = collection(db, 'stickers');
const UNAUTHENTICATED_SERVER_ACTION_ERROR = "Server Action Error: User is not authenticated in the server context. Admin operations require server-side authentication.";


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
  
  const serverAuthUser = auth.currentUser;
  console.log(`SERVER: ADD_STICKER_TO_DB: Firebase auth.currentUser?.uid on server: ${serverAuthUser?.uid || 'N/A (not authenticated or no user)'}`);
  if (!serverAuthUser) {
      console.error("SERVER: ADD_STICKER_TO_DB: " + UNAUTHENTICATED_SERVER_ACTION_ERROR);
      return UNAUTHENTICATED_SERVER_ACTION_ERROR;
  }
  if (!serverAuthUser.uid) { // Should be redundant if !serverAuthUser is caught, but good practice
      console.error("SERVER: ADD_STICKER_TO_DB: CRITICAL - Authenticated user object present, but UID is missing.");
      return "Server Action Error: Authenticated user object is invalid (missing UID).";
  }
  console.log(`SERVER: ADD_STICKER_TO_DB: Authenticated user in server action context: ${serverAuthUser.uid}. Firestore 'add' will proceed under this user's identity.`);


  console.log("SERVER: ADD_STICKER_TO_DB: Received sticker data for add:", JSON.stringify(stickerData, null, 2));
  try {
    const dataWithTimestamps = {
      ...stickerData,
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
        console.error("SERVER: ADD_STICKER_TO_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: Server action's call to Firestore was denied. Check Firestore rules for 'stickers' collection (allow write) and ensure the server action's authenticated user context (logged above as " + (serverAuthUser?.uid || 'N/A') + ") meets rule criteria (e.g., has 'role: \"admin\"' in their 'users' document).");
    }
    if (error.stack) {
        console.error("SERVER: ADD_STICKER_TO_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; 
  }
}

export async function updateStickerInDB(stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Service function invoked for ID: ${stickerId}.`);

  const serverAuthUser = auth.currentUser;
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Firebase auth.currentUser?.uid on server: ${serverAuthUser?.uid || 'N/A (not authenticated or no user)'}`);
   if (!serverAuthUser) {
      console.error("SERVER: UPDATE_STICKER_IN_DB: " + UNAUTHENTICATED_SERVER_ACTION_ERROR);
      return UNAUTHENTICATED_SERVER_ACTION_ERROR;
  }
   if (!serverAuthUser.uid) {
      console.error("SERVER: UPDATE_STICKER_IN_DB: CRITICAL - Authenticated user object present, but UID is missing.");
      return "Server Action Error: Authenticated user object is invalid (missing UID).";
  }
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Authenticated user in server action context: ${serverAuthUser.uid}. Firestore 'update' will proceed under this user's identity.`);


  console.log("SERVER: UPDATE_STICKER_IN_DB: Received sticker data for update:", JSON.stringify(stickerData, null, 2));
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    const dataWithTimestamps = {
      ...stickerData,
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
        console.error("SERVER: UPDATE_STICKER_IN_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: Server action's call to Firestore was denied. Check Firestore rules for 'stickers' collection (allow write) and ensure the server action's authenticated user context (logged above as " + (serverAuthUser?.uid || 'N/A') + ") meets rule criteria (e.g., has 'role: \"admin\"' in their 'users' document).");
    }
    if (error.stack) {
        console.error("SERVER: UPDATE_STICKER_IN_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; 
  }
}

export async function deleteStickerFromDB(stickerId: string): Promise<boolean | string> {
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Service function invoked for ID: ${stickerId}.`);

  const serverAuthUser = auth.currentUser;
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Firebase auth.currentUser?.uid on server: ${serverAuthUser?.uid || 'N/A (not authenticated or no user)'}`);
   if (!serverAuthUser) {
      console.error("SERVER: DELETE_STICKER_FROM_DB: " + UNAUTHENTICATED_SERVER_ACTION_ERROR);
      return UNAUTHENTICATED_SERVER_ACTION_ERROR;
  }
   if (!serverAuthUser.uid) {
      console.error("SERVER: DELETE_STICKER_FROM_DB: CRITICAL - Authenticated user object present, but UID is missing.");
      return "Server Action Error: Authenticated user object is invalid (missing UID).";
  }
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Authenticated user in server action context: ${serverAuthUser.uid}. Firestore 'delete' will proceed under this user's identity.`);

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
        console.error("SERVER: DELETE_STICKER_FROM_DB: SPECIFIC_ADVICE_FOR_PERMISSION_DENIED: Server action's call to Firestore was denied. Check Firestore rules for 'stickers' collection (allow write) and ensure the server action's authenticated user context (logged above as " + (serverAuthUser?.uid || 'N/A') + ") meets rule criteria (e.g., has 'role: \"admin\"' in their 'users' document).");
    }
     if (error.stack) {
        console.error("SERVER: DELETE_STICKER_FROM_DB: Error Stack Trace:", error.stack);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return `Server Error: ${fullError}`; 
  }
}

