let ticketsGlobal = [];
let ticketsHistorial = [];
let streamCamara = null;


document.addEventListener("DOMContentLoaded", async () => {

    const nombre = localStorage.getItem("usuarioNombre");
    if (!nombre || nombre === "undefined") {
        window.location.href = "login.html";
        return;
    }

    const elNombre = document.getElementById("nombre-usuario");
    if (elNombre) {
        elNombre.innerText = nombre;
    } else {
        console.warn("⚠️ Advertencia: No se encontró el elemento 'nombre-usuario' en el HTML.");
    }


    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('forceCorteX') === 'true') {
        console.log("🚀 Solicitud de Corte X automático detectada.");


        setTimeout(async () => {
            await ejecutarCorte('X');
        }, 1000);

        return;
    }

    if (!localStorage.getItem("inicioTurno")) {
        localStorage.setItem("inicioTurno", new Date().toISOString());
    }


    const rol = localStorage.getItem("usuarioRol");
    if (rol === "Administrador") {
        const btn = document.getElementById("btn-admin-usuarios");
        if (btn) btn.style.display = "inline-block";
    }

    await cargarActivos();
    initIdentidad();
});


function formatearHora(isoString) {
    if (!isoString) return "--:--";
    try {
        const fecha = new Date(isoString);
        return fecha.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) { return isoString; }
}

function limpiarId(id) {
    if (!id) return 1;
    return id.toString().replace(':1', '').trim();
}


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
                <button onclick="abrirEditar(${t.ID_TICKET})" class="btn-action btn-edit" title="Agregar Observación">Observaciones 📝</button>
                <button onclick="marcarSalida(${t.ID_TICKET})" class="btn-action btn-out" title="Marcar Salida">Salida 📤</button>
                <button onclick="abrirPerdida(${t.ID_TICKET})" class="btn-action btn-loss" title="Reportar Pérdida">Perdida 🚨</button>
                <button onclick="abrirAnulacion(${t.ID_TICKET})" class="btn-action btn-cancel" title="Anular Ticket">Anulación 🗑️</button>
            </td>
        </tr>`;
    }).join("");
}

async function cargarActivos() {
    try {
        const res = await fetch("http://127.0.0.1:3000/api/tickets/activos");
        if (!res.ok) throw new Error("Error en la petición activos");
        ticketsGlobal = await res.json();
        renderTabla(ticketsGlobal);
    } catch (e) { console.error("Error al cargar activos:", e); }
}

async function guardarTicket() {
    const rawId = localStorage.getItem("usuarioId");
    const idUsuario = limpiarId(rawId);
    const dni = limpiarId(document.getElementById("documento-input").value);
    const nombre = document.getElementById("nombre-cliente").value.trim();

    if (!dni || !nombre) return alert("⚠️ DNI y Nombre son obligatorios.");

    const body = {
        dni_cliente: dni,
        nombre_manual: nombre,
        tipo_vehiculo: document.getElementById("tipo-vehiculo").value,
        marca: document.getElementById("marca").value.trim(),
        color: document.getElementById("color").value.trim(),
        observaciones: document.getElementById("observaciones").value.trim(),
        id_usuario_ingreso: parseInt(idUsuario) || 1
    };

    try {
        const res = await fetch("http://127.0.0.1:3000/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("✅ Ticket Registrado");
            location.reload();
        } else {
            const err = await res.text();
            alert("❌ Error del servidor: " + err);
        }
    } catch (e) { alert("❌ Error de conexión al crear ticket."); }
}


function abrirEditar(id) {
    const t = ticketsGlobal.find(x => x.ID_TICKET == id);
    if (!t) return;
    document.getElementById("edit-id-ticket").value = id;
    document.getElementById("edit-nombre").value = t.Cliente;
    document.getElementById("edit-marca").value = t.MARCA_BICI || "";
    document.getElementById("edit-color").value = t.COLOR_BICI || "";
    document.getElementById("edit-obs").value = t.OBSERVACIONES || "";
    document.getElementById("modal-editar").style.display = "flex";
}

async function guardarEdicion() {
    const id = document.getElementById("edit-id-ticket").value;
    const body = {
        nombre_cliente: document.getElementById("edit-nombre").value,
        marca_bici: document.getElementById("edit-marca").value,
        color_bici: document.getElementById("edit-color").value,
        observaciones: document.getElementById("edit-obs").value
    };

    try {
        const res = await fetch(`http://127.0.0.1:3000/api/tickets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("✅ Cambios guardados correctamente.");
            cerrarModal('modal-editar');
            
            // VERIFICA EL NOMBRE DE TU FUNCIÓN AQUÍ:
            // Si tu función para recargar la tabla se llama cargarTickets, usa esa.
            if (typeof cargarTickets === 'function') {
                await cargarTickets();
            } else if (typeof cargarActivos === 'function') {
                await cargarActivos();
            }
        } else {
            const errorData = await res.text();
            console.error("Error del servidor:", errorData);
            alert("❌ El servidor rechazó el cambio: " + errorData);
        }
    } catch (e) {
        console.error("Error en la petición:", e);
        alert("❌ Error de conexión al editar.");
    }
}


