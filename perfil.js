import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// 🔥 Cambiamos setDoc por updateDoc para no borrar los demás datos del usuario
import { getFirestore, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDr2FUS2IBW90alkYnAUUXvMNy2RQPjx6E",
  authDomain: "ptueba-1-78027.firebaseapp.com",
  projectId: "ptueba-1-78027",
  storageBucket: "ptueba-1-78027.firebasestorage.app",
  messagingSenderId: "463811943830",
  appId: "1:463811943830:web:f529bdf1eea53445b0d1b7",
  measurementId: "G-W5TBQT1DLK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let datosOriginales = {};
let bannerTemporal = null;
let fotoTemporal = null;
let bannerTempFinal = null;
let offsetX = 0;  
let offsetY = 0;
let scale = 1;
const FOTO_DEFAULT = "perfil/perfil2.png";
const CORREO_DEFAULT = "correo@email.com";

window.addEventListener("DOMContentLoaded", () => {
    configurarEventos(); 
});

onAuthStateChanged(auth, (user) => {
    if(user){
        cargarPerfil(); 
        if(typeof window.conectarBotonUsuario === "function"){
            window.conectarBotonUsuario(user.uid);
        }
    } else {
        window.location.href = "index.html";
    }
});

// ================= CARGAR DATOS =================
async function cargarPerfil(){
    const user = auth.currentUser;
    if(!user) return;
    const uid = user.uid;

    try {
        const docRef = doc(db, "usuarios", uid);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){
            const data = docSnap.data();

            const fotoFinal = data.foto || FOTO_DEFAULT;
            const correoFinal = data.correo || user.email || CORREO_DEFAULT;

            // MENÚ PRINCIPAL
            document.getElementById("fotoPerfil").src = fotoFinal;
            document.getElementById("nombreUsuario").textContent = data.nombre || "Usuario";
            document.getElementById("correoUsuario").textContent = correoFinal;

            // MODAL (PREVIEW)
            document.getElementById("previewFoto").src = fotoFinal;
            document.getElementById("previewAvatar").src = fotoFinal;
            document.getElementById("previewNombre").textContent = data.nombre || "Usuario";
            document.getElementById("previewUser").textContent = correoFinal;

            if(document.getElementById("previewModelo")) document.getElementById("previewModelo").textContent = data.modeloAuto || "Sin registrar";
            if(document.getElementById("previewColor")) document.getElementById("previewColor").textContent = data.colorAuto || "Sin registrar";
            if(document.getElementById("previewAnio")) document.getElementById("previewAnio").textContent = data.anioAuto || "Sin registrar";
            if(document.getElementById("previewPlacas")) document.getElementById("previewPlacas").textContent = data.placas || "Sin registrar";

            // Llenar inputs bloqueados
            document.getElementById("nuevoNombre").value = data.nombre || "";
            document.getElementById("correoPerfil").value = correoFinal;
            document.getElementById("matriculaPerfil").value = data.matricula || "";
            document.getElementById("placasPerfil").value = data.placas || "";
            if(document.getElementById("modeloPerfil")) document.getElementById("modeloPerfil").value = data.modeloAuto || "";
            if(document.getElementById("colorPerfil")) document.getElementById("colorPerfil").value = data.colorAuto || "";
            if(document.getElementById("anioPerfil")) document.getElementById("anioPerfil").value = data.anioAuto || "";

            // 🔥 CARGAR LA INE EN LA SECCIÓN DE LICENCIA 🔥
            if(data.ineUrl) {
                document.getElementById("previewLicencia").src = data.ineUrl;
            } else if(data.licencia) {
                document.getElementById("previewLicencia").src = data.licencia;
            }
            
            // Cargar banner
            if(data.banner) actualizarBanner(data.banner);

            // Guardamos solo las fotos originales para ver si hay cambios
            datosOriginales = {
                foto: fotoFinal,
                banner: data.banner || ""
            };

        }
    } catch(error){
        console.error(error);
    }
}

