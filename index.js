const { Pool } = pg;
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER, // Nombre de usuario de la base de datos
    host: process.env.DB_HOST, // Nombre de host de la base de datos
    database: process.env.DB_NAME, // Nombre de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña de la base de datos
    port: process.env.DB_PORT, // Puerto de la base de datos
    ssl: true
});


const transporter = nodemailer.createTransport({
    service: 'Gmail', // O cualquier otro servicio de correo
    auth: {
        user: process.env.EMAIL_USER, // Utiliza la variable de entorno para el correo
        pass: process.env.EMAIL_PASSWORD // Utiliza la variable de entorno para la contraseña
    }
});

app.use(bodyParser.json());
// Crea un middleware de cors

app.use(cors({
    origin: 'https://ipwebsolutions.vercel.app', // Reemplaza con la URL de tu aplicación React
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Habilita las cookies y credenciales
}));


app.post('/contacto', async(req, res) => {
    const { email, nombre, apellido } = req.body;
    const userId = uuid.v4();
    const confirmationToken = crypto.randomBytes(32).toString('hex'); // Genera un token de confirmación

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Inserta el nuevo suscriptor en la base de datos con el token de confirmación
        await client.query('INSERT INTO subscribers (id, email, nombre, apellido, confirmation_token) VALUES ($1, $2, $3, $4, $5)', [userId, email, nombre, apellido, confirmationToken]);

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
                console.log('Error al enviar el correo: ' + error);
                res.status(500).json({ error: 'Error al enviar el correo de confirmación.' });
            } else {
                console.log('Correo de confirmación enviado: ' + info.response);
                res.json({ message: 'Correo de confirmación enviado.' });
            }
        });

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
});

app.get('/confirmar', async(req, res) => {
    const token = req.query.token;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Busca un usuario con el token de confirmación en la base de datos
        const result = await client.query('SELECT email FROM subscribers WHERE confirmation_token = $1', [token]);
        if (result.rows.length === 1) {
            const user = result.rows[0];
            // Actualiza el estado de suscripción del usuario a "true"
            await client.query('UPDATE subscribers SET subscribed = true, confirmation_token = null WHERE email = $1', [user.email]);
            await client.query('COMMIT');
            res.send('¡Tu suscripción ha sido confirmada!');
        } else {
            await client.query('ROLLBACK');
            res.status(400).send('Token de confirmación no válido.');
        }
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
});

app.get('/cancelar', async(req, res) => {
    const email = req.query.email;

    // Actualiza el estado de suscripción del usuario a "false" para cancelar la suscripción
    await pool.query('UPDATE subscribers SET unsubscribed = true WHERE email = $1', [email]);

    res.send('Tu suscripción ha sido cancelada.');
});

const testDatabaseConnection = async() => {
    try {
        const client = await pool.connect();
        console.log('Conexión a la base de datos exitosa');
        client.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
};

// Llama a la función de prueba de conexión antes de iniciar el servidor
testDatabaseConnection();

app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});