// src/controllers/roomController.js
// Controlador para manejar las solicitudes relacionadas con las salas de trabajo

const db = require('../config/db');

// Función auxiliar para generar un código de 6 caracteres
const generarCodigoInvitacion = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Función de seguridad: Extrae el ID del usuario independientemente de cómo se llame en el Token
const getUserId = (req) => {
    return req.user?.id || req.usuario?.id || req.user?.id_usuario || req.usuario?.id_usuario;
};

// 1. CREAR SALA 
const crearSala = async (req, res) => {
    const { name, descripcion } = req.body;
    const ownerid = getUserId(req); 
    const invitacion = generarCodigoInvitacion(); 

    try {
        const nuevaSala = await db.query(
            'INSERT INTO rooms (name, descripcion, invitacion, ownerid) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, descripcion, invitacion, ownerid]
        );

        const salaId = nuevaSala.rows[0].id;

        // Intentamos insertar en user_room (Plan A)
        try {
            await db.query(
                'INSERT INTO user_room (user_id, room_id) VALUES ($1, $2)',
                [ownerid, salaId]
            );
        } catch (e) {
            console.log(" Advertencia: No se pudo insertar en user_room. Revisa si las columnas son user_id y room_id.");
        }

        res.status(201).json({ mensaje: 'Sala creada exitosamente', sala: nuevaSala.rows[0] });
    } catch (error) {
        console.error(" Error en crearSala:", error);
        res.status(500).json({ message: 'Error al crear la sala: ' + error.message });
    }
};

// 2. UNIRSE A UNA SALA MEDIANTE CÓDIGO
const unirseSala = async (req, res) => {
    const { invitacion } = req.body;
    const userId = getUserId(req);

    try {
        const salaQuery = await db.query('SELECT * FROM rooms WHERE invitacion = $1', [invitacion]);
        if (salaQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Código de invitación inválido o sala no encontrada' });
        }

        const salaId = salaQuery.rows[0].id;

        try {
            const yaParticipa = await db.query('SELECT * FROM user_room WHERE user_id = $1 AND room_id = $2', [userId, salaId]);
            if (yaParticipa.rows.length > 0) {
                return res.status(400).json({ message: 'Ya eres miembro de esta sala' });
            }
            await db.query('INSERT INTO user_room (user_id, room_id) VALUES ($1, $2)', [userId, salaId]);
        } catch (e) {
            console.error(" Error en tabla user_room:", e.message);
            return res.status(500).json({ message: 'Error de BD con la tabla user_room. Revisa las columnas.' });
        }

        res.status(200).json({ mensaje: 'Te has unido a la sala exitosamente', sala: salaQuery.rows[0] });
    } catch (error) {
        console.error(" Error en unirseSala:", error);
        res.status(500).json({ message: 'Error al unirse a la sala: ' + error.message });
    }
};

// 3. VER MIS SALAS 
const obtenerMisSalas = async (req, res) => {
    const userId = getUserId(req);
    
    try {
        // PLAN A: Obtener salas donde soy dueño O donde estoy invitado (usando user_room)
        try {
            const salas = await db.query(
                `SELECT r.* FROM rooms r 
                 INNER JOIN user_room ur ON r.id = ur.room_id 
                 WHERE ur.user_id = $1`, 
                [userId]
            );
            
            // Si trae resultados, los devolvemos y listo.
            if (salas.rows.length > 0) {
                return res.status(200).json(salas.rows);
            }
        } catch (joinError) {
            console.log(" Advertencia: Falló JOIN con user_room. Pasando al Plan B (ownerid).");
        }

        // PLAN B (Fallback): Si falla el Plan A, solo obtener las salas donde soy dueño
        const salasPlanB = await db.query('SELECT * FROM rooms WHERE ownerid = $1', [userId]);
        res.status(200).json(salasPlanB.rows);

    } catch (error) {
        console.error(" Error grave en obtenerMisSalas:", error);
        res.status(500).json({ message: 'Error al obtener las salas: ' + error.message });
    }
};