async function marcarSalida(id) {
    if (!confirm("¿Confirmar salida del vehículo?")) return;
    try {
        const res = await fetch(`http://127.0.0.1:3000/api/tickets/salida/${id}`, { method: "PUT" });
        if (res.ok) await cargarActivos();
    } catch (e) { alert("❌ Error al procesar salida."); }
}


function abrirPerdida(id) {
    const t = ticketsGlobal.find(x => x.ID_TICKET == id);
    if (!t) return;

    document.getElementById("loss-id-ticket").value = id;
    document.getElementById("loss-codigo").innerText = t.CODIGO_CORRELATIVO;
    document.getElementById("loss-cliente").innerText = t.Cliente;
    document.getElementById("loss-dni").innerText = t.DNI;
    document.getElementById("loss-ingreso").innerText = formatearHora(t.HORA_INGRESO);
    document.getElementById("loss-tipo").innerText = t.TIPO_VEHICULO;
    document.getElementById("loss-marca").innerText = t.MARCA_BICI || "-";
    document.getElementById("loss-color").innerText = t.COLOR_BICI || "-";

    document.getElementById("modal-perdida").style.display = "flex";
    iniciarCamara();
}

async function iniciarCamara() {
    try {
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById("video-feed");
        if (video) video.srcObject = streamCamara;
    } catch (e) { alert("⚠️ Permitir cámara."); }
}

function capturarFoto(tipo) {
    const video = document.getElementById("video-feed");
    const imgId = tipo === 'anverso' ? "img-anverso" : "img-reverso";
    const img = document.getElementById(imgId);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    img.src = canvas.toDataURL('image/jpeg');
    img.style.display = "block";
    if (document.getElementById("placeholder-text")) {
        document.getElementById("placeholder-text").style.display = "none";
    }
}


