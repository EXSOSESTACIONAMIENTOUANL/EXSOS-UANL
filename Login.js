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
auth.useDeviceLanguage();

import { getStorage, ref, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const storage = getStorage();

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;

  try {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );

    await signInWithEmailAndPassword(auth, email, password);

    // 👇 respaldo para Safari
    if (remember) {
      localStorage.setItem("rememberUser", "true");
    } else {
      localStorage.removeItem("rememberUser");
    }

    mostrarMensaje("mensajeLogin", "Sesión iniciada correctamente", "ok");

  } catch (error) {

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
  }
}

async function subirImagen(file, ruta) {
    const storageRef = ref(storage, ruta);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
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



async function registrarUsuario() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const nombre = document.getElementById("regNombre").value;

    const placas = document.getElementById("placas").value;
    const marca = document.getElementById("marca").value;
    const modelo = document.getElementById("modelo").value;
    const anio = document.getElementById("anio").value;

    const fotoAuto = document.getElementById("fotoAuto").files[0];
    const licencia = document.getElementById("licencia").files[0];

    try {

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // 🔥 subir imágenes
        const urlAuto = await subirImagen(fotoAuto, "autos/" + uid);
        const urlLicencia = await subirImagen(licencia, "licencias/" + uid);

        // 🔥 guardar en base de datos
        await db.ref("usuarios/" + uid).set({
            nombre: nombre,
            email: email,

            vehiculo: {
                placas: placas,
                marca: marca,
                modelo: modelo,
                anio: anio,
                foto: urlAuto
            },

            licencia: urlLicencia,

            estado: "pendiente", // 🔥 clave
            fechaRegistro: new Date().toISOString()
        });

        alert("Cuenta creada. En revisión (24 hrs)");

    } catch (error) {
        console.error(error);
    }
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
    const remember = localStorage.getItem("rememberUser");
    
    if (remember === "true") {
      console.log("Safari fallback activo");
    }
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
