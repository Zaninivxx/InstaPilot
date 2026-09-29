import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDa3gBylyCvbbmmLyfdzNzueds3E8q2PB0",
  authDomain: "legacy-b2c69.firebaseapp.com",
  projectId: "legacy-b2c69",
  storageBucket: "legacy-b2c69.firebasestorage.app",
  messagingSenderId: "105060521406",
  appId: "1:105060521406:web:a95080a8bfc0e5676b55ef",
  measurementId: "G-G26KZ9991X"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
