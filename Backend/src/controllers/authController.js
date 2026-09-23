// src/controllers/authController.js
// Controlador para la autenticación de usuarios
// Incluye funciones para registrar usuarios e iniciar sesión

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importamos la librería de seguridad JWT
const db = require('../config/db');

// FUNCIÓN: CU1 Registro de Usuario
const registrarUsuario = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExist = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO usuarios (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: newUser.rows[0]
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar el usuario' });
    }
};

// FUNCIÓN: CU2 Inicio de Sesión
const iniciarSesion = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar si el correo existe en la base de datos
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];

        // 2. Comparar la contraseña escrita con la encriptada
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // 3. Generar el Token de Acceso (JWT)
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // El token caduca en 8 horas por seguridad
        );

        // 4. Responder con el token
        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Exportamos ambas funciones
module.exports = { registrarUsuario, iniciarSesion };