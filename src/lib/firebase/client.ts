"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { publicFirebaseEnv } from "@/lib/env";

const firebaseConfig = {
  apiKey: "AIzaSyAX-PoebwQGHYIhD6L1r2H44snQ5Oo6sJI",
  authDomain: "onyx-command-centre-stag-8cffa.firebaseapp.com",
  projectId: "onyx-command-centre-stag-8cffa",
  storageBucket: "onyx-command-centre-stag-8cffa.firebasestorage.app",
  messagingSenderId: "542361207125",
  appId: "1:542361207125:web:b7346c0cda235e3b79afdc",
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
