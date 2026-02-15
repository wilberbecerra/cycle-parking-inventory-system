/* --- VARIABLES GLOBALES --- */
let ticketsGlobal = [];
let ticketsHistorial = [];
let streamCamara = null;

/* --- INICIALIZACIÓN --- */
document.addEventListener("DOMContentLoaded", async () => {
    const nombre = localStorage.getItem("usuarioNombre");
    if (!nombre) { window.location.href = "login.html"; return; }
    document.getElementById("nombre-usuario").innerText = nombre;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('forceCorteX') === 'true') await ejecutarCorte('X', true);

    const rol = localStorage.getItem("usuarioRol");
    if (rol === "Administrador") {
        const btn = document.getElementById("btn-admin-usuarios");
        if (btn) btn.style.display = "inline-block";
    }

    await cargarActivos();
    initIdentidad();
});

/* --- UTILIDAD: HORA (AM/PM) --- */
function formatearHora(isoString) {
    if (!isoString) return "--:--";
    try {
        const fecha = new Date(isoString);
        return fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return isoString; }
}

/* --- 1. RENDERIZADO DE TABLA --- */
function renderTabla(lista) {
    const tbody = document.getElementById("tickets-body");
    if (!tbody) return;
    
    tbody.innerHTML = lista.map((t) => {
        const horaLimpia = formatearHora(t.HORA_INGRESO);
        const marca = t.MARCA_BICI || t.marca_bici || "-";
        const color = t.COLOR_BICI || t.color_bici || "-";
        const tipoDoc = (t.DNI && t.DNI.length > 8) ? "CE" : "DNI";

        return `
        <tr>
            <td><strong>${t.CODIGO_CORRELATIVO}</strong></td>
            <td>
                ${t.Cliente}<br>
                <small style="color:#64748b; font-weight:bold;">${tipoDoc} ${t.DNI}</small>
            </td>
            <td><span style="color:var(--primary); font-weight:bold;">${horaLimpia}</span></td>
            <td>${t.TIPO_VEHICULO || "-"}</td>
            <td>${marca} / ${color}</td>
            <td><span class="badge badge-activo">ACTIVO</span></td>
            <td style="white-space: nowrap;">
                <button onclick="abrirEditar(${t.ID_TICKET})" class="btn-action btn-edit" title="Editar">✏️ Editar</button>
                <button onclick="marcarSalida(${t.ID_TICKET})" class="btn-action btn-out" title="Salida">📤 Salida</button>
                <button onclick="abrirPerdida(${t.ID_TICKET})" class="btn-action btn-loss" title="Pérdida">🚨 Pérdida</button>
            </td>
        </tr>`;
    }).join("");
}

async function cargarActivos() {
    try {
        const res = await fetch("http://127.0.0.1:3000/api/tickets/activos");
        ticketsGlobal = await res.json();
        renderTabla(ticketsGlobal);
    } catch (e) {}
}

/* --- 2. ACCIONES (EDITAR, SALIDA, PÉRDIDA) --- */

// A) EDITAR
function abrirEditar(id) {
    const t = ticketsGlobal.find(x => x.ID_TICKET == id);
    if (!t) return;
    document.getElementById("edit-id-ticket").value = id;
    document.getElementById("edit-nombre").value = t.Cliente;
    document.getElementById("edit-marca").value = t.MARCA_BICI || t.marca_bici || "";
    document.getElementById("edit-color").value = t.COLOR_BICI || t.color_bici || "";
    document.getElementById("edit-obs").value = t.OBSERVACIONES || "";
    document.getElementById("modal-editar").style.display = "flex";
}

