/* ==========================================
   perfil.js - PERFIL UNIFICADO Y GUARDADO AUTOMÁTICO
   ========================================== */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, signOut, onAuthStateChanged, 
    verifyBeforeUpdateEmail, RecaptchaVerifier, 
    PhoneAuthProvider, updatePhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8LeQ1UNG6XqOpVWAMyde05JOvlWRENvU",
  authDomain: "exsos-login.firebaseapp.com",
  projectId: "exsos-login",
  storageBucket: "exsos-login.firebasestorage.app",
  messagingSenderId: "254157261321",
  appId: "1:254157261321:web:449f88c3567303afa846d8",
  measurementId: "G-35YQC4CCDH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let datosOriginales = {};
let bannerTemporal = null;
let fotoTemporal = null;
let bannerTempFinal = null;
let offsetX = 0;  
let offsetY = 0;
let scale = 1;
const FOTO_DEFAULT = "perfil/user.png";
const CORREO_DEFAULT = "correo@email.com";
let verificacionSmsPerfilId = null;

function procesarImagenBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const MAX_WIDTH = 600;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.6));
            };
        };
        reader.onerror = error => reject(error);
    });
}

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

async function cargarPerfil(){
    const user = auth.currentUser;
    if(!user) return;
    const uid = user.uid;

    try {
        const docRef = doc(db, "usuarios", uid);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){
            const data = docSnap.data();

            if(data.solicitudCarro && data.solicitudCarro.estado === "rechazado") {
                alert("❌ Tu solicitud de cambio de vehículo fue RECHAZADA. Vuelve a intentarlo con datos correctos.");
                await updateDoc(docRef, { solicitudCarro: deleteField() });
            }

            const fotoFinal = data.foto || FOTO_DEFAULT;
            const correoFinal = data.correo || user.email || CORREO_DEFAULT;

            // Datos del menú lateral oculto
            if(document.getElementById("fotoPerfil")) document.getElementById("fotoPerfil").src = fotoFinal;
            if(document.getElementById("nombreUsuario")) document.getElementById("nombreUsuario").textContent = data.nombre || "Usuario";
            if(document.getElementById("correoUsuario")) document.getElementById("correoUsuario").textContent = correoFinal;
           if(document.getElementById("previewTelefono")) document.getElementById("previewTelefono").textContent = data.telefono || "Sin registrar";
         if(document.getElementById("previewNacimiento")) document.getElementById("previewNacimiento").textContent = data.fechaNacimiento || "Sin registrar";

            // Tarjeta Unificada
            if(document.getElementById("previewFoto")) document.getElementById("previewFoto").src = fotoFinal;
            if(document.getElementById("previewNombre")) document.getElementById("previewNombre").textContent = data.nombre || "Usuario";
            if(document.getElementById("previewUser")) document.getElementById("previewUser").textContent = correoFinal;
            if(document.getElementById("previewMatricula")) document.getElementById("previewMatricula").textContent = data.matricula || "Sin registrar";
            if(document.getElementById("previewModelo")) document.getElementById("previewModelo").textContent = data.modeloAuto || "Sin registrar";
            if(document.getElementById("previewColor")) document.getElementById("previewColor").textContent = data.colorAuto || "Sin registrar";
            if(document.getElementById("previewAnio")) document.getElementById("previewAnio").textContent = data.anioAuto || "Sin registrar";
            if(document.getElementById("previewPlacas")) document.getElementById("previewPlacas").textContent = data.placas || "Sin registrar";

            if(document.getElementById("previewLicencia")) {
                if(data.ineUrl) document.getElementById("previewLicencia").src = data.ineUrl;
                else if(data.licencia) document.getElementById("previewLicencia").src = data.licencia;
            }
            
            if(data.banner) actualizarBanner(data.banner);

            datosOriginales = { foto: fotoFinal, banner: data.banner || "" };
        }
    } catch(error){
        console.error(error);
    }
}

function configurarEventos(){
    const preview = document.getElementById("previewFoto");
    const input = document.getElementById("inputFoto");
    const colorPicker = document.getElementById("colorBannerPicker");
    const inputBanner = document.getElementById("inputBannerPanel");
    const btnColor = document.getElementById("btnColor");
    const inputColor = document.getElementById("colorBannerPicker");
    
    const btnMenu = document.getElementById("btnMenu");
    const overlay = document.getElementById("overlay");
    const btnCerrarAvatares = document.querySelector("#panelAvatares .cerrar-panel");
    const btnNoti = document.getElementById("btnNotificaciones");
    const panelNoti = document.getElementById("panelNotificaciones");
    const overlayAyuda = document.getElementById("overlayAyuda");

    if(btnMenu) btnMenu.addEventListener("click", () => { if(window.abrirMenu) window.abrirMenu(); });
    if(overlay) overlay.addEventListener("click", () => { if(window.cerrarMenu) window.cerrarMenu(); });

    const btnAbrirAyuda = document.getElementById("btnAbrirAyuda");
    if(btnAbrirAyuda) btnAbrirAyuda.addEventListener("click", (e)=>{ e.preventDefault(); if(window.abrirAyuda) window.abrirAyuda(); });
    const btnCerrarAyuda = document.querySelector(".btn-cerrar");
    if(btnCerrarAyuda) btnCerrarAyuda.addEventListener("click", () => { if(window.cerrarAyuda) window.cerrarAyuda(); });

    if(overlayAyuda) overlayAyuda.addEventListener("click", (e)=> e.stopPropagation());
    if(btnNoti && panelNoti) btnNoti.addEventListener("click", (e)=>{ 
        e.stopPropagation(); 
        if(window.toggleNotificaciones) window.toggleNotificaciones(); 
        else panelNoti.classList.toggle("activo"); 
    });

    document.querySelectorAll(".cabecera-noti").forEach(cabecera=>{
        cabecera.addEventListener("click", ()=>{
            const seccion = cabecera.dataset.seccion;
            if(window.toggleSeccion) window.toggleSeccion(seccion);
        });
    });

    if(btnCerrarAvatares) btnCerrarAvatares.addEventListener("click", cerrarPanelAvatares);
    
    const btnCancelarBanner = document.querySelector("#editorBanner button:first-child");
    if(btnCancelarBanner) btnCancelarBanner.addEventListener("click", cancelarBanner);
    const btnAplicarBanner = document.querySelector("#editorBanner button:last-child");
    if(btnAplicarBanner) btnAplicarBanner.addEventListener("click", aplicarBanner);
    
    const btnCerrarPerfil = document.getElementById("btnCerrarPerfil");
    if(btnCerrarPerfil) btnCerrarPerfil.addEventListener("click", cerrarPerfil);
    const btnEditarBanner = document.getElementById("btnEditarBanner");
    if(btnEditarBanner) btnEditarBanner.addEventListener("click", abrirPanelBanners);
    
    const btnCancelar = document.getElementById("btnCancelarCerrarSesion");
    if(btnCancelar) btnCancelar.addEventListener("click", cancelarCerrarSesion);
    const btnConfirmar = document.getElementById("btnConfirmarCerrarSesion");
    if(btnConfirmar) btnConfirmar.addEventListener("click", confirmarCerrarSesion);
    
    const btnEditar = document.getElementById("btnEditarPerfil");
    if(btnEditar) btnEditar.addEventListener("click", abrirPerfil);
    const btnCerrar = document.getElementById("btnCerrarSesion");
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
            guardarPerfil(); // AUTOGUARDADO
        });
    }

    if(preview && input){
        preview.addEventListener("click", () => { abrirPanelAvatares(); });
        input.addEventListener("change", (e)=>{
            const archivo = e.target.files[0];
            if(archivo){
                const reader = new FileReader();
                reader.onload = function(e){
                    const imagen = e.target.result;
                    actualizarFoto(imagen);
                    cerrarPanelAvatares();
                    guardarPerfil(); // AUTOGUARDADO
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
            guardarPerfil(); // AUTOGUARDADO
        });
    });

    document.querySelectorAll(".banner-opcion-img").forEach(img=>{
        img.addEventListener("click", ()=>{
            actualizarBanner(img.src, true);
            cerrarPanelBanners();
            guardarPerfil(); // AUTOGUARDADO
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

    // ========================================================
    // 🔥 LÓGICA DE ACTUALIZACIÓN DE AUTO 🔥
    // ========================================================
    const btnSolicitarAuto = document.getElementById("btnSolicitarAuto");
    if(btnSolicitarAuto) {
        btnSolicitarAuto.addEventListener("click", () => {
            document.getElementById("modalCambioAuto").classList.add("activo");
        });
    }

    const btnEnviarSolicitudAuto = document.getElementById("btnEnviarSolicitudAuto");
    if(btnEnviarSolicitudAuto) {
        btnEnviarSolicitudAuto.addEventListener("click", async () => {
            const modelo = document.getElementById("nuevoModeloAuto").value.trim();
            const color = document.getElementById("nuevoColorAuto").value.trim();
            const anio = document.getElementById("nuevoAnioAuto").value.trim();
            const placas = document.getElementById("nuevasPlacasAuto").value.trim();
            const fotoFile = document.getElementById("nuevaFotoAuto").files[0];

            if(!modelo || !color || !anio || !placas || !fotoFile) {
                alert("Por favor completa todos los datos y sube la foto de tu nuevo vehículo.");
                return;
            }

            btnEnviarSolicitudAuto.disabled = true;
            btnEnviarSolicitudAuto.innerText = "Enviando...";

            try {
                const fotoNuevaUrl = await procesarImagenBase64(fotoFile);
                await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
                    solicitudCarro: {
                        modelo: modelo,
                        color: color,
                        anio: anio,
                        placas: placas,
                        fotoUrl: fotoNuevaUrl,
                        estado: "pendiente"
                    }
                });

                document.getElementById("modalCambioAuto").classList.remove("activo");
                alert("✅ Tu solicitud fue enviada correctamente. El administrador la revisará en un lapso de 24 horas.");
                
            } catch (error) {
                console.error(error);
                alert("Error al enviar la solicitud. Revisa tu conexión.");
            } finally {
                btnEnviarSolicitudAuto.disabled = false;
                btnEnviarSolicitudAuto.innerText = "Enviar Solicitud";
            }
        });
    }

    // ========================================================
    // 🔥 LÓGICA DE ACTUALIZACIÓN DE CORREO 🔥
    // ========================================================
    const btnCorreoAccion = document.getElementById("btnActualizarCorreo");
    if(btnCorreoAccion) {
        btnCorreoAccion.addEventListener("click", () => {
            document.getElementById("modalCambioCorreo").classList.add("activo");
        });
    }

    const btnConfirmarCorreo = document.getElementById("btnConfirmarCorreo");
    if(btnConfirmarCorreo) {
        btnConfirmarCorreo.addEventListener("click", async () => {
            const nuevoCorreo = document.getElementById("nuevoCorreoInput").value.trim();
            if(!nuevoCorreo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCorreo)) {
                alert("Por favor ingresa un correo válido."); return;
            }

            btnConfirmarCorreo.disabled = true;
            btnConfirmarCorreo.innerText = "Enviando...";

            try {
                await verifyBeforeUpdateEmail(auth.currentUser, nuevoCorreo);
                await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { correo: nuevoCorreo });
                
                alert("✉️ Enlace enviado. Revisa tu bandeja de entrada en el nuevo correo para confirmar el cambio. (Se actualizará automáticamente).");
                document.getElementById("modalCambioCorreo").classList.remove("activo");

            } catch (error) {
                if(error.code === 'auth/email-already-in-use') {
                    alert("❌ Este correo ya está registrado en otra cuenta. Por favor elige otro.");
                } else if(error.code === 'auth/requires-recent-login') {
                    alert("⚠️ Por seguridad, debes cerrar sesión y volver a entrar antes de cambiar tu correo.");
                } else {
                    alert("Error Firebase: " + error.code);
                }
            } finally {
                btnConfirmarCorreo.disabled = false;
                btnConfirmarCorreo.innerText = "Verificar Correo";
            }
        });
    }

    // ========================================================
    // 🔥 LÓGICA DE ACTUALIZACIÓN DE TELÉFONO (SMS) 🔥
    // ========================================================
    const btnTel = document.getElementById("btnActualizarTel");
    if(btnTel) {
        btnTel.addEventListener("click", () => {
            document.getElementById("modalCambioTel").classList.add("activo");
            document.getElementById("stepTel1").style.display = "block";
            document.getElementById("stepTel2").style.display = "none";
        });
    }

    const btnEnviarSms = document.getElementById("btnEnviarSmsPerfil");
    if(btnEnviarSms) {
        btnEnviarSms.addEventListener("click", async () => {
            const nuevoTel = document.getElementById("nuevoTelInput").value.trim();
            if(nuevoTel.length !== 10) { alert("El teléfono debe tener 10 dígitos."); return; }

            btnEnviarSms.disabled = true;
            btnEnviarSms.innerText = "Verificando...";

            try {
                if (!window.recaptchaVerifierPerfil) {
                    window.recaptchaVerifierPerfil = new RecaptchaVerifier(auth, 'recaptcha-perfil-container', { 'size': 'normal' });
                }
                const numeroCompleto = "+52" + nuevoTel;
                const provider = new PhoneAuthProvider(auth);
                
                verificacionSmsPerfilId = await provider.verifyPhoneNumber(numeroCompleto, window.recaptchaVerifierPerfil);
                
                document.getElementById("stepTel1").style.display = "none";
                document.getElementById("stepTel2").style.display = "block";
                
            } catch (error) {
                btnEnviarSms.disabled = false;
                btnEnviarSms.innerText = "Enviar SMS";
                if(error.code === 'auth/credential-already-in-use') {
                    alert("❌ Este número ya está asociado a otra cuenta.");
                } else {
                    alert("Error Firebase: " + error.message);
                }
            }
        });
    }

    const btnVerificarSms = document.getElementById("btnVerificarSmsPerfil");
    if(btnVerificarSms) {
        btnVerificarSms.addEventListener("click", async () => {
            const codigo = document.getElementById("codigoSmsPerfil").value.trim();
            if(!codigo) { alert("Ingresa el código."); return; }

            btnVerificarSms.disabled = true;
            btnVerificarSms.innerText = "Actualizando...";

            try {
                const credencialNueva = PhoneAuthProvider.credential(verificacionSmsPerfilId, codigo);
                await updatePhoneNumber(auth.currentUser, credencialNueva);
                
                const nuevoTel = document.getElementById("nuevoTelInput").value.trim();
                await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { telefono: nuevoTel });

                alert("✅ Tu número de teléfono se ha actualizado correctamente.");
                document.getElementById("modalCambioTel").classList.remove("activo");

            } catch (error) {
                alert("❌ Código incorrecto o expirado.");
                btnVerificarSms.disabled = false;
                btnVerificarSms.innerText = "Verificar y Guardar";
            }
        });
    }
}

