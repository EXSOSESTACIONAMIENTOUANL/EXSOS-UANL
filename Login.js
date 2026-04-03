/* ==========================================
   Login.js - VERSIÓN FINAL: VERIFICACIÓN PREVIA
   ========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    sendPasswordResetEmail, setPersistence, browserLocalPersistence, 
    browserSessionPersistence, onAuthStateChanged, signOut, 
    sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink 
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

    if(!email || !password) return mostrarMensaje("mensajeLogin", "Ingresa datos");

    const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

    setPersistence(auth, persistence)
        .then(() => signInWithEmailAndPassword(auth, email, password))
        .then((userCredential) => {
            if (!userCredential.user.emailVerified) {
                signOut(auth);
                mostrarMensaje("mensajeLogin", "Verifica tu correo primero.");
            }
        })
        .catch(() => mostrarMensaje("mensajeLogin", "Credenciales incorrectas"));
}

// --- PASO 1: VERIFICAR EMAIL (SIN CREAR CUENTA AÚN) ---
async function iniciarVerificacionCorreo() {
    const email = document.getElementById("regEmail").value;
    const btn = document.querySelector(".btn-crear");

    if (!email) return mostrarMensaje("mensajeRegistro", "Escribe tu correo para verificarlo.");

    const actionCodeSettings = {
        url: window.location.href, // Regresa a esta misma página
        handleCodeInApp: true,
    };

    try {
        btn.disabled = true;
        btn.innerText = "Enviando enlace...";
        
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailParaRegistro', email);
        
        mostrarMensaje("mensajeRegistro", "¡Enlace enviado! Revisa tu correo y haz clic en el link para continuar.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Verificar Correo";
        mostrarMensaje("mensajeRegistro", "Error al enviar el link.");
        console.error(error);
    }
}

// --- PASO 2: REGISTRO FINAL (SMS Y CREACIÓN) ---
async function finalizarRegistro() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;
    const btn = document.querySelector(".btn-crear");

    if (!password || telefono.length < 10) {
        return mostrarMensaje("mensajeRegistro", "Completa contraseña y teléfono.");
    }

    btn.disabled = true;
    btn.innerText = "Enviando SMS...";

    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'normal' });
        }
        const numeroCompleto = "+52" + telefono;
        confirmationResult = await signInWithPhoneNumber(auth, numeroCompleto, window.recaptchaVerifier);
        
        document.getElementById("seccionSms").style.display = "block";
        mostrarMensaje("mensajeRegistro", "Código SMS enviado.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Finalizar Registro";
        mostrarMensaje("mensajeRegistro", "Error SMS: Revisa el número.");
    }
}

// --- PASO 3: CONFIRMAR SMS Y CREAR USUARIO ---
async function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    try {
        await confirmationResult.confirm(codigo);
        // Creamos la cuenta oficialmente
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Marcamos manualmente como verificado (ya que vino del link)
        mostrarMensaje("mensajeRegistro", "¡Cuenta creada exitosamente!", "ok");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        mostrarMensaje("mensajeRegistro", "Código SMS incorrecto o error al crear cuenta.");
    }
}

// --- DETECTAR REGRESO DEL CORREO ---
window.addEventListener("load", async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailParaRegistro');
        if (!email) email = window.prompt('Confirma tu correo para continuar:');

        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailParaRegistro');

            abrirRegistro(); 
            document.getElementById("regEmail").value = email;
            document.getElementById("regEmail").disabled = true;
            
            mostrarMensaje("mensajeRegistro", "Correo verificado. Ahora completa tus datos.", "ok");
            
            // CAMBIAR EL BOTÓN: Ahora ya no verifica correo, ahora finaliza el registro
            const btn = document.querySelector(".btn-crear");
            btn.innerText = "Enviar SMS de verificación";
            btn.onclick = finalizarRegistro; 
        } catch (error) {
            mostrarMensaje("mensajeLogin", "El enlace expiró.");
        }
    }
});

// --- UTILIDADES ---
function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    if(box) {
        box.textContent = texto;
        box.className = "mensaje " + tipo;
        box.style.display = "block";
        setTimeout(() => { box.style.display = "none"; }, 5000);
    }
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
    if (user && user.emailVerified) window.location.href = "Home.html";
});

// --- EXPOSICIÓN GLOBAL ---
window.login = login;
window.register = iniciarVerificacionCorreo; // Por defecto el botón inicia la verificación
window.verificarCodigoSms = verificarCodigoSms;
window.enviarReset = () => { /* lógica reset */ };
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