/* --- FUNCIÓN GUARDAR EDICIÓN (REAL CONEXIÓN BD) --- */
async function guardarEdicion() {
    // 1. Obtener el ID del ticket oculto
    const id = document.getElementById("edit-id-ticket").value;
    if (!id) return alert("❌ Error: No se identificó el ticket a editar.");

    // 2. Capturar los nuevos valores del formulario
    const nombre = document.getElementById("edit-nombre").value;
    const marca = document.getElementById("edit-marca").value;
    const color = document.getElementById("edit-color").value;
    const obs = document.getElementById("edit-obs").value;

    // 3. Preparar el paquete de datos (Usamos doble llave para asegurar compatibilidad)
    const body = {
        nombre_manual: nombre,  // Para actualizar cliente si el backend lo permite
        marca_bici: marca,      // Nombre SQL
        marca: marca,           // Nombre corto
        color_bici: color,      // Nombre SQL
        color: color,           // Nombre corto
        observaciones: obs
    };

    try {
        // 4. Enviar la petición PUT al servidor
        // Asumimos que tu ruta backend es: PUT /api/tickets/:id
        const res = await fetch(`http://127.0.0.1:3000/api/tickets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("✅ Cambios guardados correctamente en Base de Datos.");
            
            // 5. Cerrar modal y refrescar la tabla
            document.getElementById("modal-editar").style.display = "none";
            await cargarActivos(); 
        } else {
            const errorTxt = await res.text();
            alert("❌ Error al actualizar: " + errorTxt);
        }
    } catch (e) {
        console.error(e);
        alert("❌ Error de conexión con el servidor.");
    }
}

// B) SALIDA
async function marcarSalida(id) {
    if (!confirm("¿Confirmar salida del vehículo?")) return;
    await fetch(`http://127.0.0.1:3000/api/tickets/salida/${id}`, { method: "PUT" });
    await cargarActivos();
}

// C) PÉRDIDA (LÓGICA MEJORADA PDF CON FOTOS)
function abrirPerdida(id) {
    const t = ticketsGlobal.find(x => x.ID_TICKET == id);
    if (!t) return;
    document.getElementById("loss-id-ticket").value = id;
    document.getElementById("loss-cliente").innerText = t.Cliente;
    document.getElementById("loss-vehiculo").innerText = `${t.TIPO_VEHICULO} - ${t.MARCA_BICI || ""}`;
    
    // Limpiar fotos previas
    document.getElementById("img-dni").style.display = "none";
    document.getElementById("img-face").style.display = "none";
    
    document.getElementById("modal-perdida").style.display = "flex";
    iniciarCamara();
}

async function iniciarCamara() {
    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById("video-dni").srcObject = streamCamara;
        document.getElementById("video-face").srcObject = streamCamara;
    } catch (e) { alert("Active la cámara para continuar."); }
}

function tomarFoto(tipo) {
    const video = document.getElementById(tipo === 'dni' ? 'video-dni' : 'video-face');
    const img = document.getElementById(tipo === 'dni' ? 'img-dni' : 'img-face');
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    img.src = canvas.toDataURL('image/jpeg');
    img.style.display = "block";
}

function confirmarPerdida() {
    // Verificar que haya fotos
    const imgDniSrc = document.getElementById("img-dni").src;
    const imgFaceSrc = document.getElementById("img-face").src;
    if(document.getElementById("img-dni").style.display === "none" || document.getElementById("img-face").style.display === "none") {
        return alert("⚠️ Debes tomar ambas fotos (DNI y Rostro) para generar el acta.");
    }

    const id = document.getElementById("loss-id-ticket").value;
    const t = ticketsGlobal.find(x => x.ID_TICKET == id);
    const fecha = new Date().toLocaleDateString('es-PE');

    // Cerrar Modal y Cámara
    if(streamCamara) streamCamara.getTracks().forEach(track => track.stop());
    document.getElementById("modal-perdida").style.display = "none";

    // --- GENERAR PDF PRO ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabecera
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("ACTA DE ENTREGA POR PÉRDIDA DE TICKET", 105, 20, null, null, "center");
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`EXPEDIENTE: ${t.CODIGO_CORRELATIVO} | FECHA: ${fecha}`, 105, 28, null, null, "center");

    // Datos
    let y = 40;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("1. DATOS DEL REGISTRO:", 15, y);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    y += 7; doc.text(`Cliente: ${t.Cliente}`, 20, y);
    y += 6; doc.text(`DNI: ${t.DNI}`, 20, y);
    y += 6; doc.text(`Vehículo: ${t.TIPO_VEHICULO} - ${t.MARCA_BICI||""} ${t.COLOR_BICI||""}`, 20, y);
    y += 6; doc.text(`Ingreso: ${formatearHora(t.HORA_INGRESO)}`, 20, y);

    // Fotos
    y += 15;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("2. EVIDENCIA FOTOGRÁFICA:", 15, y);
    y += 5;
    try {
        // Pegar fotos capturadas
        doc.addImage(imgDniSrc, "JPEG", 20, y, 80, 50); // Foto DNI
        doc.addImage(imgFaceSrc, "JPEG", 110, y, 80, 50); // Foto Rostro
        doc.setFontSize(8); doc.setFont("helvetica", "italic");
        doc.text("Documento Identidad", 60, y+55, null, null, "center");
        doc.text("Rostro Solicitante", 150, y+55, null, null, "center");
    } catch(e) { console.error("Error imágenes PDF"); }

    // Texto Legal
    y += 70;
    doc.setFillColor(240, 240, 240); doc.rect(15, y, 180, 25, 'F');
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("DECLARACIÓN DE CONFORMIDAD Y PROTECCIÓN DE DATOS:", 18, y+6);
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    const legalText = "De conformidad con la Ley N° 29733, se deja constancia del registro de imagen y datos personales del solicitante únicamente con fines de seguridad y auditoría. El solicitante declara haber recibido el vehículo en las condiciones descritas y libera al establecimiento de cualquier reclamo posterior.";
    const splitText = doc.splitTextToSize(legalText, 170);
    doc.text(splitText, 18, y+11);

    doc.save(`Acta_Perdida_${t.CODIGO_CORRELATIVO}.pdf`);
    
    // API
    fetch(`http://127.0.0.1:3000/api/tickets/salida/${id}?estado=Perdido`, { method: "PUT" });
    cargarActivos();
}

