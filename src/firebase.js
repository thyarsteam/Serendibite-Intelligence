
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "serendibite.firebaseapp.com",
  projectId: "serendibite",
  storageBucket: "serendibite.firebasestorage.app",
  messagingSenderId: "1061642988257",
  appId: "1:1061642988257:web:4379659973fecb27c165a0",
  measurementId: "G-1B57M1PS3N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