async function generarActaSalida() {
const id = document.getElementById("loss-id-ticket").value;
    const foto1 = document.getElementById("img-anverso").src;
    const foto2 = document.getElementById("img-reverso").src;
    const telefono = document.getElementById("loss-telefono").value.trim();
    const direccion = document.getElementById("loss-direccion").value.trim();
    const correo = document.getElementById("loss-correo").value.trim();

    if (!foto1.startsWith('data:') || !foto2.startsWith('data:')) {
        return alert("⚠️ Es obligatorio capturar ambas fotos como evidencia.");
    }
    if (!telefono || !direccion) {
        return alert("⚠️ Teléfono y Dirección son obligatorios para el acta legal.");
    }

    try {
        const res = await fetch(`http://127.0.0.1:3000/api/tickets/perdida/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                foto_dni: foto1, 
                foto_rostro: foto2,
                telefono: telefono,
                direccion: direccion,
                correo: correo
            })
        });

        if (res.ok) {
            alert("✅ Acta registrada correctamente. Generando PDF...");


            const datosPDF = {
                codigo: document.getElementById("loss-codigo").innerText,
                cliente: document.getElementById("loss-cliente").innerText,
                dni: document.getElementById("loss-dni").innerText,
                vehiculo: document.getElementById("loss-tipo").innerText,
                marca: document.getElementById("loss-marca").innerText,
                color: document.getElementById("loss-color").innerText,
                ingreso: document.getElementById("loss-ingreso").innerText,
                telefono, direccion, correo, foto1, foto2
            };

            imprimirPDFPerdida(datosPDF);

            setTimeout(() => location.reload(), 2000);
        }
    } catch (e) { alert("❌ Error al procesar pérdida."); }
}


async function ejecutarCorte(tipo) {

    let mensaje = "";
    let tituloReporte = "";
    if (tipo === 'X') {
        mensaje = "⚠️ ¿Realizar CORTE PARCIAL (X)?\n\nSe generará el reporte del turno actual y se cerrará su sesión.";
        tituloReporte = "REPORTE DE OPERACIONES - X (PARCIAL)";
    } else {
        mensaje = "🛑 ¿Realizar CIERRE DE JORNADA (Z)?\n\nEsta acción consolida TODA la operación del día (incluyendo otros turnos).\nLos vehículos en CUSTODIA se mantendrán para mañana.";
        tituloReporte = "CIERRE DE JORNADA FISCAL - Z";
    }

    if (!confirm(mensaje)) return;

    try {

        const [resActivos, resHistorial] = await Promise.all([
            fetch('http://127.0.0.1:3000/api/tickets/activos'),
            fetch('http://127.0.0.1:3000/api/clientes/hoy')
        ]);

        const activos = await resActivos.json();
        const historial = await resHistorial.json();

        const fechaHoy = new Date();

        const inicioTurnoStr = (tipo === 'Z') ?
            new Date(fechaHoy.setHours(0,0,0,0)).toISOString() :
            (localStorage.getItem("horaInicioTurno") || fechaHoy.toISOString());

        const inicioTurno = new Date(inicioTurnoStr);
        const diffMs = new Date() - inicioTurno; // Diferencia real
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        const responsable = (tipo === 'Z') ?
            `${localStorage.getItem("usuarioNombre")} (Y ANTERIORES)` :
            localStorage.getItem("usuarioNombre");

        const datosSesion = {
            titulo: tituloReporte,
            tipo: tipo,
            responsable: responsable,
            fecha: new Date().toLocaleDateString('es-PE'),
            horaCierre: new Date().toLocaleTimeString('en-US'),
            horaInicio: inicioTurno.toLocaleTimeString('en-US'),
            duracion: (tipo === 'Z') ? "24h (Jornada Completa)" : `${diffHrs}h ${diffMins}m`
        };


        generarPDFProfesional(datosSesion, activos, historial);
        generarExcelProfesional(datosSesion, activos, historial);

        setTimeout(() => {
            alert(`✅ ${tipo === 'Z' ? "Cierre Z" : "Corte X"} generado exitosamente.`);
            localStorage.clear();
            window.location.href = "login.html";
        }, 1500);

    } catch (e) { console.error(e); alert("❌ Error al generar reporte."); }
}


function generarPDFProfesional(sesion, activos, historial) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const colorCabecera = (sesion.tipo === 'Z') ? [127, 29, 29] : [30, 41, 59];

    doc.setFillColor(...colorCabecera);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(sesion.titulo, 105, 18, null, null, "center");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AUDITORÍA DE ESTACIONAMIENTO Y CONTROL DE INVENTARIO", 105, 26, null, null, "center");


    doc.setFillColor(241, 245, 249);
    doc.rect(14, 45, 182, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DEL PERIODO", 20, 53);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`RESPONSABLE: ${sesion.responsable.toUpperCase()}`, 20, 60);
    doc.text(`DESDE: ${sesion.fecha}, ${sesion.horaInicio}`, 20, 66);
    doc.text(`HASTA: ${sesion.fecha}, ${sesion.horaCierre}`, 120, 66);
    doc.text(`TIEMPO OPERATIVO: ${sesion.duracion}`, 120, 60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`A. INVENTARIO EN CUSTODIA (Pasa a mañana: ${activos.length})`, 14, 80);

    const dataActivos = activos.map(t => [t.CODIGO_CORRELATIVO, t.Cliente, t.TIPO_VEHICULO, formatearHora(t.HORA_INGRESO)]);
    doc.autoTable({
        startY: 85,
        head: [['TICKET', 'PROPIETARIO', 'VEHÍCULO', 'INGRESO']],
        body: dataActivos,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 9 }
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.text(`B. HISTORIAL TOTAL DEL DÍA (${historial.length} movimientos)`, 14, finalY);
    const dataHistorial = historial.map(t => [
        t.ESTADO, t.CODIGO_CORRELATIVO, t.Cliente,
        formatearHora(t.HORA_INGRESO), t.HORA_SALIDA ? formatearHora(t.HORA_SALIDA) : '--'
    ]);
    doc.autoTable({
        startY: finalY + 5,
        head: [['ESTADO', 'TICKET', 'CLIENTE', 'ENTRADA', 'SALIDA']],
        body: dataHistorial,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 9 }
    });


    const yFirmas = doc.internal.pageSize.height - 30;
    doc.setDrawColor(150);
    doc.line(70, yFirmas, 140, yFirmas);
    doc.setFontSize(8);
    doc.text("CONFORMIDAD DE CIERRE", 105, yFirmas + 5, null, null, "center");
    doc.text(sesion.responsable, 105, yFirmas + 10, null, null, "center");

    doc.save(`${sesion.tipo}_${sesion.fecha.replace(/\//g,'-')}.pdf`);
}


function generarExcelProfesional(sesion, activos, historial) {
    const wb = XLSX.utils.book_new();

    const colorBg = (sesion.tipo === 'Z') ? "7F1D1D" : "1E293B";
    const stTitulo = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 }, fill: { fgColor: { rgb: colorBg } }, alignment: { horizontal: "center" } };
    const stHead = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "475569" } }, border: { top: {style:'thin'}, bottom: {style:'thin'} } };
    const stCelda = { border: { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} } };

    let wsData = [
        [{ v: sesion.titulo, s: stTitulo }],
        [],
        [{ v: "RESPONSABLE:", s: {font:{bold:true}} }, { v: sesion.responsable }],
        [{ v: "FECHA:", s: {font:{bold:true}} }, { v: sesion.fecha }],
        [{ v: "DURACIÓN:", s: {font:{bold:true}} }, { v: sesion.duracion }],
        [],
        [{ v: `A. CUSTODIA (Pasan al día siguiente: ${activos.length})`, s: {font:{bold:true}} }],
        [
            {v:"TICKET",s:stHead}, {v:"PROPIETARIO",s:stHead}, {v:"VEHÍCULO",s:stHead}, {v:"INGRESO",s:stHead}
        ]
    ];

    activos.forEach(t => wsData.push([
        {v:t.CODIGO_CORRELATIVO,s:stCelda}, {v:t.Cliente,s:stCelda}, {v:t.TIPO_VEHICULO,s:stCelda}, {v:formatearHora(t.HORA_INGRESO),s:stCelda}
    ]));

    wsData.push([]);
    wsData.push([{ v: `B. MOVIMIENTOS TOTALES (${historial.length})`, s: {font:{bold:true}} }]);
    wsData.push([
        {v:"ESTADO",s:stHead}, {v:"TICKET",s:stHead}, {v:"CLIENTE",s:stHead}, {v:"ENTRADA",s:stHead}, {v:"SALIDA",s:stHead}
    ]);

    historial.forEach(t => wsData.push([
        {v:t.ESTADO,s:stCelda}, {v:t.CODIGO_CORRELATIVO,s:stCelda}, {v:t.Cliente,s:stCelda}, 
        {v:formatearHora(t.HORA_INGRESO),s:stCelda}, {v:t.HORA_SALIDA ? formatearHora(t.HORA_SALIDA):'-',s:stCelda}
    ]));

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]; // Merge Título
    ws['!cols'] = [{wch:15}, {wch:25}, {wch:25}, {wch:15}, {wch:15}]; // Anchos

    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `${sesion.tipo}_${sesion.fecha.replace(/\//g,'-')}.xlsx`);
}


