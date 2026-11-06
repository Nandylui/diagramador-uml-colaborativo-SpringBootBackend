// src/controllers/exportController.js
// Controlador para exportar diagramas UML a un proyecto Spring Boot

const db = require('../config/db');
const ejs = require('ejs');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Función para mapear tipos de datos SQL a tipos de datos Java
const sqlToJava = (type) => {
    const t = type?.toUpperCase() || "";
    if (t.includes("CHAR") || t === "TEXT" || t === "STRING") return "String";
    if (["INT", "INTEGER", "SMALLINT"].includes(t)) return "Integer";
    if (t === "BIGINT" || t === "LONG") return "Long";
    if (["BOOLEAN", "BIT"].includes(t)) return "Boolean";
    if (t === "DATE") return "LocalDate";
    if (["TIMESTAMP", "DATETIME"].includes(t)) return "LocalDateTime";
    if (t === "DECIMAL" || t.startsWith("NUMERIC")) return "BigDecimal";
    return "String";
};

// Función para convertir nombres de atributos a formato camelCase
const toFieldName = (n) => {
    const str = n.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    return str.charAt(0).toLowerCase() + str.slice(1);
};

// Función para capitalizar la primera letra de una cadena
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Función para obtener el ID del usuario desde la solicitud
const getUserId = (req) => {
    return req.user?.id || req.usuario?.id || req.user?.id_usuario || req.usuario?.id_usuario;
};

