
'use server';
import { getAdminDb, getAdminAuth, admin } from '@/firebase/adminConfig';
import type { Sticker } from '@/types';

// This function is now THE gatekeeper for admin operations.
// It uses the Firebase Admin SDK.
async function verifyAdmin(idToken: string, serviceName: string = 'STICKER_SERVICE'): Promise<{ uid: string } | { error: string; isInitializationError?: boolean }> {
  const logPrefix = `VERIFY_ADMIN (${serviceName})`;
  if (!idToken) {
    const errorMsg = `${logPrefix}: ID token is missing or empty.`;
    console.error(errorMsg);
    return { error: "ID token is missing or empty." };
  }
  console.log(`${logPrefix}: Received ID token (first 10 chars): ${idToken.substring(0, 10)}...`);

  try {
    const adminAuth = getAdminAuth(); 
    const adminDb = getAdminDb();   
    
    if (!adminAuth || !adminDb) {
      const errorMsg = `${logPrefix}: Firebase Admin Auth or DB SDK is not initialized. Check server startup logs. This usually means the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is missing or invalid.`;
      console.error(errorMsg);
      // This case should ideally be caught by getAdminAuth/getAdminDb throwing, but as a fallback:
      return { error: "Firebase Admin Auth or DB SDK is not initialized. Check server startup logs.", isInitializationError: true };
    }
    console.log(`${logPrefix}: Firebase Admin Auth and DB SDKs obtained.`);
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`${logPrefix}: ID token successfully verified. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`);
    } catch (tokenError: any) {
      const errorMsg = `${logPrefix}: ID token verification FAILED. Error code: ${tokenError.code}, Message: ${tokenError.message}`;
      console.error(errorMsg, tokenError);
      return { error: `ID token verification FAILED. ${tokenError.message}` }; 
    }

    const uid = decodedToken.uid;
    const userDocRef = adminDb.collection('users').doc(uid);
    
    console.log(`${logPrefix}: Looking up user document at users/${uid}`);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      const errorMsg = `${logPrefix}: User document for UID ${uid} does NOT exist in Firestore. Cannot verify admin status.`;
      console.error(errorMsg);
      return { error: `User document for UID ${uid} not found. Cannot verify admin status.` }; 
    }
    
    const userData = userDocSnap.data();
    const userRole = userData?.role;
    console.log(`${logPrefix}: User document for UID ${uid} exists. Role found: '${userRole}'`);

    if (userRole !== 'admin') {
      const errorMsg = `${logPrefix}: User ${uid} is NOT an admin. Role is '${userRole}'. Access denied.`;
      console.error(errorMsg);
      return { error: `User ${uid} (Email: ${decodedToken.email}) is not authorized (role: ${userRole}). Access denied.` }; 
    }

    console.log(`${logPrefix}: User ${uid} (Email: ${decodedToken.email}) successfully verified as admin. Role: '${userRole}'.`);
    return { uid }; 
  } catch (error: any) {
    // This catch block will now primarily catch errors from getAdminAuth() or getAdminDb() if they throw.
    const isInitializationError = error.message.includes("Firebase Admin Auth is not initialized") || 
                                  error.message.includes("Firebase Admin Firestore is not initialized");
    const specificMessage = `${logPrefix}: Admin verification failed. Error: ${error.message}`;
    console.error(specificMessage, error);
    return { error: error.message, isInitializationError };
  }
}


