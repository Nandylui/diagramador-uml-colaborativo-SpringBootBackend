// src/routes/roomRoutes.js
// Rutas para la gestión de salas y diagramas UML
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { exportarASpringBoot, exportarASpringBootLocal } = require('../controllers/exportController');
const { crearSala, unirseSala, obtenerMisSalas, actualizarSala, eliminarSala, guardarDiagrama, obtenerDiagrama } = require('../controllers/roomController');

// Todas estas rutas están protegidas por el middleware "verificarToken"
router.post('/crear', verificarToken, crearSala);
router.post('/unirse', verificarToken, unirseSala);
router.get('/mis-salas', verificarToken, obtenerMisSalas);
router.put('/actualizar/:id', verificarToken, actualizarSala);
router.delete('/eliminar/:id', verificarToken, eliminarSala);
router.put('/:id/diagrama', verificarToken, guardarDiagrama);
router.get('/:id/diagrama', verificarToken, obtenerDiagrama);
router.get('/:id/exportar/spring', verificarToken, exportarASpringBoot);
router.post('/exportar/spring-local', verificarToken, exportarASpringBootLocal);

// Exportamos el router para que pueda ser usado en app.js
module.exports = router;