function cerrarSesionBoton() { ejecutarCorte('X'); }
function cerrarSesionBoton() {
    ejecutarCorte('X');
}

function filtrarTabla() {
    const texto = document.getElementById("buscador-principal").value.toLowerCase();
    const filtrados = ticketsGlobal.filter(x => 
        x.Cliente.toLowerCase().includes(texto) || 
        x.DNI.includes(texto) || 
        x.CODIGO_CORRELATIVO.toLowerCase().includes(texto)
    );
    renderTabla(filtrados);
}

function cerrarModal(id) { 
    document.getElementById(id).style.display = "none";
    if (id === 'modal-perdida' && streamCamara) {
        streamCamara.getTracks().forEach(track => track.stop());
    }
}

function initIdentidad() {
    const inputDni = document.getElementById("documento-input");
    if (!inputDni) return;

    inputDni.addEventListener("input", async (e) => {
        // Limpiamos :1 mientras escribe
        const dniLimpio = limpiarId(e.target.value);
        if (dniLimpio.length === 8) {
            try {
                const r = await fetch(`http://127.0.0.1:3000/api/clientes/identidad/DNI/${dniLimpio}`);
                if (r.ok) {
                    const d = await r.json();
                    if (d.nombre) document.getElementById("nombre-cliente").value = d.nombre;
                }
            } catch (e) {}
        }
    });
}