export async function addStickerToDB(idToken: string, stickerData: Omit<Sticker, 'id'>): Promise<string> {
  const serviceName = 'addStickerToDB';
  console.log(`SERVER (${serviceName}): Service function invoked.`);
  
  const verificationResult = await verifyAdmin(idToken, serviceName);
  if ('error' in verificationResult) {
    let errorMessage = verificationResult.error;
    if (verificationResult.isInitializationError) {
      errorMessage = `Critical Firebase Admin SDK issue: ${verificationResult.error}`;
    } else {
      errorMessage = `Authorization failed: ${verificationResult.error}`;
    }
    console.error(`SERVER (${serviceName}): Admin verification failed. Error: ${errorMessage}`);
    // Ensure a Server Action Error prefix for client-side parsing, if needed, or just return the detailed error.
    return `Server Action Error: ${errorMessage}`;
  }
  const adminUid = verificationResult.uid;


  console.log(`SERVER (${serviceName}): Admin UID ${adminUid} verified. Received sticker data for add:`, JSON.stringify(stickerData, null, 2));
  try {
    const adminDb = getAdminDb();
    const adminStickersCollectionRef = adminDb.collection('stickers');
    const dataWithTimestamps = {
      ...stickerData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await adminStickersCollectionRef.add(dataWithTimestamps);
    console.log(`SERVER (${serviceName}): Sticker added successfully using Admin SDK. Document ID:`, docRef.id);
    return docRef.id;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER (${serviceName}): CRITICAL ERROR WHILE ADDING STICKER (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`; 
  }
}

export async function updateStickerInDB(idToken: string, stickerId: string, stickerData: Partial<Omit<Sticker, 'id'>>): Promise<boolean | string> {
  const serviceName = 'updateStickerInDB';
  console.log(`SERVER (${serviceName}): Service function invoked for ID: ${stickerId}.`);

  const verificationResult = await verifyAdmin(idToken, serviceName);
  if ('error' in verificationResult) {
    let errorMessage = verificationResult.error;
    if (verificationResult.isInitializationError) {
      errorMessage = `Critical Firebase Admin SDK issue: ${verificationResult.error}`;
    } else {
      errorMessage = `Authorization failed: ${verificationResult.error}`;
    }
    console.error(`SERVER (${serviceName}): Admin verification failed for sticker ID ${stickerId}. Error: ${errorMessage}`);
    return `Server Action Error: ${errorMessage}`;
  }
  const adminUid = verificationResult.uid;

  console.log(`SERVER (${serviceName}): Admin UID ${adminUid} verified. Received sticker data for update:`, JSON.stringify(stickerData, null, 2));
  try {
    const adminDb = getAdminDb(); 
    const stickerDocRef = adminDb.collection('stickers').doc(stickerId);
    const dataWithTimestamps = {
      ...stickerData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), 
    };
    await stickerDocRef.update(dataWithTimestamps);
    console.log(`SERVER (${serviceName}): Sticker updated successfully using Admin SDK for ID:`, stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER (${serviceName}): CRITICAL ERROR WHILE UPDATING STICKER ID ${stickerId} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`; 
  }
}

export async function deleteStickerFromDB(idToken: string, stickerId: string): Promise<boolean | string> {
  const serviceName = 'deleteStickerFromDB';
  console.log(`SERVER (${serviceName}): Service function invoked for ID: ${stickerId}.`);

  const verificationResult = await verifyAdmin(idToken, serviceName);
  if ('error' in verificationResult) {
    let errorMessage = verificationResult.error;
    if (verificationResult.isInitializationError) {
      errorMessage = `Critical Firebase Admin SDK issue: ${verificationResult.error}`;
    } else {
      errorMessage = `Authorization failed: ${verificationResult.error}`;
    }
    console.error(`SERVER (${serviceName}): Admin verification failed for deleting sticker ID ${stickerId}. Error: ${errorMessage}`);
    return `Server Action Error: ${errorMessage}`;
  }
  const adminUid = verificationResult.uid;
  
  console.log(`SERVER (${serviceName}): Admin UID ${adminUid} verified. Attempting to delete document with ID:`, stickerId);
  try {
    const adminDb = getAdminDb(); 
    const stickerDocRef = adminDb.collection('stickers').doc(stickerId);
    await stickerDocRef.delete();
    console.log(`SERVER (${serviceName}): Sticker deleted successfully using Admin SDK for ID:`, stickerId);
    return true;
  } catch (error: any) {
    const errorCode = error.code || 'UNKNOWN_CODE';
    const errorMessage = error.message || 'Unknown Firestore error occurred.';
    const fullError = `Firebase Admin SDK Error (Code: ${errorCode}): ${errorMessage}`;
    console.error(`SERVER (${serviceName}): CRITICAL ERROR WHILE DELETING STICKER ID ${stickerId} (Admin SDK):`, fullError, error);
    return `Server Error: ${fullError}`; 
  }
}

// Client-side function to get stickers (does not require admin auth)
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
    console.error("SERVER: GET_STICKERS_FROM_DB: Error fetching stickers from Firestore (Client SDK used by this func): ", error);
    return [];
  }
}