// ================= EVENTOS =================
function configurarEventos(){
    const preview = document.getElementById("previewFoto");
    const input = document.getElementById("inputFoto");
    const colorPicker = document.getElementById("colorBannerPicker");
    const inputBanner = document.getElementById("inputBannerPanel");
    const btnColor = document.getElementById("btnColor");
    const inputColor = document.getElementById("colorBannerPicker");
    const btnCerrar = document.getElementById("btnCerrarSesion");
    const btnEditar = document.getElementById("btnEditarPerfil");
    const btnMenu = document.querySelector(".menu-btn");
    const overlay = document.getElementById("overlay");
    const btnCerrarAvatares = document.querySelector("#panelAvatares .cerrar-panel");
    const btnNoti = document.getElementById("btnNotificaciones");
    const panelNoti = document.getElementById("panelNotificaciones");
    const overlayAyuda = document.getElementById("overlayAyuda");

    if(overlayAyuda) overlayAyuda.addEventListener("click", (e)=> e.stopPropagation());
    if(btnNoti && panelNoti) btnNoti.addEventListener("click", (e)=>{ e.stopPropagation(); panelNoti.classList.toggle("activo"); });

    document.querySelectorAll(".cabecera-noti").forEach(cabecera=>{
        cabecera.addEventListener("click", ()=>{
            const seccion = cabecera.dataset.seccion;
            const contenido = document.getElementById(seccion);
            const flecha = document.getElementById("flecha-" + seccion);
            contenido.classList.toggle("activo");
            if(flecha) flecha.style.transform = contenido.classList.contains("activo") ? "rotate(180deg)" : "rotate(0deg)";
        });
    });

    const btnAbrirAyuda = document.getElementById("btnAbrirAyuda");
    if(btnAbrirAyuda) btnAbrirAyuda.addEventListener("click", (e)=>{ e.preventDefault(); abrirAyuda(); });
    const btnCerrarAyuda = document.querySelector(".btn-cerrar");
    if(btnCerrarAyuda) btnCerrarAyuda.addEventListener("click", cerrarAyuda);
    if(btnCerrarAvatares) btnCerrarAvatares.addEventListener("click", cerrarPanelAvatares);
    if(overlay) overlay.addEventListener("click", cerrarMenu);
    if(btnMenu) btnMenu.addEventListener("click", abrirMenu);
    const btnSalir = document.querySelector(".btn-salir");
    if(btnSalir) btnSalir.addEventListener("click", cerrarPerfil);
    
    const btnCancelarBanner = document.querySelector("#editorBanner button:first-child");
    if(btnCancelarBanner) btnCancelarBanner.addEventListener("click", cancelarBanner);
    const btnAplicarBanner = document.querySelector("#editorBanner button:last-child");
    if(btnAplicarBanner) btnAplicarBanner.addEventListener("click", aplicarBanner);
    
    const btnCerrarPerfil = document.getElementById("btnCerrarPerfil");
    if(btnCerrarPerfil) btnCerrarPerfil.addEventListener("click", cerrarPerfil);
    const btnGuardar = document.getElementById("btnGuardarPerfil");
    if(btnGuardar) btnGuardar.addEventListener("click", guardarPerfil);
    const btnEditarBanner = document.getElementById("btnEditarBanner");
    if(btnEditarBanner) btnEditarBanner.addEventListener("click", abrirPanelBanners);
    
    const btnCancelar = document.getElementById("btnCancelarCerrarSesion");
    if(btnCancelar) btnCancelar.addEventListener("click", cancelarCerrarSesion);
    const btnConfirmar = document.getElementById("btnConfirmarCerrarSesion");
    if(btnConfirmar) btnConfirmar.addEventListener("click", confirmarCerrarSesion);
    
    if(btnEditar) btnEditar.addEventListener("click", abrirPerfil);
    if(btnCerrar) btnCerrar.addEventListener("click", ()=>{ abrirModalCerrarSesion(); });

    if(btnColor && inputColor){
        btnColor.addEventListener("click", () => {
            inputColor.style.position = "fixed";
            inputColor.style.left = "50%";
            inputColor.style.top = "50%";
            inputColor.style.transform = "translate(-50%, -50%)";
            inputColor.click();
            setTimeout(()=>{
                inputColor.style.position = "";
                inputColor.style.left = "";
                inputColor.style.top = "";
                inputColor.style.transform = "";
            }, 100);
        });
    }

    if(colorPicker){
        colorPicker.addEventListener("input", (e)=>{
            const color = e.target.value;
            actualizarBanner(color);
            const pickerBox = document.querySelector(".banner-color-picker");
            if(pickerBox) pickerBox.style.background = color;
        });
    }

    if(preview && input){
        preview.addEventListener("click", () => {abrirPanelAvatares(); });
        input.addEventListener("change", (e)=>{
            const archivo = e.target.files[0];
            if(archivo){
                const reader = new FileReader();
                reader.onload = function(e){
                    const imagen = e.target.result;
                    actualizarFoto(imagen);
                }
                reader.readAsDataURL(archivo);
            }
        });
    }

    document.addEventListener("keydown", (e)=>{
        if(e.key === "Escape"){
            const editor = document.getElementById("editorBanner");
            if(editor && editor.classList.contains("activo")){
                cerrarEditorBanner();
                return;
            }
            cerrarPerfil();
        }
    });

    const modal = document.getElementById("modalPerfil");
    if(modal){
        modal.addEventListener("click", (e)=>{
            if(e.target.id === "modalPerfil"){
                cerrarPerfil();
            }
        });
    }

    document.querySelectorAll(".banner-opcion").forEach(div=>{
        div.addEventListener("click", ()=>{
            actualizarBanner(div.style.backgroundColor, false);
            cerrarPanelBanners();
        });
    });

    document.querySelectorAll(".banner-opcion-img").forEach(img=>{
        img.addEventListener("click", ()=>{
            actualizarBanner(img.src, true);
            cerrarPanelBanners();
        });
    });

    if(inputBanner){
        inputBanner.addEventListener("change", (e)=>{
            const archivo = e.target.files[0];
            if(archivo){
                const reader = new FileReader();
                reader.onload = function(e){
                    bannerTemporal = e.target.result;
                    abrirEditorBanner(bannerTemporal);
                    inputBanner.value = ""; 
                }
                reader.readAsDataURL(archivo);
            }
        });
    }
}

