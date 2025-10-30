// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKABTuXrTqtsxuuI2J_euntAynOeENg0g",
  authDomain: "decentralizedidentity-2bdee.firebaseapp.com",
  projectId: "decentralizedidentity-2bdee",
  storageBucket: "decentralizedidentity-2bdee.firebasestorage.app",
  messagingSenderId: "1087421157299",
  appId: "1:1087421157299:web:74df1a1b62539753b4c5c6",
  measurementId: "G-JV6RKBX1YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);