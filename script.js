/* ======================================================== */
/* 1. CONFIGURACIÓN Y MOTOR REAL-TIME (SOLO HOME)           */
/* ======================================================== */
const pathRaw = '/estacionamiento/raw';

if (typeof firebase !== 'undefined' && document.querySelector(".mapa-estacionamiento")) {
    firebase.database().ref(pathRaw).on('value', (snapshot) => {
        const raw = snapshot.val(); 
        if (!raw) return;
        for (let i = 1; i <= 5; i++) {
            const cajon = document.querySelector(`.cajon${i}`);
            if (!cajon) continue;
            const estaLibre = raw[i - 1] === "1";
            if (estaLibre) {
                if (cajon.classList.contains("ocupado")) cajon.classList.replace("ocupado", "libre");
            } else {
                if (cajon.classList.contains("libre")) cajon.classList.replace("libre", "ocupado");
            }
        }
        // Actualización de contadores
        const libres = (raw.match(/1/g) || []).length;
        const ocupados = (raw.match(/0/g) || []).length;
        requestAnimationFrame(() => {
            document.querySelector(".numero-verde") && (document.querySelector(".numero-verde").innerText = libres.toString().padStart(3, '0'));
            document.querySelector(".numero-rojo") && (document.querySelector(".numero-rojo").innerText = ocupados.toString().padStart(3, '0'));
        });
    });
}

/* ======================================================== */
/* 2. NAVEGACIÓN Y MENÚ (UNIVERSAL)                         */
/* ======================================================== */
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

/* ======================================================== */
/* 3. ASISTENTE DINO (AYUDA)                                */
/* ======================================================== */
function abrirAyuda() {
    const overlay = document.getElementById("overlayAyuda");
    const titulo = document.getElementById("tituloAyuda");
    const texto = document.getElementById("textoAyuda");
    const img = document.getElementById("imagenCentral");
    const chatCont = document.querySelector(".chat-contenedor");
    const msjAyuda = document.getElementById("mensajeAyuda");

    if(!overlay) return;
    overlay.classList.add("activo");
    img.style.display = "block";
    msjAyuda.style.display = "block";
    chatCont.classList.remove("activo");
    img.classList.remove("monito-desaparece");
    msjAyuda.classList.remove("monito-desaparece");

    escribirTexto("¡Hola!", titulo, 50, () => {
        escribirTexto("Soy tu asistente virtual EXSOS", texto, 30, () => {
            setTimeout(() => {
                img.classList.add("monito-desaparece");
                msjAyuda.classList.add("monito-desaparece");
                setTimeout(() => {
                    img.style.display = "none";
                    msjAyuda.style.display = "none";
                    chatCont.classList.add("activo");
                }, 500);
            }, 1500);
        });
    });
}
function cerrarAyuda() { document.getElementById("overlayAyuda").classList.remove("activo"); }
function escribirTexto(t, el, v, cb) {
    let i = 0; el.innerHTML = "";
    const timer = setInterval(() => {
        el.innerHTML += t.charAt(i++);
        if (i >= t.length) { clearInterval(timer); if(cb) cb(); }
    }, v);
}

/* ======================================================== */
/* 4. CALENDARIO Y NOTIFICACIONES (CSV) - CORREGIDO         */
/* ======================================================== */
let partidosGlobal = {};

async function cargarPartidos() {
    try {
        const res = await fetch("partidos.csv");
        const texto = await res.text();
        const lineas = texto.split("\n").slice(1);

        partidosGlobal = {}; // Limpiar
        lineas.forEach(l => {
            const d = l.split(",");
            if (d.length < 5) return;
            const clave = `${parseInt(d[0])}-${parseInt(d[1])}`; // Asegurar números limpios
            if (!partidosGlobal[clave]) partidosGlobal[clave] = [];
            partidosGlobal[clave].push({ local: d[2], rival: d[3], hora: d[4] });
        });

        // IMPORTANTE: Ejecutar esto SOLO después de que cargue el CSV
        revisarNotificacionesCompleto();
        if(document.querySelector(".mes")) marcarDias();
    } catch (e) { console.warn("Archivo CSV no detectado o error de red."); }
}

