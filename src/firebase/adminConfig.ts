// src/firebase/adminConfig.ts
import * as admin from 'firebase-admin';

// Ensure this file is only processed on the server
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK can only be used on the server.');
}

const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
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
    // Attempt to initialize without explicit credentials (relies on GOOGLE_APPLICATION_CREDENTIALS or ADC in some environments)
    // This is unlikely to work for most local dev or non-Google Cloud server environments for admin tasks.
    try {
      admin.initializeApp();
      console.log('FIREBASE_ADMIN_INIT: Attempted to initialize with default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS).');
    } catch (e: any) {
      console.error(
        "FIREBASE_ADMIN_INIT_ERROR: Failed to initialize Firebase Admin SDK with default credentials. " +
        "Service account JSON via FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is strongly recommended. Error: " + e.message
      );
    }
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON.');
    } catch (e: any) {
      console.error(
        'FIREBASE_ADMIN_INIT_ERROR: Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON or initialize Firebase Admin SDK with it. ' +
        'Ensure the environment variable contains valid JSON and newlines are correctly escaped. Error: ' + e.message
      );
       // Fallback attempt, though less likely to succeed if specific SA JSON failed.
      try {
        admin.initializeApp();
        console.warn("FIREBASE_ADMIN_INIT_WARN: Initialized Firebase Admin SDK with default credentials as fallback after SA JSON failure.");
      } catch (defaultInitError: any) {
          console.error("FIREBASE_ADMIN_INIT_ERROR: Also failed to initialize Firebase Admin SDK with default credentials as fallback. Error: " + defaultInitError.message);
      }
    }
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb, admin };