function actualizarFoto(imagen){
    const preview = document.getElementById("previewFoto");
    if(preview) preview.src = imagen;
    const avatar = document.getElementById("previewAvatar");
    if(avatar) avatar.src = imagen;
    const fotoMenu = document.getElementById("fotoPerfil");
    if(fotoMenu) fotoMenu.src = imagen;
    fotoTemporal = imagen;
}

function abrirPerfil(){
    document.body.style.overflow = "hidden";
    document.getElementById("modalPerfil").classList.add("activo");
}

function cerrarPerfil(){
    if(hayCambios()){
        abrirModalConfirmacion();
        return;
    }
    document.getElementById("modalPerfil").classList.remove("activo");
    document.body.style.overflow = "";
    cargarPerfil();
    fotoTemporal = null;
    bannerTempFinal = null;
}

// ================= GUARDAR (SOLO FOTO Y BANNER) =================
async function guardarPerfil() {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;

    const datosAActualizar = {
        foto: fotoTemporal || document.getElementById("previewFoto").src,
        banner: bannerTempFinal || datosOriginales.banner || ""
    };

    try {
        // 🔥 Usamos updateDoc para NO borrar ni modificar estado, placas o datos clave
        await updateDoc(doc(db, "usuarios", uid), datosAActualizar);

        datosOriginales.foto = datosAActualizar.foto;
        datosOriginales.banner = datosAActualizar.banner;
        
        fotoTemporal = null;
        bannerTempFinal = null;

        mostrarMensaje("✔ Fotos de perfil actualizadas", "#00c853");
    } catch (error) {
        console.error(error);
        mostrarMensaje("Error al guardar", "red");
    }
}

function mostrarMensaje(texto, color){
    const mensaje = document.getElementById("mensajePerfil");
    if(!mensaje) return;
    mensaje.textContent = texto;
    mensaje.style.color = color;
    mensaje.classList.remove("activo");
    void mensaje.offsetWidth; 
    mensaje.classList.add("activo");
    setTimeout(()=>{ mensaje.classList.remove("activo"); }, 2000);
}

function abrirPanelAvatares(){ document.getElementById("panelAvatares").classList.add("activo"); }
function cerrarPanelAvatares(){ document.getElementById("panelAvatares").classList.remove("activo"); }

document.querySelectorAll(".avatar-opcion").forEach(img => {
    img.addEventListener("click", () => {
        const ruta = img.src;
        actualizarFoto(ruta); 
        cerrarPanelAvatares();
    });
});

