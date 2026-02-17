const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcryptjs'); 
const { getConnection } = require('../config/db');


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('u', sql.VarChar, username)
            .query('SELECT NOMBRE_EMPLEADO, ROL, PASSWORD_HASH FROM PRK_USUARIOS WHERE USERNAME = @u');
        
        if (result.recordset.length === 0) return res.status(401).send("Usuario no encontrado");

        const usuario = result.recordset[0];
        const matchPlano = (password === usuario.PASSWORD_HASH);
        let matchHash = false;
        if (usuario.PASSWORD_HASH && usuario.PASSWORD_HASH.startsWith('$2')) { 
            matchHash = await bcrypt.compare(password, usuario.PASSWORD_HASH);
        }

        if (matchPlano || matchHash) {
            res.json({ mensaje: "OK", usuario: { NOMBRE_EMPLEADO: usuario.NOMBRE_EMPLEADO, ROL: usuario.ROL } });
        } else {
            res.status(401).send("Contraseña incorrecta");
        }
    } catch (e) {
        res.status(500).send("Error del servidor");
    }
});


router.post('/registrar', async (req, res) => {
    const { nombre, username, password, rol } = req.body;
    if (!nombre || !username || !password || !rol) return res.status(400).send("Faltan datos");

    try {
        const pool = await getConnection();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.request()
            .input('nom', sql.VarChar, nombre)
            .input('u', sql.VarChar, username)
            .input('p', sql.VarChar, hashedPassword)
            .input('r', sql.VarChar, rol)
            .query("INSERT INTO PRK_USUARIOS (NOMBRE_EMPLEADO, USERNAME, PASSWORD_HASH, ROL, ID_SEDE) VALUES (@nom, @u, @p, @r, 1)");

        res.status(201).json({ mensaje: "Usuario creado correctamente" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Error al registrar en DB");
    }
});


router.get('/listar', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT ID_USUARIO, NOMBRE_EMPLEADO, USERNAME, ROL FROM PRK_USUARIOS');
        res.json(result.recordset);
    } catch (e) { res.status(500).send("Error al listar"); }
});


router.delete('/eliminar/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM PRK_USUARIOS WHERE ID_USUARIO = @id');
        res.send("Eliminado");
    } catch (e) { res.status(500).send("Error al eliminar"); }
});

module.exports = router;