import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle Private Key line breaks for Vercel Env
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });
    console.log("Firebase Admin Initialized");
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