const inputAvatar = document.getElementById("inputAvatarPanel");
if(inputAvatar){
    inputAvatar.addEventListener("change", (e)=>{
        const archivo = e.target.files[0];
        if(archivo){
            const reader = new FileReader();
            reader.onload = function(e){
                const imagen = e.target.result;
                actualizarFoto(imagen);
                cerrarPanelAvatares();
            }
            reader.readAsDataURL(archivo);
        }
    });
}

function abrirPanelBanners(){ document.getElementById("panelBanners").classList.add("activo"); }
function cerrarPanelBanners(){ document.getElementById("panelBanners").classList.remove("activo"); }

function actualizarBanner(valor) {
    const previewBanner = document.getElementById("previewBanner");
    const menuBanner = document.getElementById("bannerMenu");
    [previewBanner, menuBanner].forEach(banner => {
        if (!banner) return;
        if (valor.startsWith("#")) {
            banner.style.background = valor;
            banner.style.backgroundImage = "none";
        } else {
            banner.style.background = "transparent";
            banner.style.backgroundImage = `url("${valor}")`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
            banner.style.backgroundRepeat = "no-repeat";
        }
    });
    bannerTempFinal = valor;
}

function abrirEditorBanner(imagen){
    const editor = document.getElementById("editorBanner");
    const preview = document.getElementById("imagenBannerMovible");
    const slider = document.getElementById("zoomSlider");
    editor.classList.add("activo");
    document.body.style.overflow = "hidden";
    preview.style.backgroundImage = `url(${imagen})`;
    offsetX = 0; offsetY = 0; scale = 1;
    preview.style.backgroundPosition = `center`;
    preview.style.backgroundSize = `${scale * 100}%`;
    if(slider){
        slider.value = 1;
        actualizarBarraZoom(slider); 
    }
    activarMovimientoBanner();
}

function cancelarBanner(){
    bannerTemporal = null;
    cerrarEditorBanner();
}

