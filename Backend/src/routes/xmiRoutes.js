// src/routes/xmiRoutes.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { exportarXMI, importarXMI, upload } = require('../controllers/xmiController');

// IMPORTANTE: Deben ser POST, y la ruta debe coincidir con lo que llama el frontend (/api/xmi/exportar)
router.post('/exportar', verificarToken, exportarXMI);
router.post('/importar', verificarToken, upload.single('file'), importarXMI);

module.exports = router;