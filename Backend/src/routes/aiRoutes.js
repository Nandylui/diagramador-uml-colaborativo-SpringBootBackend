// src/routes/aiRoutes.js
// Rutas para la generación de diagramas UML mediante IA
const express = require('express');
const router = express.Router();
const multer = require('multer');
const verificarToken = require('../middlewares/authMiddleware');
const { procesarInstruccionIA, generarDesdeImagen } = require('../controllers/aiController');

// Configuración de multer para manejar la subida de imágenes ..FALTA TERMINAR....
const upload = multer({ storage: multer.memoryStorage() });

// Ruta para generar UML con texto/voz (Protegida)
router.post('/generar', verificarToken, procesarInstruccionIA);
router.post('/generar-imagen', verificarToken, upload.single('imagen'), generarDesdeImagen);
// router.post('/vision', verificarToken, upload.single('imagen'), generarDesdeImagen);

// Exportamos el router para que pueda ser usado en app.js
module.exports = router;