function aplicarBanner() {
    if (!bannerTemporal) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = function() {
        canvas.width = 800; canvas.height = 300;
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let sx, sy, sWidth, sHeight;
        if (imgRatio > canvasRatio) {
            sHeight = img.height; sWidth = sHeight * canvasRatio;
            sx = (img.width - sWidth) / 2; sy = 0;
        } else {
            sWidth = img.width; sHeight = sWidth / canvasRatio;
            sx = 0; sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        const resultado = canvas.toDataURL("image/png");
        actualizarBanner(resultado);
        cerrarEditorBanner();
        cerrarPanelBanners();
        bannerTemporal = null;
    }
    img.src = bannerTemporal;
}

function cerrarEditorBanner(){ document.getElementById("editorBanner").classList.remove("activo"); }

function activarMovimientoBanner(){
    let isDragging = false;
    let img = document.getElementById("imagenBannerMovible");
    if(!img) return;
    const nuevo = img.cloneNode(true);
    img.replaceWith(nuevo);
    img = nuevo;
    img.addEventListener("mousedown", ()=>{ isDragging = true; img.style.cursor = "grabbing"; });
    document.addEventListener("mouseup", ()=>{ isDragging = false; img.style.cursor = "grab"; });
    document.addEventListener("mousemove", (e)=>{
        if(!isDragging) return;
        offsetX += e.movementX; offsetY += e.movementY;
        img.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    });

    const slider = document.getElementById("zoomSlider");
    if(slider){
        slider.value = scale;
        slider.addEventListener("input", (e)=>{
            scale = parseFloat(e.target.value);
            img.style.backgroundSize = `${scale * 100}%`;
            actualizarBarraZoom(slider); 
        });
    }

    let lastTouchX = 0; let lastTouchY = 0;
    img.addEventListener("touchstart", (e)=>{
        isDragging = true;
        const touch = e.touches[0];
        lastTouchX = touch.clientX; lastTouchY = touch.clientY;
    });
    img.addEventListener("touchmove", (e)=>{
        if(!isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchX; const deltaY = touch.clientY - lastTouchY;
        offsetX += deltaX; offsetY += deltaY;
        img.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        lastTouchX = touch.clientX; lastTouchY = touch.clientY;
    });
    img.addEventListener("touchend", ()=>{ isDragging = false; });
    img.addEventListener("touchmove", (e)=>{ e.preventDefault(); }, { passive: false });
}

function cerrarTodoBanner(){
    cerrarEditorBanner(); cerrarPanelBanners();
    bannerTemporal = null; offsetX = 0; offsetY = 0; scale = 1;
}

function actualizarBarraZoom(slider){
    const porcentaje = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #5865f2 0%, #5865f2 ${porcentaje}%, #3a3c41 ${porcentaje}%, #3a3c41 100%)`;
}

function intentarCerrarPerfil(){
    if(hayCambios()) abrirModalConfirmacion();
    else cerrarPerfil();
}

function abrirModalConfirmacion(){ document.getElementById("modalConfirmar").classList.add("activo"); }
function cerrarModalConfirmacion(){ document.getElementById("modalConfirmar").classList.remove("activo"); }
function cancelarSalida(){ cerrarModalConfirmacion(); }
function confirmarSalida(){
    cerrarModalConfirmacion(); 
    document.getElementById("modalPerfil").classList.remove("activo"); 
    document.body.style.overflow = "";
    cargarPerfil(); 
    fotoTemporal = null; bannerTempFinal = null;
}

function hayCambios(){
    const fotoActual = fotoTemporal || document.getElementById("previewFoto").src || "";
    let bannerActual = bannerTempFinal;

    if (!bannerActual) {
        const estilo = document.getElementById("previewBanner").style.backgroundImage;
        if (estilo && estilo !== "none") {
            bannerActual = estilo.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
        } else { bannerActual = ""; }
    }

    return (fotoActual !== datosOriginales.foto || bannerActual !== datosOriginales.banner);
}

function abrirModalCerrarSesion(){ document.getElementById("modalCerrarSesion").classList.add("activo"); }
function cancelarCerrarSesion(){ document.getElementById("modalCerrarSesion").classList.remove("activo"); }
function confirmarCerrarSesion(){ signOut(auth).then(() => { window.location.href = "index.html"; }); }

// Funciones del Chatbot de Dino...
function abrirAyuda(){
    document.body.classList.add("no-scroll");
    const overlay = document.getElementById("overlayAyuda");
    const titulo = document.getElementById("tituloAyuda");
    const texto = document.getElementById("textoAyuda");
    const mensajeAyuda = document.getElementById("mensajeAyuda");
    const imagenCentral = document.getElementById("imagenCentral");
    const chatContenedor = document.querySelector(".chat-contenedor");
    const chat = document.getElementById("chatArea");

    if(overlay.classList.contains("activo")) return;
    overlay.classList.add("activo");
    if(!overlay || !titulo || !texto || !mensajeAyuda || !imagenCentral || !chatContenedor || !chat) return;

    titulo.innerHTML = ""; texto.innerHTML = ""; chat.innerHTML = "";
    chatContenedor.classList.remove("activo");
    imagenCentral.classList.remove("monito-desaparece");
    mensajeAyuda.classList.remove("monito-desaparece");
    imagenCentral.style.display = "block"; mensajeAyuda.style.display = "block";

    escribirTexto("¡Hola!", titulo, 50, () => {
        escribirTexto("Soy tu asistente virtual EXSOS", texto, 30, () => {
            setTimeout(()=>{
                imagenCentral.classList.add("monito-desaparece");
                mensajeAyuda.classList.add("monito-desaparece");
                setTimeout(()=>{
                    imagenCentral.style.display="none"; mensajeAyuda.style.display="none";
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
    document.getElementById("overlayAyuda").classList.remove("activo");
    document.body.classList.remove("no-scroll");
    const chat = document.querySelector(".chat-contenedor");
    if(chat) chat.classList.remove("activo");
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

// Variables Globales
window.abrirPerfil = abrirPerfil;
window.cerrarPerfil = cerrarPerfil;
window.guardarPerfil = guardarPerfil;
window.abrirPanelBanners = abrirPanelBanners;
window.cerrarPanelBanners = cerrarPanelBanners;
window.cancelarBanner = cancelarBanner;
window.aplicarBanner = aplicarBanner;
window.cerrarTodoBanner = cerrarTodoBanner;
window.cancelarSalida = cancelarSalida;
window.confirmarSalida = confirmarSalida;
window.cancelarCerrarSesion = cancelarCerrarSesion;
window.confirmarCerrarSesion = confirmarCerrarSesion;
