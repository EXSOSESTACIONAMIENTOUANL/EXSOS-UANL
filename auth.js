import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario logueado:", user.email);
    // aquí cargas datos del perfil si quieres
  } else {
    console.log("No hay sesión");

    // 🔴 REDIRECCIÓN SI NO ESTÁ LOGUEADO
    window.location.href = "index.html"; // o tu index de login
  }
});