/* --- 3. GUARDAR TICKET (AMBOS NOMBRES) --- */
async function guardarTicket() {
    const usuarioId = localStorage.getItem("usuarioId") || 1; 
    const marca = document.getElementById("marca").value.trim();
    const color = document.getElementById("color").value.trim();

    const body = {
        dni_cliente: document.getElementById("documento-input").value,
        nombre_manual: document.getElementById("nombre-cliente").value,
        tipo_vehiculo: document.getElementById("tipo-vehiculo").value,
        
        // Enviamos doble para asegurar
        marca: marca, marca_bici: marca,
        color: color, color_bici: color,
        
        observaciones: document.getElementById("observaciones").value,
        tiene_cadena: 0, id_usuario_ingreso: parseInt(usuarioId), id_sede: 1
    };
    
    const res = await fetch("http://127.0.0.1:3000/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { alert("✅ Ticket Registrado"); location.reload(); }
}

/* --- 4. EXPORTACIÓN --- */
function cerrarSesionBoton() {
    if (confirm("¿Desea cerrar la sesión? Se generará un Corte X automáticamente.")) {
        ejecutarCorte('X', true);
    }
}

async function ejecutarCorte(tipo, salirAlFinal = false) {
    if (salirAlFinal) alert("Exportando datos y cerrando sesión...");
    
    try {
        const resMov = await fetch('http://127.0.0.1:3000/api/clientes/hoy');
        const movimientos = await resMov.json();
        const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
        const nombreArchivo = `Corte_${tipo}_${fecha}`;

        // PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 28, 'F');
        doc.setTextColor(255); doc.setFontSize(16); doc.text(`REPORTE ${tipo}`, 105, 18, null, null, "center");
        doc.autoTable({ startY: 40, head: [['ESTADO', 'TICKET', 'CLIENTE', 'VEHÍCULO', 'SALIDA']], body: movimientos.map(m => [m.ESTADO, m.CODIGO_CORRELATIVO, m.Cliente, m.TIPO_VEHICULO, m.HORA_SALIDA || '-']) });
        doc.save(`${nombreArchivo}.pdf`);

        // EXCEL
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(movimientos);
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);

        if (salirAlFinal) {
            setTimeout(() => { localStorage.clear(); window.location.href = "login.html"; }, 2000);
        }
    } catch (e) {}
}

/* --- 5. USUARIOS (CON ELIMINAR) --- */
async function abrirModalUsuarios() { 
    document.getElementById("modal-usuarios").style.display = "flex"; 
    cargarListaUsuarios(); 
}

