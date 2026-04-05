import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 CREDENCIALES
const firebaseConfig = {
  apiKey: "AIzaSyB8LeQ1UNG6XqOpVWAMyde05JOvlWRENvU",
  authDomain: "exsos-login.firebaseapp.com",
  projectId: "exsos-login",
  storageBucket: "exsos-login.firebasestorage.app",
  messagingSenderId: "254157261321",
  appId: "1:254157261321:web:449f88c3567303afa846d8",
  measurementId: "G-35YQC4CCDH"
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
