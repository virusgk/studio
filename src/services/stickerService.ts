
'use server';
import { db } from '@/firebase/config';
import type { Sticker } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

const stickersCollectionRef = collection(db, 'stickers');

export async function getStickersFromDB(): Promise<Sticker[]> {
  try {
    const q = query(stickersCollectionRef, orderBy('name')); // Optional: order by name or another field
    const data = await getDocs(q);
    const stickers = data.docs.map((doc) => {
      const docData = doc.data();
      return { 
        ...docData, 
        id: doc.id,
        // Ensure any Timestamp fields are converted if necessary, though Sticker type doesn't have them currently
      } as Sticker;
    });
    return stickers;
  } catch (error) {
    console.error("Error fetching stickers: ", error);
    return [];
  }
}

export async function addStickerToDB(stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  try {
    // Ensure all fields are correctly formatted, especially if dealing with dates later
    const dataWithTimestamps = {
      ...stickerData,
      // createdAt: Timestamp.now(), // Example if you add timestamps
      // updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(stickersCollectionRef, dataWithTimestamps);
    return docRef.id;
  } catch (error) {
    console.error("Error adding sticker: ", error);
    return null;
  }
}

export async function updateStickerInDB(stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean> {
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      // updatedAt: Timestamp.now(), // Example if you add timestamps
    };
    await updateDoc(stickerDoc, dataWithTimestamps);
    return true;
  } catch (error) {
    console.error("Error updating sticker: ", error);
    return false;
  }
}

export async function deleteStickerFromDB(stickerId: string): Promise<boolean> {
  try {
    const stickerDoc = doc(db, 'stickers', stickerId);
    await deleteDoc(stickerDoc);
    return true;
  } catch (error) {
    console.error("Error deleting sticker: ", error);
    return false;
  }
}
