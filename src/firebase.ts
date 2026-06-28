import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "AIzaSyDEMiZhrGrd5S3kBHCI2Zjl4Vl5QsV3scM",
  authDomain: "genesis-pro-8e2c2.firebaseapp.com",
  projectId: "genesis-pro-8e2c2",
  storageBucket: "genesis-pro-8e2c2.firebasestorage.app",
  messagingSenderId: "221362183057",
  appId: "1:221362183057:web:97013d0af9f01bd2c41830",
  measurementId: "G-91SN3Q22HW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to the services you need
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };