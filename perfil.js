// ========================================================
// 🔥 SOLICITUD DE CAMBIO DE VEHÍCULO Y DATOS 🔥
// ========================================================

// Reutilizamos el convertidor de imágenes para la foto nueva del auto
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

document.addEventListener("DOMContentLoaded", () => {
    
    // Abrir Modal de Cambio de Auto
    const btnSolicitarAuto = document.getElementById("btnSolicitarAuto");
    if(btnSolicitarAuto) {
        btnSolicitarAuto.addEventListener("click", () => {
            document.getElementById("modalCambioAuto").classList.add("activo");
        });
    }

    // Botones de Correo y Teléfono (Mensajes Informativos por ahora)
    const btnCorreo = document.getElementById("btnActualizarCorreo");
    if(btnCorreo) {
        btnCorreo.addEventListener("click", () => {
            alert("Para actualizar tu correo, por favor contacta a Administración Universitaria.");
        });
    }

    const btnTel = document.getElementById("btnActualizarTel");
    if(btnTel) {
        btnTel.addEventListener("click", () => {
            alert("Para cambiar tu teléfono de recuperación, acude al módulo de EXSOS.");
        });
    }

    // Enviar la Solicitud del Auto
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
                // Convertimos la foto nueva a texto
                const fotoNuevaUrl = await procesarImagenBase64(fotoFile);
                
                // Obtenemos al usuario actual
                const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
                const { getFirestore, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
                const user = getAuth().currentUser;

                // Guardamos la solicitud DENTRO del documento del usuario
                await updateDoc(doc(getFirestore(), "usuarios", user.uid), {
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
});
