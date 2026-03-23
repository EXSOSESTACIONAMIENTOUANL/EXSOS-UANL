/* ======================================================== */
/* 1. VARIABLES GLOBALES Y NAVEGACIÓN                       */
/* ======================================================== */
let partidos = {}; 

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

// Cerrar notificaciones al hacer clic fuera
document.addEventListener("click", function(e) {
    const panel = document.getElementById("panelNotificaciones");
    const container = document.querySelector(".notificaciones-container");
    if (panel && container && !container.contains(e.target)) {
        panel.classList.remove("activo");
    }
});

/* ======================================================== */
/* 2. CALENDARIO Y LECTURA DE PARTIDOS (CSV)                */
/* ======================================================== */

async function cargarPartidos() {
    try {
        const respuesta = await fetch("partidos.csv");
        const texto = await respuesta.text();
        const lineas = texto.split("\n");
        lineas.shift(); // Quitar encabezado

        lineas.forEach(linea => {
            const datos = linea.split(",");
            if (datos.length < 5) return;
            
            const mes = datos[0].trim();
            const dia = datos[1].trim();
            const clave = mes + "-" + dia;

            if (!partidos[clave]) {
                partidos[clave] = [];
            }

            partidos[clave].push({
                local: datos[2],
                rival: datos[3],
                hora: datos[4],
                logoLocal: datos[5],
                logoRival: datos[6]
            });
        });

        marcarPartidos();
        activarClicks();
        revisarPartidosHoy();
        revisarPartidosAnteriores();
    } catch (e) {
        console.error("Error cargando el archivo partidos.csv:", e);
    }
}

function marcarPartidos() {
    const meses = document.querySelectorAll(".mes");
    meses.forEach((mesDiv, index) => {
        const mesNumero = index + 1;
        const dias = mesDiv.querySelectorAll(".dias span");
        dias.forEach(dia => {
            const numero = dia.dataset.dia;
            if (partidos[mesNumero + "-" + numero]) {
                dia.classList.add("partido");
            }
        });
    });
}

function activarClicks() {
    const meses = document.querySelectorAll(".mes");
    meses.forEach((mesDiv, index) => {
        const mesNumero = index + 1;
        const dias = mesDiv.querySelectorAll(".dias span");
        dias.forEach(dia => {
            dia.addEventListener("click", function() {
                const numero = this.dataset.dia;
                const clave = mesNumero + "-" + numero;
                if (partidos[clave]) {
                    mostrarPopup(partidos[clave]);
                }
            });
        });
    });
}

/* ======================================================== */
/* 3. POPUPS Y NOTIFICACIONES                               */
/* ======================================================== */

function mostrarPopup(listaPartidos) {
    document.getElementById("popup").style.display = "flex";
    let contenido = "";
    listaPartidos.forEach(p => {
        contenido += `
        <div class="partido-card">
            <div class="partido-info">
                <div class="equipo">
                    <img src="logos/${p.logoLocal}" onerror="this.style.display='none'">
                    <span class="nombre-equipo">${p.local}</span>
                </div>
                <div class="vs">VS</div>
                <div class="equipo">
                    <span class="nombre-equipo">${p.rival}</span>
                    <img src="logos/${p.logoRival}" onerror="this.style.display='none'">
                </div>
                <div class="info-partido">
                    <div class="hora">🕒 ${p.hora}</div>
                </div>
            </div>
            <div class="barra-color"></div>
        </div>`;
    });
    document.getElementById("popup-rival").innerHTML = contenido;
}

function cerrarPopup() {
    document.getElementById("popup").style.display = "none";
}

function revisarPartidosHoy() {
    const hoy = new Date();
    const clave = (hoy.getMonth() + 1) + "-" + hoy.getDate();
    const contenedor = document.getElementById("hoy");
    const estadoVacio = document.getElementById("estadoVacioHoy");

    if (partidos[clave]) {
        estadoVacio.style.display = "none";
        partidos[clave].forEach(p => {
            const aviso = document.createElement("div");
            aviso.className = "notificacion-card";
            aviso.innerHTML = `<b>Partido hoy:</b> ${p.local} vs ${p.rival} a las ${p.hora}`;
            contenedor.appendChild(aviso);
        });
    }
    actualizarNumeroCampana();
}

function revisarPartidosAnteriores() {
    const hoy = new Date();
    const mAct = hoy.getMonth() + 1;
    const dAct = hoy.getDate();
    const contenedor = document.getElementById("anteriores");
    const estadoVacio = document.getElementById("estadoVacioAnteriores");
    let hayAnteriores = false;

    Object.keys(partidos).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        if (m < mAct || (m === mAct && d < dAct)) {
            partidos[clave].forEach(p => {
                const aviso = document.createElement("div");
                aviso.className = "notificacion-card";
                aviso.innerHTML = `📅 ${d}/${m}/26 - ${p.local} vs ${p.rival}`;
                contenedor.appendChild(aviso);
                hayAnteriores = true;
            });
        }
    });
    if(hayAnteriores) estadoVacio.style.display = "none";
    actualizarNumeroCampana();
}

function actualizarNumeroCampana() {
    const total = document.querySelectorAll(".notificacion-card").length;
    const badge = document.getElementById("badgeNoti");
    if (badge) {
        badge.textContent = total;
        badge.style.backgroundColor = (total === 0) ? "#00c800" : "red";
    }
}

/* ======================================================== */
/* 4. ASISTENTE AYUDA (DINO)                                 */
/* ======================================================== */

function abrirAyuda() {
    document.getElementById("overlayAyuda").classList.add("activo");
    // Mensaje estático para esta página
    document.getElementById("chatArea").innerHTML = "¡Hola! Estás en el Calendario. Aquí puedes ver los próximos partidos.";
}

function cerrarAyuda() {
    document.getElementById("overlayAyuda").classList.remove("activo");
}

/* ======================================================== */
/* 5. INICIALIZACIÓN                                        */
/* ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Alinear días de la semana
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const diasContainer = mesDiv.querySelector(".dias");
        diasContainer.querySelectorAll(".vacio").forEach(e => e.remove());
        const primerDia = new Date(2026, index, 1).getDay();
        let offset = (primerDia === 0) ? 6 : primerDia - 1;
        for (let i = 0; i < offset; i++) {
            const espacio = document.createElement("span");
            espacio.className = "vacio";
            diasContainer.prepend(espacio);
        }
    });
    cargarPartidos();
});
