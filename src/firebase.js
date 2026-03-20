// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASePnWnSvC9kNcbszO32e781KaOY1w_FM",
  authDomain: "purchasing-power-pro.firebaseapp.com",
  projectId: "purchasing-power-pro",
  storageBucket: "purchasing-power-pro.firebasestorage.app",
  messagingSenderId: "401510790017",
  appId: "1:401510790017:web:10884c1986b0bf775cae80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)