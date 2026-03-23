/* ======================================================== */
/* 1. CONEXIÓN A FIREBASE (NUBE) - INTEGRACIÓN SEGURA       */
/* ======================================================== */

// Usamos tus credenciales exactas
const firebaseConfig = {
  apiKey: "AIzaSyBTnfeDaDYQlk3ugUHzc3SXB_b7dMrv3Qg",
  authDomain: "esp32-ecdcf.firebaseapp.com",
  databaseURL: "https://esp32-ecdcf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-ecdcf",
  storageBucket: "esp32-ecdcf.firebasestorage.app",
  messagingSenderId: "436852778640",
  appId: "1:436852778640:web:7a7e1f2cb1c42973921a15"
};

// Inicializamos solo si no se ha inicializado antes
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Escuchamos la ruta original /estacionamiento
// Solo se ejecuta si estamos en la página del mapa (Home)
if (document.querySelector(".mapa-estacionamiento")) {
    db.ref("/estacionamiento").on("value", (snapshot) => {
        const datos = snapshot.val();
        if (!datos) return;

        let ocupados = 0;
        let libres = 0;

        // Actualizamos cada cajón con tu lógica original de clases
        for (let i = 1; i <= 5; i++) {
            const cajon = document.querySelector(`.cajon${i}`);
            if (cajon) {
                const estado = datos[`cajon${i}`]; // Lee cajon1, cajon2, etc.
                if (estado == 0) { // Ocupado
                    cajon.classList.remove("libre");
                    cajon.classList.add("ocupado");
                    ocupados++;
                } else { // Libre
                    cajon.classList.remove("ocupado");
                    cajon.classList.add("libre");
                    libres++;
                }
            }
        }

        // Actualizamos tus contadores numéricos
        const numV = document.querySelector(".numero-verde");
        const numR = document.querySelector(".numero-rojo");
        if(numV) numV.innerText = libres.toString().padStart(3, '0');
        if(numR) numR.innerText = ocupados.toString().padStart(3, '0');
    });
}

/* ======================================================== */
/* 2. TU LÓGICA DE MENÚ Y NOTIFICACIONES (TAL CUAL)         */
/* ======================================================== */

function abrirMenu(){
    document.getElementById("menuLateral").classList.add("activo");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarMenu(){
    document.getElementById("menuLateral").classList.remove("activo");
    document.getElementById("overlay").classList.remove("activo");
}

function toggleNotificaciones(){
    const panel = document.getElementById("panelNotificaciones");
    if(panel) panel.classList.toggle("activo");
}

function toggleSeccion(id){
    const contenido = document.getElementById(id);
    const flecha = document.getElementById("flecha-" + id);
    if(contenido) contenido.classList.toggle("activo");
    if(flecha) flecha.classList.toggle("rotar");
}

/* ======================================================== */
/* 3. TU AYUDANTE DINO (CHAT) - REPARADO                    */
/* ======================================================== */

function abrirAyuda(){
    const overlay = document.getElementById("overlayAyuda");
    const titulo = document.getElementById("tituloAyuda");
    const texto = document.getElementById("textoAyuda");
    const msj = document.getElementById("mensajeAyuda");
    const img = document.getElementById("imagenCentral");
    const chatCont = document.querySelector(".chat-contenedor");
    const chatArea = document.getElementById("chatArea");

    if(!overlay) return;

    overlay.classList.add("activo");
    titulo.innerHTML = ""; texto.innerHTML = ""; chatArea.innerHTML = "";
    chatCont.classList.remove("activo");
    img.classList.remove("monito-desaparece");
    msj.classList.remove("monito-desaparece");
    img.style.display = "block";
    msj.style.display = "block";

    escribirTexto("¡Hola!", titulo, 50, () => {
        escribirTexto("Soy tu asistente virtual EXSOS", texto, 30, () => {
            setTimeout(()=>{
                img.classList.add("monito-desaparece");
                msj.classList.add("monito-desaparece");
                setTimeout(()=>{
                    img.style.display="none";
                    msj.style.display="none";
                    chatCont.classList.add("activo");
                    chatArea.innerHTML = `<div class="mensaje bot"><img src="https://i.postimg.cc/WpxqwBv1/Feliz.png" class="avatar"><div class="burbuja">¿En qué puedo ayudarte?</div></div>`;
                },500);
            },1500);
        });
    });
}

function cerrarAyuda(){
    document.getElementById("overlayAyuda").classList.remove("activo");
}

function escribirTexto(texto, elemento, velocidad, callback){
    let i = 0;
    elemento.innerHTML = "";
    const intervalo = setInterval(()=>{
        elemento.innerHTML += texto.charAt(i++);
        if(i >= texto.length){
            clearInterval(intervalo);
            if(callback) callback();
        }
    }, velocidad);
}

/* ======================================================== */
/* 4. TU CALENDARIO (CSV) - SIN TOCAR                       */
/* ======================================================== */

let partidos = {};

async function cargarPartidos(){
    try {
        const res = await fetch("partidos.csv");
        const texto = await res.text();
        const lineas = texto.split("\n").slice(1);

        lineas.forEach(linea => {
            const d = linea.split(",");
            if(d.length < 5) return;
            const clave = d[0].trim() + "-" + d[1].trim(); 
            if(!partidos[clave]) partidos[clave] = [];
            partidos[clave].push({ rival:d[3], local:d[2], hora:d[4], logoLocal:d[5], logoRival:d[6] });
        });

        marcarPartidos();
        activarClicks();
        revisarPartidosHoy();
        revisarPartidosAnteriores();
    } catch(e) { console.error("Error CSV"); }
}

function marcarPartidos(){
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const mesNum = index + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            if(partidos[mesNum + "-" + dia.dataset.dia]) dia.classList.add("partido");
        });
    });
}

