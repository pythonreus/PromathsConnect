import admin from "firebase-admin";

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) {
    return admin;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  console.log("Firebase Admin initialized");
  return admin;
};

export default initializeFirebase;