async function abrirModalUsuarios() {
    const modal = document.getElementById("modal-usuarios");
    if(modal) {
        modal.style.display = "flex";
        await cargarListaUsuarios();
    }
}

async function cargarListaUsuarios() {
    try {
        const res = await fetch("http://127.0.0.1:3000/api/auth/listar");
        if(res.ok) {
            const usuarios = await res.json();
            const tbody = document.getElementById("lista-usuarios-body");
            if(tbody) {
                tbody.innerHTML = usuarios.map(u => `
                    <tr style="border-bottom: 1px solid #eee">
                        <td style="padding: 8px">${u.NOMBRE_EMPLEADO}</td>
                        <td><strong>${u.USERNAME}</strong></td>
                        <td><span class="badge" style="background:#64748b; color:white;">${u.ROL}</span></td>
                        <td style="text-align: center">
                            <button onclick="eliminarUsuario(${u.ID_USUARIO}, '${u.USERNAME}')" 
                                    style="background:none; border:none; cursor:pointer;" title="Eliminar">🗑️</button>
                        </td>
                    </tr>`).join("");
            }
        }
    } catch (e) { console.error("Error al cargar usuarios"); }
}

async function crearUsuario() {
    const body = {
        nombre: document.getElementById("new-nombre").value,
        username: document.getElementById("new-user").value,
        password: document.getElementById("new-pass").value,
        rol: document.getElementById("new-rol").value,
        id_sede: 1
    };
    try {
        const res = await fetch("http://127.0.0.1:3000/api/auth/registrar", {
            method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body)
        });
        if(res.ok) { alert("✅ Usuario Creado"); cargarListaUsuarios(); }
    } catch(e) { alert("❌ Error al crear usuario"); }
}

async function eliminarUsuario(id, username) {
    const actual = localStorage.getItem("usuarioNombre");
    if(username === actual) return alert("⚠️ No puedes eliminarte a ti mismo.");
    if (confirm(`¿Eliminar a ${username}?`)) {
        await fetch(`http://127.0.0.1:3000/api/auth/eliminar/${id}`, { method: "DELETE" });
        cargarListaUsuarios();
    }
}


async function abrirHistorial() {
    try {
        const res = await fetch("http://127.0.0.1:3000/api/clientes/hoy");
        if(res.ok) {
            ticketsHistorial = await res.json();
            document.getElementById("modal-historial").style.display = "flex";
            renderHistorial(ticketsHistorial);
        }
    } catch(e) { console.error("Error historial"); }
}

