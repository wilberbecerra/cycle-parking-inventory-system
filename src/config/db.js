const sql = require('mssql');
require('dotenv').config();

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT), 
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        console.log('✅ Conexión exitosa a la base de datos SQL Server (Puerto 1435)');
        return pool;
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return null;
    }
};

module.exports = { getConnection };