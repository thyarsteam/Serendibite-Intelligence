
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyD6X0cwubmPwkt0NDsh64P4OrPwjLYAU_0",
  authDomain: "serendibite.firebaseapp.com",
  projectId: "serendibite",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "1061642988257",
  appId: "1:1061642988257:web:4379659973fecb27c165a0",
  measurementId: "G-1B57M1PS3N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
