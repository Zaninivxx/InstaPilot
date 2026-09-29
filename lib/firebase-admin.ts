import { cert, getApps, initializeApp, type AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const options: AppOptions = {
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Do not crash during `next build` when Vercel env vars have not been added yet.
// At runtime Firebase operations will still require valid Admin credentials.
if (projectId && clientEmail && privateKey) {
  options.credential = cert({ projectId, clientEmail, privateKey });
}

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp(options);

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