function actualizarFoto(imagen){
    const preview = document.getElementById("previewFoto");
    if(preview) preview.src = imagen;
    const fotoMenu = document.getElementById("fotoPerfil");
    if(fotoMenu) fotoMenu.src = imagen;
    fotoTemporal = imagen;
}

function abrirPerfil(){
    document.body.style.overflow = "hidden";
    document.getElementById("modalPerfil").classList.add("activo");
}

function cerrarPerfil(){
    document.getElementById("modalPerfil").classList.remove("activo");
    document.body.style.overflow = "";
    cargarPerfil();
    fotoTemporal = null;
    bannerTempFinal = null;
}

async function guardarPerfil() {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    const datosAActualizar = {
        foto: fotoTemporal || document.getElementById("previewFoto").src,
        banner: bannerTempFinal || datosOriginales.banner || ""
    };

    try {
        await updateDoc(doc(db, "usuarios", uid), datosAActualizar);
        datosOriginales.foto = datosAActualizar.foto;
        datosOriginales.banner = datosAActualizar.banner;
        fotoTemporal = null;
        bannerTempFinal = null;
    } catch (error) {
        console.error(error);
    }
}

function abrirPanelAvatares(){ document.getElementById("panelAvatares").classList.add("activo"); }
function cerrarPanelAvatares(){ document.getElementById("panelAvatares").classList.remove("activo"); }

