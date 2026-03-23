/* ======================================================== */
/* 1. VARIABLES GLOBALES Y NAVEGACIÓN                       */
/* ======================================================== */
let partidosGlobal = {};

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
/* 2. MOTOR DEL CALENDARIO Y NOTIFICACIONES (CSV)           */
/* ======================================================== */

async function cargarPartidos() {
    try {
        const respuesta = await fetch("partidos.csv");
        const texto = await respuesta.text();
        const lineas = texto.split("\n").slice(1); // Quitar encabezado

        partidosGlobal = {}; // Limpiar datos

        lineas.forEach(linea => {
            const d = linea.split(",");
            if (d.length < 5) return;
            
            // d[0]=Mes, d[1]=Dia, d[2]=Local, d[3]=Rival, d[4]=Hora
            const clave = `${parseInt(d[0])}-${parseInt(d[1])}`;

            if (!partidosGlobal[clave]) partidosGlobal[clave] = [];
            
            partidosGlobal[clave].push({
                local: d[2].trim(),
                rival: d[3].trim(),
                hora: d[4].trim()
            });
        });

        // Ejecutar funciones visuales
        marcarDiasEnCalendario();
        llenarPanelNotificaciones();
        
    } catch (e) {
        console.error("Error: No se pudo cargar partidos.csv. Asegúrate de que el archivo existe.");
    }
}

function marcarDiasEnCalendario() {
    const meses = document.querySelectorAll(".mes");
    meses.forEach((mesDiv, index) => {
        const mesNumero = index + 1;
        const dias = mesDiv.querySelectorAll(".dias span");
        
        dias.forEach(dia => {
            const numDia = dia.dataset.dia;
            const clave = `${mesNumero}-${numDia}`;

            if (partidosGlobal[clave]) {
                dia.classList.add("partido"); // Esto activa el círculo amarillo de tu CSS
                dia.onclick = () => mostrarPopup(partidosGlobal[clave]);
            }
        });
    });
}

/* ======================================================== */
/* 3. LÓGICA DE LA CAMPANITA (NOTIFICACIONES)               */
/* ======================================================== */

function llenarPanelNotificaciones() {
    const hoy = new Date();
    const mesHoy = hoy.getMonth() + 1;
    const diaHoy = hoy.getDate();
    
    const contHoy = document.getElementById("hoy");
    const contAnt = document.getElementById("anteriores");
    if (!contHoy || !contAnt) return;

    contHoy.innerHTML = ""; 
    contAnt.innerHTML = "";

    let totalNotificaciones = 0;
    let hayHoy = false;
    let hayAnt = false;

    Object.keys(partidosGlobal).forEach(clave => {
        const [m, d] = clave.split("-").map(Number);
        
        partidosGlobal[clave].forEach(p => {
            const card = document.createElement("div");
            card.className = "notificacion-card";
            
            // Estructura visual exacta de tu diseño
            card.innerHTML = `
                <div class="noti-icono">⚽</div>
                <div class="noti-texto">
                    <div class="noti-titulo">Partido hoy</div>
                    <div class="noti-mensaje">
                        Hoy hay partido: ${p.local} vs ${p.rival} a las ${p.hora}.
                    </div>
                </div>`;

            if (m === mesHoy && d === diaHoy) {
                contHoy.appendChild(card);
                hayHoy = true;
                totalNotificaciones++;
            } else if (m < mesHoy || (m === mesHoy && d < diaHoy)) {
                // Personalización para partidos anteriores
                card.querySelector(".noti-icono").innerText = "📅";
                card.querySelector(".noti-titulo").innerText = `${p.local} vs ${p.rival}`;
                card.querySelector(".noti-mensaje").innerText = `Jugado el ${d}/${m}/26`;
                contAnt.appendChild(card);
                hayAnt = true;
                totalNotificaciones++;
            }
        });
    });

    // Mostrar/Ocultar estados vacíos
    document.getElementById("estadoVacioHoy").style.display = hayHoy ? "none" : "flex";
    document.getElementById("estadoVacioAnteriores").style.display = hayAnt ? "none" : "flex";
    
    // Actualizar Badge Rojo
    const badge = document.getElementById("badgeNoti");
    if (badge) {
        badge.textContent = totalNotificaciones;
        badge.style.backgroundColor = (totalNotificaciones === 0) ? "#00c800" : "red";
    }
}

/* ======================================================== */
/* 4. POPUP Y UTILIDADES                                    */
/* ======================================================== */

function mostrarPopup(lista) {
    const popup = document.getElementById("popup");
    const rivalArea = document.getElementById("popup-rival");
    if (!popup || !rivalArea) return;

    popup.style.display = "flex";
    let html = "";
    
    lista.forEach(p => {
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
    rivalArea.innerHTML = html;
}

function cerrarPopup() {
    document.getElementById("popup").style.display = "none";
}

/* ======================================================== */
/* 5. INICIALIZACIÓN AL CARGAR                              */
/* ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Corregir alineación de días (viejos espacios vacíos)
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

    // 2. Cargar datos
    cargarPartidos();
});
