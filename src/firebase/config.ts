// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from "firebase/analytics";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const PLACEHOLDER_VALUES = [
  "YOUR_API_KEY",
  "YOUR_AUTH_DOMAIN",
  "YOUR_PROJECT_ID",
  "YOUR_STORAGE_BUCKET",
  "YOUR_MESSAGING_SENDER_ID",
  "YOUR_APP_ID"
];

// Check for critical missing or placeholder values
if (
  !apiKey || PLACEHOLDER_VALUES.includes(apiKey) ||
  !authDomain || PLACEHOLDER_VALUES.includes(authDomain) ||
  !projectId || PLACEHOLDER_VALUES.includes(projectId) ||
  !appId || PLACEHOLDER_VALUES.includes(appId)
) {
  const errorMessage =
    "CRITICAL_FIREBASE_CONFIG_ERROR: Firebase configuration is missing or uses placeholder values. " +
    "Please ensure all NEXT_PUBLIC_FIREBASE_ prefixed variables in your .env file " +
    "are set to your actual Firebase project credentials. " +
    "You can find these in your Firebase project settings (Project settings > General > Your apps > Web app). " +
    "After updating the .env file, you MUST restart your Next.js development server for the changes to take effect.";
  console.error(errorMessage);
  // Throw an error to halt execution and make the problem very clear.
  throw new Error(errorMessage);
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Optional

export { app, auth, db };
