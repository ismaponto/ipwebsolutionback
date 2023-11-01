const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    ssl: true
}));

// Importa y configura las rutas directamente en el archivo principal
const subscribeRouter = require('./routes/subscribe');
const confirmRouter = require('./routes/confirm');
const cancelRouter = require('./routes/cancel');

// Utiliza las rutas importadas
app.use('/subscribe', subscribeRouter);
app.use('/confirmar', confirmRouter);
app.use('/cancelar', cancelRouter);

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});