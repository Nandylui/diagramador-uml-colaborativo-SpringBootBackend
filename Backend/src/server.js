// src/server.js
// Servidor principal de la aplicación
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

// Importamos las rutas
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const aiRoutes = require('./routes/aiRoutes');
const xmiRoutes = require('./routes/xmiRoutes');

// 1. NUEVAS IMPORTACIONES PARA WEBSOCKETS
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// 2. CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Más adelante aquí pondremos la URL de tu React
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); 
// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/salas', roomRoutes);
app.use('/api/ia', aiRoutes);
app.use('/api/xmi', xmiRoutes);

// Ruta de prueba para verificar que el servidor y la base de datos están funcionando
app.get('/api/test', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() AS hora_actual');
        res.json({
            mensaje: '¡Servidor Backend funcionando correctamente!',
            bd: 'Conectado a PostgreSQL',
            hora: result.rows[0].hora_actual
        });
    } catch (error) {
        res.status(500).json({ error: 'Error conectando a la base de datos' });
    }
});

// 3. LÓGICA DE COLABORACIÓN EN TIEMPO REAL (SOCKET.IO)
io.on('connection', (socket) => {
    console.log(` Nuevo usuario conectado al túnel WebSocket: ${socket.id}`);

    // A. Cuando un usuario entra a la pizarra de una sala específica
    socket.on('unirse-pizarra', (salaId) => {
        socket.join(salaId);
        console.log(`Usuario ${socket.id} entró a la pizarra de la sala: ${salaId}`);
    });

    // B. Cuando un usuario mueve, crea o edita un componente UML
    socket.on('cambio-diagrama', (data) => {
        // data contendrá: { salaId: 1, diagrama: { ...nuevo json del UML... } }
        
        // Retransmitimos este cambio a todos los demás en la misma sala (excepto al que lo envió)
        socket.to(data.salaId).emit('actualizar-pizarra', data.diagrama);
    });

    // C. Cuando el usuario cierra la pestaña
    socket.on('disconnect', () => {
        console.log(` Usuario desconectado: ${socket.id}`);
    });
});

// 4. ATENCIÓN: AHORA LEVANTAMOS 'server' EN LUGAR DE 'app'
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(` Servidor HTTP y WebSockets corriendo en http://localhost:${PORT}`);
});