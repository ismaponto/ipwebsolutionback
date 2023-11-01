const express = require('express');
const router = express.Router();
const pool = require('../controls/db');


router.get('/', async(req, res) => {
    app.get('/confirm', async(req, res) => {
        const token = req.query.token;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Busca un usuario con el token de confirmación en la base de datos
            const result = await client.query('SELECT email FROM subscribers WHERE confirmation_token = $1', [token]);
            if (result.rows.length === 1) {
                const user = result.rows[0];
                // Actualiza el estado de suscripción del usuario a "true" y borra el token de confirmación
                await client.query('UPDATE subscribers SET subscribed = true, confirmation_token = null WHERE email = $1', [user.email]);
                await client.query('COMMIT');
                res.send('¡Tu suscripción ha sido confirmada!');
            } else {
                await client.query('ROLLBACK');
                res.status(400).send('Token de confirmación no válido.');
            }
        } catch (e) {
            await client.query('ROLLBACK');

            // Manejo de error general
            console.error('Error al confirmar suscripción:', e);
            res.status(500).send('Error al confirmar suscripción.');
        } finally {
            client.release();
        }
    });
});

module.exports = router;