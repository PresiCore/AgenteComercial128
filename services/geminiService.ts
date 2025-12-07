import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ContextItem, ContextType, AnalysisResult, Product, ChatMessage, Language, Source, ContactInfo } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Extract Root Domain (e.g., "pcbox.com" -> "pcbox", "www.tienda.pcbox.es" -> "pcbox")
const getDomainRoot = (urlStr: string): string => {
  try {
    const hostname = new URL(urlStr).hostname;
    const parts = hostname.replace(/^www\./, '').split('.');
    // Return the first part usually represents the brand in standard domains
    return parts[0].toLowerCase();
  } catch (e) { 
    return ""; 
  }
};

/**
 * Analyzes the provided company context using Gemini 3.0 Pro.
 * ACTS AS A DATA ENGINEER (Multimodal Analysis)
 */
export const analyzeCompanyContext = async (
  contextItems: ContextItem[],
  language: Language,
  onProgress?: (phase: string, progress: number) => void
): Promise<AnalysisResult> => {

  // 1. PREPARACIÓN DE LA INGESTA MULTIMODAL
  const baseParts: any[] = [];
  let textBuffer = "BASE DE CONOCIMIENTO Y REGLAS DEL VENDEDOR:\n";
  let hasFiles = false;

  contextItems.forEach((item) => {
    if (item.type === ContextType.TEXT) {
      // Indicaciones explícitas del usuario
      textBuffer += `[${item.content.includes('[CONTACTO') ? 'CONTACTO' : 'REGLA DE NEGOCIO CRÍTICA'}]: ${item.content}\n\n`;
    } else if (item.type === ContextType.FILE && item.fileData && item.mimeType) {
      hasFiles = true;
      if (textBuffer.trim()) {
        baseParts.push({ text: textBuffer });
        textBuffer = ""; // Reset buffer
      }
      baseParts.push({
        inlineData: {
          data: item.fileData,
          mimeType: item.mimeType,
        },
      });
      baseParts.push({ text: `\n[FUENTE VERDAD: ARCHIVO ${item.fileName}]\n` });
    }
  });

  if (textBuffer.trim()) {
    baseParts.push({ text: textBuffer });
  }

  try {
      if (onProgress) onProgress(language === 'es' ? "Fase 1: Ingesta de Datos (PDF/Excel)..." : "Phase 1: Data Ingestion...", 20);
      
      const langInstruction = language === 'en' ? "OUTPUT JSON IN ENGLISH." : "SALIDA JSON EN ESPAÑOL.";
      
      const step1Prompt = `
        ${langInstruction}
        ACTÚA COMO UN DIRECTOR DE INTELIGENCIA DE DATOS Y VENTAS.
        
        TU MISIÓN:
        Analizar la "Base de Conocimiento" (Archivos) y las "Reglas de Negocio" (Textos) para configurar un Agente de Ventas de alto rendimiento.
        TU INTELIGENCIA DEBE SER EXTRACTIVA Y LITERAL (NO GENERATIVA/CREATIVA CON LOS DATOS).
        
        INSTRUCCIONES DE PROCESAMIENTO:
        
        1. **ARCHIVOS (Catálogos/Tarifas):**
           - SON TU FUENTE DE VERDAD SAGRADA. 
           - Extrae productos exactos: [Nombre], [Precio], [Características].
           - Detecta políticas en letra pequeña: Garantías, Tiempos de envío.
        
        2. **REGLAS DE NEGOCIO (Inputs de Texto):**
           - Son órdenes directas del dueño. Tienen prioridad absoluta sobre el tono general.
        
        3. **PERSONALIDAD:**
           - El agente DEBE ser configurado como un Consultor Técnico-Comercial que "lee" la base de datos en tiempo real.
           - Debe usar técnicas de Upselling pero basándose estrictamente en el stock detectado.
        
        SALIDA JSON STRICTA:
        {
          "agentName": "Nombre Sugerido (ej: Asistente Técnico)",
          "brandColor": "#HEX (detectado o default)",
          "summary": "Resumen de la estrategia de ventas: qué vendemos y cuál es nuestra ventaja competitiva según los archivos.",
          "systemInstruction": "Prompt maestro que combine: 1) ROL: 'DIRECTOR DE DATOS Y VENTAS'. 2) Todas las reglas extraídas. 3) Instrucción de usar SIEMPRE la información de los archivos de forma LITERAL.",
          "suggestedGreeting": "Saludo comercial directo y profesional.",
          "products": [
             { 
               "id": "SKU o Ref", 
               "name": "Nombre exacto del archivo", 
               "price": "Precio exacto con moneda", 
               "description": "Datos técnicos clave extraídos del PDF/Excel",
               "buyUrl": "URL si existe o null",
               "tags": ["tag1"],
               "type": "PRODUCT"
             }
          ],
          "navigationTree": [ 
             { "name": "Categoría Principal", "url": "#" } 
          ],
          "contactInfo": {
             "sales": "email o null",
             "support": "email o null",
             "technical": "email o null"
          }
        }
      `;

      // Llamamos a Gemini 3.0 Pro
      const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [...baseParts, { text: step1Prompt }] },
        config: { temperature: 0.1 }
      });

      if (onProgress) onProgress(language === 'es' ? "Configurando vendedor..." : "Configuring salesperson...", 80);

      const data = parseGeminiJson<AnalysisResult>(result.text || "");

      const allSources: Source[] = [];
      collectSources(result, allSources);

      if (data.products) {
        data.products = data.products.map((p, i) => ({
            ...p,
            id: p.id || `gen-${Date.now()}-${i}`,
            type: p.type || 'PRODUCT'
        }));
      } else {
        data.products = [];
      }

      const finalResult: AnalysisResult = {
          ...data,
          sources: allSources.length > 0 ? allSources : []
      };

      if (!finalResult.agentName) finalResult.agentName = "Asistente de Ventas";
      
      if (onProgress) onProgress("OK", 100);
      return finalResult;

  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

