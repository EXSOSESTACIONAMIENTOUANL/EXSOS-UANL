/* ========================================== */
/* 1. NAVEGACIÓN Y MENÚ (PARA TODAS LAS PAGS) */
/* ========================================== */
function abrirMenu() {
    document.getElementById("menuLateral").classList.add("activo");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarMenu() {
    document.getElementById("menuLateral").classList.remove("activo");
    document.getElementById("overlay").classList.remove("activo");
}

function toggleNotificaciones() {
    document.getElementById("panelNotificaciones").classList.toggle("activo");
}

function toggleSeccion(id) {
    document.getElementById(id)?.classList.toggle("activo");
    document.getElementById("flecha-" + id)?.classList.toggle("rotar");
}

/* ========================================== */
/* 2. ASISTENTE AYUDA (DINO)                  */
/* ========================================== */
function abrirAyuda() {
    const overlay = document.getElementById("overlayAyuda");
    if(!overlay) return;
    overlay.classList.add("activo");
    
    const chat = document.getElementById("chatArea");
    if(chat) chat.innerHTML = `<div class="mensaje bot">¡Hola! Soy Dino. ¿En qué puedo ayudarte en esta sección?</div>`;
}

function cerrarAyuda() {
    document.getElementById("overlayAyuda")?.classList.remove("activo");
}

/* ========================================== */
/* 3. CALENDARIO Y NOTIFICACIONES (CSV)       */
/* ========================================== */
let partidos = {};

async function cargarPartidos() {
    try {
        const res = await fetch("partidos.csv");
        const texto = await res.text();
        const lineas = texto.split("\n").slice(1);

        lineas.forEach(l => {
            const d = l.split(",");
            if (d.length < 5) return;
            const clave = `${d[0].trim()}-${d[1].trim()}`;
            if (!partidos[clave]) partidos[clave] = [];
            partidos[clave].push({ local: d[2], rival: d[3], hora: d[4] });
        });

        // Si estamos en la página de calendario, marcar días
        if(document.querySelector(".calendario")) marcarPartidos();
        
        revisarPartidosHoy();
    } catch (e) { console.log("CSV no encontrado o error de lectura."); }
}

function marcarPartidos() {
    document.querySelectorAll(".mes").forEach((mesDiv, i) => {
        const mesNum = i + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            const clave = `${mesNum}-${dia.dataset.dia}`;
            if (partidos[clave]) {
                dia.classList.add("partido");
                dia.onclick = () => mostrarPopup(partidos[clave]);
            }
        });
    });
}

function revisarPartidosHoy() {
    const hoy = new Date();
    const clave = `${hoy.getMonth() + 1}-${hoy.getDate()}`;
    const contenedor = document.getElementById("hoy");
    
    if (contenedor && partidos[clave]) {
        document.getElementById("estadoVacioHoy").style.display = "none";
        partidos[clave].forEach(p => {
            contenedor.innerHTML += `<div class="notificacion-card">⚽ Partido hoy: ${p.hora}</div>`;
        });
    }
    actualizarBadge();
}

function actualizarBadge() {
    const n = document.querySelectorAll(".notificacion-card").length;
    const badge = document.getElementById("badgeNoti");
    if (badge) {
        badge.textContent = n;
        badge.style.backgroundColor = n === 0 ? "#00c800" : "red";
    }
}

function mostrarPopup(lista) {
    const popup = document.getElementById("popup");
    if(!popup) return;
    popup.style.display = "flex";
    let html = "";
    lista.forEach(p => html += `<div><b>${p.local} vs ${p.rival}</b><br>🕒 ${p.hora}</div>`);
    document.getElementById("popup-rival").innerHTML = html;
}

function cerrarPopup() { document.getElementById("popup").style.display = "none"; }

/* ========================================== */
/* 4. MOTOR FIREBASE (SOLO SI ES HOME)       */
/* ========================================== */
if (typeof firebase !== 'undefined' && document.querySelector(".mapa-estacionamiento")) {
    firebase.database().ref('/estacionamiento/raw').on('value', (snapshot) => {
        const raw = snapshot.val();
        if (!raw) return;
        for (let i = 1; i <= 5; i++) {
            const cajon = document.querySelector(`.cajon${i}`);
            if (cajon) {
                if (raw[i-1] === "1") cajon.classList.replace("ocupado", "libre");
                else cajon.classList.replace("libre", "ocupado");
            }
        }
    });
}

/* ========================================== */
/* INICIALIZACIÓN                             */
/* ========================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarPartidos();
    // Corregir inicio de meses si hay calendario
    if(document.querySelector(".mes")) {
        document.querySelectorAll(".mes").forEach((mesDiv, index) => {
            const container = mesDiv.querySelector(".dias");
            let offset = new Date(2026, index, 1).getDay() - 1;
            if (offset < 0) offset = 6;
            for (let i = 0; i < offset; i++) {
                const span = document.createElement("span");
                span.className = "vacio";
                container.prepend(span);
            }
        });
    }
});
