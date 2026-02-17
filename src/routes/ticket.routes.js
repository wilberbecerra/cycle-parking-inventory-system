const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('../config/db');


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
        res.status(500).send(e.message); 
    }
});


router.post('/', async (req, res) => {
    let { dni_cliente, nombre_manual, marca, color, tipo_vehiculo, observaciones, id_usuario_ingreso } = req.body;

    try {

        if (dni_cliente) dni_cliente = dni_cliente.toString().replace(':1', '');
        const vUsuario = id_usuario_ingreso ? id_usuario_ingreso.toString().replace(':1', '') : 1;

        const pool = await getConnection();

        const check = await pool.request()
            .input('d', sql.VarChar(20), dni_cliente)
            .query('SELECT DNI FROM PRK_CLIENTES WHERE DNI = @d');

        if (check.recordset.length === 0) {
            await pool.request()
                .input('d', sql.VarChar(20), dni_cliente)
                .input('n', sql.VarChar(150), nombre_manual || 'CLIENTE NUEVO')
                .query(`INSERT INTO PRK_CLIENTES (DNI, NOMBRE_COMPLETO, TIPO_DOCUMENTO, ORIGEN_DATOS, TIPO_CLIENTE) 
                        VALUES (@d, @n, 'DNI', 'Manual', 'General')`);
        }

 
        const ahora = new Date();
        await pool.request()
            .input('d', sql.VarChar(20), dni_cliente)
            .input('u', sql.Int, parseInt(vUsuario))
            .input('m', sql.VarChar(50), marca || '')
            .input('c', sql.VarChar(50), color || '')
            .input('tv', sql.VarChar(50), tipo_vehiculo || 'Bicicleta')
            .input('obs', sql.VarChar(sql.MAX), observaciones || '')
            .input('fh', sql.DateTime, ahora)
 
            .query(`INSERT INTO PRK_TICKETS 
                    (DNI_CLIENTE, ID_USUARIO_INGRESO, MARCA_BICI, COLOR_BICI, TIPO_VEHICULO, OBSERVACIONES, TIENE_CADENA, ESTADO, FECHA_INGRESO, HORA_INGRESO) 
                    VALUES (@d, @u, @m, @c, @tv, @obs, 0, 'Activo', @fh, @fh)`);

        res.status(201).send("OK");
    } catch (e) {
        console.error("Error SQL:", e.message);
        res.status(500).send("Error interno: " + e.message);
    }
});


router.put('/salida/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request().input('id', req.params.id)
            .query(`UPDATE PRK_TICKETS
        SET ESTADO = 'Finalizado',
            FECHA_SALIDA = GETUTCDATE(),
            HORA_SALIDA = GETUTCDATE()
        WHERE ID_TICKET = @id`);
        res.json({ mensaje: "OK" });
    } catch (e) { res.status(500).send(e.message); }
});


router.put('/perdida/:id', async (req, res) => {
    const { id } = req.params;

    const { foto_dni, foto_rostro, telefono, direccion, correo } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', id)
            .input('fd', sql.VarChar(sql.MAX), foto_dni)
            .input('fr', sql.VarChar(sql.MAX), foto_rostro)

            .input('tel', sql.VarChar(20), telefono || '')
            .input('dir', sql.VarChar(200), direccion || '')
            .input('mail', sql.VarChar(100), correo || '')

            .query(`UPDATE PRK_TICKETS SET
        ESTADO = 'Perdido',
        ...
        FECHA_SALIDA = GETUTCDATE(),
        HORA_SALIDA = GETUTCDATE()
        WHERE ID_TICKET = @id`);

        res.json({ mensaje: "OK" });
    } catch (e) {
        console.error("Error en pérdida:", e);
        res.status(500).send(e.message);
    }
});


router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const { nombre_cliente, marca_bici, color_bici, observaciones } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, id)
            .input('n', sql.VarChar(100), nombre_cliente)
            .input('m', sql.VarChar(50), marca_bici)
            .input('c', sql.VarChar(50), color_bici)
            .input('obs', sql.VarChar(sql.MAX), observaciones)
            .query(`
                -- 1. Actualizamos el nombre en la tabla de Clientes usando un JOIN
                UPDATE C
                SET C.NOMBRE_COMPLETO = @n
                FROM PRK_CLIENTES C
                INNER JOIN PRK_TICKETS T ON C.DNI = T.DNI_CLIENTE
                WHERE T.ID_TICKET = @id;

                -- 2. Actualizamos los detalles de la bici en la tabla de Tickets
                UPDATE PRK_TICKETS
                SET MARCA_BICI = @m,
                    COLOR_BICI = @c,
                    OBSERVACIONES = @obs
                WHERE ID_TICKET = @id;
            `);

        res.json({ mensaje: "Ticket y Cliente actualizados correctamente" });
    } catch (e) {
        console.error("❌ Error al editar:", e.message);
        res.status(500).send("Error en la base de datos: " + e.message);
    }
});

module.exports = router;