function renderHistorial(lista) {
    const tbody = document.getElementById("historial-body");
    if (!tbody) return;
    tbody.innerHTML = lista.map(t => `
        <tr>
            <td><span class="badge ${t.ESTADO === 'Finalizado' ? 'badge-finalizado' : 'badge-activo'}">${t.ESTADO}</span></td>
            <td><strong>${t.CODIGO_CORRELATIVO}</strong></td>
            <td>${t.Cliente}</td>
            <td>${t.TIPO_VEHICULO || '-'}</td>
            <td>${formatearHora(t.HORA_INGRESO)}</td>
            <td>${t.HORA_SALIDA ? formatearHora(t.HORA_SALIDA) : '-'}</td>
        </tr>`).join("");
}


function cerrarSesionBoton(tipo = 'X') {
    if (confirm(`¿Desea realizar el Corte ${tipo} y cerrar sesión?`)) {
        ejecutarCorte(tipo, true);
    }
}

function imprimirPDFPerdida(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fechaHoy = new Date().toLocaleDateString('es-PE');


    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("ACTA DE ENTREGA POR PÉRDIDA DE TICKET", 105, 12, null, null, "center");
    doc.setFontSize(10);
    doc.text(`EXPEDIENTE: ${d.codigo} | FECHA: ${fechaHoy}`, 105, 19, null, null, "center");

    doc.setTextColor(0, 0, 0);
    doc.autoTable({
        startY: 35,
        head: [['1. DATOS DEL VEHÍCULO Y PROPIETARIO REGISTRADO']],
        body: [
            [`Ticket Original: ${d.codigo}`, `Vehículo: ${d.vehiculo}`],
            [`Propietario: ${d.cliente}`, `Marca/Color: ${d.marca} / ${d.color}`],
            [`Documento: ${d.dni}`, `Hora Ingreso: ${d.ingreso}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
        styles: { fontSize: 10 }
    });


    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['2. DATOS DEL SOLICITANTE (QUIEN RETIRA)']],
        body: [
            [`Dirección Domiciliaria: ${d.direccion}`],
            [`Teléfono de Contacto: ${d.telefono}`, `Correo: ${d.correo}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' }
    });


    const yFotos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. EVIDENCIA DE IDENTIDAD Y ENTREGA", 14, yFotos);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("ROSTRO DEL SOLICITANTE", 50, yFotos + 8, null, null, "center");
    doc.text("DOCUMENTO PRESENTADO", 150, yFotos + 8, null, null, "center");


    try {
        doc.addImage(d.foto2, 'JPEG', 15, yFotos + 12, 80, 60);
        doc.addImage(d.foto1, 'JPEG', 115, yFotos + 12, 80, 60);
    } catch(e) { console.error("Error cargando imagenes al PDF"); }


    const yFooter = 260;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("DECLARACIÓN DE CONFORMIDAD Y PROTECCIÓN DE DATOS:", 14, yFooter);

    const textoLegal = `De conformidad con la Ley N° 29733, se deja constancia del registro de imagen y datos personales del solicitante únicamente con fines de seguridad y auditoría.\nEl solicitante declara haber recibido el vehículo en las condiciones descritas y libera al establecimiento de cualquier reclamo posterior.`;

    doc.setFont("helvetica", "italic");
    doc.text(textoLegal, 14, yFooter + 6, { maxWidth: 180, align: "justify" });


    doc.save(`Acta_Perdida_${d.codigo}.pdf`);
}

function filtrarHistorial() {

    const input = document.getElementById("filtro-historial");
    if (!input) return; 

    const texto = input.value.toLowerCase().trim();

    const filtrados = ticketsHistorial.filter(t => {

        const cliente = (t.Cliente || "").toLowerCase();
        const codigo = (t.CODIGO_CORRELATIVO || "").toLowerCase();
        const vehiculo = (t.TIPO_VEHICULO || "").toLowerCase();

        const marca = (t.MARCA_BICI || t.marca || "").toLowerCase();
        const color = (t.COLOR_BICI || t.color || "").toLowerCase();
        const estado = (t.ESTADO || "").toLowerCase();

        return cliente.includes(texto) ||
               codigo.includes(texto) ||
               vehiculo.includes(texto) ||
               marca.includes(texto) ||
               color.includes(texto) ||
               estado.includes(texto);
    });

    renderHistorial(filtrados);
}

function imprimirTicketEntrada(ticket, esOriginal = false) {
    const doc = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 250]
    });

    doc.setFont("courier", "bold");
    let y = 10;

    if (!esOriginal) {
        doc.setTextColor(150);
        doc.setFontSize(20);

        doc.text("*** COPIA ***", 40, 5, { align: "center" });
        doc.text("*** REIMPRESIÓN ***", 40, 245, { align: "center" });
        doc.setTextColor(0);
    }

    doc.setFontSize(12);
    doc.text("PARKING CONTROL - SEDE BRASIL", 40, y, { align: "center" }); y += 5;

    doc.setFontSize(9);
    doc.text("Operado por: APPARKA (La Rambla)", 40, y, { align: "center" }); y += 4;
    doc.text("RUC: 20123456789", 40, y, { align: "center" }); y += 6;

    doc.text("--------------------------------------", 40, y, { align: "center" }); y += 5;

    doc.setFontSize(11);
    doc.text(`TICKET: ${ticket.codigo_ticket}`, 5, y); y += 6;

    const nombreArchivo = esOriginal ? `Ticket_${ticket.codigo_ticket}.pdf` : `Ticket_${ticket.codigo_ticket}_COPIA.pdf`;
    doc.save(nombreArchivo);
}



