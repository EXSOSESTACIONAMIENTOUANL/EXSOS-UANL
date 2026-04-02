/* Inicio de sesion de Bryan para que se calle */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged, signOut, sendEmailVerification } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8LeQ1UNG6XqOpVWAMyde05JOvlWRENvU",
  authDomain: "exsos-login.firebaseapp.com",
  projectId: "exsos-login",
  appId: "1:254157261321:web:449f88c3567303afa846d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


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
      // 🔴 BLOQUEO ESTRICTO: Revisar si ya verificó el correo
      if (!userCredential.user.emailVerified) {
        // Si no lo ha verificado, le cerramos la sesión y le avisamos
        signOut(auth);
        mostrarMensaje("mensajeLogin", "Aún no has verificado tu correo. Revisa tu bandeja de entrada.", "error");
      } else {
        mostrarMensaje("mensajeLogin", "Sesión iniciada correctamente", "ok");
        window.location.href = "Home.html";
      }
    })
    .catch(error => {
      let mensaje = "Error al iniciar sesión";
      if (error.code === "auth/user-not-found") mensaje = "El correo no está registrado";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") mensaje = "Correo o contraseña incorrectos";
      if (error.code === "auth/too-many-requests") mensaje = "Demasiados intentos. Intenta más tarde";
      mostrarMensaje("mensajeLogin", mensaje);
      document.getElementById("password").value = "";
    });
}


function register() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const nombre = document.getElementById("regNombre").value;
  const telefono = document.getElementById("regTelefono").value; 
  const modelo = document.getElementById("regModelo").value;
  const color = document.getElementById("regColor").value;
  const anio = document.getElementById("regAnio").value;
  const placas = document.getElementById("regPlacas").value; 
  const fotoCarro = document.getElementById("regFotoCarro").files[0];
  const documento = document.getElementById("regDocumento").files[0];

  if(email === "" || password === ""){
    mostrarMensaje("mensajeRegistro", "Completa el correo y contraseña");
    return;
  }

  if(telefono.length < 10) {
      mostrarMensaje("mensajeRegistro", "El teléfono debe tener 10 dígitos.", "error");
      return;
  }

  if (!modelo || !color || !anio || !placas || !fotoCarro || !documento) {
      mostrarMensaje("mensajeRegistro", "Completa todos los datos del vehículo y documentos.", "error");
      return;
  }

  const dia = document.querySelector("#selectDia .selected").textContent;
  const mes = document.querySelector("#selectMes .selected").textContent;
  const anioNacimiento = document.querySelector("#selectAnio .selected").textContent;

  if (dia === "Día" || mes === "Mes" || anioNacimiento === "Año") {
    mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento");
    return;
  }

  const mesesLista = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mesNumero = mesesLista.indexOf(mes); 
  const fechaNacimientoObj = new Date(anioNacimiento, mesNumero, dia);
  const hoy = new Date();
  const fechaMinima = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());

  if (fechaNacimientoObj > fechaMinima) {
    mostrarMensaje("mensajeRegistro", "Debes ser mayor de edad");
    return;
  }

  // Mostramos un mensaje temporal para que el usuario sepa que está cargando
  mostrarMensaje("mensajeRegistro", "Creando cuenta... por favor espera", "ok");

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // 1. Enviar correo de verificación
      sendEmailVerification(userCredential.user).then(() => {
          
          // 2. 🔴 IMPORTANTE: Cerramos la sesión que Firebase abrió automáticamente
          // para evitar que se vaya a Home.html antes de verificar su correo
          signOut(auth).then(() => {
              mostrarMensaje("mensajeRegistro", "¡Éxito! Revisa tu correo electrónico para verificar la cuenta.", "ok");
              
              setTimeout(() => { cerrarRegistro(); }, 3500);

              // Limpiar todos los campos
              document.getElementById("regEmail").value = "";
              document.getElementById("regPassword").value = "";
              document.getElementById("regNombre").value = "";
              document.getElementById("regMatricula").value = ""; 
              document.getElementById("regTelefono").value = ""; 
              document.getElementById("regModelo").value = "";
              document.getElementById("regColor").value = "";
              document.getElementById("regAnio").value = "";
              document.getElementById("regPlacas").value = "";
              document.getElementById("textoCarro").textContent = "Ningún archivo...";
              document.getElementById("textoINE").textContent = "Ningún archivo...";
          });
      });
    })
    .catch(error => {
      let mensaje = "Error al crear cuenta";
      if(error.code === "auth/email-already-in-use") mensaje = "Este correo ya está registrado";
      if(error.code === "auth/weak-password") mensaje = "La contraseña debe tener mínimo 6 caracteres";
      mostrarMensaje("mensajeRegistro", mensaje);
    });
}


