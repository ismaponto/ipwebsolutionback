const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../controls/db'); // Asegúrate de proporcionar la ruta correcta a tu archivo de configuración de la piscina
const nodemailer = require('nodemailer');

function validarFormatoEmail(email) {
    // Expresión regular para validar el formato de correo electrónico
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    // Utiliza el método test para verificar si el email coincide con la expresión regular
    return regex.test(email);
}
router.post('/', async(req, res) => {

    const { email, nombre, apellido } = req.body;
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    console.log('1');
    const client = await pool.connect();

    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Nombre del servicio de correo (puedes usar otros servicios o configurar SMTP directamente)
        auth: {
            user: process.env.EMAIL_USER, // Tu dirección de correo electrónico
            pass: process.env.EMAIL_PASSWORD // Tu contraseña de correo electrónico
        }
    });

    try {
        await client.query('BEGIN');
        console.log('2')

        // Validación de datos de entrada (asegúrate de hacer una validación más completa)
        if (!email || !nombre || !apellido) {
            throw new Error('Datos de entrada incompletos');
        }
        console.log('3')

        // Verifica si el correo electrónico ya está en uso
        const checkEmailQuery = 'SELECT * FROM subscribers WHERE email = $1';
        const checkEmailResult = await client.query(checkEmailQuery, [email]);

        if (checkEmailResult.rows.length > 0) {
            // El correo electrónico ya está en uso, maneja el error
            res.status(400).json({
                error: 'El correo electrónico ya está registrado.',
                message: 'Este correo ya fue registrado'
            });
            return;
        }
        console.log('4')

        if (!validarFormatoEmail(email)) {
            res.status(400).json({
                error: 400,
                message: 'El correo electronico no tiene el formato correcto'
            });
            return;
        }

        // Inserta el nuevo suscriptor en la base de datos con el token de confirmación
        const insertQuery = 'INSERT INTO subscribers (email, nombre, apellido, confirmation_token, subscribed, unsubscribed) VALUES($1, $2, $3, $4, $5, $6)';
        await client.query(insertQuery, [email, nombre, apellido, confirmationToken, false, false]);

        // Envía el correo de confirmación con el enlace que contiene el token
        const confirmationLink = `https://ipwebsolutionback.onrender.com/confirmar?token=${confirmationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirma tu suscripción',
            text: `Haz clic en el siguiente enlace para confirmar tu suscripción: ${confirmationLink}`
        };
        console.log('5')

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

module.exports = router;