document.querySelectorAll(".avatar-opcion").forEach(img => {
    img.addEventListener("click", () => {
        const ruta = img.src;
        actualizarFoto(ruta); 
        cerrarPanelAvatares();
        guardarPerfil(); // AUTOGUARDADO
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
                guardarPerfil(); // AUTOGUARDADO
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
        guardarPerfil(); // AUTOGUARDADO
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

function abrirModalCerrarSesion(){ document.getElementById("modalCerrarSesion").classList.add("activo"); }
function cancelarCerrarSesion(){ document.getElementById("modalCerrarSesion").classList.remove("activo"); }
function confirmarCerrarSesion(){ signOut(auth).then(() => { window.location.href = "index.html"; }); }

// 🔥 FUNCION DE PLACAS AUTOMATICAS 🔥
window.formatearPlacas = function(input) {
    let valor = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formateado = '';
    if (valor.length > 0) formateado += valor.substring(0, 3);
    if (valor.length > 3) formateado += '-' + valor.substring(3, 6);
    if (valor.length > 6) formateado += '-' + valor.substring(6, 7);
    input.value = formateado;
};

// Variables Globales
window.abrirPerfil = abrirPerfil;
window.cerrarPerfil = cerrarPerfil;
window.abrirPanelBanners = abrirPanelBanners;
window.cerrarPanelBanners = cerrarPanelBanners;
window.cancelarBanner = cancelarBanner;
window.aplicarBanner = aplicarBanner;
window.cerrarTodoBanner = cerrarTodoBanner;
window.cancelarCerrarSesion = cancelarCerrarSesion;
window.confirmarCerrarSesion = confirmarCerrarSesion;
