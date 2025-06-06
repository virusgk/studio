
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig';
import type { Sticker } from '@/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config'; 

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
    return stickers;
  } catch (error) {
    console.error("SERVER: GET_STICKERS_FROM_DB: Error fetching stickers from Firestore: ", error);
    return [];
  }
}

async function verifyAdmin(idToken: string, serviceName: string = 'STICKER_SERVICE'): Promise<string | null> {
  const logPrefix = `VERIFY_ADMIN (${serviceName})`;
  if (!idToken) {
    console.error(`${logPrefix}: ID token is missing or empty.`);
    return null;
  }
  console.log(`${logPrefix}: Received ID token (first 10 chars): ${idToken.substring(0, 10)}...`);

  try {
    const adminAuth = getAdminAuth(); 
    const adminDb = getAdminDb();   
    
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

    if (!userDocSnap.exists()) {
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


export async function addStickerToDB(idToken: string, stickerData: Omit<Sticker, 'id'>): Promise<string | null> {
  console.log("SERVER: ADD_STICKER_TO_DB: Service function invoked.");
  
  const adminUid = await verifyAdmin(idToken, 'addStickerToDB');
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }

  console.log("SERVER: ADD_STICKER_TO_DB: Admin verified. Received sticker data for add:", JSON.stringify(stickerData, null, 2));
  try {
    const adminDb = getAdminDb();
    const adminStickersCollectionRef = adminDb.collection('stickers');
    const dataWithTimestamps = {
      ...stickerData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

  const adminUid = await verifyAdmin(idToken, 'updateStickerInDB');
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }

  console.log("SERVER: UPDATE_STICKER_IN_DB: Admin verified. Received sticker data for update:", JSON.stringify(stickerData, null, 2));
  try {
    const adminDb = getAdminDb();
    const stickerDocRef = adminDb.collection('stickers').doc(stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), 
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

  const adminUid = await verifyAdmin(idToken, 'deleteStickerFromDB');
  if (!adminUid) {
    return "Server Action Error: User is not authorized to perform this admin operation or token is invalid.";
  }
  
  console.log("SERVER: DELETE_STICKER_FROM_DB: Admin verified. Attempting to delete document with ID:", stickerId);
  try {
    const adminDb = getAdminDb();
    const stickerDocRef = adminDb.collection('stickers').doc(stickerId);
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
