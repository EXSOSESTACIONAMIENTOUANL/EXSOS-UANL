import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    sendPasswordResetEmail, setPersistence, browserLocalPersistence, 
    browserSessionPersistence, onAuthStateChanged, signOut, 
    sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber 
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
  if(!email || !password) return mostrarMensaje("mensajeLogin", "Ingresa datos");

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        if (!userCredential.user.emailVerified) {
            signOut(auth);
            mostrarMensaje("mensajeLogin", "Verifica tu correo primero.");
        }
    })
    .catch(() => mostrarMensaje("mensajeLogin", "Credenciales incorrectas"));
}

// --- REGISTRO ---
async function register() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;
    const btn = document.querySelector(".btn-crear");

    const dia = document.querySelector("#selectDia .selected").innerText.trim();
    const mes = document.querySelector("#selectMes .selected").innerText.trim();
    const anio = document.querySelector("#selectAnio .selected").innerText.trim();

    if (dia === "Día" || mes === "Mes" || anio === "Año") {
        return mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento.");
    }

    if (!email || !password || telefono.length < 10) {
        return mostrarMensaje("mensajeRegistro", "Completa todos los campos (Teléfono 10 dígitos).");
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
        mostrarMensaje("mensajeRegistro", "Código enviado.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Crear una cuenta";
        mostrarMensaje("mensajeRegistro", "Error SMS: Revisa el número.");
    }
}

async function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    try {
        await confirmationResult.confirm(codigo);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        mostrarMensaje("mensajeRegistro", "Cuenta creada. Verifica tu email.", "ok");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        mostrarMensaje("mensajeRegistro", "Código SMS incorrecto.");
    }
}

// --- FUNCIONES AUXILIARES ---
function formatearPlacas(input) {
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formateado = '';
    if (valor.length > 0) formateado += valor.substring(0, 3);
    if (valor.length > 3) formateado += '-' + valor.substring(3, 6);
    if (valor.length > 6) formateado += '-' + valor.substring(6, 7);
    input.value = formateado;
}

function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    if(box) {
        box.textContent = texto;
        box.className = "mensaje " + tipo;
        box.style.display = "block";
        setTimeout(() => { box.style.display = "none"; }, 4000);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) window.location.href = "Home.html";
});

window.login = login;
window.register = register;
window.verificarCodigoSms = verificarCodigoSms;
window.formatearPlacas = formatearPlacas;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
window.abrirRegistro = () => { document.getElementById("modalRegistro").style.display = "flex"; };
window.cerrarRegistro = () => { document.getElementById("modalRegistro").style.display = "none"; };