// 4. ACTUALIZAR SALA
const actualizarSala = async (req, res) => {
    const { id } = req.params; 
    const { name, descripcion } = req.body;
    const ownerid = getUserId(req);

    try {
        const sala = await db.query('SELECT * FROM rooms WHERE id = $1 AND ownerid = $2', [id, ownerid]);
        if (sala.rows.length === 0) return res.status(403).json({ message: 'No tienes permiso o no existe' });

        const salaActualizada = await db.query(
            'UPDATE rooms SET name = $1, descripcion = $2 WHERE id = $3 RETURNING *',
            [name, descripcion, id]
        );
        res.status(200).json({ mensaje: 'Sala actualizada', sala: salaActualizada.rows[0] });
    } catch (error) {
        console.error(" Error en actualizarSala:", error);
        res.status(500).json({ message: 'Error al actualizar la sala' });
    }
};

// 5. ELIMINAR SALA
const eliminarSala = async (req, res) => {
    const { id } = req.params;
    const ownerid = getUserId(req);

    try {
        const sala = await db.query('SELECT * FROM rooms WHERE id = $1 AND ownerid = $2', [id, ownerid]);
        if (sala.rows.length === 0) return res.status(403).json({ message: 'No tienes permiso para eliminar esta sala' });

        // Borramos primero las relaciones de usuarios en la sala para evitar errores de llave foránea
        await db.query('DELETE FROM user_room WHERE room_id = $1', [id]);
        // Luego borramos la sala por completo
        await db.query('DELETE FROM rooms WHERE id = $1', [id]);

        res.status(200).json({ mensaje: 'Sala eliminada correctamente' });
    } catch (error) {
        console.error(" Error en eliminarSala:", error);
        res.status(500).json({ message: 'Error al eliminar la sala: ' + error.message });
    }
};

// 6. GUARDAR EL ESTADO DEL DIAGRAMA
const guardarDiagrama = async (req, res) => {
    const { id } = req.params;
    const { diagrama } = req.body; 
    const userId = getUserId(req);

    try {
        let tienePermiso = false;
        try {
            const participa = await db.query('SELECT * FROM user_room WHERE user_id = $1 AND room_id = $2', [userId, id]);
            if (participa.rows.length > 0) tienePermiso = true;
        } catch (e) {
            const esDueno = await db.query('SELECT * FROM rooms WHERE ownerid = $1 AND id = $2', [userId, id]);
            if (esDueno.rows.length > 0) tienePermiso = true;
        }

        if (!tienePermiso) return res.status(403).json({ message: 'No tienes acceso a esta sala' });

        await db.query('UPDATE rooms SET diagrama = $1 WHERE id = $2', [diagrama, id]);
        res.status(200).json({ mensaje: 'Diagrama guardado correctamente' });
    } catch (error) {
        console.error(" Error en guardarDiagrama:", error);
        res.status(500).json({ message: 'Error al guardar el diagrama' });
    }
};

// 7. OBTENER EL DIAGRAMA ACTUAL
const obtenerDiagrama = async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);

    try {
        let tienePermiso = false;
        try {
            const participa = await db.query('SELECT * FROM user_room WHERE user_id = $1 AND room_id = $2', [userId, id]);
            if (participa.rows.length > 0) tienePermiso = true;
        } catch (e) {
            const esDueno = await db.query('SELECT * FROM rooms WHERE ownerid = $1 AND id = $2', [userId, id]);
            if (esDueno.rows.length > 0) tienePermiso = true;
        }

        if (!tienePermiso) return res.status(403).json({ message: 'No tienes acceso a esta sala' });

        const sala = await db.query('SELECT diagrama FROM rooms WHERE id = $1', [id]);
        res.status(200).json({ diagrama: sala.rows[0].diagrama || {} });
    } catch (error) {
        console.error(" Error en obtenerDiagrama:", error);
        res.status(500).json({ message: 'Error al obtener el diagrama' });
    }
};

// Exportamos todas las funciones del controlador
module.exports = { crearSala, unirseSala, obtenerMisSalas, actualizarSala, eliminarSala, guardarDiagrama, obtenerDiagrama };