function resetPassword() {
  const email = document.getElementById("email").value;
  if(email === ""){
    mostrarMensaje("mensajeLogin", "Ingresa tu correo primero");
    return;
  }
  sendPasswordResetEmail(auth, email)
    .then(() => mostrarMensaje("mensajeLogin", "Correo enviado correctamente", "ok"))
    .catch(error => mostrarMensaje("mensajeLogin", "Error: " + error.code));
}

function enviarReset(){
  const email = document.getElementById("resetEmail").value;
  const mensaje = document.getElementById("mensajeReset");
  const loader = document.getElementById("loader");
  const boton = document.getElementById("btnReset");

  mensaje.textContent = "";
  mensaje.className = "mensaje";

  if(email === ""){
    mensaje.textContent = "Ingresa tu correo 📧";
    mensaje.classList.add("error");
    return;
  }

  loader.style.display = "block";
  boton.disabled = true;
  boton.textContent = "Enviando...";

  sendPasswordResetEmail(auth, email)
    .then(() => {
      loader.style.display = "none";
      mensaje.textContent = "Correo enviado correctamente";
      mensaje.classList.add("ok");
      boton.disabled = false;
      boton.textContent = "Enviar correo";
    })
    .catch(error => {
      loader.style.display = "none";
      mensaje.textContent = "Error: " + error.message;
      mensaje.classList.add("error");
      boton.disabled = false;
      boton.textContent = "Enviar correo";
    });
}

function cerrarSesion(){
  signOut(auth).then(() => console.log("Sesión cerrada")).catch(err => console.error(err));
}

function abrirModal(){ document.getElementById("modalReset").classList.add("activo"); }
function cerrarModal(){ document.getElementById("modalReset").classList.remove("activo"); }

function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);
    box.textContent = texto;
    box.className = "mensaje " + tipo;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 4000);
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

  const selectedDia = document.querySelector("#selectDia .selected");
  if (parseInt(selectedDia.textContent) > diasMes) {
    selectedDia.textContent = "Día";
  }
}

function crearOpciones(selectId, datos) {
    const select = document.getElementById(selectId);
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
        const yaActivo = select.classList.contains("active");
        document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
        if (!yaActivo) select.classList.add("active");
    });
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-select")) {
        document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
    }
});

window.addEventListener("load", () => {
    const dias = Array.from({length: 31}, (_, i) => i + 1);
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const actual = new Date().getFullYear();
    const anios = [];
    for(let i = actual - 18; i >= actual - 100; i--) anios.push(i);

    crearOpciones("selectDia", dias);
    crearOpciones("selectMes", meses);
    crearOpciones("selectAnio", anios);
});

onAuthStateChanged(auth, (user) => {
  // Solo lo dejamos pasar a Home si su usuario existe y SU CORREO ESTÁ VERIFICADO
  if (user && user.emailVerified) {
    window.location.href = "Home.html";
  } else {
    document.getElementById("modalRegistro").style.display = "none";
    const login = document.getElementById("loginCard");
    if (login) {
      login.style.display = "block";
      login.classList.remove("oculto");
    }
  }
});

function formatearPlacas(input) {
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formateado = '';
    if (valor.length > 0) formateado += valor.substring(0, 3);
    if (valor.length > 3) formateado += '-' + valor.substring(3, 6);
    if (valor.length > 6) formateado += '-' + valor.substring(6, 7);
    input.value = formateado;
}

window.login = login;
window.register = register;
window.resetPassword = resetPassword;
window.enviarReset = enviarReset;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;
window.cerrarSesion = cerrarSesion;
window.formatearPlacas = formatearPlacas;
