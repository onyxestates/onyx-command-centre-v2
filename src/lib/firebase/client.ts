"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { publicFirebaseEnv } from "@/lib/env";

const firebaseConfig = {
  apiKey: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: publicFirebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let emulatorsConnected = false;
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !emulatorsConnected) {
  connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099"}`, { disableWarnings: true });
  const [firestoreHost, firestorePort] = (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
  const [storageHost, storagePort] = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199").split(":");
  connectFirestoreEmulator(db, firestoreHost, Number(firestorePort));
  connectStorageEmulator(storage, storageHost, Number(storagePort));
  emulatorsConnected = true;
}
