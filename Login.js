/* Inicio de sesion de Bryan - Versión Corregida y Unificada */

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
async function register() {
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value;
    const fotoCarro = document.getElementById("regFotoCarro").files[0];
    const documento = document.getElementById("regDocumento").files[0];
    const btn = document.querySelector("button[onclick='register()']");

    if (!email || !password || telefono.length < 10) {
        mostrarMensaje("mensajeRegistro", "Correo, contraseña y teléfono (10 dígitos) son obligatorios.");
        return;
    }

    if (!fotoCarro || !documento) {
        mostrarMensaje("mensajeRegistro", "Debes subir la foto del carro y el documento INE.");
        return;
    }

    const dia = document.querySelector("#selectDia .selected").textContent;
    const mes = document.querySelector("#selectMes .selected").textContent;
    const anio = document.querySelector("#selectAnio .selected").textContent;

    if (dia === "Día" || mes === "Mes" || anio === "Año") {
        mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Registrando...";
    mostrarMensaje("mensajeRegistro", "Procesando... no cierres la ventana", "ok");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        sendEmailVerification(user);
        await enviarSmsVerificacion(user); 

    } catch (firebaseError) {
        btn.disabled = false;
        btn.innerText = "Crear una cuenta";
        let mensaje = "Error al registrar";
        if (firebaseError.code === "auth/email-already-in-use") mensaje = "El correo ya está en uso.";
        mostrarMensaje("mensajeRegistro", mensaje);
    }
}

// --- SMS LOGIC ---
async function enviarSmsVerificacion(user) {
    const tel = document.getElementById("regTelefono").value;
    const numeroCompleto = "+52" + tel; 

    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }

        const result = await linkWithPhoneNumber(user, numeroCompleto, window.recaptchaVerifier);
        confirmationResult = result;
        document.getElementById("seccionSms").style.display = "block";
        mostrarMensaje("mensajeRegistro", "¡SMS Enviado! Ingresa el código.", "ok");
    } catch (error) {
        if (user) await user.delete();
        mostrarMensaje("mensajeRegistro", "Error al enviar SMS. Revisa tu número.");
        const btn = document.querySelector("button[onclick='register()']");
        btn.disabled = false;
        btn.innerText = "Crear una cuenta";
    }
}

function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    if(!codigo) return;

    confirmationResult.confirm(codigo)
        .then(() => {
            mostrarMensaje("mensajeRegistro", "¡Verificado! Revisa tu email.", "ok");
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

// --- RECUPERAR CONTRASEÑA ---
function enviarReset(){
    const email = document.getElementById("resetEmail").value;
    const mensaje = document.getElementById("mensajeReset");
    const loader = document.getElementById("loader");
    const boton = document.getElementById("btnReset");

    if(!email){
        mensaje.textContent = "Ingresa tu correo";
        mensaje.className = "mensaje error";
        return;
    }

    loader.style.display = "block";
    boton.disabled = true;

    sendPasswordResetEmail(auth, email)
        .then(() => {
            loader.style.display = "none";
            mensaje.textContent = "Correo enviado correctamente";
            mensaje.className = "mensaje ok";
            boton.disabled = false;
        })
        .catch(error => {
            loader.style.display = "none";
            mensaje.textContent = "Error: " + error.code;
            mensaje.className = "mensaje error";
            boton.disabled = false;
        });
}

// --- PLACAS Y MENSAJES ---
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
    if(!box) return;
    box.textContent = texto;
    box.className = "mensaje " + tipo;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 5000);
}

// --- MODALES ---
function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

// --- SELECTORES DE FECHA ---
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

window.addEventListener("load", () => {
    const dias = Array.from({length: 31}, (_, i) => i + 1);
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const actual = new Date().getFullYear();
    const anios = [];
    for(let i = actual - 18; i >= actual - 80; i--) anios.push(i);
    crearOpciones("selectDia", dias);
    crearOpciones("selectMes", meses);
    crearOpciones("selectAnio", anios);
});

onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) window.location.href = "Home.html";
});

document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
});

// --- EXPOSICIÓN GLOBAL ---
window.login = login;
window.register = register;
window.verificarCodigoSms = verificarCodigoSms;
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
window.enviarReset = enviarReset;
window.formatearPlacas = formatearPlacas;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
