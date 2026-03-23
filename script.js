/* ======================================================== */
/* 1. MOTOR REAL-TIME (FIREBASE)                            */
/* ======================================================== */
const dbRef = firebase.database().ref('/estacionamiento/raw');

// Esta parte controla los cajones en el Home
if (typeof firebase !== 'undefined' && document.querySelector(".mapa-estacionamiento")) {
    dbRef.on('value', (snapshot) => {
        const raw = snapshot.val(); 
        if (!raw) return;
        for (let i = 1; i <= 5; i++) {
            const cajon = document.querySelector(`.cajon${i}`);
            if (cajon) {
                if (raw[i - 1] === "1") {
                    cajon.classList.remove("ocupado");
                    cajon.classList.add("libre");
                } else {
                    cajon.classList.remove("libre");
                    cajon.classList.add("ocupado");
                }
            }
        }
        // Actualizar números de disponibilidad
        const libres = (raw.match(/1/g) || []).length;
        const ocupados = (raw.match(/0/g) || []).length;
        const elV = document.querySelector(".numero-verde");
        const elR = document.querySelector(".numero-rojo");
        if(elV) elV.innerText = libres.toString().padStart(3, '0');
        if(elR) elR.innerText = ocupados.toString().padStart(3, '0');
    });
}

/* ======================================================== */
/* 2. NAVEGACIÓN Y MENÚ                                     */
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
function enviarMensaje() {
    const input = document.getElementById("inputUsuario");
    const chat = document.getElementById("chatArea");
    if (!input || !input.value.trim()) return;
    chat.innerHTML += `<div class="mensaje usuario"><div class="burbuja">${input.value}</div><img src="https://i.postimg.cc/3NzGy63L/Dina.png" class="avatar"></div>`;
    input.value = "";
    chat.scrollTop = chat.scrollHeight;
}

/* ======================================================== */
/* 4. CALENDARIO Y CAMPANA (CSV)                            */
/* ======================================================== */
let partidosGlobal = {};

async function cargarPartidos() {
    try {
        const res = await fetch("partidos.csv");
        const texto = await res.text();
        const lineas = texto.split("\n").slice(1);
        partidosGlobal = {};

        lineas.forEach(l => {
            const d = l.split(",");
            if (d.length < 5) return;
            const clave = `${parseInt(d[0])}-${parseInt(d[1])}`;
            if (!partidosGlobal[clave]) partidosGlobal[clave] = [];
            partidosGlobal[clave].push({ local: d[2].trim(), rival: d[3].trim(), hora: d[4].trim() });
        });

        revisarNotificacionesCompleto();
        if(document.querySelector(".mes")) marcarDias();
    } catch (e) { console.warn("Error CSV"); }
}

function marcarDias() {
    document.querySelectorAll(".mes").forEach((mesDiv, i) => {
        const mesNum = i + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            const clave = `${mesNum}-${parseInt(dia.dataset.dia)}`;
            if (partidosGlobal[clave]) dia.classList.add("partido");
        });
    });
}

function mostrarPopup(lista) {
    document.getElementById("popup").style.display = "flex";
    let html = "";
    lista.forEach(p => {
        // Estructura idéntica a tu Captura 2 (con barra amarilla/azul)
        html += `
        <div class="partido-card">
            <div class="partido-info">
                <div class="equipo"><span class="nombre-equipo">${p.local}</span></div>
                <div class="vs">VS</div>
                <div class="equipo"><span class="nombre-equipo">${p.rival}</span></div>
                <div class="info-partido"><div class="hora">🕒 ${p.hora}</div></div>
            </div>
            <div class="barra-color"></div>
        </div>`;
    });
    document.getElementById("popup-rival").innerHTML = html;
}

function cerrarPopup() { document.getElementById("popup").style.display = "none"; }

function revisarNotificacionesCompleto() {
    const hoy = new Date();
    const mesHoy = hoy.getMonth() + 1;
    const diaHoy = hoy.getDate();
    const contHoy = document.getElementById("hoy");
    const contAnt = document.getElementById("anteriores");

    if (!contHoy) return;
    contHoy.innerHTML = ""; contAnt.innerHTML = "";

    let count = 0, hayHoy = false, hayAnt = false;

    Object.keys(partidosGlobal).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        partidosGlobal[clave].forEach(p => {
            count++;
            const card = document.createElement("div");
            card.className = "notificacion-card";
            card.innerHTML = `
                <div class="noti-icono">⚽</div>
                <div class="noti-texto">
                    <div class="noti-titulo">${m === mesHoy && d === diaHoy ? "Partido hoy" : p.local + " vs " + p.rival}</div>
                    <div class="noti-mensaje">${m === mesHoy && d === diaHoy ? "Hoy hay partido a las " + p.hora : d + "/" + m + "/26"}</div>
                </div>`;

            if (m === mesHoy && d === diaHoy) { contHoy.appendChild(card); hayHoy = true; }
            else if (m < mesHoy || (m === mesHoy && d < diaHoy)) { contAnt.appendChild(card); hayAnt = true; }
        });
    });

    document.getElementById("estadoVacioHoy").style.display = hayHoy ? "none" : "flex";
    document.getElementById("estadoVacioAnteriores").style.display = hayAnt ? "none" : "flex";
    
    // Actualizar badge rojo de la campana
    const badge = document.getElementById("badgeNoti");
    if(badge) {
        badge.textContent = count;
        badge.style.backgroundColor = count === 0 ? "#00c800" : "red";
    }
}

/* ======================================================== */
/* 5. INICIALIZACIÓN                                        */
/* ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarPartidos();
    // Corregir espacios en blanco del calendario
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
    // Activar clics
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            dia.addEventListener("click", () => {
                const clave = `${index + 1}-${dia.dataset.dia}`;
                if (partidosGlobal[clave]) mostrarPopup(partidosGlobal[clave]);
            });
        });
    });
    document.getElementById("inputUsuario")?.addEventListener("keypress", (e) => { if(e.key === "Enter") enviarMensaje(); });
});