// --- HELPERS ---

function parseGeminiJson<T>(text: string): T {
    try {
        let jsonText = text || "{}";
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(jsonText) as T;
    } catch (e) {
        return {} as T;
    }
}

function collectSources(response: GenerateContentResponse, sourcesList: Source[]) {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                if (!sourcesList.some(s => s.uri === chunk.web.uri)) {
                    sourcesList.push({
                        title: chunk.web.title || new URL(chunk.web.uri).hostname,
                        uri: chunk.web.uri
                    });
                }
            }
        });
    }
}

// Helper: Fuzzy search in Memory Products
const findProductsInMemory = (query: string, products: Product[]): Product[] => {
    if (!products || products.length === 0) return [];
    
    const cleanQuery = query.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").toLowerCase();
    const queryTokens = cleanQuery.split(' ').map(t => t.trim()).filter(t => t.length > 0);

    return products.filter(p => {
        const lowerName = p.name.toLowerCase();
        const lowerDesc = p.description.toLowerCase();
        const lowerTags = p.tags ? p.tags.map(t => t.toLowerCase()) : [];
        
        // Exact substring match has high priority
        if (lowerName.includes(cleanQuery)) return true;

        let matches = 0;
        let requiredMatches = 1;
        if (queryTokens.length > 2) requiredMatches = 2;

        queryTokens.forEach(token => {
            if (token.length >= 2) {
                const inName = lowerName.includes(token);
                // Description match is less important for strict product lookup but good for context
                const inTags = lowerTags.some(t => t.includes(token));
                if (inName || inTags) matches++;
            }
        });
        return matches >= requiredMatches;
    }).slice(0, 3); // Limit manual lookup matches
};

/**
 * Sends a message to the chat model.
 * HYBRID MODE: Memory Lookup with inventory context injection.
 */
