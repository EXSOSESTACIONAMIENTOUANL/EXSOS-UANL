import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 CREDENCIALES
const firebaseConfig = {
  apiKey: "AIzaSyDr2FUS2IBW90alkYnAUUXvMNy2RQPjx6E",
  authDomain: "ptueba-1-78027.firebaseapp.com",
  projectId: "ptueba-1-78027",
  storageBucket: "ptueba-1-78027.firebasestorage.app",
  messagingSenderId: "463811943830",
  appId: "1:463811943830:web:f529bdf1eea53445b0d1b7",
  measurementId: "G-W5TBQT1DLK"
};

// 🔥 TRUCO MÁGICO: Si Firebase ya se inició en otro archivo, solo úsalo, no lo dupliques
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let vigiaEnTiempoReal = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario logueado:", user.email);

    // VIGILANCIA EN TIEMPO REAL
    const userRef = doc(db, "usuarios", user.uid);
    
    vigiaEnTiempoReal = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const estado = docSnap.data().estado;
            if (estado === "inhabilitado") {
                alert("⚠️ ATENCIÓN: Tu cuenta ha sido inhabilitada por el administrador. Serás desconectado por razones de seguridad.");
                signOut(auth).then(() => {
                    window.location.href = "index.html";
                });
            }
        } else {
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        }
    });

  } else {
    console.log("No hay sesión. Expulsando...");
    if (vigiaEnTiempoReal) vigiaEnTiempoReal();
    window.location.href = "index.html"; 
  }
});
