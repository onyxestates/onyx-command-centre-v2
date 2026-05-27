const defaultPublicFirebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyD-1234567890abcdefghijklmnopqrstuv",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "onyx-command-centre-build.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "onyx-command-centre-build",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "onyx-command-centre-build.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1234567890:web:1234567890abcdef123456",
} as const;

function readEnvValue(key: keyof typeof defaultPublicFirebaseEnv) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value : defaultPublicFirebaseEnv[key];
}

export const publicFirebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: readEnvValue("NEXT_PUBLIC_FIREBASE_API_KEY"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: readEnvValue("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: readEnvValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: readEnvValue("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: readEnvValue("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  NEXT_PUBLIC_FIREBASE_APP_ID: readEnvValue("NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;
