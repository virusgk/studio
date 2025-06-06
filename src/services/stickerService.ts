
'use server';
import { adminDb, adminAuth } from '@/firebase/adminConfig'; // Use Admin SDK
import type { Sticker } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

// Client SDK 'db' can still be used for reads if desired, but writes should use Admin SDK for consistency in server actions
import { db } from '@/firebase/config'; 
const stickersCollectionRef = collection(db, 'stickers'); // For reads by anyone
const adminStickersCollectionRef = adminDb.collection('stickers'); // For admin writes


export async function getStickersFromDB(): Promise<Sticker[]> {
  try {
    // Reading stickers can still use client SDK as it's public access defined by rules
    const q = query(stickersCollectionRef, orderBy('name'));
    const data = await getDocs(q);
    const stickers = data.docs.map((doc) => {
      const docData = doc.data();
      return {
        ...docData,
        id: doc.id,
      } as Sticker;
    });
    return stickers;
  } catch (error) {
    console.error("SERVER: GET_STICKERS_FROM_DB: Error fetching stickers from Firestore: ", error);
    return [];
  }
}

async function verifyAdmin(idToken: string): Promise<string | null> {
  if (!idToken) {
    console.error("SERVER_ACTION_AUTH: ID token is missing.");
    return null;
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists() || userDocSnap.data()?.role !== 'admin') {
      console.error(`SERVER_ACTION_AUTH: User ${uid} is not authorized (not found or not admin). Role: ${userDocSnap.data()?.role}`);
      return null;
    }
    console.log(`SERVER_ACTION_AUTH: User ${uid} verified as admin.`);
    return uid; // Return UID if admin
  } catch (error) {
    console.error("SERVER_ACTION_AUTH: ID token verification failed or user lookup error.", error);
    return null;
  }
}


export async function addStickerToDB(idToken: string, stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  console.log("SERVER: ADD_STICKER_TO_DB: Service function invoked.");
  
  const adminUid = await verifyAdmin(idToken);
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }

  console.log("SERVER: ADD_STICKER_TO_DB: Admin verified. Received sticker data for add:", JSON.stringify(stickerData, null, 2));
  try {
    const dataWithTimestamps = {
      ...stickerData,
      // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Using Admin SDK timestamp
      // updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await adminStickersCollectionRef.add(dataWithTimestamps);
    console.log("SERVER: ADD_STICKER_TO_DB: Sticker added successfully using Admin SDK. Document ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error("SERVER: ADD_STICKER_TO_DB: CRITICAL ERROR WHILE ADDING STICKER (Admin SDK):", fullError, error);
    return `Server Error: ${fullError}`; 
  }
}

export async function updateStickerInDB(idToken: string, stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean | string> {
  console.log(`SERVER: UPDATE_STICKER_IN_DB: Service function invoked for ID: ${stickerId}.`);

  const adminUid = await verifyAdmin(idToken);
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }

  console.log("SERVER: UPDATE_STICKER_IN_DB: Admin verified. Received sticker data for update:", JSON.stringify(stickerData, null, 2));
  try {
    const stickerDocRef = adminStickersCollectionRef.doc(stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      // updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Using Admin SDK timestamp
    };
    await stickerDocRef.update(dataWithTimestamps);
    console.log("SERVER: UPDATE_STICKER_IN_DB: Sticker updated successfully using Admin SDK for ID:", stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER: UPDATE_STICKER_IN_DB: CRITICAL ERROR WHILE UPDATING STICKER ID ${stickerId} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`; 
  }
}

export async function deleteStickerFromDB(idToken: string, stickerId: string): Promise<boolean | string> {
  console.log(`SERVER: DELETE_STICKER_FROM_DB: Service function invoked for ID: ${stickerId}.`);

  const adminUid = await verifyAdmin(idToken);
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }
  
  console.log("SERVER: DELETE_STICKER_FROM_DB: Admin verified. Attempting to delete document with ID:", stickerId);
  try {
    const stickerDocRef = adminStickersCollectionRef.doc(stickerId);
    await stickerDocRef.delete();
    console.log("SERVER: DELETE_STICKER_FROM_DB: Sticker deleted successfully using Admin SDK for ID:", stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER: DELETE_STICKER_FROM_DB: CRITICAL ERROR WHILE DELETING STICKER ID ${stickerId} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`; 
  }
}
