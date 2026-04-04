import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Credenciales (Asegurándonos de que son las del sistema de la app)
const firebaseConfig = {
  apiKey: "AIzaSyCjlT5tS1iEWvYzSIHRzg3jQLnyq5AAFJk",
  authDomain: "exsos-pruebas.firebaseapp.com",
  projectId: "exsos-pruebas",
  storageBucket: "exsos-pruebas.firebasestorage.app",
  messagingSenderId: "564255524295",
  appId: "1:564255524295:web:ae4160b7a56304e6acc5e2",
  measurementId: "G-B3KZX20LYS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variable para detener la escucha de la base de datos si el usuario sale
let vigiaEnTiempoReal = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario logueado:", user.email);

    // 🔥 INICIA LA VIGILANCIA EN TIEMPO REAL 🔥
    const userRef = doc(db, "usuarios", user.uid);
    
    vigiaEnTiempoReal = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const estado = docSnap.data().estado;
            
            // Si el administrador cambia el estado a inhabilitado mientras el usuario está en Home.html
            if (estado === "inhabilitado") {
                alert("⚠️ ATENCIÓN: Tu cuenta ha sido inhabilitada por el administrador. Serás desconectado por razones de seguridad.");
                
                // Forzamos el cierre de sesión y lo mandamos al inicio
                signOut(auth).then(() => {
                    window.location.href = "index.html";
                });
            }
        } else {
            // Si el administrador borra el documento por completo de la base de datos
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        }
    });

  } else {
    console.log("No hay sesión. Expulsando...");
    
    // Si no hay sesión, detenemos al vigía por si acaso y redirigimos
    if (vigiaEnTiempoReal) {
        vigiaEnTiempoReal();
    }
    
    // 🔴 REDIRECCIÓN SI NO ESTÁ LOGUEADO
    window.location.href = "index.html"; 
  }
});
