// src/middlewares/authMiddleware.js
// Middleware para verificar el token JWT en las solicitudes
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Leer el token desde los encabezados de la petición
    const token = req.header('Authorization');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token de seguridad.' });
    }

    try {
        // Quitamos la palabra "Bearer " si viene incluida y verificamos
        const tokenLimpio = token.replace('Bearer ', '');
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // Guardamos los datos del usuario (id, email) en la petición para usarlos después
        req.user = verificado;
        next(); // El token es válido, dejamos pasar al usuario
    } catch (error) {
        res.status(400).json({ error: 'Token no válido o ha expirado.' });
    }
};

// Exportamos el middleware para que pueda ser utilizado en las rutas
module.exports = verificarToken;