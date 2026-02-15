const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
const sql = require('mssql');
const { getConnection } = require('../config/db'); // CORRECCIÓN: ../ para salir a src

const TOKEN_API = "1c625f4160a670b2a295f7f52624cfc5"; 
const URL_BASE = "https://api.peruapi.com/api";
const agent = new https.Agent({ rejectUnauthorized: false });

// Historial Hoy
router.get('/hoy', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT t.CODIGO_CORRELATIVO, c.NOMBRE_COMPLETO as Cliente, c.DNI, 
                   ISNULL(c.TIPO_DOCUMENTO, 'DNI') as TIPO_DOCUMENTO,
                   t.TIPO_VEHICULO, t.MARCA_BICI, t.COLOR_BICI, 
                   t.ESTADO, t.HORA_INGRESO, t.HORA_SALIDA
            FROM PRK_TICKETS t
            INNER JOIN PRK_CLIENTES c ON t.DNI_CLIENTE = c.DNI
            WHERE CAST(t.FECHA_INGRESO AS DATE) = CAST(GETDATE() AS DATE)
            ORDER BY t.ID_TICKET DESC`);
        res.json(result.recordset);
    } catch (e) { res.status(500).send(e.message); }
});

// Identidad (DNI/CE)
router.get('/identidad/:tipo/:documento', async (req, res) => {
    const { tipo, documento } = req.params;
    try {
        const pool = await getConnection();
        const local = await pool.request().input('doc', documento).query('SELECT NOMBRE_COMPLETO FROM PRK_CLIENTES WHERE DNI = @doc');
        if (local.recordset.length > 0) return res.json({ nombre: local.recordset[0].NOMBRE_COMPLETO });
        
        const response = await axios.get(`${URL_BASE}/${tipo.toLowerCase()}/${documento}?token=${TOKEN_API}`, { httpsAgent: agent });
        const data = response.data;
        const nombre = data.nombre_completo || (data.nombres ? `${data.nombres} ${data.apellido_paterno}` : null);
        
        if (nombre) {
            await pool.request().input('doc', documento).input('nom', nombre).input('tipo', tipo).query("INSERT INTO PRK_CLIENTES (DNI, NOMBRE_COMPLETO, TIPO_DOCUMENTO, ORIGEN_DATOS, TIPO_CLIENTE) VALUES (@doc, @nom, @tipo, 'API', 'General')");
            res.json({ nombre });
        } else { res.status(404).send("No encontrado"); }
    } catch (e) { res.status(503).send("API error"); }
});

module.exports = router;