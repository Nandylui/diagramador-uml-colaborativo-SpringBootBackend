// src/routes/xmiRoutes.js
// Rutas para la exportación e importación de diagramas en formato XMI
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { exportarXMI, importarXMI, upload } = require('../controllers/xmiController');

// Ruta para exportar un diagrama a XMI
router.get('/:id/exportar/xmi', verificarToken, exportarXMI);
router.post('/:id/importar/xmi', verificarToken, upload.single('file'), importarXMI);

// Exportamos el router para que pueda ser usado en app.js
module.exports = router;