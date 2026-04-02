/* Inicio de sesion de Bryan para que se calle */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

  const persistence = remember
    ? browserLocalPersistence
    : browserSessionPersistence;

  setPersistence(auth, persistence)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then(() => {
      mostrarMensaje("mensajeLogin", "Sesión iniciada correctamente", "ok");
    })


.catch(error => {

  let mensaje = "Error al iniciar sesión";

  switch (error.code) {

    case "auth/user-not-found":
      mensaje = "El correo no está registrado";
      break;

    case "auth/missing-password":
    mensaje = "Ingresa tu contraseña";
    break;

    case "auth/wrong-password":
      mensaje = "La contraseña es incorrecta";
      break;

    case "auth/invalid-credential":
      mensaje = "Correo o contraseña incorrectos";
      break;

    case "auth/invalid-email":
      mensaje = "El formato del correo no es válido";
      break;

    case "auth/too-many-requests":
      mensaje = "Demasiados intentos. Intenta más tarde";
      break;

    case "auth/network-request-failed":
      mensaje = "Error de conexión a internet";
      break;

    default:
      mensaje = "Error desconocido";
  }

  mostrarMensaje("mensajeLogin", mensaje);
  document.getElementById("password").value = "";
});

}


function register() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const nombre = document.getElementById("regNombre").value;
  const matricula = document.getElementById("regMatricula").value;

  if(email === "" || password === ""){
  mostrarMensaje("mensajeRegistro", "Completa los campos obligatorios");
  return;
  }


  // Obtener valores de la fecha
  const dia = document.querySelector("#selectDia .selected").textContent;
  const mes = document.querySelector("#selectMes .selected").textContent;
  const anio = document.querySelector("#selectAnio .selected").textContent;

  // Validar que hayan seleccionado fecha
  if (dia === "Día" || mes === "Mes" || anio === "Año") {
    mostrarMensaje("mensajeRegistro", "Selecciona tu fecha de nacimiento");
    return;
  }

  // Convertir mes a número
    const mesesLista = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

const mesNumero = mesesLista.indexOf(mes); // 0–11

// Convertir a fecha
const fechaNacimiento = new Date(anio, mesNumero, dia);
const hoy = new Date();

// Fecha mínima para ser mayor de edad
const fechaMinima = new Date(
  hoy.getFullYear() - 18,
  hoy.getMonth(),
  hoy.getDate()
);

if (fechaNacimiento > fechaMinima) {
  mostrarMensaje("mensajeRegistro", "Debes ser mayor de edad");
  return;
}


  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      mostrarMensaje("mensajeRegistro", "Cuenta creada correctamente", "ok");

      setTimeout(() => {
      cerrarRegistro();
      }, 1000);

      // limpiar inputs
      document.getElementById("regEmail").value = "";
      document.getElementById("regPassword").value = "";
      document.getElementById("regNombre").value = "";
      document.getElementById("regUser").value = "";

    })
   .catch(error => {

  let mensaje = "Error al crear cuenta";

  switch (error.code) {

    case "auth/email-already-in-use":
      mensaje = "Este correo ya está registrado";
      break;

    case "auth/weak-password":
      mensaje = "La contraseña debe tener mínimo 6 caracteres";
      break;

    case "auth/invalid-email":
      mensaje = "Correo inválido";
      break;

    case "auth/network-request-failed":
      mensaje = "Error de conexión";
      break;

    default:
      mensaje = "Error: " + error.code;
  }

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
    .then(() => {
      mostrarMensaje("mensajeLogin", "Correo enviado correctamente", "ok");
    })
    .catch(error => {
      mostrarMensaje("mensajeLogin", "Error: " + error.code);
    });
}



function abrirModal(){
  document.getElementById("modalReset").classList.add("activo");
}


function cerrarModal(){
  document.getElementById("modalReset").classList.remove("activo");
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



onAuthStateChanged(auth, (user) => {

  if (user) {
    // Usuario logueado → ir a Home
    window.location.href = "Home.html";
  } else {
    // Usuario NO logueado → asegurar vista limpia
    document.getElementById("modalRegistro").style.display = "none";

    const login = document.getElementById("loginCard");
    if (login) {
      login.style.display = "block";
      login.classList.remove("oculto");
    }
  }

});


function cerrarSesion(){
  signOut(auth)
    .then(() => {
      // Firebase ya activará onAuthStateChanged
      console.log("Sesión cerrada");
    })
    .catch(error => {
      console.error(error);
    });
}

window.cerrarSesion = cerrarSesion;


function abrirRegistro() {
    document.getElementById("modalRegistro").style.display = "flex";
    document.getElementById("loginCard").classList.add("oculto");
}

function cerrarRegistro() {
    document.getElementById("modalRegistro").style.display = "none";
    document.getElementById("loginCard").classList.remove("oculto");
}

window.login = login;
window.register = register;
window.resetPassword = resetPassword;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.enviarReset = enviarReset;
window.abrirRegistro = abrirRegistro;
window.cerrarRegistro = cerrarRegistro;




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

    // 👇 actualizar días si cambia mes o año
    if (selectId === "selectMes" || selectId === "selectAnio") {
        actualizarDias();
    }
});

        options.appendChild(div);
    });

    // abrir/cerrar
    selected.addEventListener("click", (e) => {

    e.stopPropagation(); // evita que se cierre por el click global

    const yaActivo = select.classList.contains("active");

    // cerrar todos
    document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));

    // si NO estaba abierto, lo abre
    if (!yaActivo) {
        select.classList.add("active");
    }
});
}

// cerrar si haces click afuera
document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-select")) {
        document.querySelectorAll(".custom-select").forEach(s => s.classList.remove("active"));
    }
});







window.addEventListener("load", () => {

    // DÍAS
    const dias = Array.from({length: 31}, (_, i) => i + 1);

    // MESES
    const meses = [
        "Enero","Febrero","Marzo","Abril","Mayo","Junio",
        "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

    // AÑOS
    const actual = new Date().getFullYear();
    const anios = [];

    // solo mayores de 18
    for(let i = actual - 18; i >= actual - 100; i--){
        anios.push(i);
    }

    crearOpciones("selectDia", dias);
    crearOpciones("selectMes", meses);
    crearOpciones("selectAnio", anios);
});


function mostrarMensaje(id, texto, tipo="error") {
    const box = document.getElementById(id);

    box.textContent = "";
    box.textContent = texto;

    box.className = "mensaje " + tipo;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 4000);
}


function actualizarDias() {

  const mes = document.querySelector("#selectMes .selected").textContent;
  const anio = document.querySelector("#selectAnio .selected").textContent;

  if (mes === "Mes" || anio === "Año") return;

  const mesesLista = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const mesNumero = mesesLista.indexOf(mes);

  // último día del mes
  const diasMes = new Date(anio, mesNumero + 1, 0).getDate();

  const options = document.querySelector("#selectDia .options");
  options.innerHTML = ""; // limpiar días

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