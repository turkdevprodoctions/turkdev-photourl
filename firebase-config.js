
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPyZyyINsjaLNdndEU2yIX_4UTAhPAcnI",
  authDomain: "turkdev-photourl.firebaseapp.com",
  projectId: "turkdev-photourl",
  storageBucket: "turkdev-photourl.firebasestorage.app",
  messagingSenderId: "518636091417",
  appId: "1:518636091417:web:09a8f8d5efa0442bf51288",
  measurementId: "G-MQN55H1J2D",
  databaseURL: "https://turkdev-photourl-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut, ref, set, get, update };
