/* ======================================================== */
/* 2. MENÚ LATERAL Y NOTIFICACIONES                         */
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
    panel.classList.toggle("activo");
}

document.addEventListener("click", function(e){
    const panel = document.getElementById("panelNotificaciones");
    const container = document.querySelector(".notificaciones-container");
    if(container && !container.contains(e.target)){
        panel.classList.remove("activo");
    }
});

function toggleSeccion(id){
    const contenido = document.getElementById(id);
    const flecha = document.getElementById("flecha-" + id);
    contenido.classList.toggle("activo");
    flecha.classList.toggle("rotar");
}

/* ======================================================== */
/* 3. ASISTENTE VIRTUAL DINO (CHATBOT)                      */
/* ======================================================== */

function abrirAyuda(){
    const overlay = document.getElementById("overlayAyuda");
    const titulo = document.getElementById("tituloAyuda");
    const texto = document.getElementById("textoAyuda");
    const mensajeAyuda = document.getElementById("mensajeAyuda");
    const imagenCentral = document.getElementById("imagenCentral");
    const chatContenedor = document.querySelector(".chat-contenedor");
    const chat = document.getElementById("chatArea");

    overlay.classList.add("activo");
    titulo.innerHTML = ""; texto.innerHTML = ""; chat.innerHTML = "";
    chatContenedor.classList.remove("activo");

    imagenCentral.classList.remove("monito-desaparece");
    mensajeAyuda.classList.remove("monito-desaparece");

    escribirTexto("¡Hola!", titulo, 50, () => {
        escribirTexto("Soy tu asistente virtual EXSOS", texto, 30, () => {
            setTimeout(()=>{
                imagenCentral.classList.add("monito-desaparece");
                mensajeAyuda.classList.add("monito-desaparece");
                setTimeout(()=>{
                    imagenCentral.style.display="none";
                    mensajeAyuda.style.display="none";
                    chatContenedor.classList.add("activo");
                    chat.innerHTML += `
                    <div class="mensaje bot">
                        <img src="https://i.postimg.cc/WpxqwBv1/Feliz.png" class="avatar">
                        <div class="burbuja">¿En qué puedo ayudarte?</div>
                    </div>`;
                    chat.scrollTop = chat.scrollHeight;
                },500);
            },1500);
        });
    });
}

function cerrarAyuda(){
    const overlay = document.getElementById("overlayAyuda");
    overlay.classList.remove("activo");
}

function escribirTexto(textoCompleto, elemento, velocidad, callback){
    let i = 0;
    elemento.innerHTML = "";
    const intervalo = setInterval(()=>{
        elemento.innerHTML += textoCompleto.charAt(i);
        i++;
        if(i >= textoCompleto.length){
            clearInterval(intervalo);
            if(callback) callback();
        }
    }, velocidad);
}

function enviarMensaje(){
    const input = document.getElementById("inputUsuario");
    const chat = document.getElementById("chatArea");
    const textoUsuario = input.value.trim();
    if(textoUsuario === "") return;

    chat.innerHTML += `
    <div class="mensaje usuario">
        <div class="burbuja">${textoUsuario}</div>
        <img src="${obtenerAvatarUsuario(textoUsuario)}" class="avatar usuario-avatar">
    </div>`;
    input.value="";
    chat.scrollTop = chat.scrollHeight;

    const pensando = document.createElement("div");
    pensando.classList.add("mensaje","bot");
    pensando.innerHTML = `<img src="https://i.postimg.cc/WpxqwBv1/Feliz.png" class="avatar"><div class="burbuja pensando">Escribiendo...</div>`;
    chat.appendChild(pensando);

    setTimeout(()=>{
        pensando.remove();
        const respuesta = generarRespuesta(textoUsuario);
        const mensajeBot = document.createElement("div");
        mensajeBot.classList.add("mensaje","bot");
        mensajeBot.innerHTML = `<img src="${obtenerAvatarBot(textoUsuario)}" class="avatar"><div class="burbuja"></div>`;
        chat.appendChild(mensajeBot);
        escribirTexto(respuesta, mensajeBot.querySelector(".burbuja"), 20);
        chat.scrollTop = chat.scrollHeight;
    },1000);
}

// Aquí permanecen tus funciones de obtenerAvatarUsuario, obtenerAvatarBot y generarRespuesta tal cual las tienes...
function generarRespuesta(texto){
    texto = texto.toLowerCase();
    if(texto.includes("verde")) return "El color verde indica que el lugar está disponible.";
    if(texto.includes("rojo")) return "El color rojo indica que el cajón está ocupado.";
    if(texto.includes("tu nombre")) return "Mi nombre es Dino, asistente de EXSOS.";
    if(texto.includes("tiempo real")) return "Sí, el sistema se actualiza automáticamente con sensores.";
    return "Lo siento, aún estoy aprendiendo. Pregúntame sobre colores o disponibilidad.";
}

function obtenerAvatarBot(t){ return "https://i.postimg.cc/WpxqwBv1/Feliz.png"; }
function obtenerAvatarUsuario(t){ return "https://i.postimg.cc/3NzGy63L/Dina.png"; }

/* ======================================================== */
/* 4. CALENDARIO Y PARTIDOS (LECTURA CSV)                   */
/* ======================================================== */

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
               <div class="equipo">
    <img src="logos/${p.logoLocal}" alt="${p.local}">
    <span class="nombre-equipo">${p.local}</span>
</div>
<div class="vs">VS</div>
<div class="equipo">
    <span class="nombre-equipo">${p.rival}</span>
    <img src="logos/${p.logoRival}" alt="${p.rival}">
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
