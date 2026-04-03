import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8LeQ1UNG6XqOpVWAMyde05JOvlWRENvU",
  authDomain: "exsos-login.firebaseapp.com",
  projectId: "exsos-login",
  appId: "1:254157261321:web:449f88c3567303afa846d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let datosOriginales = {};
let bannerTemporal = null;
let fotoTemporal = null;
let bannerTempFinal = null;
let licenciaTemporal = null;
let offsetX = 0;  
let offsetY = 0;
let scale = 1;
const FOTO_DEFAULT = "perfil/perfil2.png";
const CORREO_DEFAULT = "correo@email.com";

window.addEventListener("DOMContentLoaded", () => {
    configurarEventos(); // 🔥 esto sí se queda
});

onAuthStateChanged(auth, (user) => {
    if(user){
        cargarPerfil(); 
        
        // Conectar el botón de la pluma al usuario actual
        if(typeof window.conectarBotonUsuario === "function"){
            window.conectarBotonUsuario(user.uid);
        }
    } else {
        // 🔥 SI NO HAY SESIÓN, LO REGRESAMOS AL LOGIN
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

// MENÚ
document.getElementById("fotoPerfil").src = fotoFinal;
document.getElementById("nombreUsuario").textContent = data.nombre || "Usuario";
document.getElementById("correoUsuario").textContent = correoFinal;

// MODAL
document.getElementById("previewFoto").src = fotoFinal;
document.getElementById("previewAvatar").src = fotoFinal;

document.getElementById("previewNombre").textContent = data.nombre || "Usuario";
document.getElementById("previewUser").textContent = correoFinal;

            // INPUTS
            document.getElementById("nuevoNombre").value = data.nombre || "";
            document.getElementById("correoPerfil").value = correoFinal;
            document.getElementById("matriculaPerfil").value = data.matricula || "";
            document.getElementById("placasPerfil").value = data.placas || "";

            // licencia
            if(data.licencia){
                document.getElementById("previewLicencia").src = data.licencia;
            }

            // banner
            if(data.banner){
                actualizarBanner(data.banner);
            }

        }

        else{
    await setDoc(doc(db, "usuarios", uid), {
        nombre: "Usuario",
        correo: user.email || "",
        matricula: "",
        placas: "",
        foto: FOTO_DEFAULT,
        banner: "",
        licencia: ""
    });

    await cargarPerfil();
}

    } catch(error){
        console.error(error);
    }
}

