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

// Función principal para exportar un diagrama UML a un proyecto Spring Boot
const exportarASpringBoot = async (req, res) => {
    const { id } = req.params; 
    const userId = getUserId(req);

    try {
        console.log(`➡️ 1. Iniciando exportación para la sala ID: ${id} por el usuario ID: ${userId}`);

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
            console.log("❌ Error: El usuario no tiene acceso a esta sala.");
            return res.status(403).json({ error: 'No tienes acceso a esta sala o no existe' });
        }

        const diagramaJson = salaQuery.rows[0].diagrama;
        
        // 🔥 CORRECCIÓN 1: React Flow guarda los elementos como 'nodes', no como 'clases'
        if (!diagramaJson || !diagramaJson.nodes || diagramaJson.nodes.length === 0) {
             console.log("❌ Error: Diagrama vacío o sin nodos.");
             return res.status(400).json({ error: 'El diagrama está vacío o no contiene clases válidas' });
        }

        // Filtramos solo los nodos que son clases UML (ignorando interfaces o notas si las hubiera)
        const clasesUML = diagramaJson.nodes.filter(n => n.type === 'umlClass' && !n.data.label.includes('<<interface>>'));

        if (clasesUML.length === 0) {
             return res.status(400).json({ error: 'No hay clases válidas para exportar en el diagrama' });
        }

        const projectName = (salaQuery.rows[0].name || "proyecto_generado").replace(/\s+/g, "").toLowerCase();
        console.log(`📁 2. Nombre del proyecto: ${projectName}`);

        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), `sb-${projectName}-`));
        console.log(`📂 3. Carpeta temporal creada en: ${tmpRoot}`);

        const basePath = path.join(tmpRoot, "src", "main", "java", "com", "example", projectName);
        const resPath = path.join(tmpRoot, "src", "main", "resources");
        const templatesPath = path.join(__dirname, '..', 'templates');

        await fs.ensureDir(basePath);
        await fs.ensureDir(resPath);

        console.log("📝 4. Generando archivos pom.xml y DemoApplication...");
        const pomTpl = await fs.readFile(path.join(templatesPath, 'pom.xml.ejs'), 'utf8');
        await fs.writeFile(path.join(tmpRoot, "pom.xml"), ejs.render(pomTpl, { projectName }));

        const demoTpl = await fs.readFile(path.join(templatesPath, 'DemoApplication.java.ejs'), 'utf8');
        await fs.writeFile(path.join(basePath, "DemoApplication.java"), ejs.render(demoTpl, { projectName }));

        console.log("⚙️ 5. Procesando clases del diagrama...");
        for (const nodo of clasesUML) {
             // 🔥 CORRECCIÓN 2: Extraemos el nombre desde nodo.data.label
             const nombreClase = nodo.data.label.replace('<<interface>>\n', '').trim();
             const EntityName = capitalize(toFieldName(nombreClase));
             console.log(`  -> Creando código para: ${EntityName}`);
             
             const entityDir = path.join(basePath, "domain");
             const dtoDir = path.join(basePath, "dto");
             const repoDir = path.join(basePath, "repository");
             const serviceDir = path.join(basePath, "service");
             const ctrlDir = path.join(basePath, "controller");

             await Promise.all([
                 fs.ensureDir(entityDir),
                 fs.ensureDir(dtoDir),
                 fs.ensureDir(repoDir),
                 fs.ensureDir(serviceDir),
                 fs.ensureDir(ctrlDir)
             ]);

             // 🔥 CORRECCIÓN 3: Extraemos los atributos desde nodo.data.atributos
             const cols = (nodo.data.atributos || []).map((attr) => {
                 const limpio = attr.replace(/^[\+\-\#]\s*/, '').trim();
                 const [nombreAttr, tipoAttr] = limpio.split(':').map(s => s.trim());
                 return {
                     name: nombreAttr,
                     type: tipoAttr || "String",
                     javaType: sqlToJava(tipoAttr),
                     fieldName: toFieldName(nombreAttr),
                     FieldNameCapital: capitalize(toFieldName(nombreAttr)),
                     pk: (nombreAttr || "").toLowerCase() === "id",
                     nullable: (nombreAttr || "").toLowerCase() !== "id"
                 };
             });

             const variablesEjs = {
                 projectName,
                 tableName: nombreClase.toLowerCase(),
                 EntityName,
                 columns: cols,
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
             await fs.writeFile(path.join(ctrlDir, `${EntityName}Controller.java`), ejs.render(ctrlTpl, { 
                 projectName, EntityName, entityPath: nombreClase.toLowerCase() 
             }));
        }

        console.log("🗄️ 6. Generando application.properties...");
        await fs.writeFile(
            path.join(resPath, "application.properties"),
            `spring.datasource.url=jdbc:postgresql://localhost:5432/${projectName}\nspring.datasource.username=postgres\nspring.datasource.password=postgres\nspring.jpa.hibernate.ddl-auto=update\n`
        );

        console.log("📦 7. Empaquetando en ZIP y enviando al cliente...");
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename=${projectName}.zip`);
        
        const archive = archiver("zip", { zlib: { level: 9 } });
        
        archive.on("error", (err) => { 
            console.error("❌ Error interno de archiver:", err);
            if (!res.headersSent) res.status(500).json({ error: 'Error al comprimir' });
        });
        
        res.on('close', () => {
            console.log("✅ 8. Envío completado. Limpiando archivos temporales...");
            fs.remove(tmpRoot).catch(console.error);
        });

        const salidaLocal = fs.createWriteStream(path.join(__dirname, '..', '..', `${projectName}.zip`));
        archive.pipe(salidaLocal);

        archive.pipe(res);
        archive.directory(tmpRoot, false);
        await archive.finalize();

    } catch (error) {
        console.error('❌ Error crítico al exportar a Spring Boot:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al generar el proyecto Spring Boot', detalle: error.message });
        }
    }
};

// Exportamos la función para que pueda ser utilizada en las rutas
module.exports = { exportarASpringBoot };