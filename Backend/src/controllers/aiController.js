// src/controllers/aiController.js
// Controlador para manejar las solicitudes relacionadas con la IA

const procesarInstruccionIA = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Debes enviar una instrucción en el parámetro 'prompt'." });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "openrouter/free", // Usamos el router gratuito
                messages: [
                    {
                        role: "system",
                        content: `Eres un experto en diagramas UML 2.5. Devuelve SOLO JSON válido sin texto adicional.

ESTRUCTURA REQUERIDA:
{
  "clases": [
    {
      "nombre": "NombreClase",
      "atributos": ["+ nombreCampo: String"],
      "metodos": ["+ nombreMetodo(): void"]
    }
  ],
  "relaciones": [
    {
      "from": "ClaseOrigen",
      "to": "ClaseDestino",
      "type": "association",
      "fromMultiplicity": "1",
      "toMultiplicity": "0..*"
    }
  ]
}
IMPORTANTE: 
- En las relaciones, deduce y añade siempre "fromMultiplicity" y "toMultiplicity" usando notación UML válida (1, 0..1, 1..*, 0..*, *).
- Devuelve únicamente el JSON, sin formato markdown (\`\`\`).`
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.2, // Temperatura baja para respuestas más lógicas y precisas
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: "Error de comunicación con la IA", detalle: errorText });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: "La IA no devolvió un contenido válido" });
        }

        // Limpiar la respuesta por si la IA añade formato Markdown
        content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        let jsonData;
        try {
            jsonData = JSON.parse(content);
        } catch {
            // Intentar extraer solo el JSON si viene con texto basura
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonData = JSON.parse(jsonMatch[0]);
            else throw new Error("No se pudo parsear el texto a JSON");
        }

        res.status(200).json({ mensaje: "Diagrama generado por IA", diagrama: jsonData });

    } catch (error) {
        console.error("Error en el controlador de IA:", error);
        res.status(500).json({ error: "Error interno del servidor al procesar la IA" });
    }
};

// Generar diagrama desde una imagen de pizarra --> FALTA DESARROLLAR....
const generarDesdeImagen = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ninguna imagen de la pizarra" });
        }

        // 1. Convertir la imagen a formato Base64 (texto) para que la IA la entienda
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype; // ej. image/jpeg, image/png
        const imageUrl = `data:${mimeType};base64,${base64Image}`;

        // 2. Comunicarse con la IA de Visión
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_VISION_MODEL || "meta-llama/llama-3.2-11b-vision-instruct:free",
                messages: [
                    {
                        role: "system",
                        content: `Eres un experto en diagramas UML 2.5. Analiza la imagen de la pizarra, extrae las clases, atributos y métodos, y devuelve SOLO JSON válido sin texto adicional.
                        ESTRUCTURA REQUERIDA:
                        {
                          "clases": [{ "nombre": "Clase", "atributos": ["+ attr: String"], "metodos": ["+ met(): void"] }],
                          "relaciones": [{ "from": "A", "to": "B", "type": "association", "fromMultiplicity": "1", "toMultiplicity": "0..*" }]
                        }`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analiza esta foto de una pizarra. Extrae el diagrama UML y conviértelo al JSON exacto que se te pidió." },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        
        // 3. Limpiar y procesar la respuesta
        if (data.choices && data.choices.length > 0) {
            let contenidoIA = data.choices[0].message.content.trim();
            
            // Reutilizamos tu bloque de limpieza robusto por si la IA visual manda basura
            contenidoIA = contenidoIA.replace(/```json/gi, "").replace(/```/g, "").trim();
            
            let diagramaJSON;
            try {
                diagramaJSON = JSON.parse(contenidoIA);
            } catch {
                const jsonMatch = contenidoIA.match(/\{[\s\S]*\}/);
                if (jsonMatch) diagramaJSON = JSON.parse(jsonMatch[0]);
                else throw new Error("No se pudo parsear el texto a JSON");
            }
            
            res.status(200).json({
                mensaje: "Diagrama escaneado con éxito",
                diagrama: diagramaJSON
            });
        } else {
            throw new Error("La IA no devolvió un formato válido");
        }
    } catch (error) {
        console.error("Error en la IA de Visión:", error);
        res.status(500).json({ error: "No se pudo procesar la imagen. Verifica que sea clara." });
    }
};

// Exportamos exactamente las dos funciones que existen en este archivo
module.exports = { procesarInstruccionIA, generarDesdeImagen };
