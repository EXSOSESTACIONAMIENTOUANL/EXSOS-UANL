/* ========================= */
/* CONFIGURACIÓN Y SELECTORES CACHEADOS */
/* ========================= */
const dbRef = firebase.database().ref('/estacionamiento/raw');
let partidos = {};

// Cachear elementos del DOM para evitar buscarlos en cada actualización
const dom = {
    cajones: Array.from({ length: 5 }, (_, i) => document.querySelector(`.cajon${i + 1}`)),
    numLibres: document.querySelector(".numero-verde"),
    numOcupados: document.querySelector(".numero-rojo"),
    badge: document.getElementById("badgeNoti"),
    input: document.getElementById("inputUsuario"),
    chat: document.getElementById("chatArea")
};

/* ========================= */
/* MOTOR REAL-TIME ULTRA-RÁPIDO */
/* ========================= */
dbRef.on('value', (snapshot) => {
    const raw = snapshot.val(); // Recibe "10110"
    if (!raw) return;

    let libres = 0, ocupados = 0;

    // Actualización atómica de cajones
    dom.cajones.forEach((cajon, i) => {
        if (!cajon) return;
        const estaLibre = raw[i] === "1";
        
        // Solo aplicar cambios si el estado es diferente al actual (Evita lag visual)
        if (estaLibre) {
            if (cajon.classList.contains("ocupado")) cajon.classList.replace("ocupado", "libre");
            libres++;
        } else {
            if (cajon.classList.contains("libre")) cajon.classList.replace("libre", "ocupado");
            ocupados++;
        }
    });

    // Sincronizar con el refresco de pantalla del monitor (60fps)
    requestAnimationFrame(() => {
        if (dom.numLibres) dom.numLibres.innerText = libres.toString().padStart(3, '0');
        if (dom.numOcupados) dom.numOcupados.innerText = ocupados.toString().padStart(3, '0');
    });
});

/* ========================= */
/* INTERFAZ Y NAVEGACIÓN */
/* ========================= */
const abrirMenu = () => {
    document.getElementById("menuLateral").classList.add("activo");
    document.getElementById("overlay").classList.add("activo");
};

const cerrarMenu = () => {
    document.getElementById("menuLateral").classList.remove("activo");
    document.getElementById("overlay").classList.remove("activo");
};

const toggleNotificaciones = () => document.getElementById("panelNotificaciones").classList.toggle("activo");

document.addEventListener("click", (e) => {
    const container = document.querySelector(".notificaciones-container");
    if (container && !container.contains(e.target)) {
        document.getElementById("panelNotificaciones").classList.remove("activo");
    }
});

const toggleSeccion = (id) => {
    document.getElementById(id)?.classList.toggle("activo");
    document.getElementById(`flecha-${id}`)?.classList.toggle("rotar");
};

/* ========================= */
/* ASISTENTE VIRTUAL (DINO) */
/* ========================= */
function abrirAyuda() {
    const el = {
        overlay: document.getElementById("overlayAyuda"),
        titulo: document.getElementById("tituloAyuda"),
        texto: document.getElementById("textoAyuda"),
        msj: document.getElementById("mensajeAyuda"),
        img: document.getElementById("imagenCentral"),
        chatCont: document.querySelector(".chat-contenedor")
    };

    el.overlay.classList.add("activo");
    el.titulo.innerHTML = el.texto.innerHTML = dom.chat.innerHTML = "";
    el.chatCont.classList.remove("activo");
    el.img.classList.remove("monito-desaparece");
    el.msj.classList.remove("monito-desaparece");
    el.img.style.display = el.msj.style.display = "block";

    escribirTexto("¡Hola!", el.titulo, 30, () => {
        escribirTexto("Soy tu asistente virtual EXSOS", el.texto, 20, () => {
            setTimeout(() => {
                el.img.classList.add("monito-desaparece");
                el.msj.classList.add("monito-desaparece");
                setTimeout(() => {
                    el.img.style.display = el.msj.style.display = "none";
                    el.chatCont.classList.add("activo");
                    dom.chat.innerHTML = `<div class="mensaje bot"><img src="https://i.postimg.cc/WpxqwBv1/Feliz.png" class="avatar"><div class="burbuja">¿En qué puedo ayudarte?</div></div>`;
                }, 400);
            }, 1000);
        });
    });
}

