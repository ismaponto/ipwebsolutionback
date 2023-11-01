const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true
});


router.get('/', async(req, res) => {
    const email = req.query.email;

    try {
        // Actualiza el estado de suscripción del usuario a "false" para cancelar la suscripción
        const result = await pool.query('UPDATE subscribers SET unsubscribed = true WHERE email = $1', [email]);

        if (result.rowCount === 1) {
            // La actualización tuvo éxito
            res.send('Tu suscripción ha sido cancelada.');
        } else {
            // No se encontró el usuario con el correo electrónico especificado
            res.status(404).send('Usuario no encontrado.');
        }
    } catch (error) {
        console.error('Error al cancelar la suscripción:', error);

        // Manejo de error general
        res.status(500).send('Error al cancelar la suscripción.');
    }
});

module.exports = router;