function abrirAnulacion(id) {
    document.getElementById("anular-id-ticket").value = id;
    document.getElementById("anular-motivo").value = "";
    document.getElementById("anular-pass-admin").value = "";
    document.getElementById("modal-anulacion").style.display = "flex";
}

async function confirmarAnulacion() {
    const idTicket = document.getElementById("anular-id-ticket").value;
    const motivo = document.getElementById("anular-motivo").value.trim();
    const passAdmin = document.getElementById("anular-pass-admin").value.trim();

    if (!motivo) return alert("⚠️ Debe especificar un motivo para la anulación.");
    if (!passAdmin) return alert("⚠️ Se requiere la contraseña de administrador.");


    if (!confirm("¿Está seguro de anular este ticket? Esta acción no se puede deshacer.")) return;

    try {
        const res = await fetch("http://127.0.0.1:3000/api/tickets/anular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idTicket, motivo, passAdmin })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Ticket Anulado Correctamente.");
            cerrarModal('modal-anulacion');


            generarPDFAnulacion(data.datosAnulacion);


            await cargarActivos();
        } else {
            alert("❌ Error: " + (data.mensaje || "Contraseña incorrecta o error de servidor"));
        }
    } catch (e) {
        console.error(e);
        alert("❌ Error de conexión al intentar anular.");
    }
}

function generarPDFAnulacion(d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ACTA DE ANULACIÓN DE TICKET", 105, 18, null, null, "center");


    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let y = 45;
    doc.text(`TICKET ANULADO: ${d.codigo_ticket || '---'}`, 20, y); y += 8;
    doc.text(`FECHA ORIGINAL: ${new Date(d.fecha_ingreso).toLocaleString()}`, 20, y); y += 8;
    doc.text(`CLIENTE: ${d.nombre_cliente}`, 20, y); y += 8;
    doc.text(`VEHÍCULO: ${d.tipo_vehiculo} - ${d.marca} (${d.color})`, 20, y); y += 15;


    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DE LA OPERACIÓN", 20, y); y += 10;
    doc.setFont("helvetica", "normal");

    doc.text(`FECHA ANULACIÓN: ${new Date().toLocaleString()}`, 20, y); y += 8;
    doc.text(`AUTORIZADO POR: ${d.admin_autoriza || 'Administrador'}`, 20, y); y += 15;

    doc.setFont("helvetica", "bold");
    doc.text("MOTIVO REGISTRADO:", 20, y); y += 7;
    doc.setFont("helvetica", "normal");


    const splitMotivo = doc.splitTextToSize(d.motivo, 170);
    doc.text(splitMotivo, 20, y);


    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Este documento certifica la baja del ticket en el sistema de inventario.", 105, 280, null, null, "center");

    doc.save(`Anulacion_${d.codigo_ticket}.pdf`);
}

function bloquearSesion() {

    localStorage.setItem("sesionBloqueada", "true");
    window.location.href = "login.html";

}