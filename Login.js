/* Login y Registro unificado - Bryan */
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
  const remember = document.getElementById("remember").checked;

  if(!email || !password) return mostrarMensaje("mensajeLogin", "Ingresa datos");

  const persistence = remember ? browserLocalPersistence : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => signInWithEmailAndPassword(auth, email, password))
    .then(() => {
        // Redirección manejada por onAuthStateChanged
    })
    .catch(error => mostrarMensaje("mensajeLogin", "Error: Credenciales incorrectas"));
}

// --- REGISTRO (PASO 1: SMS) ---
async function register() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono") ? document.getElementById("regTelefono").value : "";
    const btn = document.querySelector(".btn-crear");

    if (!email || !password || telefono.length < 10) {
        return mostrarMensaje("mensajeRegistro", "Correo, clave y teléfono (10 dígitos) obligatorios.");
    }

    btn.disabled = true;
    btn.innerText = "Enviando SMS...";

    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal' // Cambiado a normal para asegurar que funcione en móvil
            });
        }

        const numeroCompleto = "+52" + telefono;
        confirmationResult = await signInWithPhoneNumber(auth, numeroCompleto, window.recaptchaVerifier);
        
        document.getElementById("seccionSms").style.display = "block";
        mostrarMensaje("mensajeRegistro", "Código enviado al celular.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Crear una cuenta";
        console.error(error);
        mostrarMensaje("mensajeRegistro", "Error de SMS: Verifica el número o Captcha.");
    }
}

// --- VERIFICAR SMS Y CREAR CUENTA ---
async function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    try {
        await confirmationResult.confirm(codigo);
        // Si el código es correcto, creamos el usuario de correo
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        
        mostrarMensaje("mensajeRegistro", "¡Éxito! Cuenta creada. Verifica tu email.", "ok");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        mostrarMensaje("mensajeRegistro", "Código SMS incorrecto.");
    }
}

// --- RECUPERAR CONTRASEÑA ---
function enviarReset(){
  const email = document.getElementById("resetEmail").value;
  if(!email) return mostrarMensaje("mensajeReset", "Escribe tu correo");

  sendPasswordResetEmail(auth, email)
    .then(() => mostrarMensaje("mensajeReset", "Correo enviado", "ok"))
    .catch(err => mostrarMensaje("mensajeReset", "Error: " + err.code));
}

// --- CONFIGURACIÓN DE INTERFAZ ---
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    window.location.href = "Home.html";
  } else if (user && !user.emailVerified) {
    signOut(auth);
    mostrarMensaje("mensajeLogin", "Por favor verifica tu correo primero.");
  }
});

// Exponer funciones al HTML
window.login = login;
window.register = register;
window.verificarCodigoSms = verificarCodigoSms;
window.enviarReset = enviarReset;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
window.abrirRegistro = () => {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
};
window.cerrarRegistro = () => {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
};

function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    if(!box) return;
    box.textContent = texto;
    box.className = "mensaje " + tipo;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 4000);
}
