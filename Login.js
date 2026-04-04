/* ==========================================
   Login.js - VERSIÓN FINAL (Flujo Completo con Fotos y Estado)
   ========================================== */

// 1. IMPORTACIONES SIEMPRE HASTA ARRIBA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, 
    setPersistence, browserLocalPersistence, browserSessionPersistence, 
    onAuthStateChanged, signOut, RecaptchaVerifier,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
    updatePassword, linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 2. CREDENCIALES
const firebaseConfig = {
  apiKey: "AIzaSyCjlT5tS1iEWvYzSIHRzg3jQLnyq5AAFJk",
  authDomain: "exsos-pruebas.firebaseapp.com",
  projectId: "exsos-pruebas",
  storageBucket: "exsos-pruebas.firebasestorage.app",
  messagingSenderId: "564255524295",
  appId: "1:564255524295:web:ae4160b7a56304e6acc5e2",
  measurementId: "G-B3KZX20LYS"
};


// 3. INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
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
        .then(async (userCredential) => {
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                await signOut(auth);
                return mostrarMensaje("mensajeLogin", "Verifica tu correo primero.");
            }

            // 🔥 VERIFICAR EL ESTADO EN FIRESTORE
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const estado = docSnap.data().estado;
                
                if (estado === "pendiente") {
                    await signOut(auth); 
                    return mostrarMensaje("mensajeLogin", "⏳ Tu cuenta sigue en proceso de validación (24h).");
                } 
                else if (estado === "rechazado") {
                    await signOut(auth); 
                    return mostrarMensaje("mensajeLogin", "❌ Tu cuenta fue rechazada. Verifica tus datos.");
                }
            } else {
                await signOut(auth);
                return mostrarMensaje("mensajeLogin", "Error: Cuenta no encontrada.");
            }
        })
        .catch(() => mostrarMensaje("mensajeLogin", "Credenciales incorrectas"));
}

// --- PASO 1: VERIFICAR EMAIL ---
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
        
        mostrarMensaje("mensajeRegistro", "¡Enlace enviado! Revisa tu correo y haz clic en el link.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Verificar Correo";
        mostrarMensaje("mensajeRegistro", "Error al enviar el link. " + error.code);
    }
}

// --- PASO 2: EL USUARIO REGRESA DEL CORREO ---
window.addEventListener("load", async () => {
    const dias = Array.from({length: 31}, (_, i) => i + 1);
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const actual = new Date().getFullYear();
    const anios = [];
    for(let i = actual - 18; i >= actual - 80; i--) anios.push(i);

    crearOpciones("selectDia", dias);
    crearOpciones("selectMes", meses);
    crearOpciones("selectAnio", anios);

    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailParaRegistro');
        if (!email) email = window.prompt('Confirma tu correo para continuar:');

        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailParaRegistro');

            document.getElementById("modalRegistro").style.display = "flex";
            document.getElementById("loginCard").classList.add("oculto");
            document.getElementById("datosExtra").style.display = "block";
            
            document.getElementById("regEmail").value = email;
            document.getElementById("regEmail").disabled = true; 
            
            mostrarMensaje("mensajeRegistro", "Correo verificado. Ahora completa el resto de tus datos.", "ok");
            
            const btn = document.querySelector(".btn-crear");
            btn.innerText = "Finalizar y enviar SMS";
            btn.onclick = finalizarRegistro; 
            btn.disabled = false;
        } catch (error) {
            mostrarMensaje("mensajeLogin", "El enlace expiró o es inválido.");
        }
    }
});

// --- PASO 3: VALIDAR DATOS EXTRA Y ENVIAR SMS ---
async function finalizarRegistro() {
    const nombre = document.getElementById("regNombre").value.trim();
    const password = document.getElementById("regPassword").value;
    const telefono = document.getElementById("regTelefono").value.trim();
    const modelo = document.getElementById("regModelo").value.trim();
    const color = document.getElementById("regColor").value.trim();
    const anioCarro = document.getElementById("regAnio").value.trim();
    const placas = document.getElementById("regPlacas").value.trim();
    const fotoCarro = document.getElementById("regFotoCarro").files[0];
    const documento = document.getElementById("regDocumento").files[0];
    const btn = document.querySelector(".btn-crear");
    const dia = document.querySelector("#selectDia .selected").innerText.trim();
    const mes = document.querySelector("#selectMes .selected").innerText.trim();
    const anio = document.querySelector("#selectAnio .selected").innerText.trim();

    if (!nombre || !password || !modelo || !color || !anioCarro || !placas) return mostrarMensaje("mensajeRegistro", "Completa todos los campos de texto.");
    if (password.length < 6) return mostrarMensaje("mensajeRegistro", "La contraseña debe tener al menos 6 caracteres.");
    if (telefono.length < 10) return mostrarMensaje("mensajeRegistro", "El número debe tener 10 dígitos.");
    if (dia === "Día" || mes === "Mes" || anio === "Año") return mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento.");
    if (!fotoCarro || !documento) return mostrarMensaje("mensajeRegistro", "Falta subir la foto del carro o el INE.");

    btn.disabled = true;
    btn.innerText = "Enviando SMS...";

    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'normal' });
        }
        const numeroCompleto = "+52" + telefono;
        confirmationResult = await linkWithPhoneNumber(auth.currentUser, numeroCompleto, window.recaptchaVerifier);
        
        document.getElementById("seccionSms").style.display = "block";
        mostrarMensaje("mensajeRegistro", "Código SMS enviado.", "ok");
    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Finalizar y enviar SMS";
        if (error.code === 'auth/provider-already-linked' || error.code === 'auth/credential-already-in-use') {
            mostrarMensaje("mensajeRegistro", "Este número de teléfono ya está registrado en otra cuenta.");
        } else {
            mostrarMensaje("mensajeRegistro", "Error Firebase: " + error.code);
        }
    }
}