// ============================================================================
// FUNCION COMPARTIDA PARA GENERAR EL PROYECTO
// ============================================================================
const generarProyecto = async (nodes, edges, projectName, res) => {
    try {
        const clasesUML = nodes.filter(n => n.type === 'umlClass' && !n.data.label.includes('<<interface>>'));

        if (clasesUML.length === 0) {
             return res.status(400).json({ error: 'No hay clases válidas para exportar en el diagrama' });
        }

        // --- NUEVA LÓGICA DE RELACIONES ---
        // Procesamos las líneas (edges) para inyectar foráneas basadas en multiplicidad
        const relationsMap = {}; 
        (edges || []).forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return;

            const fromMult = (edge.data?.fromMultiplicity || "").toLowerCase();
            const toMult = (edge.data?.toMultiplicity || "").toLowerCase();
            const sourceName = sourceNode.data.label.replace('<<interface>>\n', '').trim();
            const targetName = targetNode.data.label.replace('<<interface>>\n', '').trim();
            const isMany = (v) => v.includes('*') || v.includes('n') || v.includes('m');

            // Regla de oro (1 a Muchos): La FK se pone en la tabla de los Muchos.
            // Si Origen es 1 y Destino es *, Destino recibe la foránea
            if (!isMany(fromMult) && isMany(toMult)) {
                if (!relationsMap[targetName]) relationsMap[targetName] = [];
                relationsMap[targetName].push({
                    RefClass: capitalize(toFieldName(sourceName)),
                    refName: toFieldName(sourceName),
                    colName: `id_${sourceName.toLowerCase()}`
                });
            }
            // Si Origen es * y Destino es 1, Origen recibe la foránea
            else if (isMany(fromMult) && !isMany(toMult)) {
                if (!relationsMap[sourceName]) relationsMap[sourceName] = [];
                relationsMap[sourceName].push({
                    RefClass: capitalize(toFieldName(targetName)),
                    refName: toFieldName(targetName),
                    colName: `id_${targetName.toLowerCase()}`
                });
            }
        });
        // -----------------------------------

        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), `sb-${projectName}-`));
        const basePath = path.join(tmpRoot, "src", "main", "java", "com", "example", projectName);
        const resPath = path.join(tmpRoot, "src", "main", "resources");
        const templatesPath = path.join(__dirname, '..', 'templates');

        await fs.ensureDir(basePath);
        await fs.ensureDir(resPath);

        const pomTpl = await fs.readFile(path.join(templatesPath, 'pom.xml.ejs'), 'utf8');
        await fs.writeFile(path.join(tmpRoot, "pom.xml"), ejs.render(pomTpl, { projectName }));

        const demoTpl = await fs.readFile(path.join(templatesPath, 'DemoApplication.java.ejs'), 'utf8');
        await fs.writeFile(path.join(basePath, "DemoApplication.java"), ejs.render(demoTpl, { projectName }));

        for (const nodo of clasesUML) {
             const nombreClase = nodo.data.label.replace('<<interface>>\n', '').trim();
             const EntityName = capitalize(toFieldName(nombreClase));
             
             const entityDir = path.join(basePath, "domain");
             const dtoDir = path.join(basePath, "dto");
             const repoDir = path.join(basePath, "repository");
             const serviceDir = path.join(basePath, "service");
             const ctrlDir = path.join(basePath, "controller");

             await Promise.all([fs.ensureDir(entityDir), fs.ensureDir(dtoDir), fs.ensureDir(repoDir), fs.ensureDir(serviceDir), fs.ensureDir(ctrlDir)]);

             const cols = (nodo.data.atributos || []).map((attr) => {
                 const limpio = attr.replace(/^[\+\-\#]\s*/, '').trim();
                 const [nombreAttr, tipoAttr] = limpio.split(':').map(s => s.trim());
                 return {
                     name: nombreAttr,
                     type: tipoAttr || "String",
                     javaType: sqlToJava(tipoAttr),
                     fieldName: toFieldName(nombreAttr),
                     FieldNameCapital: capitalize(toFieldName(nombreAttr))
                 };
             });

             // NUEVO: Agregamos las relaciones mapeadas a las variables de EJS
             const relations = relationsMap[nombreClase] || [];

             const variablesEjs = {
                 projectName,
                 tableName: nombreClase.toLowerCase(),
                 EntityName,
                 columns: cols,
                 relations: relations, // <-- Array con las llaves foráneas inyectadas
                 hasLocalDate: cols.some(c => c.javaType === "LocalDate"),
                 hasLocalDateTime: cols.some(c => c.javaType === "LocalDateTime")
             };

             const entityTpl = await fs.readFile(path.join(templatesPath, 'entity.ejs'), 'utf8');
             await fs.writeFile(path.join(entityDir, `${EntityName}.java`), ejs.render(entityTpl, variablesEjs));

             const dtoTpl = await fs.readFile(path.join(templatesPath, 'dto.ejs'), 'utf8');
             await fs.writeFile(path.join(dtoDir, `${EntityName}Dto.java`), ejs.render(dtoTpl, variablesEjs));

             const repoTpl = await fs.readFile(path.join(templatesPath, 'repository.ejs'), 'utf8');
             await fs.writeFile(path.join(repoDir, `${EntityName}Repository.java`), ejs.render(repoTpl, variablesEjs));

             const serviceTpl = await fs.readFile(path.join(templatesPath, 'service.ejs'), 'utf8');
             await fs.writeFile(path.join(serviceDir, `${EntityName}Service.java`), ejs.render(serviceTpl, variablesEjs));

             const ctrlTpl = await fs.readFile(path.join(templatesPath, 'controller.ejs'), 'utf8');
             await fs.writeFile(path.join(ctrlDir, `${EntityName}Controller.java`), ejs.render(ctrlTpl, { projectName, EntityName, entityPath: nombreClase.toLowerCase() }));
        }

        const propertiesPath = path.join(templatesPath, 'application.properties.ejs');
        const propertiesContent = await ejs.renderFile(propertiesPath, { projectName });
        await fs.writeFile(path.join(resPath, "application.properties"), propertiesContent);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=${projectName}.zip`);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.on("error", (err) => { if (!res.headersSent) res.status(500).json({ error: 'Error al comprimir' }); });
        res.on('close', () => fs.remove(tmpRoot).catch(console.error));
        archive.pipe(res);
        archive.directory(tmpRoot, false);
        await archive.finalize();

    } catch (error) {
        if (!res.headersSent) res.status(500).json({ error: 'Error al generar Spring Boot', detalle: error.message });
    }
};

// ============================================================================
// 1. EXPORTACIÓN DESDE SALAS (BD)
// ============================================================================
const exportarASpringBoot = async (req, res) => {
    const { id } = req.params; 
    const userId = getUserId(req);

    try {
        let salaQuery = await db.query(
            `SELECT r.diagrama, r.name 
             FROM rooms r 
             LEFT JOIN user_room ur ON r.id = ur.room_id 
             WHERE r.id = $1 AND (r.ownerid = $2 OR ur.user_id = $2)`, 
            [id, userId]
        );

        if (salaQuery.rows.length === 0) {
            salaQuery = await db.query('SELECT diagrama, name FROM rooms WHERE id = $1 AND (ownerid = $2 OR id IN (SELECT room_id FROM user_room WHERE user_id = $2))', [id, userId]);
        }

        if (salaQuery.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a esta sala o no existe' });
        }

        const diagramaJson = salaQuery.rows[0].diagrama;
        
        if (!diagramaJson || !diagramaJson.nodes || diagramaJson.nodes.length === 0) {
             return res.status(400).json({ error: 'El diagrama está vacío o no contiene clases válidas' });
        }

        const projectName = (salaQuery.rows[0].name || "proyecto_generado").replace(/\s+/g, "").toLowerCase();
        
        // CORRECCIÓN: Ahora le pasamos diagramaJson.edges a la función
        await generarProyecto(diagramaJson.nodes, diagramaJson.edges || [], projectName, res);

    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno de BD' });
    }
};

// ============================================================================
// 2. NUEVO: EXPORTACIÓN DIRECTA DESDE EL LIENZO (LOCAL / INDIVIDUAL)
// ============================================================================
const exportarASpringBootLocal = async (req, res) => {
    try {
        // CORRECCIÓN: Ahora recibimos los nodes Y los edges desde el frontend
        const { nodes, edges } = req.body; 

        if (!nodes || nodes.length === 0) {
             return res.status(400).json({ error: 'El diagrama está vacío o no contiene clases válidas' });
        }

        const projectName = "proyecto_local";
        
        // CORRECCIÓN: Le pasamos los edges a la función
        await generarProyecto(nodes, edges || [], projectName, res);

    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno en exportación local' });
    }
};

module.exports = { exportarASpringBoot, exportarASpringBootLocal };