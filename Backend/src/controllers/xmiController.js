const multer = require('multer');
const xml2js = require('xml2js');

const upload = multer({ storage: multer.memoryStorage() });

const exportarXMI = async (req, res) => {
    try {
        const { nodes, edges } = req.body;
        
        if (!nodes || nodes.length === 0) {
            return res.status(400).json({ error: 'El diagrama está vacío' });
        }

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<xmi:XMI xmi:version="2.1" xmlns:uml="http://schema.omg.org/spec/UML/2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1">\n`;
        xml += `  <xmi:Documentation exporter="Enterprise Architect" exporterVersion="6.5"/>\n`;
        // TÁCTICA 1: Todo debe llamarse "EAID_..." para que EA no rechace las coordenadas
        xml += `  <uml:Model xmi:type="uml:Model" name="EA_Model" xmi:id="EAID_MODEL_1">\n`;
        xml += `    <packagedElement xmi:type="uml:Package" xmi:id="EAID_PKG_1" name="ModeloDiagramador">\n`;

        const clasesUML = nodes.filter(n => n.type === 'umlClass');
        let diagramElements = ""; 
        let eaConnectors = ""; 
        let extendedElements = ""; 

        // TÁCTICA 2: Generar IDs hexadecimales estrictos de 8 caracteres para los objetos visuales
        const genDuid = () => Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0').toUpperCase();
        
        const idMap = {};
        clasesUML.forEach((nodo, i) => {
            idMap[nodo.id] = `EAID_CLS_${nodo.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}_${i}`;
        });

        // --- EXPORTAR TODAS LAS CLASES ---
        clasesUML.forEach((nodo, indexClase) => {
            const nombreClase = nodo.data.label.replace('<<interface>>\n', '').trim();
            const classId = idMap[nodo.id];
            
            xml += `      <packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${nombreClase}">\n`;
            
            extendedElements += `      <element xmi:idref="${classId}" xmi:type="uml:Class" name="${nombreClase}" scope="public">\n`;
            let eaAttributes = "";

            if (edges && edges.length > 0) {
                edges.forEach((edge, idx) => {
                    if (edge.source === nodo.id && edge.data && edge.data.label === "Generalización") {
                        const targetNode = nodes.find(n => n.id === edge.target);
                        if (targetNode) {
                            const targetId = idMap[targetNode.id];
                            xml += `        <generalization xmi:type="uml:Generalization" xmi:id="EAID_GEN_${idx}" general="${targetId}"/>\n`;
                        }
                    }
                });
            }

            if (nodo.data.atributos) {
                nodo.data.atributos.forEach((attr, attrIndex) => {
                    const nombreAttr = attr.replace(/^[\+\-\#]\s*/, '').split(':')[0].trim() || `attr${attrIndex}`;
                    const attrId = `${classId}_ATTR_${attrIndex}`;
                    xml += `        <ownedAttribute xmi:type="uml:Property" xmi:id="${attrId}" name="${nombreAttr}" visibility="public" isUnique="true" />\n`;
                    
                    // Aseguramos el orden (position) y le decimos que es un String nativo
                    eaAttributes += `          <attribute xmi:idref="${attrId}" name="${nombreAttr}">\n`;
                    eaAttributes += `            <properties type="String" position="${attrIndex}"/>\n`;
                    eaAttributes += `          </attribute>\n`;
                });
            }
            if (nodo.data.metodos) {
                nodo.data.metodos.forEach((metodo, metIndex) => {
                    const nombreMetodo = metodo.replace(/^[\+\-\#]\s*/, '').split('(')[0].trim();
                    const opId = `${classId}_OP_${metIndex}`;
                    xml += `        <ownedOperation xmi:type="uml:Operation" xmi:id="${opId}" name="${nombreMetodo}" visibility="public" />\n`;
                });
            }
            xml += `      </packagedElement>\n`;

            if (eaAttributes !== "") {
                extendedElements += `        <attributes>\n${eaAttributes}        </attributes>\n`;
            }
            extendedElements += `      </element>\n`;

            const left = nodo.position && nodo.position.x !== undefined ? Math.round(nodo.position.x) : (indexClase * 200 + 100);
            const top = nodo.position && nodo.position.y !== undefined ? Math.round(nodo.position.y) : (indexClase * 150 + 100);
            const duid = genDuid();
            
            // Las coordenadas ya no serán ignoradas gracias al DUID hexadecimal
            diagramElements += `        <element geometry="Left=${left};Top=${top};Right=${left + 150};Bottom=${top + 100};" subject="${classId}" seqno="${indexClase + 1}" style="DUID=${duid};"/>\n`;
        });

        // --- EXPORTAR RELACIONES ---
        if (edges && edges.length > 0) {
            edges.forEach((edge, index) => {
                if (edge.type === "associativeLink") return; 

                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (sourceNode && targetNode) {
                    const sourceId = idMap[sourceNode.id];
                    const targetId = idMap[targetNode.id];
                    const assocId = `EAID_ASSOC_${index}`;

                    const srcMult = (edge.data && edge.data.fromMultiplicity) ? edge.data.fromMultiplicity : "";
                    const tgtMult = (edge.data && edge.data.toMultiplicity) ? edge.data.toMultiplicity : "";
                    let label = (edge.data && edge.data.label) ? edge.data.label : "Asociación";

                    let associativeClassId = null;
                    const assocLink = edges.find(e => e.type === "associativeLink" && e.data && e.data.originalSource === edge.source && e.data.originalTarget === edge.target);
                    if (assocLink) {
                        const linkedNode = nodes.find(n => n.id === assocLink.target);
                        if (linkedNode) {
                            associativeClassId = idMap[linkedNode.id];
                        }
                    }

                    if (label === "Generalización") {
                        eaConnectors += `        <connector xmi:idref="${assocId}">\n`;
                        eaConnectors += `          <source xmi:idref="${sourceId}"><model ea_localid="${index * 2}" type="Class"/></source>\n`;
                        eaConnectors += `          <target xmi:idref="${targetId}"><model ea_localid="${index * 2 + 1}" type="Class"/></target>\n`;
                        eaConnectors += `          <properties name="${label}" ea_type="Generalization" direction="Source -> Destination"/>\n`;
                        eaConnectors += `        </connector>\n`;
                        
                    } else if (label === "Dependencia" || label === "Realización") {
                        const umlT = label === "Realización" ? "uml:Realization" : "uml:Dependency";
                        const eaT = label === "Realización" ? "Realisation" : "Dependency";
                        
                        xml += `      <packagedElement xmi:type="${umlT}" xmi:id="${assocId}" client="${sourceId}" supplier="${targetId}"/>\n`;
                        
                        eaConnectors += `        <connector xmi:idref="${assocId}">\n`;
                        eaConnectors += `          <source xmi:idref="${sourceId}"><model ea_localid="${index * 2}" type="Class"/></source>\n`;
                        eaConnectors += `          <target xmi:idref="${targetId}"><model ea_localid="${index * 2 + 1}" type="Class"/></target>\n`;
                        eaConnectors += `          <properties name="${label}" ea_type="${eaT}" direction="Source -> Destination"/>\n`;
                        eaConnectors += `        </connector>\n`;
                        
                    } else {
                        // --- CORRECCIÓN: AGREGACIÓN Y COMPOSICIÓN ---
                        let eaType = "Association";
                        let srcAgg = "none";
                        
                        if (label === "Agregación") { eaType = "Aggregation"; srcAgg = "shared"; }
                        if (label === "Composición") { eaType = "Aggregation"; srcAgg = "composite"; }

                        xml += `      <packagedElement xmi:type="uml:Association" xmi:id="${assocId}" name="${label}">\n`;
                        xml += `        <memberEnd xmi:idref="${assocId}_src"/>\n`;
                        xml += `        <memberEnd xmi:idref="${assocId}_tgt"/>\n`;
                        
                        // CORRECCIÓN 1: Aplicar 'aggregation' al extremo SOURCE (origen)
                        xml += `        <ownedEnd xmi:type="uml:Property" xmi:id="${assocId}_src" type="${sourceId}" association="${assocId}" aggregation="${srcAgg}">\n`;
                        if (srcMult) {
                            xml += `          <lowerValue xmi:type="uml:LiteralString" xmi:id="${assocId}_src_lower" value="${srcMult.split('..')[0]}"/>\n`;
                            xml += `          <upperValue xmi:type="uml:LiteralString" xmi:id="${assocId}_src_upper" value="${srcMult.includes('..') ? srcMult.split('..')[1] : srcMult}"/>\n`;
                        }
                        xml += `        </ownedEnd>\n`;

                        // El extremo TARGET (destino) no lleva 'aggregation'
                        xml += `        <ownedEnd xmi:type="uml:Property" xmi:id="${assocId}_tgt" type="${targetId}" association="${assocId}">\n`;
                        if (tgtMult) {
                            xml += `          <lowerValue xmi:type="uml:LiteralString" xmi:id="${assocId}_tgt_lower" value="${tgtMult.split('..')[0]}"/>\n`;
                            xml += `          <upperValue xmi:type="uml:LiteralString" xmi:id="${assocId}_tgt_upper" value="${tgtMult.includes('..') ? tgtMult.split('..')[1] : tgtMult}"/>\n`;
                        }
                        xml += `        </ownedEnd>\n`;
                        xml += `      </packagedElement>\n`;

                        eaConnectors += `        <connector xmi:idref="${assocId}">\n`;
                        
                        // CORRECCIÓN 2: Aplicar 'aggregation' al bloque <source> en conectores EA
                        eaConnectors += `          <source xmi:idref="${sourceId}"><model ea_localid="${index * 2}" type="Class"/>`;
                        if (srcMult) eaConnectors += `<type multiplicity="${srcMult}" aggregation="${srcAgg}"/>`;
                        else eaConnectors += `<type aggregation="${srcAgg}"/>`;
                        eaConnectors += `</source>\n`;
                        
                        // El bloque <target> en conectores EA ya no lleva 'aggregation'
                        eaConnectors += `          <target xmi:idref="${targetId}"><model ea_localid="${index * 2 + 1}" type="Class"/>`;
                        if (tgtMult) eaConnectors += `<type multiplicity="${tgtMult}"/>`;
                        else eaConnectors += `<type/>`;
                        eaConnectors += `</target>\n`;
                        
                        eaConnectors += `          <properties name="${label}" ea_type="${eaType}" direction="Unspecified"/>\n`;
                        
                        if (associativeClassId) {
                            eaConnectors += `          <extendedProperties associationclass="${associativeClassId}"/>\n`;
                        }
                        eaConnectors += `        </connector>\n`;
                    }
                }
            });
        }

        xml += `    </packagedElement>\n`;
        xml += `  </uml:Model>\n`;
        
        xml += `  <xmi:Extension extender="Enterprise Architect" extenderID="6.5">\n`;
        xml += `    <elements>\n`;
        xml += `      <element xmi:idref="EAID_PKG_1" xmi:type="uml:Package" name="ModeloDiagramador" scope="public"/>\n`;
        
        if (extendedElements !== "") {
            xml += extendedElements;
        }
        
        xml += `    </elements>\n`;
        
        if (eaConnectors !== "") {
            xml += `    <connectors>\n${eaConnectors}    </connectors>\n`;
        }
        
        xml += `    <diagrams>\n`;
        xml += `      <diagram xmi:id="EAID_DIAG_1">\n`;
        xml += `        <model package="EAID_PKG_1" localID="1" owner="EAID_PKG_1"/>\n`;
        xml += `        <properties name="ModeloDiagramador" type="Logical"/>\n`;
        xml += `        <project author="System" version="1.0" created="2026-11-05 00:00:00" modified="2026-11-05 00:00:00"/>\n`;
        xml += `        <style1 value="ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=1;PPgs.cy=1;DocSize.cx=850;DocSize.cy=1098;ShowDetails=0;Orientation=P;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=1;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.1;ExplicitNavigability=0;ShowShape=1;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;ShowNotes=0;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;"/>\n`;
        xml += `        <style2 value="SaveTag=6C86208B;"/>\n`;
        xml += `        <elements>\n${diagramElements}        </elements>\n`;
        xml += `      </diagram>\n`;
        xml += `    </diagrams>\n`;
        xml += `  </xmi:Extension>\n`;
        xml += `</xmi:XMI>`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=diagrama.xmi`);
        return res.status(200).send(xml);
    } catch (error) {
        console.error("Error al exportar:", error);
        res.status(500).json({ error: "Error al exportar a XMI" });
    }
};

const importarXMI = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    try {
        const xml = req.file.buffer.toString('utf8');
        const parser = new xml2js.Parser({ explicitArray: true });
        const result = await parser.parseStringPromise(xml);

        let nodesGenerados = [];
        let edgesGenerados = [];
        let elementos = [];
        let idMap = {}; 
        let geoMap = {}; 

        // 1. Extraer coordenadas de forma flexible (sin importar el orden de atributos en <element>)
        const elementTagRegex = /<element\s+[^>]*geometry="([^"]+)"[^>]*subject="([^"]+)"|<element\s+[^>]*subject="([^"]+)"[^>]*geometry="([^"]+)"/g;
        let match;
        while ((match = elementTagRegex.exec(xml)) !== null) {
            const geomStr = match[1] || match[4];
            const subjectId = match[2] || match[3];
            
            const leftMatch = /Left=([-]?\d+)/i.exec(geomStr);
            const topMatch = /Top=([-]?\d+)/i.exec(geomStr);
            
            if (leftMatch && topMatch && subjectId) {
                geoMap[subjectId] = { 
                    x: parseInt(leftMatch[1], 10), 
                    y: Math.abs(parseInt(topMatch[1], 10)) // EA a veces exporta Top en negativo
                };
            }
        }

        // Ajuste de separación para evitar que las clases salgan pegadas en React Flow
        const esExportadoDeEA = xml.includes('exporter="Enterprise Architect"');
        const factorEscalaX = esExportadoDeEA ? 1.75 : 1;
        const factorEscalaY = esExportadoDeEA ? 2.1 : 1;

        const buscarElementos = (obj) => {
            if (!obj) return;
            if (obj['packagedElement']) elementos = elementos.concat(obj['packagedElement']);
            for (let key in obj) {
                if (typeof obj[key] === 'object' && key !== 'xmi:Extension') {
                    buscarElementos(obj[key]);
                }
            }
        };
        
        buscarElementos(result);

        // 2. Procesar todas las Clases
        let classIndex = 0;
        elementos.forEach((el) => {
            const attrs = el['$'] || {};
            if (attrs['xmi:type'] === 'uml:Class' && attrs.name) {
                const eaId = attrs['xmi:id'];
                const rfId = `nodo-${Date.now()}-${classIndex}`;
                idMap[eaId] = rfId;
                
                // Si no hay coordenadas, acomodar en cuadrícula limpia (4 columnas) en vez de apilar
                let posicion;
                if (geoMap[eaId]) {
                    posicion = {
                        x: Math.round(geoMap[eaId].x * factorEscalaX),
                        y: Math.round(geoMap[eaId].y * factorEscalaY)
                    };
                } else {
                    const col = classIndex % 4;
                    const row = Math.floor(classIndex / 4);
                    posicion = { x: 100 + (col * 320), y: 100 + (row * 260) };
                }
                classIndex++;

                let nuevaClase = {
                    id: rfId,
                    type: 'umlClass',
                    position: posicion,
                    data: { label: attrs.name, atributos: [], metodos: [] }
                };

                if (el['ownedAttribute']) {
                    el['ownedAttribute'].forEach(attr => {
                        const data = attr['$'] || {};
                        // Ignorar atributos que en realidad son extremos de asociaciones de EA
                        if (data.name && !data.association) {
                            nuevaClase.data.atributos.push(`+ ${data.name}: String`);
                        }
                    });
                }
                if (el['ownedOperation']) {
                    el['ownedOperation'].forEach(met => {
                        const data = met['$'] || {};
                        if (data.name) nuevaClase.data.metodos.push(`+ ${data.name}(): void`);
                    });
                }
                nodesGenerados.push(nuevaClase);

                // Generalizaciones anidadas en la clase
                if (el['generalization']) {
                    el['generalization'].forEach((gen, gIndex) => {
                        const genAttrs = gen['$'] || {};
                        if (genAttrs.general) {
                            edgesGenerados.push({
                                id: `edge-gen-${Date.now()}-${classIndex}-${gIndex}`,
                                source: rfId, 
                                target: genAttrs.general, // Se traduce a rfId abajo
                                type: 'umlEdge',
                                data: { label: 'Generalización', fromMultiplicity: '', toMultiplicity: '' }
                            });
                        }
                    });
                }
            }
        });

        // Traducir los targets de las generalizaciones a IDs de React Flow
        edgesGenerados.forEach(edge => {
            if (edge.data.label === 'Generalización' && idMap[edge.target]) {
                edge.target = idMap[edge.target];
            }
        });

        // 3. Intentar leer conectores directamente de la extensión de EA (La fuente más fiel cuando viene de EA)
        let conectoresEAProcesados = new Set();
        const connectorRegex = /<connector xmi:idref="([^"]+)"[\s\S]*?<source xmi:idref="([^"]+)"[\s\S]*?<type([^>]*)\/>[\s\S]*?<\/source>[\s\S]*?<target xmi:idref="([^"]+)"[\s\S]*?<type([^>]*)\/>[\s\S]*?<\/target>[\s\S]*?<properties([^>]*)\/>/g;
        let connMatch;

        while ((connMatch = connectorRegex.exec(xml)) !== null) {
            const connId = connMatch[1];
            const srcEA = connMatch[2];
            const srcTypeProps = connMatch[3] || "";
            const tgtEA = connMatch[4];
            const tgtTypeProps = connMatch[5] || "";
            const propsStr = connMatch[6] || "";

            if (idMap[srcEA] && idMap[tgtEA]) {
                const eaTypeMatch = /ea_type="([^"]+)"/.exec(propsStr);
                const nameMatch = /name="([^"]+)"/.exec(propsStr);
                const eaType = eaTypeMatch ? eaTypeMatch[1] : "Association";

                // Evitar duplicar generalizaciones que ya leímos arriba
                if (eaType === "Generalization") {
                    conectoresEAProcesados.add(connId);
                    continue;
                }

                const srcMultMatch = /multiplicity="([^"]+)"/.exec(srcTypeProps);
                const tgtMultMatch = /multiplicity="([^"]+)"/.exec(tgtTypeProps);
                const srcAggMatch = /aggregation="([^"]+)"/.exec(srcTypeProps);
                const tgtAggMatch = /aggregation="([^"]+)"/.exec(tgtTypeProps);

                let srcMult = srcMultMatch ? srcMultMatch[1] : "";
                let tgtMult = tgtMultMatch ? tgtMultMatch[1] : "";
                let agg = (srcAggMatch ? srcAggMatch[1] : "none") !== "none" ? srcAggMatch[1] : (tgtAggMatch ? tgtAggMatch[1] : "none");

                let label = nameMatch ? nameMatch[1] : "Asociación";
                if (eaType === "Dependency") label = "Dependencia";
                else if (eaType === "Realisation" || eaType === "Realization") label = "Realización";
                else if (agg === "shared") label = "Agregación";
                else if (agg === "composite") label = "Composición";

                edgesGenerados.push({
                    id: `edge-ea-${Date.now()}-${edgesGenerados.length}`,
                    source: idMap[srcEA],
                    target: idMap[tgtEA],
                    type: 'umlEdge',
                    data: { label, fromMultiplicity: srcMult, toMultiplicity: tgtMult }
                });

                conectoresEAProcesados.add(connId);
            }
        }

        // 4. Respaldo estándar UML para relaciones que no estaban en el bloque <connectors>
        elementos.forEach((el, index) => {
            const attrs = el['$'] || {};
            const type = attrs['xmi:type'];
            const xmiId = attrs['xmi:id'];

            if (conectoresEAProcesados.has(xmiId)) return;

            const idEdge = `edge-${Date.now()}-${index}`;

            if (type === 'uml:Association') {
                const extremos = el['ownedEnd'];
                if (extremos && extremos.length >= 2) {
                    const origenEA = extremos[0]['$'] ? extremos[0]['$'].type : null;
                    const destinoEA = extremos[1]['$'] ? extremos[1]['$'].type : null;
                    
                    if (origenEA && destinoEA && idMap[origenEA] && idMap[destinoEA]) {
                        const getMult = (extremo) => {
                            let lower = extremo['lowerValue'] && extremo['lowerValue'][0]['$'] ? extremo['lowerValue'][0]['$'].value : "";
                            let upper = extremo['upperValue'] && extremo['upperValue'][0]['$'] ? extremo['upperValue'][0]['$'].value : "";
                            if (lower && upper && lower !== upper) return `${lower}..${upper}`;
                            if (lower) return lower;
                            return "";
                        };

                        let srcMult = getMult(extremos[0]);
                        let tgtMult = getMult(extremos[1]);
                        let label = attrs.name || "Asociación";

                        const srcAttrs = extremos[0]['$'] || {};
                        const tgtAttrs = extremos[1]['$'] || {};
                        const agg = (srcAttrs.aggregation && srcAttrs.aggregation !== "none") ? srcAttrs.aggregation : tgtAttrs.aggregation;

                        if (agg === "shared") label = "Agregación";
                        if (agg === "composite") label = "Composición";

                        edgesGenerados.push({
                            id: idEdge,
                            source: idMap[origenEA],
                            target: idMap[destinoEA],
                            type: 'umlEdge',
                            data: { label, fromMultiplicity: srcMult, toMultiplicity: tgtMult }
                        });
                    }
                }
            } 
            else if (type === 'uml:Dependency' || type === 'uml:Realization' || type === 'uml:Usage') {
                const client = attrs.client;
                const supplier = attrs.supplier;
                if (client && supplier && idMap[client] && idMap[supplier]) {
                    edgesGenerados.push({
                        id: idEdge,
                        source: idMap[client],
                        target: idMap[supplier],
                        type: 'umlEdge',
                        data: { 
                            label: type === 'uml:Realization' ? "Realización" : "Dependencia", 
                            fromMultiplicity: "", 
                            toMultiplicity: "" 
                        }
                    });
                }
            }
        });

        res.status(200).json({ mensaje: 'XMI importado', diagrama: { nodes: nodesGenerados, edges: edgesGenerados } });
    } catch (error) {
        console.error("Error importando XMI:", error);
        res.status(500).json({ error: "El archivo no tiene un formato XMI válido" });
    }
};

module.exports = { exportarXMI, importarXMI, upload };