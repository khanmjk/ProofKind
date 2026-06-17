import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getServerEnv } from "@/lib/env";

export function getAdminDb() {
  const env = getServerEnv();

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  }

  return getFirestore();
}

