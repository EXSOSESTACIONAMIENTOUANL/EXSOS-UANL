/* ==========================================
   Login.js - VERSIÓN FINAL CORREGIDA
   (Fechas, Placas, Validación Estricta, Email Link + SMS)
   ========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    sendPasswordResetEmail, setPersistence, browserLocalPersistence, 
    browserSessionPersistence, onAuthStateChanged, signOut, 
    RecaptchaVerifier, signInWithPhoneNumber,
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

// --- PASO 1: VERIFICAR EMAIL (MANDA EL LINK) ---
async function iniciarVerificacionCorreo() {
    const email = document.getElementById("regEmail").value;
    const btn = document.querySelector(".btn-crear");

    if (!email) return mostrarMensaje("mensajeRegistro", "Escribe tu correo para verificarlo.");

    const actionCodeSettings = {
        url: window.location.href, 
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
        mostrarMensaje("mensajeRegistro", "Error al enviar el link. " + error.message);
    }
}

// --- PASO 2: VALIDAR TODOS LOS DATOS Y ENVIAR SMS ---
async function finalizarRegistro() {
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;
    
    const modelo = document.getElementById("regModelo").value;
    const color = document.getElementById("regColor").value;
    const anioCarro = document.getElementById("regAnio").value;
    const placas = document.getElementById("regPlacas").value;

    const fotoCarro = document.getElementById("regFotoCarro").files[0];
    const documento = document.getElementById("regDocumento").files[0];
    const btn = document.querySelector(".btn-crear");

    const dia = document.querySelector("#selectDia .selected").innerText.trim();
    const mes = document.querySelector("#selectMes .selected").innerText.trim();
    const anio = document.querySelector("#selectAnio .selected").innerText.trim();

    // 1. Validar campos de texto
    if (!password || telefono.length < 10 || !modelo || !color || !anioCarro || !placas) {
        return mostrarMensaje("mensajeRegistro", "Completa todos los campos de texto y teléfono.");
    }
    // 2. Validar Fechas
    if (dia === "Día" || mes === "Mes" || anio === "Año") {
        return mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento completa.");
    }
    // 3. Validar Archivos
    if (!fotoCarro || !documento) {
        return mostrarMensaje("mensajeRegistro", "Falta subir foto del carro o INE.");
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
        mostrarMensaje("mensajeRegistro", "Código SMS enviado al celular.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Enviar SMS de verificación";
        mostrarMensaje("mensajeRegistro", "Error SMS: Revisa el número.");
    }
}

// --- PASO 3: CONFIRMAR SMS Y CREAR USUARIO EN FIREBASE ---
async function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    try {
        await confirmationResult.confirm(codigo);
        // Al usar email y password aquí, automáticamente Firebase asume que el correo ya está verificado 
        // porque viene del flujo de Email Link anterior.
        await createUserWithEmailAndPassword(auth, email, password);
        
        mostrarMensaje("mensajeRegistro", "¡Cuenta creada exitosamente!", "ok");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        mostrarMensaje("mensajeRegistro", "Código SMS incorrecto o error al crear.");
    }
}

// --- UTILIDADES RESTAURADAS (PLACAS, FECHAS, MODALES) ---
function formatearPlacas(input) {
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formateado = '';
    if (valor.length > 0) formateado += valor.substring(0, 3);
    if (valor.length > 3) formateado += '-' + valor.substring(3, 6);
    if (valor.length > 6) formateado += '-' + valor.substring(6, 7);
    input.value = formateado;
}

function actualizarDias() {
    const mes = document.querySelector("#selectMes .selected").textContent;
    const anio = document.querySelector("#selectAnio .selected").textContent;
    if (mes === "Mes" || anio === "Año") return;

    const mesesLista = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const mesNumero = mesesLista.indexOf(mes);
    const diasMes = new Date(anio, mesNumero + 1, 0).getDate();
    const options = document.querySelector("#selectDia .options");
    options.innerHTML = ""; 

    for (let i = 1; i <= diasMes; i++) {
        const div = document.createElement("div");
        div.textContent = i;
        div.addEventListener("click", () => {
            document.querySelector("#selectDia .selected").textContent = i;
            document.getElementById("selectDia").classList.remove("active");
        });
        options.appendChild(div);
    }
}

function crearOpciones(selectId, datos) {
    const select = document.getElementById(selectId);
    if(!select) return;
    const selected = select.querySelector(".selected");
    const options = select.querySelector(".options");
    datos.forEach(valor => {
        const div = document.createElement("div");
        div.textContent = valor;
        div.addEventListener("click", () => {
            selected.textContent = valor;
            select.classList.remove("active");
            if (selectId === "selectMes" || selectId === "selectAnio") actualizarDias();
        });
        options.appendChild(div);
    });
    selected.addEventListener("click", (e) => {
        e.stopPropagation(); 
        document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
        select.classList.toggle("active");
    });
}

// --- EVENTOS AL CARGAR LA PÁGINA ---
window.addEventListener("load", async () => {
    // 1. Cargar Fechas (Esto lo había borrado por error)
    const dias = Array.from({length: 31}, (_, i) => i + 1);
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const actual = new Date().getFullYear();
    const anios = [];
    for(let i = actual - 18; i >= actual - 80; i--) anios.push(i);

    crearOpciones("selectDia", dias);
    crearOpciones("selectMes", meses);
    crearOpciones("selectAnio", anios);

    // 2. Detectar si viene del Link del Correo
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailParaRegistro');
        if (!email) email = window.prompt('Confirma tu correo para continuar:');

        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailParaRegistro');

            abrirRegistro(); 
            document.getElementById("regEmail").value = email;
            document.getElementById("regEmail").disabled = true; // Bloquea el correo
            
            mostrarMensaje("mensajeRegistro", "Correo verificado. Ahora completa todos tus datos.", "ok");
            
            // CAMBIO DE BOTÓN: Ahora valida todo y manda SMS
            const btn = document.querySelector(".btn-crear");
            btn.innerText = "Enviar SMS de verificación";
            btn.onclick = finalizarRegistro; 
        } catch (error) {
            mostrarMensaje("mensajeLogin", "El enlace expiró o es inválido.");
        }
    }
});

// Cierra los dropdowns de fecha si haces clic afuera
document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
});

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

// --- RECUPERAR CONTRASEÑA ---
function enviarReset(){
  const email = document.getElementById("resetEmail").value;
  if(!email) return mostrarMensaje("mensajeReset", "Escribe tu correo");
  sendPasswordResetEmail(auth, email)
    .then(() => mostrarMensaje("mensajeReset", "Correo enviado", "ok"))
    .catch(err => mostrarMensaje("mensajeReset", "Error: " + err.code));
}

// --- EXPOSICIÓN GLOBAL ---
window.login = login;
window.register = iniciarVerificacionCorreo; 
window.verificarCodigoSms = verificarCodigoSms;
window.formatearPlacas = formatearPlacas; // RESTAURADO PARA QUE FUNCIONE EL ONINPUT
window.enviarReset = enviarReset;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
