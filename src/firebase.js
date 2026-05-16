
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJneYwz0afGmVNe_GcNNKscV6zG7yA6Ak",
  authDomain: "testproject-ad38c.firebaseapp.com",
  projectId: "testproject-ad38c",
  storageBucket: "testproject-ad38c.firebasestorage.app",
  messagingSenderId: "723669306946",
  appId: "1:723669306946:web:f3316aa2c6b6fc90cfa7db",
  measurementId: "G-77W4MV10M0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
