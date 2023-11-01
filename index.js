const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


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