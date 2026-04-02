/* Inicio de sesion de Bryan - Versión Final Optimizada */

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
                mostrarMensaje("mensajeLogin", "Verifica tu correo electrónico.", "error");
            } else {
                window.location.href = "Home.html";
            }
        })
        .catch(error => {
            mostrarMensaje("mensajeLogin", "Error: Credenciales incorrectas");
        });
}

// --- REGISTRO ---
function register() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;
    
    // Captura de fecha desde Custom Selects
    const dia = document.querySelector("#selectDia .selected").textContent;
    const mes = document.querySelector("#selectMes .selected").textContent;
    const anio = document.querySelector("#selectAnio .selected").textContent;

    if(email === "" || password === "" || telefono.length < 10){
        mostrarMensaje("mensajeRegistro", "Datos incompletos o teléfono inválido.");
        return;
    }

    if (dia === "Día" || mes === "Mes" || anio === "Año") {
        mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento.");
        return;
    }

    mostrarMensaje("mensajeRegistro", "Procesando registro...", "ok");

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            sendEmailVerification(user);
            enviarSmsVerificacion(user); 
        })
        .catch(error => {
            let mensaje = "Error al registrar";
            if (error.code === "auth/email-already-in-use") mensaje = "El correo ya está registrado.";
            mostrarMensaje("mensajeRegistro", mensaje, "error");
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
            mostrarMensaje("mensajeRegistro", "Código SMS enviado al celular", "ok");
        }).catch((error) => {
            mostrarMensaje("mensajeRegistro", "Error al enviar SMS. Revisa el número.");
        });
}

function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    if(!codigo) return;

    confirmationResult.confirm(codigo)
        .then(() => {
            mostrarMensaje("mensajeRegistro", "¡Teléfono verificado! Revisa tu correo.", "ok");
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

// --- PLACAS FORMATO NUEVO LEÓN ---
function formatearPlacas(input) {
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formateado = '';
    if (valor.length > 0) formateado += valor.substring(0, 3);
    if (valor.length > 3) formateado += '-' + valor.substring(3, 6);
    if (valor.length > 6) formateado += '-' + valor.substring(6, 7);
    input.value = formateado;
}

// --- AUXILIARES ---
function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    if(!box) return;
    box.textContent = texto;
    box.className = "mensaje " + tipo;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 5000);
}

function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        window.location.href = "Home.html";
    }
});

// --- EXPOSICIÓN GLOBAL ---
window.login = login;
window.register = register;
window.verificarCodigoSms = verificarCodigoSms;
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
window.formatearPlacas = formatearPlacas;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
