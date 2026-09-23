// src/controllers/xmiController.js
// Controlador para la exportación e importación de diagramas en formato XMI

const db = require('../config/db');
const multer = require('multer');
const xml2js = require('xml2js');

// Configuración de multer (guarda el archivo en memoria temporalmente)
const upload = multer({ storage: multer.memoryStorage() });

// Función para exportar un diagrama UML a formato XMI
const exportarXMI = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const salaQuery = await db.query(
            `SELECT r.diagrama, r.name FROM rooms r INNER JOIN user_room ur ON r.id = ur.room_id WHERE r.id = $1 AND ur.user_id = $2`, 
            [id, userId]
        );

        if (salaQuery.rows.length === 0) return res.status(403).json({ error: 'Sin acceso' });
        
        const diagramaJson = salaQuery.rows[0].diagrama;
        if (!diagramaJson || !diagramaJson.clases) return res.status(400).json({ error: 'Diagrama vacío' });

        const projectName = (salaQuery.rows[0].name || "ModeloUML").replace(/\s+/g, "_");
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">\n`;
        xml += `  <uml:Model xmi:id="Model_${id}" name="${projectName}">\n`;

        diagramaJson.clases.forEach((clase, index) => {
            const classId = `Class_${clase.nombre}_${index}`;
            xml += `    <packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${clase.nombre}">\n`;
            if (clase.atributos) {
                clase.atributos.forEach((attr, attrIndex) => {
                    const nombreAttr = attr.replace(/^[\+\-\#]\s*/, '').split(':')[0].trim() || `attr${attrIndex}`;
                    xml += `      <ownedAttribute xmi:type="uml:Property" xmi:id="${classId}_attr_${attrIndex}" name="${nombreAttr}" visibility="public" />\n`;
                });
            }
            if (clase.metodos) {
                clase.metodos.forEach((metodo, metIndex) => {
                    const nombreMetodo = metodo.replace(/^[\+\-\#]\s*/, '').split('(')[0].trim();
                    xml += `      <ownedOperation xmi:type="uml:Operation" xmi:id="${classId}_op_${metIndex}" name="${nombreMetodo}" visibility="public" />\n`;
                });
            }
            xml += `    </packagedElement>\n`;
        });

        xml += `  </uml:Model>\n</xmi:XMI>`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=${projectName}.xmi`);
        return res.status(200).send(xml);
    } catch (error) {
        res.status(500).json({ error: "Error al exportar" });
    }
};

// Función para mapear tipos de datos SQL a tipos de datos Java
const importarXMI = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo XMI' });
    }

    try {
        const xml = req.file.buffer.toString('utf8');
        const parser = new xml2js.Parser({ explicitArray: true });
        const result = await parser.parseStringPromise(xml);

        let diagramaJSON = { clases: [], relaciones: [] };
        let elementos = [];

        // Función recursiva para buscar los elementos empaquetados donde sea que estén en el XML
        const buscarElementos = (obj) => {
            if (!obj) return;
            if (obj['packagedElement']) elementos = elementos.concat(obj['packagedElement']);
            for (let key in obj) {
                if (typeof obj[key] === 'object') buscarElementos(obj[key]);
            }
        };
        
        buscarElementos(result);

        // Convertir etiquetas XML a Clases JSON
        elementos.forEach(el => {
            const attrs = el['$'] || {};
            if (attrs['xmi:type'] === 'uml:Class' && attrs.name) {
                let nuevaClase = { nombre: attrs.name, atributos: [], metodos: [] };
                
                if (el['ownedAttribute']) {
                    el['ownedAttribute'].forEach(attr => {
                        const data = attr['$'] || {};
                        if (data.name) nuevaClase.atributos.push(`+ ${data.name}: String`);
                    });
                }
                if (el['ownedOperation']) {
                    el['ownedOperation'].forEach(met => {
                        const data = met['$'] || {};
                        if (data.name) nuevaClase.metodos.push(`+ ${data.name}(): void`);
                    });
                }
                diagramaJSON.clases.push(nuevaClase);
            }
        });

        // Actualizar la base de datos con el nuevo JSON
        const update = await db.query(
            `UPDATE rooms SET diagrama = $1 WHERE id = $2 AND EXISTS (SELECT 1 FROM user_room WHERE room_id = $2 AND user_id = $3) RETURNING id`,
            [diagramaJSON, id, userId]
        );

        if (update.rowCount === 0) return res.status(403).json({ error: 'No tienes acceso a esta sala' });

        res.status(200).json({ mensaje: 'Archivo XMI importado con éxito', diagrama: diagramaJSON });

    } catch (error) {
        console.error("Error importando XMI:", error);
        res.status(500).json({ error: "El archivo no tiene un formato XMI válido" });
    }
};

// Exportamos las funciones para que puedan ser utilizadas en las rutas
module.exports = { exportarXMI, importarXMI, upload };