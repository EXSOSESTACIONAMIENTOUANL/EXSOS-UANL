/* Inicio de sesion de Bryan para que se calle - Versión Corregida */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence, 
    onAuthStateChanged, 
    signOut, 
    sendEmailVerification,
    RecaptchaVerifier,
    linkWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8LeQ1UNG6XqOpVWAMyde05JOvlWRENvU",
    authDomain: "exsos-login.firebaseapp.com",
    projectId: "exsos-login",
    appId: "1:254157261321:web:449f88c3567303afa846d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variable global para el SMS
let confirmationResult;

// --- LOGIN ---
function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    if(email === "" || password === ""){
        mostrarMensaje("mensajeLogin", "Ingresa tu correo y contraseña");
        return;
    }

    const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

    setPersistence(auth, persistence)
        .then(() => signInWithEmailAndPassword(auth, email, password))
        .then((userCredential) => {
            if (!userCredential.user.emailVerified) {
                signOut(auth);
                mostrarMensaje("mensajeLogin", "Aún no has verificado tu correo.", "error");
            } else {
                mostrarMensaje("mensajeLogin", "Sesión iniciada correctamente", "ok");
                window.location.href = "Home.html";
            }
        })
        .catch(error => {
            mostrarMensaje("mensajeLogin", "Error: " + error.code);
        });
}

// --- REGISTRO ---
function register() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;

    if(email === "" || password === "" || telefono.length < 10){
        mostrarMensaje("mensajeRegistro", "Completa los datos correctamente (Teléfono 10 dígitos)");
        return;
    }

    mostrarMensaje("mensajeRegistro", "Creando cuenta... espera el SMS", "ok");

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // 1. Enviar correo
            sendEmailVerification(user);

            // 2. Disparar SMS
            enviarSmsVerificacion(user);
        })
        .catch(error => {
            mostrarMensaje("mensajeRegistro", "Error: " + error.message);
        });
}

// --- SMS LOGIC ---
function enviarSmsVerificacion(user) {
    const tel = document.getElementById("regTelefono").value;
    const numeroCompleto = "+52" + tel; 

    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
        });
    }

    linkWithPhoneNumber(user, numeroCompleto, window.recaptchaVerifier)
        .then((result) => {
            confirmationResult = result;
            document.getElementById("seccionSms").style.display = "block";
            mostrarMensaje("mensajeRegistro", "Código SMS enviado", "ok");
        }).catch((error) => {
            console.error(error);
            mostrarMensaje("mensajeRegistro", "Error SMS: " + error.message);
        });
}

function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    if(!codigo) return;

    confirmationResult.confirm(codigo)
        .then(() => {
            mostrarMensaje("mensajeRegistro", "¡Teléfono verificado! Revisa tu email.", "ok");
            setTimeout(() => {
                signOut(auth).then(() => {
                    cerrarRegistro();
                    location.reload(); 
                });
            }, 3000);
        }).catch(() => {
            mostrarMensaje("mensajeRegistro", "Código SMS incorrecto.");
        });
}

// --- AUXILIARES ---
function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    box.textContent = texto;
    box.className = "mensaje " + tipo;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 4000);
}

function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

function enviarReset(){
    const email = document.getElementById("resetEmail").value;
    if(!email) return;
    sendPasswordResetEmail(auth, email)
        .then(() => mostrarMensaje("mensajeReset", "Correo enviado", "ok"))
        .catch(err => mostrarMensaje("mensajeReset", err.code));
}

// Inicializar selectores y AuthState
onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        window.location.href = "Home.html";
    }
});

// Exponer funciones al HTML
window.login = login;
window.register = register;
window.verificarCodigoSms = verificarCodigoSms;
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
window.enviarReset = enviarReset;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
