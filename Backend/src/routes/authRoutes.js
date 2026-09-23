// src/routes/authRoutes.js
// Rutas relacionadas con la autenticación de usuarios (registro e inicio de sesión)
const express = require('express');
const router = express.Router();
// Importamos ambas funciones del controlador
const { registrarUsuario, iniciarSesion } = require('../controllers/authController'); 

router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);

// Exportamos el router para que pueda ser utilizado en la aplicación principal
module.exports = router;