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

let partidos = {};

async function cargarPartidos(){
    const respuesta = await fetch("partidos.csv");
    const texto = await respuesta.text();
    const lineas = texto.split("\n");
    lineas.shift();

    lineas.forEach(linea => {
        const datos = linea.split(",");
        if(datos.length < 5) return;
        const clave = datos[0] + "-" + datos[1]; // Mes-Dia
        if(!partidos[clave]) partidos[clave] = [];
        partidos[clave].push({ rival:datos[3], local:datos[2], hora:datos[4], logoLocal:datos[5], logoRival:datos[6] });
    });

    marcarPartidos();
    activarClicks();
    revisarPartidosHoy();
    revisarPartidosAnteriores();
}

function marcarPartidos(){
    const meses = document.querySelectorAll(".mes");
    meses.forEach((mesDiv, index) => {
        const mesNumero = index + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            if(partidos[mesNumero + "-" + dia.dataset.dia]) dia.classList.add("partido");
        });
    });
}

function activarClicks(){
    const meses = document.querySelectorAll(".mes");
    meses.forEach((mesDiv, index) => {
        const mesNumero = index + 1;
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            dia.addEventListener("click", function(){
                const clave = mesNumero + "-" + this.dataset.dia;
                if(partidos[clave]) mostrarPopup(partidos[clave]);
            });
        });
    });
}

function mostrarPopup(listaPartidos){
    const popup = document.getElementById("popup");
    popup.style.display="flex";
    let contenido = "";
    listaPartidos.forEach(p => {
        contenido += `
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
    document.getElementById("popup-rival").innerHTML = contenido;
}

function cerrarPopup(){ document.getElementById("popup").style.display="none"; }

function revisarPartidosHoy(){
    const hoy = new Date();
    const clave = (hoy.getMonth() + 1) + "-" + hoy.getDate();
    const contenedor = document.getElementById("hoy");
    if(partidos[clave]){
        document.getElementById("estadoVacioHoy").style.display = "none";
        partidos[clave].forEach(p => {
            const aviso = document.createElement("div");
            aviso.classList.add("notificacion-card");
            aviso.innerHTML = `<div class=\"noti-icono\">⚽</div><div class=\"noti-texto\"><b>Partido hoy</b><br>A las ${p.hora}</div>`;
            contenedor.appendChild(aviso);
        });
    }
    actualizarNumeroCampana();
}

function revisarPartidosAnteriores(){
    const hoy = new Date();
    const mesAct = hoy.getMonth() + 1;
    const diaAct = hoy.getDate();
    const contenedor = document.getElementById("anteriores");
    let hayEventos = false;

    Object.keys(partidos).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        if(m < mesAct || (m === mesAct && d < diaAct)){
            partidos[clave].forEach(p => {
                const aviso = document.createElement("div");
                aviso.classList.add("notificacion-card");
                aviso.innerHTML = `<div class=\"noti-icono\">📅</div><div class=\"noti-texto\"><b>${p.local} vs ${p.rival}</b><br>${d}/${m}/26</div>`;
                contenedor.appendChild(aviso);
                hayEventos = true;
            });
        }
    });
    document.getElementById("estadoVacioAnteriores").style.display = hayEventos ? "none" : "flex";
    actualizarNumeroCampana();
}

function corregirInicioMeses(){
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const diasContainer = mesDiv.querySelector(".dias");
        diasContainer.querySelectorAll(".vacio").forEach(e => e.remove());
        const primerDia = new Date(2026, index, 1).getDay();
        let offset = primerDia - 1;
        if(offset < 0) offset = 6;
        for(let i = 0; i < offset; i++){
            const espacio = document.createElement("span");
            espacio.classList.add("vacio");
            diasContainer.prepend(espacio);
        }
    });
}

function actualizarNumeroCampana(){
    const total = document.querySelectorAll(".notificacion-card").length;
    const badge = document.getElementById("badgeNoti");
    if(badge){
        badge.textContent = total;
        badge.style.backgroundColor = (total === 0) ? "#00c800" : "red";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    corregirInicioMeses();
    cargarPartidos();
    const input = document.getElementById("inputUsuario");
    if(input) input.addEventListener("keypress", (e) => { if(e.key === "Enter") enviarMensaje(); });
});


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