async function cargarListaUsuarios() {
    try {
        const res = await fetch("http://127.0.0.1:3000/api/auth/listar");
        const usuarios = await res.json();
        
        document.getElementById("lista-usuarios-body").innerHTML = usuarios.map(u => `
            <tr style="border-bottom: 1px solid #eee">
                <td style="padding: 8px">${u.NOMBRE_EMPLEADO}</td>
                <td><strong>${u.USERNAME}</strong></td>
                <td><span class="badge" style="background:#64748b; color:white;">${u.ROL}</span></td>
                <td style="text-align: center">
                    <button onclick="eliminarUsuario(${u.ID_USUARIO}, '${u.USERNAME}')" 
                            style="background:none; border:none; cursor:pointer; font-size: 1.2rem;" 
                            title="Eliminar">
                        🗑️
                    </button>
                </td>
            </tr>`).join("");
    } catch (e) { console.error("Error usuarios"); }
}

async function crearUsuario() {
    const body = { 
        nombre: document.getElementById("new-nombre").value, 
        username: document.getElementById("new-user").value, 
        password: document.getElementById("new-pass").value, 
        rol: document.getElementById("new-rol").value, 
        id_sede: 1 
    };
    await fetch("http://127.0.0.1:3000/api/auth/registrar", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    alert("✅ Creado"); cargarListaUsuarios();
}

async function eliminarUsuario(id, username) {
    const actual = localStorage.getItem("usuarioNombre");
    if(username === actual) return alert("⚠️ No puedes eliminarte a ti mismo.");
    if (confirm(`¿Eliminar a ${username}?`)) {
        await fetch(`http://127.0.0.1:3000/api/auth/eliminar/${id}`, { method: "DELETE" });
        cargarListaUsuarios();
    }
}

/* --- 6. HISTORIAL --- */
async function abrirHistorial() {
    const res = await fetch("http://127.0.0.1:3000/api/clientes/hoy");
    ticketsHistorial = await res.json();
    document.getElementById("modal-historial").style.display = "flex";
    renderHistorial(ticketsHistorial);
}

function renderHistorial(lista) {
    const tbody = document.getElementById("historial-body");
    if (!tbody) return;

    tbody.innerHTML = lista.map(t => {
        let badgeClass = 'badge-activo'; 
        if (t.ESTADO === 'Finalizado') badgeClass = 'badge-finalizado';
        if (t.ESTADO === 'Perdido') badgeClass = 'badge-perdido';

        return `<tr>
            <td><span class="badge ${badgeClass}">${t.ESTADO || 'Activo'}</span></td>
            <td><strong>${t.CODIGO_CORRELATIVO}</strong></td>
            <td>${t.Cliente}</td>
            <td>${t.TIPO_VEHICULO || '-'}</td>
            <td>${formatearHora(t.HORA_INGRESO)}</td>
            <td>${t.HORA_SALIDA ? formatearHora(t.HORA_SALIDA) : '-'}</td>
        </tr>`;
    }).join("");
}

function filtrarHistorial() {
    const texto = document.getElementById("filtro-historial").value.toLowerCase();
    const filtrados = ticketsHistorial.filter(t => 
        (t.Cliente && t.Cliente.toLowerCase().includes(texto)) || 
        (t.CODIGO_CORRELATIVO && t.CODIGO_CORRELATIVO.toLowerCase().includes(texto)) ||
        (t.TIPO_VEHICULO && t.TIPO_VEHICULO.toLowerCase().includes(texto))
    );
    renderHistorial(filtrados);
}

/* --- UTILIDADES --- */
function initIdentidad() {
    document.getElementById("documento-input").addEventListener("input", async (e) => {
        if (e.target.value.length >= 8) {
            try { const r = await fetch(`http://127.0.0.1:3000/api/clientes/identidad/DNI/${e.target.value}`);
            if(r.ok) { const d = await r.json(); if(d.nombre) document.getElementById("nombre-cliente").value = d.nombre; } } catch(e){}
        }
    });
}
function cerrarModal(id) { 
    document.getElementById(id).style.display = "none";
    if(id === 'modal-perdida' && streamCamara) streamCamara.getTracks().forEach(t => t.stop());
}
function filtrarTabla() {
    const t = document.getElementById("buscador-principal").value.toLowerCase();
    const f = ticketsGlobal.filter(x => x.Cliente.toLowerCase().includes(t) || x.DNI.includes(t));
    renderTabla(f);
}