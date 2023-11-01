const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Conexión a la base de datos
const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true
});

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

app.use(bodyParser.json());
app.use(cors({
    origin: 'https://ipwebsolutions.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    ssl: true
}));

// Ruta para suscripción
app.post('/contacto', require('./routes/subscribe'));

// Ruta para confirmar suscripción
app.get('/confirmar', require('./routes/confirm'));

// Ruta para cancelar suscripción
app.get('/cancelar', require('./routes/cancel'));


// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});