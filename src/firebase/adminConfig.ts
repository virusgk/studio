
// src/firebase/adminConfig.ts
import * as admin from 'firebase-admin';

// Ensure this file is only processed on the server
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK can only be used on the server.');
}

const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

// === BEGIN DIAGNOSTIC LOGGING ===
console.log("FIREBASE_ADMIN_CONFIG_DIAGNOSTIC: Type of FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON:", typeof serviceAccountString);
if (typeof serviceAccountString === 'string') {
  console.log("FIREBASE_ADMIN_CONFIG_DIAGNOSTIC: Length of FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON:", serviceAccountString.length);
  console.log("FIREBASE_ADMIN_CONFIG_DIAGNOSTIC: First 100 chars of FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON:", serviceAccountString.substring(0, 100));
  console.log("FIREBASE_ADMIN_CONFIG_DIAGNOSTIC: Last 100 chars of FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON:", serviceAccountString.substring(Math.max(0, serviceAccountString.length - 100)));
} else {
  console.log("FIREBASE_ADMIN_CONFIG_DIAGNOSTIC: FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is undefined or not a string.");
}
// === END DIAGNOSTIC LOGGING ===

let adminAuthInstance: admin.auth.Auth | null = null;
let adminDbInstance: admin.firestore.Firestore | null = null;
let isInitialized = false;

if (admin.apps.length === 0) {
  if (!serviceAccountString) {
    console.warn(
      'FIREBASE_ADMIN_INIT_WARN: FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
      'Firebase Admin SDK could not be initialized with specific credentials. ' +
      'This is CRITICAL for server actions requiring admin privileges. ' +
      'Please go to Firebase Project Settings -> Service accounts -> Generate new private key, ' +
      'then set the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable in your .env file ' +
      'with the *entire content* of the downloaded JSON key file. ' +
      'Ensure newlines in the private key are properly escaped (e.g., \\n) if the env var is single line. ' +
      'Admin operations WILL FAIL without this.'
    );
    try {
      admin.initializeApp();
      console.log('FIREBASE_ADMIN_INIT: Attempted to initialize with default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS).');
      isInitialized = true;
    } catch (e: any) {
      console.error(
        "FIREBASE_ADMIN_INIT_ERROR: Failed to initialize Firebase Admin SDK with default credentials. " +
        "Service account JSON via FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is strongly recommended. Error: " + e.message
      );
    }
  } else {
    try {
      let serviceAccount = JSON.parse(serviceAccountString);

      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        const originalPrivateKey = serviceAccount.private_key;
        // Attempt to normalize newlines in the private_key.
        // Replace literal '\\n' with actual '\n'.
        serviceAccount.private_key = originalPrivateKey.replace(/\\n/g, '\n');
        if (serviceAccount.private_key !== originalPrivateKey) {
            console.log('FIREBASE_ADMIN_INIT: Normalized newlines in private_key from "\\\\n" to "\\n".');
        }
      } else {
        console.warn('FIREBASE_ADMIN_INIT_WARN: private_key field is missing or not a string in the parsed service account JSON.');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON.');
      isInitialized = true;
    } catch (e: any) {
      console.error(
        'FIREBASE_ADMIN_INIT_ERROR: Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or initialize Firebase Admin SDK with it. ' +
        'Ensure the environment variable contains valid JSON and newlines are correctly escaped. Error: ' + e.message
      );
      try {
        admin.initializeApp();
        console.warn("FIREBASE_ADMIN_INIT_WARN: Initialized Firebase Admin SDK with default credentials as fallback after SA JSON failure.");
        isInitialized = true;
      } catch (defaultInitError: any) {
          console.error("FIREBASE_ADMIN_INIT_ERROR: Also failed to initialize Firebase Admin SDK with default credentials as fallback. Error: " + defaultInitError.message);
      }
    }
  }
} else {
  console.log('Firebase Admin SDK was already initialized.');
  isInitialized = true;
}

if (isInitialized && admin.apps.length > 0) {
  try {
    adminAuthInstance = admin.auth();
    adminDbInstance = admin.firestore();
    console.log('Firebase Admin Auth and Firestore instances obtained successfully.');
  } catch (e : any) {
    console.error("FIREBASE_ADMIN_INIT_ERROR: Error obtaining Auth or Firestore instance after initialization: " + e.message);
    isInitialized = false;
  }
}

if(!isInitialized) {
  console.error(
    "FIREBASE_ADMIN_FATAL_ERROR: Firebase Admin SDK could not be initialized or auth/db instances could not be obtained. " +
    "This is likely due to missing or incorrect 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON' environment variable, " +
    "or failure to initialize with default credentials. Admin operations will fail. " +
    "Please check server startup logs for specific initialization errors."
  );
}

export function getAdminAuth(): admin.auth.Auth {
  if (!adminAuthInstance) {
    throw new Error("Firebase Admin Auth is not initialized. Check server startup logs for initialization errors. This usually means the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is missing or invalid.");
  }
  return adminAuthInstance;
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDbInstance) {
    throw new Error("Firebase Admin Firestore is not initialized. Check server startup logs for initialization errors. This usually means the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is missing or invalid.");
  }
  return adminDbInstance;
}

export { admin };
