const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/db');

/* --- 1. LISTAR TICKETS ACTIVOS --- */
router.get('/activos', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT t.ID_TICKET, t.CODIGO_CORRELATIVO, c.NOMBRE_COMPLETO AS Cliente, c.DNI, 
                   ISNULL(c.TIPO_DOCUMENTO, 'DNI') as TIPO_DOCUMENTO,
                   t.MARCA_BICI, t.COLOR_BICI, t.TIPO_VEHICULO, t.OBSERVACIONES, 
                   t.ESTADO, t.HORA_INGRESO 
            FROM PRK_TICKETS t 
            INNER JOIN PRK_CLIENTES c ON t.DNI_CLIENTE = c.DNI 
            WHERE t.ESTADO = 'Activo' 
            ORDER BY t.ID_TICKET DESC`);
        res.json(result.recordset);
    } catch (e) { 
        res.status(500).send("Error al listar: " + e.message); 
    }
});

/* --- 2. CREAR TICKET (POST /api/tickets) --- */
router.post('/', async (req, res) => {
    const { dni_cliente, nombre_manual, marca, marca_bici, color, color_bici, tipo_vehiculo, observaciones, id_usuario_ingreso } = req.body;
    
    // Usamos el valor que venga (soporta marca o marca_bici)
    const vMarca = marca || marca_bici || '';
    const vColor = color || color_bici || '';
    const vUsuario = id_usuario_ingreso || 1;

    try {
        const pool = await getConnection();
        
        // Verificar si el cliente existe, si no, crearlo
        const check = await pool.request()
            .input('d', sql.VarChar(20), dni_cliente)
            .query('SELECT DNI FROM PRK_CLIENTES WHERE DNI = @d');
            
        if (check.recordset.length === 0) {
            await pool.request()
                .input('d', sql.VarChar(20), dni_cliente)
                .input('n', sql.VarChar(150), nombre_manual)
                .query(`INSERT INTO PRK_CLIENTES (DNI, NOMBRE_COMPLETO, TIPO_DOCUMENTO, ORIGEN_DATOS, TIPO_CLIENTE) 
                        VALUES (@d, @n, 'DNI', 'Manual', 'General')`);
        }

        const ahora = new Date();
        await pool.request()
            .input('d', sql.VarChar(20), dni_cliente)
            .input('u', sql.Int, vUsuario)
            .input('m', sql.VarChar(50), vMarca)
            .input('c', sql.VarChar(50), vColor)
            .input('tv', sql.VarChar(50), tipo_vehiculo || 'Bicicleta')
            .input('obs', sql.VarChar(sql.MAX), observaciones || '')
            .input('fh', sql.DateTime, ahora)
            .query(`INSERT INTO PRK_TICKETS 
                    (DNI_CLIENTE, ID_USUARIO_INGRESO, MARCA_BICI, COLOR_BICI, TIPO_VEHICULO, OBSERVACIONES, TIENE_CADENA, ESTADO, FECHA_INGRESO, HORA_INGRESO, ID_SEDE) 
                    VALUES (@d, @u, @m, @c, @tv, @obs, 0, 'Activo', @fh, @fh, 1)`);
        
        res.status(201).send("OK");
    } catch (e) { 
        console.error(e);
        res.status(500).send("Error al crear: " + e.message); 
    }
});

/* --- 3. EDITAR TICKET (PUT /api/tickets/:id) --- */
// Esta ruta corrige el error 404 al coincidir con el dashboard.js
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_manual, marca, marca_bici, color, color_bici, tipo_vehiculo, observaciones } = req.body;
    
    const vMarca = marca || marca_bici || '';
    const vColor = color || color_bici || '';

    try {
        const pool = await getConnection();
        
        // 1. Actualizar datos del vehículo
        await pool.request()
            .input('id', sql.Int, id)
            .input('m', sql.VarChar(50), vMarca)
            .input('c', sql.VarChar(50), vColor)
            .input('tv', sql.VarChar(50), tipo_vehiculo || 'Bicicleta')
            .input('obs', sql.VarChar(sql.MAX), observaciones || '')
            .query(`UPDATE PRK_TICKETS 
                    SET MARCA_BICI = @m, COLOR_BICI = @c, TIPO_VEHICULO = @tv, OBSERVACIONES = @obs 
                    WHERE ID_TICKET = @id`);

        // 2. Actualizar nombre del cliente (basado en el DNI de ese ticket)
        if (nombre_manual) {
            await pool.request()
                .input('id', sql.Int, id)
                .input('nom', sql.VarChar(150), nombre_manual)
                .query(`UPDATE PRK_CLIENTES 
                        SET NOMBRE_COMPLETO = @nom 
                        WHERE DNI = (SELECT DNI_CLIENTE FROM PRK_TICKETS WHERE ID_TICKET = @id)`);
        }

        res.json({ mensaje: "OK" });
    } catch (e) { 
        res.status(500).send("Error al editar: " + e.message); 
    }
});

/* --- 4. REGISTRAR SALIDA NORMAL (PUT /api/tickets/salida/:id) --- */
router.put('/salida/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.query; // Puede recibir ?estado=Perdido
    const nuevoEstado = estado || 'Finalizado';

    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, id)
            .input('est', sql.VarChar(20), nuevoEstado)
            .query(`UPDATE PRK_TICKETS 
                    SET FECHA_SALIDA = GETDATE(), 
                        HORA_SALIDA = GETDATE(), 
                        ESTADO = @est 
                    WHERE ID_TICKET = @id`);
        res.json({ mensaje: "OK" });
    } catch (e) { 
        res.status(500).send("Error en salida: " + e.message); 
    }
});

/* --- 5. PROTOCOLO DE PÉRDIDA (PUT /api/tickets/perdida/:id) --- */
router.put('/perdida/:id', async (req, res) => {
    const { id } = req.params; 
    const { foto_dni, foto_rostro, tel, dir, correo } = req.body;

    try {
        const pool = await getConnection(); 
        const ahora = new Date();
        await pool.request()
            .input('id', sql.Int, id)
            .input('fd', sql.VarChar(sql.MAX), foto_dni)
            .input('fr', sql.VarChar(sql.MAX), foto_rostro)
            .input('t', sql.VarChar(20), tel)
            .input('d', sql.VarChar(150), dir)
            .input('c', sql.VarChar(100), correo)
            .input('fecha', sql.DateTime, ahora)
            .query(`UPDATE PRK_TICKETS 
                    SET ESTADO = 'Perdido', 
                        FOTO_DNI_BASE64 = @fd, 
                        FOTO_ROSTRO_BASE64 = @fr, 
                        TEL_CONTACTO = @t, 
                        DIR_CONTACTO = @d, 
                        CORREO_CONTACTO = @c, 
                        FECHA_SALIDA = @fecha, 
                        HORA_SALIDA = @fecha, 
                        FECHA_ACTA_PERDIDA = @fecha 
                    WHERE ID_TICKET = @id`);
        res.json({ mensaje: "OK" });
    } catch (e) { 
        res.status(500).send("Error en protocolo de pérdida: " + e.message); 
    }
});

module.exports = router;