function marcarDias() {
    document.querySelectorAll(".mes").forEach((mesDiv, i) => {
        const mesNum = i + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            const numDia = parseInt(dia.dataset.dia);
            const clave = `${mesNum}-${numDia}`;
            if (partidosGlobal[clave]) {
                dia.classList.add("partido");
                dia.onclick = () => mostrarPopup(partidosGlobal[clave]);
            }
        });
    });
}

function revisarNotificacionesCompleto() {
    const hoy = new Date();
    const mesHoy = hoy.getMonth() + 1;
    const diaHoy = hoy.getDate();
    
    const contHoy = document.getElementById("hoy");
    const contAnt = document.getElementById("anteriores");
    if (!contHoy || !contAnt) return;

    contHoy.innerHTML = ""; // Limpiar
    contAnt.innerHTML = "";

    let hayHoy = false, hayAnt = false;

    Object.keys(partidosGlobal).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        
        partidosGlobal[clave].forEach(p => {
            const card = document.createElement("div");
            card.className = "notificacion-card";
            // Usamos el baloncito de tu imagen
            card.innerHTML = `
                <img src="https://i.imgur.com/gANyK8b.png" class="noti-icono-balon" style="width:30px; height:30px; margin-right:10px;">
                <div class="noti-texto">
                    <div class="noti-titulo"><b>${m === mesHoy && d === diaHoy ? "Partido hoy" : p.local + " vs " + p.rival}</b></div>
                    <div class="noti-mensaje">${m === mesHoy && d === diaHoy ? "Hoy hay partido a las " + p.hora : d + "/" + m + "/26 - " + p.hora}</div>
                </div>`;

            if (m === mesHoy && d === diaHoy) {
                contHoy.appendChild(card);
                hayHoy = true;
            } else if (m < mesHoy || (m === mesHoy && d < diaHoy)) {
                contAnt.appendChild(card);
                hayAnt = true;
            }
        });
    });

    document.getElementById("estadoVacioHoy").style.display = hayHoy ? "none" : "flex";
    document.getElementById("estadoVacioAnteriores").style.display = hayAnt ? "none" : "flex";
    
    actualizarBadge();
}

function mostrarPopup(lista) {
    document.getElementById("popup").style.display = "flex";
    let html = "";
    lista.forEach(p => html += `<div class="partido-card"><b>${p.local} vs ${p.rival}</b><br>🕒 ${p.hora}</div>`);
    document.getElementById("popup-rival").innerHTML = html;
}
function cerrarPopup() { document.getElementById("popup").style.display = "none"; }

function actualizarBadge() {
    const n = document.querySelectorAll(".notificacion-card").length;
    const badge = document.getElementById("badgeNoti");
    if (badge) {
        badge.textContent = n;
        badge.style.backgroundColor = n === 0 ? "#00c800" : "red";
    }
}

/* ======================================================== */
/* 5. INICIALIZACIÓN                                        */
/* ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarPartidos(); // Carga datos y luego dispara calendario/campana
    
    if(document.querySelector(".mes")) {
        document.querySelectorAll(".mes").forEach((mesDiv, index) => {
            const container = mesDiv.querySelector(".dias");
            if (!container) return;
            container.querySelectorAll(".vacio").forEach(v => v.remove());
            let offset = new Date(2026, index, 1).getDay() - 1;
            if (offset < 0) offset = 6;
            for (let i = 0; i < offset; i++) {
                const span = document.createElement("span");
                span.className = "vacio";
                container.prepend(span);
            }
        });
    }
    
    document.getElementById("inputUsuario")?.addEventListener("keypress", (e) => {
        if(e.key === "Enter") enviarMensaje();
    });
});