// ================= EVENTOS =================
function configurarEventos(){

    const preview = document.getElementById("previewFoto");
    const input = document.getElementById("inputFoto");
    const inputCorreo = document.getElementById("correoPerfil");
    const inputLicencia = document.getElementById("inputLicencia");
    const colorPicker = document.getElementById("colorBannerPicker");
    const inputBanner = document.getElementById("inputBannerPanel");
    const btnColor = document.getElementById("btnColor");
    const inputColor = document.getElementById("colorBannerPicker");
    const btnCerrar = document.getElementById("btnCerrarSesion");
    const fotoMenu = document.getElementById("fotoPerfil");
    const btnEditar = document.getElementById("btnEditarPerfil");
    const btnMenu = document.querySelector(".menu-btn");
    const overlay = document.getElementById("overlay");
    const btnCerrarAvatares = document.querySelector("#panelAvatares .cerrar-panel");
    const btnNoti = document.getElementById("btnNotificaciones");
    const panelNoti = document.getElementById("panelNotificaciones");
    const overlayAyuda = document.getElementById("overlayAyuda");

if(overlayAyuda){
    overlayAyuda.addEventListener("click", (e)=>{
        e.stopPropagation();
    });
}

if(btnNoti && panelNoti){
    btnNoti.addEventListener("click", (e)=>{
        e.stopPropagation();
        panelNoti.classList.toggle("activo");
    });
}

document.querySelectorAll(".cabecera-noti").forEach(cabecera=>{
    cabecera.addEventListener("click", ()=>{

        const seccion = cabecera.dataset.seccion;
        const contenido = document.getElementById(seccion);
        const flecha = document.getElementById("flecha-" + seccion);

        contenido.classList.toggle("activo");

        if(flecha){
            flecha.style.transform = contenido.classList.contains("activo")
                ? "rotate(180deg)"
                : "rotate(0deg)";
        }
    });
});


    // 🔹 ABRIR AYUDA
const btnAbrirAyuda = document.getElementById("btnAbrirAyuda");


if(btnAbrirAyuda){
    btnAbrirAyuda.addEventListener("click", (e)=>{
        e.preventDefault();
        abrirAyuda();
    });
}

// 🔹 CERRAR AYUDA
const btnCerrarAyuda = document.querySelector(".btn-cerrar");

if(btnCerrarAyuda){
    btnCerrarAyuda.addEventListener("click", cerrarAyuda);
}

// 🔹 ENVIAR MENSAJE
const btnEnviar = document.querySelector(".boton-enviar");

if(btnEnviar){
    btnEnviar.addEventListener("click", enviarMensaje);
}

if(btnCerrarAvatares){
    btnCerrarAvatares.addEventListener("click", cerrarPanelAvatares);
}

if(overlay){
    overlay.addEventListener("click", cerrarMenu);
}

if(btnMenu){
    btnMenu.addEventListener("click", abrirMenu);
}


// 🔹 BOTÓN CERRAR (X)
const btnSalir = document.querySelector(".btn-salir");
if(btnSalir){
    btnSalir.addEventListener("click", cerrarPerfil);
}


// 🔹 CANCELAR BANNER
const btnCancelarBanner = document.querySelector("#editorBanner button:first-child");
if(btnCancelarBanner){
    btnCancelarBanner.addEventListener("click", cancelarBanner);
}

// 🔹 APLICAR BANNER
const btnAplicarBanner = document.querySelector("#editorBanner button:last-child");
if(btnAplicarBanner){
    btnAplicarBanner.addEventListener("click", aplicarBanner);
}

    
// 🔹 cerrar perfil
const btnCerrarPerfil = document.getElementById("btnCerrarPerfil");
if(btnCerrarPerfil){
    btnCerrarPerfil.addEventListener("click", cerrarPerfil);
}

// 🔹 guardar
const btnGuardar = document.getElementById("btnGuardarPerfil");

if(btnGuardar){
    btnGuardar.addEventListener("click", guardarPerfil);
}

// 🔹 banner
const btnEditarBanner = document.getElementById("btnEditarBanner");
if(btnEditarBanner){
    btnEditarBanner.addEventListener("click", abrirPanelBanners);
}

// 🔹 cerrar sesión modal
const btnCancelar = document.getElementById("btnCancelarCerrarSesion");
if(btnCancelar){
    btnCancelar.addEventListener("click", cancelarCerrarSesion);
}

const btnConfirmar = document.getElementById("btnConfirmarCerrarSesion");
if(btnConfirmar){
    btnConfirmar.addEventListener("click", confirmarCerrarSesion);
}










if(btnEditar){
    btnEditar.addEventListener("click", abrirPerfil);
}

if(btnCerrar){
    btnCerrar.addEventListener("click", ()=>{
        abrirModalCerrarSesion();
    });
}

if(btnColor && inputColor){

    btnColor.addEventListener("click", () => {

    inputColor.style.position = "fixed";
    inputColor.style.left = "50%";
    inputColor.style.top = "50%";
    inputColor.style.transform = "translate(-50%, -50%)";

    inputColor.click();


        // limpiar después
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
        if(pickerBox){
            pickerBox.style.background = color;
        }
    });
}







if(inputLicencia){
    inputLicencia.addEventListener("change", e=>{
        const archivo = e.target.files[0];

        if(archivo){
            const reader = new FileReader();

            reader.onload = function(ev){
                const imagen = ev.target.result;

                document.getElementById("previewLicencia").src = imagen;
                licenciaTemporal = imagen;
            };

            reader.readAsDataURL(archivo);
        }
    });
}


if(inputCorreo){
    inputCorreo.addEventListener("input", (e)=>{
        const valor = e.target.value;

        document.getElementById("previewUser").textContent = valor || CORREO_DEFAULT;

        if(valor && !validarCorreo(valor)){
            inputCorreo.style.borderBottom = "2px solid red";
        } else {
            inputCorreo.style.borderBottom = "2px solid #ccc";
        }
    });
}


const inputMatricula = document.getElementById("matriculaPerfil");

if(inputMatricula){
    inputMatricula.addEventListener("input", e=>{
        const val = e.target.value;

        if(val && !validarMatricula(val)){
            e.target.style.borderBottom = "2px solid red";
        } else {
            e.target.style.borderBottom = "2px solid #ccc";
        }
    });
}



const inputPlacas = document.getElementById("placasPerfil");

if(inputPlacas){
    inputPlacas.addEventListener("input", e=>{
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        let letras = val.match(/^[A-Z]+/)?.[0] || "";

        if(letras.length === 2){
            if(val.length > 2 && val.length <= 6){
                val = val.slice(0,2) + "-" + val.slice(2);
            } else if(val.length > 6){
                val = val.slice(0,2) + "-" + val.slice(2,6) + "-" + val.slice(6,7);
            }
        } else {
            if(val.length > 3 && val.length <= 6){
                val = val.slice(0,3) + "-" + val.slice(3);
            } else if(val.length > 6){
                val = val.slice(0,3) + "-" + val.slice(3,6) + "-" + val.slice(6,7);
            }
        }

        e.target.value = val;

        if(val && !validarPlacas(val)){
            e.target.style.borderBottom = "2px solid red";
        } else {
            e.target.style.borderBottom = "2px solid #ccc";
        }
    });
}




    // 🔥 Click en imagen → abrir selector
    if(preview && input){
        preview.addEventListener("click", () => {abrirPanelAvatares(); });

        input.addEventListener("change", (e)=>{
            const archivo = e.target.files[0];

            if(archivo){
                const reader = new FileReader();

                reader.onload = function(e){
                    const imagen = e.target.result;

                    // actualizar TODO
                    actualizarFoto(imagen);
                }

                reader.readAsDataURL(archivo);
            }
        });
    }

    // 🔥 Nombre en tiempo real
    const inputNombre = document.getElementById("nuevoNombre");
    if(inputNombre){
        inputNombre.addEventListener("input", (e)=>{
            const nombre = e.target.value || "Usuario";

            const nombrePreview = document.getElementById("previewNombre");
            if(nombrePreview) nombrePreview.textContent = nombre;
        });
    }

    document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){

        // cerrar editor primero si está abierto
        const editor = document.getElementById("editorBanner");

        if(editor && editor.classList.contains("activo")){
            cerrarEditorBanner();
            return;
        }

        cerrarPerfil();
    }
});


    // 🔥 Cerrar al hacer click fuera
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

    inputBanner.value = ""; // 🔥 IMPORTANTE
}

            reader.readAsDataURL(archivo);
        }
    });
}


}






