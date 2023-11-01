const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true
});
router.post('/', async(req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // O cualquier otro servicio de correo
        auth: {
            user: process.env.EMAIL_USER, // Utiliza la variable de entorno para el correo
            pass: process.env.EMAIL_PASSWORD // Utiliza la variable de entorno para la contraseña
        }
    });
    app.post('/contacto', async(req, res) => {
        const { email, nombre, apellido } = req.body;
        const confirmationToken = require('crypto').randomBytes(32).toString('hex'); // Genera un token de confirmación de forma segura

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Validación de datos de entrada (asegúrate de hacer una validación más completa)
            if (!email || !nombre || !apellido) {
                throw new Error('Datos de entrada incompletos');
            }

            // Inserta el nuevo suscriptor en la base de datos con el token de confirmación
            const insertQuery = 'INSERT INTO subscribers (email, nombre, apellido, confirmation_token, Subscribed, Unsubscribed) VALUES($1, $2, $3, $4, $5, $6)';
            await client.query(insertQuery, [email, nombre, apellido, confirmationToken, 'false', 'false']);

            // Envía el correo de confirmación con el enlace que contiene el token
            const confirmationLink = `https://ipwebsolutionback.onrender.com/confirmar?token=${confirmationToken}`;
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Confirma tu suscripción',
                text: `Haz clic en el siguiente enlace para confirmar tu suscripción: ${confirmationLink}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo: ' + error);

                    // Manejo de error al enviar correo
                    res.status(500).json({ error: 'Error al enviar el correo de confirmación.' });
                } else {
                    console.log('Correo de confirmación enviado: ' + info.response);

                    // Éxito
                    res.json({ message: 'Correo de confirmación enviado.' });
                }
            });

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');

            // Manejo de error general
            console.error('Error en la solicitud:', e);
            res.status(500).json({ error: 'Error en la solicitud.' });
        } finally {
            client.release();
        }
    });

});

module.exports = router;