function escribirTexto(texto, elemento, velocidad, callback) {
    let i = 0;
    elemento.innerHTML = "";
    const intervalo = setInterval(() => {
        elemento.innerHTML += texto.charAt(i++);
        if (i >= texto.length) {
            clearInterval(intervalo);
            if (callback) callback();
        }
    }, velocidad);
}

function enviarMensaje() {
    const texto = dom.input.value.trim();
    if (!texto) return;

    dom.chat.innerHTML += `<div class="mensaje usuario"><div class="burbuja">${texto}</div><img src="${obtenerAvatarUsuario(texto)}" class="avatar usuario-avatar"></div>`;
    dom.input.value = "";
    dom.chat.scrollTop = dom.chat.scrollHeight;

    setTimeout(() => {
        const msgBot = document.createElement("div");
        msgBot.className = "mensaje bot";
        msgBot.innerHTML = `<img src="${obtenerAvatarBot(texto)}" class="avatar"><div class="burbuja"></div>`;
        dom.chat.appendChild(msgBot);
        escribirTexto(generarRespuesta(texto), msgBot.querySelector(".burbuja"), 15);
        dom.chat.scrollTop = dom.chat.scrollHeight;
    }, 600);
}

/* ========================= */
/* LÓGICA DE CALENDARIO */
/* ========================= */
async function cargarPartidos() {
    try {
        const res = await fetch("partidos.csv");
        const data = await res.text();
        data.split("\n").slice(1).forEach(linea => {
            const [m, d, loc, riv, h, lL, lR] = linea.split(",");
            if (!m) return;
            const clave = `${m}-${d}`;
            if (!partidos[clave]) partidos[clave] = [];
            partidos[clave].push({ rival: riv, local: loc, hora: h, logoLocal: lL, logoRival: lR });
        });
        marcarPartidos();
        revisarEventos();
    } catch (e) { console.error("Error CSV"); }
}

function marcarPartidos() {
    document.querySelectorAll(".mes").forEach((mesDiv, i) => {
        mesDiv.querySelectorAll(".dias span").forEach(dia => {
            const clave = `${i + 1}-${dia.dataset.dia}`;
            if (partidos[clave]) {
                dia.classList.add("partido");
                dia.onclick = () => mostrarPopup(partidos[clave]);
            }
        });
    });
}

function revisarEventos() {
    const hoy = new Date(), mHoy = hoy.getMonth() + 1, dHoy = hoy.getDate();
    const cHoy = document.getElementById("hoy"), cAnt = document.getElementById("anteriores");
    
    if (partidos[`${mHoy}-${dHoy}`]) {
        document.getElementById("estadoVacioHoy").style.display = "none";
        partidos[`${mHoy}-${dHoy}`].forEach(p => {
            cHoy.innerHTML += `<div class="notificacion-card"><div class="noti-icono">⚽</div><div class="noti-texto"><div class="noti-titulo">Partido hoy</div><div class="noti-mensaje">Inicia a las ${p.hora}</div></div></div>`;
        });
    }
    actualizarCampana();
}

function actualizarCampana() {
    const total = document.querySelectorAll(".notificacion-card").length;
    if (dom.badge) {
        dom.badge.textContent = total;
        dom.badge.style.backgroundColor = total === 0 ? "#00c800" : "red";
    }
}

/* ========================= */
/* INICIALIZACIÓN */
/* ========================= */
document.addEventListener("DOMContentLoaded", () => {
    corregirInicioMeses();
    cargarPartidos();
    dom.input?.addEventListener("keypress", (e) => e.key === "Enter" && enviarMensaje());
});

function corregirInicioMeses() {
    document.querySelectorAll(".mes").forEach((mesDiv, index) => {
        const container = mesDiv.querySelector(".dias");
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
