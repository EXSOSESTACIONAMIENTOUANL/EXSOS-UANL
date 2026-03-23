/* ========================================== */
/* 1. MOTOR DE SEÑALES (FIREBASE)             */
/* ========================================== */
const dbRef = firebase.database().ref('/estacionamiento/raw');
let partidos = {}; 

// Cache de elementos para que los botones respondan al instante
const dom = {
    cajones: Array.from({length: 5}, (_, i) => document.querySelector(`.cajon${i+1}`)),
    numLibres: document.querySelector(".numero-verde"),
    numOcupados: document.querySelector(".numero-rojo"),
    menu: document.getElementById("menuLateral"),
    overlay: document.getElementById("overlay"),
    input: document.getElementById("inputUsuario"),
    chat: document.getElementById("chatArea")
};

// Escuchar los sensores (El corazón de la fluidez)
dbRef.on('value', (snapshot) => {
    const raw = snapshot.val(); 
    if (!raw) return;

    let libres = 0, ocupados = 0;

    dom.cajones.forEach((cajon, i) => {
        if (!cajon) return;
        const estaLibre = raw[i] === "1"; // 1=Libre, 0=Ocupado

        if (estaLibre) {
            if (cajon.classList.contains("ocupado")) cajon.classList.replace("ocupado", "libre");
            libres++;
        } else {
            if (cajon.classList.contains("libre")) cajon.classList.replace("libre", "ocupado");
            ocupados++;
        }
    });

    requestAnimationFrame(() => {
        if(dom.numLibres) dom.numLibres.innerText = libres.toString().padStart(3, '0');
        if(dom.numOcupados) dom.numOcupados.innerText = ocupados.toString().padStart(3, '0');
    });
});

/* ========================================== */
/* 2. NAVEGACIÓN (MENÚ Y BOTONES)             */
/* ========================================== */
function abrirMenu() {
    dom.menu.classList.add("activo");
    dom.overlay.classList.add("activo");
}

function cerrarMenu() {
    dom.menu.classList.remove("activo");
    dom.overlay.classList.remove("activo");
}

function toggleNotificaciones() {
    document.getElementById("panelNotificaciones").classList.toggle("activo");
}

/* ========================================== */
/* 3. ASISTENTE DINO (AYUDA)                  */
/* ========================================== */
function abrirAyuda() {
    document.getElementById("overlayAyuda").classList.add("activo");
    document.querySelector(".chat-contenedor").classList.add("activo");
    // Mensaje de bienvenida directo para evitar que se trabe
    dom.chat.innerHTML = `<div class="mensaje bot"><img src="https://i.postimg.cc/WpxqwBv1/Feliz.png" class="avatar"><div class="burbuja">¡Hola! Soy Dino de EXSOS. ¿En qué te ayudo?</div></div>`;
}

function cerrarAyuda() {
    document.getElementById("overlayAyuda").classList.remove("activo");
}

function enviarMensaje() {
    const texto = dom.input.value.trim();
    if (!texto) return;
    dom.chat.innerHTML += `<div class="mensaje usuario"><div class="burbuja">${texto}</div></div>`;
    dom.input.value = "";
    dom.chat.scrollTop = dom.chat.scrollHeight;
}

/* ========================================== */
/* 4. CALENDARIO (CSV)                        */
/* ========================================== */
async function cargarPartidos() {
    try {
        const res = await fetch("partidos.csv");
        const texto = await res.text();
        texto.split("\n").slice(1).forEach(linea => {
            const d = linea.split(",");
            if (d.length < 4) return;
            const clave = `${d[0]}-${d[1]}`;
            if (!partidos[clave]) partidos[clave] = [];
            partidos[clave].push({ local: d[2], rival: d[3], hora: d[4] });
        });
        marcarPartidos();
    } catch (e) { console.error("Error cargando calendario"); }
}

function marcarPartidos() {
    document.querySelectorAll(".mes").forEach((mesDiv, i) => {
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            if (partidos[`${i + 1}-${dia.dataset.dia}`]) dia.classList.add("partido");
        });
    });
}

// Inicializar todo al cargar
document.addEventListener("DOMContentLoaded", () => {
    cargarPartidos();
    // Corregir días del calendario
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
});
