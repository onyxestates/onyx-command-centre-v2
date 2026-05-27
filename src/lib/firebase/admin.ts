import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getServiceAccountConfig() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function getFirebaseAdminApp() {
  if (getApps().length) return getApp();

  const serviceAccount = getServiceAccountConfig();

  try {
    if (serviceAccount) {
      return initializeApp({ credential: cert(serviceAccount) });
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return initializeApp({ credential: applicationDefault() });
    }
  } catch (error) {
    console.error("Failed to initialise Firebase Admin", error);
    return null;
  }

  return null;
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}
