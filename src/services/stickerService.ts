
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
    console.error("SERVER: Error fetching stickers from Firestore: ", error);
    return [];
  }
}

export async function addStickerToDB(stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  try {
    console.log("SERVER: Attempting to add sticker to Firestore with data:", stickerData);
    const dataWithTimestamps = {
      ...stickerData,
      // createdAt: Timestamp.now(), 
      // updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(stickersCollectionRef, dataWithTimestamps);
    console.log("SERVER: Sticker added successfully to Firestore with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("SERVER: Error adding sticker to Firestore: ", error);
    // Log the error object itself for more details, e.g., error.code, error.message
    if (error instanceof Error) {
        console.error("SERVER: Firebase Error Code:", (error as any).code);
        console.error("SERVER: Firebase Error Message:", error.message);
    }
    return null;
  }
}

export async function updateStickerInDB(stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean> {
  try {
    console.log(`SERVER: Attempting to update sticker in Firestore (ID: ${stickerId}) with data:`, stickerData);
    const stickerDoc = doc(db, 'stickers', stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      // updatedAt: Timestamp.now(), 
    };
    await updateDoc(stickerDoc, dataWithTimestamps);
    console.log("SERVER: Sticker updated successfully in Firestore for ID:", stickerId);
    return true;
  } catch (error) {
    console.error(`SERVER: Error updating sticker in Firestore (ID: ${stickerId}): `, error);
    if (error instanceof Error) {
        console.error("SERVER: Firebase Error Code:", (error as any).code);
        console.error("SERVER: Firebase Error Message:", error.message);
    }
    return false;
  }
}

export async function deleteStickerFromDB(stickerId: string): Promise<boolean> {
  try {
    console.log(`SERVER: Attempting to delete sticker from Firestore (ID: ${stickerId})`);
    const stickerDoc = doc(db, 'stickers', stickerId);
    await deleteDoc(stickerDoc);
    console.log("SERVER: Sticker deleted successfully from Firestore for ID:", stickerId);
    return true;
  } catch (error) {
    console.error(`SERVER: Error deleting sticker from Firestore (ID: ${stickerId}): `, error);
     if (error instanceof Error) {
        console.error("SERVER: Firebase Error Code:", (error as any).code);
        console.error("SERVER: Firebase Error Message:", error.message);
    }
    return false;
  }
}
