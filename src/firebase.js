import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBdxo-DvSE724k8NqomPF3nSCi06gbwzQc",
    authDomain: "leetcodetracker-405b0.firebaseapp.com",
    projectId: "leetcodetracker-405b0",
    storageBucket: "leetcodetracker-405b0.firebasestorage.app",
    messagingSenderId: "1034910908742",
    appId: "1:1034910908742:web:d9c1159456c3b00acbe547",
    measurementId: "G-77KXG5G6CB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