function activarClicks(){
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const mesNum = index + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            dia.addEventListener("click", function(){
                const clave = mesNum + "-" + this.dataset.dia;
                if(partidos[clave]) mostrarPopup(partidos[clave]);
            });
        });
    });
}

function mostrarPopup(lista){
    const popup = document.getElementById("popup");
    const rivalArea = document.getElementById("popup-rival");
    if(!popup) return;
    popup.style.display="flex";
    let html = "";
    lista.forEach(p => {
        html += `<div class="partido-card"><div class="partido-info"><div class="equipo"><span class="nombre-equipo">${p.local}</span></div><div class="vs">VS</div><div class="equipo"><span class="nombre-equipo">${p.rival}</span></div><div class="info-partido"><div class="hora">🕒 ${p.hora}</div></div></div><div class="barra-color"></div></div>`;
    });
    rivalArea.innerHTML = html;
}

function cerrarPopup(){ document.getElementById("popup").style.display="none"; }

function revisarPartidosHoy(){
    const hoy = new Date();
    const clave = (hoy.getMonth() + 1) + "-" + hoy.getDate();
    const cont = document.getElementById("hoy");
    if(cont && partidos[clave]){
        document.getElementById("estadoVacioHoy").style.display = "none";
        partidos[clave].forEach(p => {
            const card = document.createElement("div");
            card.className = "notificacion-card";
            card.innerHTML = `<div class="noti-icono">⚽</div><div class="noti-texto"><b>Partido hoy</b><br>A las ${p.hora}</div>`;
            cont.appendChild(card);
        });
    }
    actualizarNumeroCampana();
}

function revisarPartidosAnteriores(){
    const hoy = new Date();
    const mesAct = hoy.getMonth() + 1;
    const diaAct = hoy.getDate();
    const cont = document.getElementById("anteriores");
    if(!cont) return;
    let hayEventos = false;
    Object.keys(partidos).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        if(m < mesAct || (m === mesAct && d < diaAct)){
            partidos[clave].forEach(p => {
                const card = document.createElement("div");
                card.className = "notificacion-card";
                card.innerHTML = `<div class="noti-icono">📅</div><div class="noti-texto"><b>${p.local} vs ${p.rival}</b><br>${d}/${m}/26</div>`;
                cont.appendChild(card);
                hayEventos = true;
            });
        }
    });
    if(document.getElementById("estadoVacioAnteriores")) 
        document.getElementById("estadoVacioAnteriores").style.display = hayEventos ? "none" : "flex";
    actualizarNumeroCampana();
}

function actualizarNumeroCampana(){
    const total = document.querySelectorAll(".notificacion-card").length;
    const badge = document.getElementById("badgeNoti");
    if(badge){
        badge.textContent = total;
        badge.style.backgroundColor = (total === 0) ? "#00c800" : "red";
    }
}

/* ======================================================== */
/* 5. INICIALIZACIÓN                                        */
/* ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Alinear meses
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const diasContainer = mesDiv.querySelector(".dias");
        if(!diasContainer) return;
        diasContainer.querySelectorAll(".vacio").forEach(e => e.remove());
        let offset = new Date(2026, index, 1).getDay() - 1;
        if (offset < 0) offset = 6;
        for (let i = 0; i < offset; i++) {
            const span = document.createElement("span");
            span.className = "vacio";
            diasContainer.prepend(span);
        }
    });
    cargarPartidos();
});
