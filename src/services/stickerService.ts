
'use server';
import { db } from '@/firebase/config';
import type { Sticker } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

const stickersCollectionRef = collection(db, 'stickers');

export async function getStickersFromDB(): Promise<Sticker[]> {
  try {
    const q = query(stickersCollectionRef, orderBy('name'));
    const data = await getDocs(q);
    const stickers = data.docs.map((doc) => {
      const docData = doc.data();
      return {
        ...docData,
        id: doc.id,
      } as Sticker;
    });
    // console.log("SERVER: Fetched stickers successfully from Firestore:", stickers.length);
    return stickers;
  } catch (error) {
    console.error("SERVER: GET_STICKERS_FROM_DB: Error fetching stickers from Firestore: ", error);
    return [];
  }
}

export async function addStickerToDB(stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  console.log("SERVER: ADD_STICKER_TO_DB: Service function invoked.");
  console.log("SERVER: ADD_STICKER_TO_DB: Received sticker data:", JSON.stringify(stickerData, null, 2));
  try {
    const dataWithTimestamps = {
      ...stickerData,
      // createdAt: Timestamp.now(),
      // updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(stickersCollectionRef, dataWithTimestamps);
    console.log("SERVER: ADD_STICKER_TO_DB: Sticker added successfully to Firestore. Document ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: CRITICAL ERROR WHILE ADDING STICKER TO FIRESTORE");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: Error Object:", error);
    if (error instanceof Error) {
        console.error("SERVER: ADD_STICKER_TO_DB: Firebase Error Code (if available):", (error as any).code);
        console.error("SERVER: ADD_STICKER_TO_DB: Firebase Error Message:", error.message);
        console.error("SERVER: ADD_STICKER_TO_DB: Error Stack Trace:", error.stack);
    } else {
        console.error("SERVER: ADD_STICKER_TO_DB: Encountered an error that is not an instance of Error:", error);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: ADD_STICKER_TO_DB: Please check Firestore rules, data payload, and Firebase project config.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return null;
  }
}

export async function updateStickerInDB(stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean> {
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Service function invoked for ID: ${stickerId}.`);
  console.log("SERVER: UPDATE_STICKER_IN_DB: Received sticker data for update:", JSON.stringify(stickerData, null, 2));
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      // updatedAt: Timestamp.now(),
    };
    await updateDoc(stickerDoc, dataWithTimestamps);
    console.log("SERVER: UPDATE_STICKER_IN_DB: Sticker updated successfully in Firestore for ID:", stickerId);
    return true;
  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(`SERVER: UPDATE_STICKER_IN_DB: CRITICAL ERROR WHILE UPDATING STICKER ID ${stickerId}`);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: UPDATE_STICKER_IN_DB: Error Object:", error);
     if (error instanceof Error) {
        console.error("SERVER: UPDATE_STICKER_IN_DB: Firebase Error Code (if available):", (error as any).code);
        console.error("SERVER: UPDATE_STICKER_IN_DB: Firebase Error Message:", error.message);
        console.error("SERVER: UPDATE_STICKER_IN_DB: Error Stack Trace:", error.stack);
    } else {
        console.error("SERVER: UPDATE_STICKER_IN_DB: Encountered an error that is not an instance of Error:", error);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return false;
  }
}

export async function deleteStickerFromDB(stickerId: string): Promise<boolean> {
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Service function invoked for ID: ${stickerId}.`);
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    await deleteDoc(stickerDoc);
    console.log("SERVER: DELETE_STICKER_FROM_DB: Sticker deleted successfully from Firestore for ID:", stickerId);
    return true;
  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(`SERVER: DELETE_STICKER_FROM_DB: CRITICAL ERROR WHILE DELETING STICKER ID ${stickerId}`);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SERVER: DELETE_STICKER_FROM_DB: Error Object:", error);
    if (error instanceof Error) {
        console.error("SERVER: DELETE_STICKER_FROM_DB: Firebase Error Code (if available):", (error as any).code);
        console.error("SERVER: DELETE_STICKER_FROM_DB: Firebase Error Message:", error.message);
        console.error("SERVER: DELETE_STICKER_FROM_DB: Error Stack Trace:", error.stack);
    } else {
        console.error("SERVER: DELETE_STICKER_FROM_DB: Encountered an error that is not an instance of Error:", error);
    }
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return false;
  }
}