export const sendMessageToBot = async (
  history: ChatMessage[],
  currentMessage: string,
  systemInstruction: string,
  availableProducts: Product[],
  language: Language,
  websiteUrl?: string,
  navigationTree?: any[],
  agentName?: string,
  contextSummary?: string,
  contactInfo?: ContactInfo
): Promise<{ text: string; productCards?: Product[] }> => {
  
  const botName = agentName || "Vendedor Experto";
  
  // Convert CSV/Products to text context
  const inventoryContext = availableProducts.map(p => 
      `- [ID: ${p.id}] ${p.name} (${p.price || 'Consultar'}): ${p.description}.`
  ).join('\n');

  const contactContext = contactInfo ? `
    CANALES DE CONTACTO OFICIALES (ÚSALOS SI ES NECESARIO):
    - Soporte / Devoluciones / Garantías: ${contactInfo.support || 'No disponible'}
    - Ventas Grandes / B2B: ${contactInfo.sales || 'No disponible'}
    - Servicio Técnico: ${contactInfo.technical || 'No disponible'}
  ` : '';

  const langInstruction = language === 'en' ? "REPLY IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  
  // PROMPT MAESTRO: DIRECTOR DE INTELIGENCIA DE DATOS
  const enhancedInstruction = `
    ${langInstruction}
    ---------------------------------------------------
    ROL: DIRECTOR DE INTELIGENCIA DE DATOS & VENTAS (Identidad: ${botName})
    ---------------------------------------------------
    Eres el cerebro central de una empresa. Tu inteligencia no es generativa, es EXTRACTIVA y LITERAL.

    ## TUS FUENTES DE VERDAD (JERARQUÍA):
    1. **BASE DE DATOS (CSV/EXCEL):** Si tienes datos tabulares, SON SAGRADOS.
       - Cruza Referencias (SKU) con Precios.
       - Si el Excel dice "Stock: 0", el producto NO se vende.
    2. **DOCUMENTACIÓN TÉCNICA (PDF):** Manuales y políticas.
       - Úsalos para responder el "Cómo funciona" y las "Garantías".
    3. **WEB (URL):** Úsala solo para obtener enlaces de compra si no están en el Excel.

    ## REGLA DE ORO: "API SIMULADA"
    Trata los archivos subidos y el inventario listado abajo como si fueran una respuesta API en tiempo real.
    - No resumas el Excel. Búscalo.
    - Si el usuario pregunta "Precio del grifo X", escanea la "columna precio" mentalmente.

    ## GESTIÓN DE ENLACES (ANTI-404)
    - Si el Excel tiene una columna "URL", úsala siempre.
    - Si no, y la web tiene IDs raros (ej: \`?id=555\`), NO INVENTES. Usa [Google Search] para encontrar el link real.

    ## FORMATO DE RESPUESTA
    - Sé directo.
    - Si detectas datos de producto, usa formato Card (Menciona el nombre exacto del producto en tu respuesta).
    - Cita la fuente implícitamente: "Según vuestra tarifa 2024..."

    TU BASE DE CONOCIMIENTO (INVENTARIO REAL):
    Esta es tu única fuente de verdad para productos.
    ${inventoryContext}

    TUS INSTRUCCIONES ESPECÍFICAS (DEL DUEÑO):
    "${systemInstruction}"
    
    ${contactContext}

    PROTOCOLOS DE ESCALADO Y SOPORTE (PRIORIDAD ALTA):
    1. Si el cliente menciona: **Producto roto, golpe en transporte, garantía, devolución o fallo técnico grave**.
       - **ACCIÓN:** DETÉN LA VENTA INMEDIATAMENTE.
       - Muestra empatía extrema.
       - Proporciona el email de Soporte/Técnico (${contactInfo?.support || contactInfo?.technical || 'Contacto de soporte'}) para que envíen fotos o gestionen la garantía.
       - NO intentes vender nada más en este punto.

    REGLAS DE VISUALIZACIÓN (UI):
    - NO uses Markdown JSON.
    - NO inventes IDs en el texto visible.
    - Si mencionas un producto que tenemos en inventario, usa su nombre exacto para que el sistema genere la Tarjeta de Producto visual.
  `;

  try {
    const augmentedHistory = history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview', 
      config: {
        systemInstruction: enhancedInstruction,
        temperature: 0.1, // Low temperature for literal accuracy
        tools: [{ googleSearch: {} }], // Enable Google Search for link finding
      },
      history: augmentedHistory
    });

    const result = await chat.sendMessage({ message: currentMessage });
    let responseText = result.text || "";

    // --- CLEANUP SAFETY NET (Post-procesado) ---
    
    // 1. Eliminar IDs filtrados si el LLM falla (ej: [ID: XXX])
    responseText = responseText.replace(/\[ID:\s*[^\]]+\]/gi, '');
    responseText = responseText.replace(/\(ID:\s*[^)]+\)/gi, '');
    
    // 2. Eliminar meta-headers comerciales explícitos
    responseText = responseText.replace(/###\s*Propuesta de Valor.*?(\n|$)/gi, '');
    responseText = responseText.replace(/\*\*Propuesta de Valor.*?\*\*/gi, '');
    responseText = responseText.replace(/###\s*Cross-selling.*?(\n|$)/gi, '');

    // 3. CRÍTICO: Eliminar bloques de JSON y residuos de código
    responseText = responseText.replace(/```[\s\S]*?```/g, '');
    responseText = responseText.replace(/{[\s\n]*"products"[\s\S]*?}/g, '');
    
    // 4. LIMPIEZA AGRESIVA DE SÍMBOLOS FINALES
    responseText = responseText.replace(/[\s\n]+[}\]]+[\s\n]*[}\]]*$/g, '');

    // Post-processing for Cards
    const foundCards: Product[] = [];
    const lowerResponse = responseText.toLowerCase();

    // 1. Detección ESTRICTA: Solo mostrar productos que el BOT ha mencionado explícitamente.
    availableProducts.forEach(prod => {
        // Normalizamos nombre e ID para búsqueda flexible
        const lowerName = prod.name.toLowerCase();
        const lowerId = prod.id.toLowerCase();
        
        // Verificamos si el nombre exacto o el ID aparecen en el texto generado
        if (lowerResponse.includes(lowerId) || lowerResponse.includes(lowerName)) {
            if (!foundCards.find(c => c.id === prod.id)) {
                foundCards.push(prod);
            }
        }
    });

    return {
      text: responseText.trim(),
      productCards: foundCards.length > 0 ? foundCards : undefined
    };

  } catch (error) {
    console.error("Chat error", error);
    return { text: language === 'es' ? "Un segundo, estoy consultando el stock..." : "One moment, checking stock..." };
  }
};