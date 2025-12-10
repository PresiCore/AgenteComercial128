import { getFunctions, httpsCallable } from 'firebase/functions';
import { ContextItem, ContextType, AnalysisResult, ChatMessage, Product, Language, ContactInfo } from "../types";

// NOTA: Ya no importamos GoogleGenAI aquí. La seguridad está en el Backend.

/**
 * Prepara el prompt de texto basándose en los items de contexto.
 * Convierte archivos y textos en un solo string gigante para enviarlo al backend.
 */
const buildFullPrompt = (items: ContextItem[]): string => {
  let textBuffer = "BASE DE CONOCIMIENTO Y REGLAS DEL VENDEDOR:\n";

  items.forEach((item) => {
    if (item.type === ContextType.TEXT) {
      // Textos directos (reglas de negocio, emails, etc)
      textBuffer += `[${item.content.includes('[CONTACTO') ? 'CONTACTO' : 'REGLA DE NEGOCIO'}]: ${item.content}\n\n`;
    } else if (item.type === ContextType.FILE) {
      // Archivos: Aquí asumimos que si es texto/csv ya viene legible o base64. 
      // Para optimizar costos de Cloud Functions, enviamos metadatos. 
      // Idealmente el backend procesaría el archivo real, pero para este flujo enviamos un resumen o el contenido si es pequeño.
      textBuffer += `\n[ARCHIVO ADJUNTO: ${item.fileName}]\n(Contenido del archivo procesado para contexto...)\n`;
      // Nota: Si tus archivos son pequeños CSVs convertidos a texto, agrégalos aquí al string.
      if (item.content && !item.content.startsWith('Archivo:')) {
          textBuffer += `${item.content}\n`;
      }
    }
  });
  
  return textBuffer;
};

/**
 * Analiza el contexto de la empresa llamando a la Cloud Function segura.
 */
export const analyzeCompanyContext = async (
  contextItems: ContextItem[],
  language: Language,
  onProgress?: (phase: string, progress: number) => void
): Promise<AnalysisResult> => {

  const functions = getFunctions();
  const analyzeContextFn = httpsCallable(functions, 'analyzeContext');

  // 1. Preparación del Prompt para el Backend
  const baseContext = buildFullPrompt(contextItems);
  const langInstruction = language === 'en' ? "OUTPUT JSON IN ENGLISH." : "SALIDA JSON EN ESPAÑOL.";
  
  const fullPrompt = `
    ${baseContext}
    
    ${langInstruction}
    ACTÚA COMO UN DIRECTOR DE INTELIGENCIA DE DATOS Y VENTAS.
    
    TU MISIÓN:
    Analizar la "Base de Conocimiento" y las "Reglas de Negocio" para configurar un Agente de Ventas.
    
    INSTRUCCIONES:
    1. Extrae productos, precios y reglas de forma LITERAL.
    2. Define la personalidad del vendedor.
    3. Estructura la salida en JSON estricto con los campos: agentName, brandColor, summary, systemInstruction, suggestedGreeting, products, navigationTree, contactInfo.
  `;

  try {
      if (onProgress) onProgress(language === 'es' ? "Conectando con el cerebro (Nube)..." : "Connecting to cloud brain...", 30);
      
      // 2. Llamada Segura a Firebase Functions
      const result = await analyzeContextFn({
        fullPrompt: fullPrompt,
        systemInstruction: "Eres un experto analista de datos. Tu salida debe ser EXCLUSIVAMENTE JSON válido sin bloques markdown."
      });

      if (onProgress) onProgress("Procesando respuesta...", 80);

      const data = result.data as AnalysisResult;

      // 3. Post-procesamiento en cliente (IDs únicos, valores por defecto)
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
          sources: [] // Las fuentes web se procesan mejor en el cliente o se omiten en esta fase simplificada
      };

      if (!finalResult.agentName) finalResult.agentName = "Asistente Virtual";
      
      if (onProgress) onProgress("OK", 100);
      return finalResult;

  } catch (error) {
    console.error("Analysis failed via Cloud Function", error);
    throw error;
  }
};

/**
 * Envía un mensaje al bot a través del Backend.
 * Maneja el inventario y parsea la respuesta JSON para separar texto de productos.
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
  
  const functions = getFunctions();
  const chatWithGeminiFn = httpsCallable(functions, 'chatWithGemini');
  
  // 1. Preparar Contexto de Inventario (Texto plano para el LLM)
  const inventoryContext = availableProducts.map(p => 
      `- [ID: ${p.id}] ${p.name} (${p.price || 'Consultar'}): ${p.description}.`
  ).join('\n');

  const contactContext = contactInfo ? `
    CANALES DE CONTACTO:
    - Soporte: ${contactInfo.support || 'N/A'}
    - Ventas: ${contactInfo.sales || 'N/A'}
  ` : '';

  const langInstruction = language === 'en' ? "REPLY IN ENGLISH." : "RESPONDE EN ESPAÑOL.";
  
  // 2. Prompt del Sistema Mejorado (Inyectamos inventario aquí)
  const enhancedSystemInstruction = `
    ${langInstruction}
    ROL: VENDEDOR EXPERTO (Identidad: ${agentName || 'Asistente'})
    
    BASE DE CONOCIMIENTO (INVENTARIO REAL):
    ${inventoryContext}
    
    INSTRUCCIONES DEL DUEÑO:
    "${systemInstruction}"
    
    ${contactContext}

    FORMATO DE RESPUESTA OBLIGATORIO (JSON):
    Debes responder SIEMPRE con un objeto JSON con esta estructura:
    {
      "answer": "Tu respuesta conversacional y amable aquí.",
      "recommended_product_ids": ["ID1", "ID2"] // Solo si recomiendas productos específicos del inventario.
    }
  `;

  try {
    // 3. Llamada al Backend
    // Enviamos solo los últimos mensajes para ahorrar tokens
    const recentHistory = history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    const result = await chatWithGeminiFn({
      history: recentHistory,
      message: currentMessage,
      systemInstruction: enhancedSystemInstruction
    });

    const responseData = result.data as { text: string };
    let rawText = responseData.text || "";

    // 4. Parseo de la respuesta (El backend devuelve texto que contiene JSON)
    let parsedResponse: { answer: string; recommended_product_ids?: string[] } = { answer: "" };
    
    try {
        // Limpiamos posibles bloques de código markdown que el modelo pueda añadir
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResponse = JSON.parse(cleanJson);
    } catch (e) {
        // Fallback si el modelo no devuelve JSON puro (raro con Gemini 3.0 Pro, pero posible)
        console.warn("El modelo no devolvió JSON estricto, usando texto plano.");
        parsedResponse = { answer: rawText };
    }

    // 5. Mapear IDs recomendados a objetos Producto completos
    const foundCards: Product[] = [];
    if (parsedResponse.recommended_product_ids && Array.isArray(parsedResponse.recommended_product_ids)) {
        parsedResponse.recommended_product_ids.forEach(id => {
            const product = availableProducts.find(p => p.id === id);
            if (product && !foundCards.some(c => c.id === product.id)) {
                foundCards.push(product);
            }
        });
    }

    return {
      text: parsedResponse.answer || "...",
      productCards: foundCards.length > 0 ? foundCards : undefined
    };

  } catch (error) {
    console.error("Chat error via Cloud Function", error);
    return { text: language === 'es' ? "Lo siento, estoy teniendo problemas de conexión. Inténtalo de nuevo." : "Connection error. Please try again." };
  }
};