// --- PASO 4: CONFIRMAR SMS, SUBIR FOTOS Y CREAR CUENTA ---
async function verificarCodigoSms() {
    const codigo = document.getElementById("codigoSms").value;
    const password = document.getElementById("regPassword").value;
    const btn = document.querySelector(".btn-crear");

    try {
        btn.disabled = true;
        btn.innerText = "Creando cuenta y subiendo archivos...";

        await confirmationResult.confirm(codigo);
        await updatePassword(auth.currentUser, password);
        
        const user = auth.currentUser;

        // Recopilamos datos
        const nombre = document.getElementById("regNombre").value.trim();
        const telefono = document.getElementById("regTelefono").value.trim();
        const matricula = document.getElementById("regMatricula").value.trim();
        const modelo = document.getElementById("regModelo").value.trim();
        const color = document.getElementById("regColor").value.trim();
        const anioCarro = document.getElementById("regAnio").value.trim();
        const placas = document.getElementById("regPlacas").value.trim();
        
        const dia = document.querySelector("#selectDia .selected").innerText.trim();
        const mes = document.querySelector("#selectMes .selected").innerText.trim();
        const anio = document.querySelector("#selectAnio .selected").innerText.trim();
        const fechaNacimiento = `${dia}/${mes}/${anio}`;

        const fotoCarroFile = document.getElementById("regFotoCarro").files[0];
        const documentoFile = document.getElementById("regDocumento").files[0];

        // Subimos al Storage
        const refCarro = ref(storage, `usuarios/${user.uid}/carro_${fotoCarroFile.name}`);
        await uploadBytes(refCarro, fotoCarroFile);
        const urlFotoCarro = await getDownloadURL(refCarro);

        const refIne = ref(storage, `usuarios/${user.uid}/ine_${documentoFile.name}`);
        await uploadBytes(refIne, documentoFile);
        const urlDocumentoIne = await getDownloadURL(refIne);

        // Guardamos en Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            correo: user.email,
            nombre: nombre,
            telefono: telefono,
            matricula: matricula,
            fechaNacimiento: fechaNacimiento,
            modeloAuto: modelo,
            colorAuto: color,
            anioAuto: anioCarro,
            placas: placas,
            fotoCarroUrl: urlFotoCarro,
            ineUrl: urlDocumentoIne,
            estado: "pendiente"
        });

        await signOut(auth);
        
        mostrarMensaje("mensajeRegistro", "¡Registro completado! Tu cuenta será validada en las próximas 24 horas.", "ok");
        
        setTimeout(() => { 
            cerrarRegistro(); 
            btn.disabled = false;
            btn.innerText = "Finalizar y enviar SMS";
        }, 5000);

    } catch (error) {
        btn.disabled = false;
        btn.innerText = "Confirmar Código SMS";
        mostrarMensaje("mensajeRegistro", "Error al guardar los datos: " + error.code);
    }
}

// --- FUNCIONES DE INTERFAZ ---
function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
    
    const datosExtra = document.getElementById("datosExtra");
    if (datosExtra) datosExtra.style.display = "none";
    document.getElementById("seccionSms").style.display = "none";

    const btn = document.querySelector(".btn-crear");
    btn.innerText = "Verificar Correo";
    btn.disabled = false;
    btn.onclick = iniciarVerificacionCorreo;
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

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
        const div = document.createElement("div"); div.textContent = i;
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
        const div = document.createElement("div"); div.textContent = valor;
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

onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified && user.phoneNumber && !isSignInWithEmailLink(auth, window.location.href)) {
        
        // 🔥 Revisamos Firestore antes de mandarlo al Home
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        if(docSnap.exists() && docSnap.data().estado === "aprobado") {
            window.location.href = "Home.html";
        } else {
            signOut(auth);
        }
    }
});

function enviarReset(){
  const email = document.getElementById("resetEmail").value;
  if(!email) return mostrarMensaje("mensajeReset", "Escribe tu correo");
  sendPasswordResetEmail(auth, email)
    .then(() => mostrarMensaje("mensajeReset", "Correo enviado", "ok"))
    .catch(err => mostrarMensaje("mensajeReset", "Error: " + err.code));
}

// EXPOSICIÓN GLOBAL
window.login = login;
window.register = iniciarVerificacionCorreo; 
window.verificarCodigoSms = verificarCodigoSms;
window.formatearPlacas = formatearPlacas;
window.enviarReset = enviarReset;
window.abrirModal = () => document.getElementById("modalReset").classList.add("activo");
window.cerrarModal = () => document.getElementById("modalReset").classList.remove("activo");
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