// ================= ACTUALIZAR FOTO =================
function actualizarFoto(imagen){

    // modal
    const preview = document.getElementById("previewFoto");
    if(preview) preview.src = imagen;

    // preview discord
    const avatar = document.getElementById("previewAvatar");
    if(avatar) avatar.src = imagen;

    // menú
    const fotoMenu = document.getElementById("fotoPerfil");
    if(fotoMenu) fotoMenu.src = imagen;

    // guardar
    fotoTemporal = imagen;
}

// ================= MODAL =================
function abrirPerfil(){
    
    document.body.style.overflow = "hidden";
    document.getElementById("modalPerfil").classList.add("activo");

    const nombre = document.getElementById("nuevoNombre").value || "";
    const correo = document.getElementById("correoPerfil").value || "";
    const matricula = document.getElementById("matriculaPerfil").value || "";
    const placas = document.getElementById("placasPerfil").value || "";

    const foto = document.getElementById("previewFoto").src || "";
    const licencia = document.getElementById("previewLicencia").src || "";

    const bannerStyle = document.getElementById("previewBanner").style.backgroundImage;

    let bannerLimpio = "";

    if (bannerStyle && bannerStyle !== "none") {
        bannerLimpio = bannerStyle
            .replace(/^url\(["']?/, "")
            .replace(/["']?\)$/, "");
    }

    datosOriginales = {
        nombre,
        correo,
        matricula,
        placas,
        foto,
        banner: bannerLimpio,
        licencia
    };
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

// ================= GUARDAR =================


async function guardarPerfil() {
    const user = auth.currentUser;

    if (!user) {
        mostrarMensaje("Usuario no autenticado", "red");
        return;
    }

    const uid = user.uid;

    // 🔥 obtener valores
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const correo = document.getElementById("correoPerfil").value.trim();
    const matricula = document.getElementById("matriculaPerfil").value.trim();
    const placas = document.getElementById("placasPerfil").value.trim();

    // 🔥 VALIDACIONES
    if (!nombre) {
        mostrarMensaje("Ingresa un nombre", "red");
        return;
    }

    if (!correo) {
    mostrarMensaje("Ingresa un correo", "red");
    return;
    }

    if (correo && !validarCorreo(correo)) {
        mostrarMensaje("Correo no válido", "red");
        return;
    }

    if (matricula && !validarMatricula(matricula)) {
        mostrarMensaje("La matrícula debe contener solo números", "red");
        return;
    }

    if (placas && !validarPlacas(placas)) {
        mostrarMensaje("Formato válido: ABC-123 o ABC-123-A", "red");
        return;
    }

    const datos = {
    nombre: document.getElementById("nuevoNombre").value.trim(),
    correo: document.getElementById("correoPerfil").value.trim() || CORREO_DEFAULT,
    matricula: document.getElementById("matriculaPerfil").value.trim(),
    placas: document.getElementById("placasPerfil").value.trim(),
    foto: fotoTemporal || document.getElementById("previewFoto").src,
    banner: bannerTempFinal || datosOriginales.banner || "",
    licencia: licenciaTemporal || document.getElementById("previewLicencia").src
};

    try {
        await setDoc(doc(db, "usuarios", uid), datos);

            // 🔥 actualizar menú en tiempo real
            document.getElementById("nombreUsuario").textContent = datos.nombre;
            document.getElementById("correoUsuario").textContent = datos.correo;

            // 🔥 actualizar preview también
            document.getElementById("previewUser").textContent = datos.correo;

            datosOriginales = { ...datos };
            fotoTemporal = null;
            bannerTempFinal = null;
            licenciaTemporal = null;

        mostrarMensaje("✔ Información guardada", "#00c853");

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

    // 🔥 reiniciar animación
    mensaje.classList.remove("activo");
    void mensaje.offsetWidth; // truco para reiniciar animación
    mensaje.classList.add("activo");

    // 🔥 desaparecer después
    setTimeout(()=>{
        mensaje.classList.remove("activo");
    }, 2000);
}


function abrirPanelAvatares(){
    document.getElementById("panelAvatares").classList.add("activo");
}

function cerrarPanelAvatares(){
    document.getElementById("panelAvatares").classList.remove("activo");
}


document.querySelectorAll(".avatar-opcion").forEach(img => {

    img.addEventListener("click", () => {

        const ruta = img.src;

        actualizarFoto(ruta); // 🔥 reutilizas tu función

        cerrarPanelAvatares();
    });

});

// 🔹 seleccionar avatar normal
document.querySelectorAll(".avatar-opcion").forEach(img => {

    img.addEventListener("click", () => {
        const ruta = img.src;

        actualizarFoto(ruta);
        cerrarPanelAvatares();
    });

});


// 🔥 importar imagen
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


function validarCorreo(correo){
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

function validarMatricula(matricula){
    return /^[0-9]+$/.test(matricula);
}

function validarPlacas(placas){
    const regex = /^([A-Z]{3}-\d{3}(-[A-Z])?|[A-Z]{2}-\d{4}(-[A-Z])?)$/;
    return regex.test(placas.toUpperCase());
}


function abrirPanelBanners(){
    document.getElementById("panelBanners").classList.add("activo");
}

function cerrarPanelBanners(){
    document.getElementById("panelBanners").classList.remove("activo");
}


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
    
    offsetX = 0;
    offsetY = 0;
    scale = 1;

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
    canvas.width = 800;
    canvas.height = 300;

    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let sx, sy, sWidth, sHeight;

    if (imgRatio > canvasRatio) {
        // imagen más ancha → recortar lados
        sHeight = img.height;
        sWidth = sHeight * canvasRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
    } else {
        // imagen más alta → recortar arriba y abajo
        sWidth = img.width;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(
        img,
        sx, sy, sWidth, sHeight,
        0, 0, canvas.width, canvas.height
    );

    const resultado = canvas.toDataURL("image/png");

    console.log("Banner generado:", resultado);

    actualizarBanner(resultado);

    cerrarEditorBanner();
    cerrarPanelBanners();

    bannerTemporal = null;
}

    img.src = bannerTemporal;
}


function cerrarEditorBanner(){
    document.getElementById("editorBanner").classList.remove("activo");
}


function activarMovimientoBanner(){

    let isDragging = false;

    let img = document.getElementById("imagenBannerMovible");

    if(!img) return;

    const nuevo = img.cloneNode(true);
    img.replaceWith(nuevo);
    img = nuevo;

    img.addEventListener("mousedown", ()=>{
        isDragging = true;
        img.style.cursor = "grabbing";
    });

    document.addEventListener("mouseup", ()=>{
        isDragging = false;
        img.style.cursor = "grab";
    });

    document.addEventListener("mousemove", (e)=>{
        if(!isDragging) return;

        offsetX += e.movementX;
        offsetY += e.movementY;

        img.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    });


    const slider = document.getElementById("zoomSlider");


if(slider){
    slider.value = scale;

    slider.addEventListener("input", (e)=>{
    scale = parseFloat(e.target.value);

    img.style.backgroundSize = `${scale * 100}%`;

    actualizarBarraZoom(slider); // 🔥 AQUI
});
}




let lastTouchX = 0;
let lastTouchY = 0;

// 📱 TOCAR
img.addEventListener("touchstart", (e)=>{
    isDragging = true;

    const touch = e.touches[0];
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
});

// 📱 MOVER
img.addEventListener("touchmove", (e)=>{
    if(!isDragging) return;

    const touch = e.touches[0];

    const deltaX = touch.clientX - lastTouchX;
    const deltaY = touch.clientY - lastTouchY;

    offsetX += deltaX;
    offsetY += deltaY;

    img.style.backgroundPosition = `${offsetX}px ${offsetY}px`;

    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
});

// 📱 SOLTAR
img.addEventListener("touchend", ()=>{
    isDragging = false;
});

img.addEventListener("touchmove", (e)=>{
    e.preventDefault();
}, { passive: false });

}


function cerrarTodoBanner(){
    cerrarEditorBanner();
    cerrarPanelBanners();

    bannerTemporal = null;

    offsetX = 0;
    offsetY = 0;
    scale = 1;
}

function actualizarBarraZoom(slider){
    const porcentaje = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;

    slider.style.background = `linear-gradient(
        to right,
        #5865f2 0%,
        #5865f2 ${porcentaje}%,
        #3a3c41 ${porcentaje}%,
        #3a3c41 100%
    )`;
}


function intentarCerrarPerfil(){
    if(hayCambios()){
        abrirModalConfirmacion();
    }else{
        cerrarPerfil();
    }
}


function abrirModalConfirmacion(){
    document.getElementById("modalConfirmar").classList.add("activo");
}

function cerrarModalConfirmacion(){
    document.getElementById("modalConfirmar").classList.remove("activo");
}

function cancelarSalida(){
    cerrarModalConfirmacion();
}

function confirmarSalida(){
    cerrarModalConfirmacion(); // cierra el popup
    document.getElementById("modalPerfil").classList.remove("activo"); // 🔥 cierra perfil

    document.body.style.overflow = "";
    cargarPerfil(); // 🔥 restaura datos originales

    // limpiar temporales
    fotoTemporal = null;
    bannerTempFinal = null;
    licenciaTemporal = null;
}

function hayCambios(){

    const nombre = document.getElementById("nuevoNombre").value.trim();
    const correo = document.getElementById("correoPerfil").value.trim();
    const matricula = document.getElementById("matriculaPerfil").value.trim();
    const placas = document.getElementById("placasPerfil").value.trim();

    const fotoActual = fotoTemporal || document.getElementById("previewFoto").src || "";
    const licenciaActual = licenciaTemporal || document.getElementById("previewLicencia").src || "";
    let bannerActual = bannerTempFinal;

if (!bannerActual) {
    const estilo = document.getElementById("previewBanner").style.backgroundImage;

    if (estilo && estilo !== "none") {
        bannerActual = estilo.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    } else {
        bannerActual = "";
    }
}

    return (
        nombre !== datosOriginales.nombre ||
        correo !== datosOriginales.correo ||
        matricula !== datosOriginales.matricula ||
        placas !== datosOriginales.placas ||
        fotoActual !== datosOriginales.foto ||
        bannerActual !== datosOriginales.banner ||
        licenciaActual !== datosOriginales.licencia
    );
}


function abrirModalCerrarSesion(){
    document.getElementById("modalCerrarSesion").classList.add("activo");
}

function cancelarCerrarSesion(){
    document.getElementById("modalCerrarSesion").classList.remove("activo");
}

function confirmarCerrarSesion(){
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
}



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


    if(!overlay || !titulo || !texto || !mensajeAyuda || !imagenCentral || !chatContenedor || !chat){
        console.error("❌ Faltan elementos del HTML para el asistente");
        return;
    }

    overlay.classList.add("activo");

    titulo.innerHTML = "";
    texto.innerHTML = "";
    chat.innerHTML = "";

    chatContenedor.classList.remove("activo");

    imagenCentral.classList.remove("monito-desaparece");
    mensajeAyuda.classList.remove("monito-desaparece");

    imagenCentral.style.display = "block";
    mensajeAyuda.style.display = "block";

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
                        <div class="burbuja">
                            ¿En qué puedo ayudarte?
                        </div>
                    </div>
                    `;

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
    if(chat){
        chat.classList.remove("activo");
    }
}


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
