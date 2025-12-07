import { GoogleGenAI, GenerateContentResponse, Type, Schema } from "@google/genai";
import { ContextItem, ContextType, AnalysisResult, Product, ChatMessage, Language, Source, ContactInfo } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      
      const langInstruction = language === 'en' ? "OUTPUT ENGLISH." : "SALIDA ESPAÑOL.";
      
      const step1Prompt = `
        ${langInstruction}
        ACTÚA COMO UN DIRECTOR DE INTELIGENCIA DE DATOS Y VENTAS.
        
        TU MISIÓN:
        Analizar la "Base de Conocimiento" (Archivos) y las "Reglas de Negocio" (Textos) para configurar un Agente de Ventas de alto rendimiento.
        TU INTELIGENCIA DEBE SER EXTRACTIVA Y LITERAL (NO GENERATIVA/CREATIVA CON LOS DATOS).
        
        INSTRUCCIONES DE PROCESAMIENTO:
        1. **ARCHIVOS (Catálogos/Tarifas):** SON TU FUENTE DE VERDAD SAGRADA. Extrae productos exactos.
        2. **REGLAS DE NEGOCIO:** Prioridad absoluta sobre el tono general.
        
        Define la estructura JSON exacta para el agente.
      `;

      // Define Output Schema for Analysis
      const analysisSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            agentName: { type: Type.STRING, description: "Nombre sugerido para el bot (ej: Asistente Técnico)." },
            brandColor: { type: Type.STRING, description: "Código Hex del color de marca predominante." },
            summary: { type: Type.STRING, description: "Resumen ejecutivo de la estrategia de ventas detectada." },
            systemInstruction: { type: Type.STRING, description: "Prompt maestro del sistema para el chatbot." },
            suggestedGreeting: { type: Type.STRING, description: "Un saludo inicial corto y comercial." },
            products: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        price: { type: Type.STRING },
                        description: { type: Type.STRING },
                        buyUrl: { type: Type.STRING, nullable: true },
                        type: { type: Type.STRING, enum: ["PRODUCT", "SERVICE", "LINK"] },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            navigationTree: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        url: { type: Type.STRING }
                    }
                }
            },
            contactInfo: {
                type: Type.OBJECT,
                properties: {
                    sales: { type: Type.STRING, nullable: true },
                    support: { type: Type.STRING, nullable: true },
                    technical: { type: Type.STRING, nullable: true }
                }
            }
        },
        required: ["agentName", "systemInstruction", "products", "summary"]
      };

      // Llamamos a Gemini 3.0 Pro
      const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [...baseParts, { text: step1Prompt }] },
        config: { 
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: analysisSchema
        }
      });

      if (onProgress) onProgress(language === 'es' ? "Configurando vendedor..." : "Configuring salesperson...", 80);

      // With responseSchema, result.text is guaranteed to be valid JSON string
      const data = JSON.parse(result.text || "{}") as AnalysisResult;

      const allSources: Source[] = [];
      collectSources(result, allSources);

      // Post-process IDs
      if (data.products) {
        data.products = data.products.map((p, i) => ({
            ...p,
            id: p.id && p.id.length > 2 ? p.id : `gen-${Date.now()}-${i}`,
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

/**
 * Sends a message to the chat model using STRUCTURED OUTPUT.
 * This guarantees clean JSON without regex hacking.
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
  
  // Convert Products to text context
  const inventoryContext = availableProducts.map(p => 
      `- [ID: ${p.id}] ${p.name} (${p.price || 'Consultar'}): ${p.description}.`
  ).join('\n');

  const contactContext = contactInfo ? `
    CANALES DE CONTACTO:
    - Soporte: ${contactInfo.support || 'N/A'}
    - Ventas: ${contactInfo.sales || 'N/A'}
    - Técnico: ${contactInfo.technical || 'N/A'}
  ` : '';

  const langInstruction = language === 'en' ? "REPLY IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  
  const enhancedInstruction = `
    ${langInstruction}
    ---------------------------------------------------
    ROL: DIRECTOR DE INTELIGENCIA DE DATOS & VENTAS (Identidad: ${botName})
    ---------------------------------------------------
    1. **BASE DE DATOS (CSV/EXCEL):** SON SAGRADOS. Cruza Referencias (SKU) con Precios.
    2. **DOCUMENTACIÓN TÉCNICA:** Úsala para responder garantías.
    3. **REGLA DE ORO:** API SIMULADA. No inventes datos.

    TU BASE DE CONOCIMIENTO (INVENTARIO REAL):
    ${inventoryContext}

    TUS INSTRUCCIONES ESPECÍFICAS (DEL DUEÑO):
    "${systemInstruction}"
    
    ${contactContext}

    PROTOCOLOS:
    - Si es garantía/roto -> Da el email de soporte y DETÉN VENTA.
    - Si detectas intención de compra -> RECOMIENDA el producto exacto usando su ID en el campo JSON correspondiente.

    IMPORTANTE:
    Genera la respuesta usando el esquema JSON proporcionado. 
    Pon tu respuesta conversacional en el campo "answer".
    Pon los IDs de productos recomendados (si los hay) en el array "recommended_product_ids".
  `;

  // Define Schema for Chat Response
  const chatResponseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        answer: { 
            type: Type.STRING, 
            description: "La respuesta conversacional natural al usuario. NO incluyas JSON ni Markdown de código aquí." 
        },
        recommended_product_ids: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Lista de IDs exactos de los productos del inventario que se deben mostrar como tarjetas."
        }
    },
    required: ["answer"]
  };

  try {
    // Only send the last few messages to keep context window manageable
    const recentHistory = history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview', 
      config: {
        systemInstruction: enhancedInstruction,
        temperature: 0.1, 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema
      },
      history: recentHistory
    });

    const result = await chat.sendMessage({ message: currentMessage });
    
    // Parse the structured output
    let structuredResponse: { answer: string; recommended_product_ids?: string[] } = { answer: "" };
    
    try {
        structuredResponse = JSON.parse(result.text || '{"answer": ""}');
    } catch (e) {
        // Fallback if model fails strictly
        structuredResponse = { answer: result.text || "" };
    }

    // Match recommended IDs back to full product objects
    const foundCards: Product[] = [];
    if (structuredResponse.recommended_product_ids && Array.isArray(structuredResponse.recommended_product_ids)) {
        structuredResponse.recommended_product_ids.forEach(id => {
            const product = availableProducts.find(p => p.id === id);
            if (product && !foundCards.some(c => c.id === product.id)) {
                foundCards.push(product);
            }
        });
    }

    return {
      text: structuredResponse.answer,
      productCards: foundCards.length > 0 ? foundCards : undefined
    };

  } catch (error) {
    console.error("Chat error", error);
    return { text: language === 'es' ? "Un segundo, estoy consultando el stock..." : "One moment, checking stock..." };
  }
};