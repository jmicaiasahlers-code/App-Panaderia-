// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXZpBcDZaBOeUi25aqsUNKMmh3xKsKvM8",
  authDomain: "app-panaderia--gestion.firebaseapp.com",
  projectId: "app-panaderia--gestion",
  storageBucket: "app-panaderia--gestion.firebasestorage.app",
  messagingSenderId: "553029589370",
  appId: "1:553029589370:web:221123e075c01bf9ebdec3",
  measurementId: "G-LC0GGLJJ1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy };
