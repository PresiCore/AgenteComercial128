import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ContextItem, ContextType, AnalysisResult, Product, ChatMessage, Language, Source } from "../types";

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
 * ACTS AS A 2-STEP WEB CRAWLER:
 * Step 1: Architecture & Branding
 * Step 2: Deep Inventory Scanning based on Step 1 Categories
 */
export const analyzeCompanyContext = async (
  contextItems: ContextItem[],
  language: Language,
  onProgress?: (phase: string, progress: number) => void
): Promise<AnalysisResult> => {
  
  // 1. PREPARE BASE CONTEXT
  const baseParts: any[] = [];
  let hasUrls = false;
  let urlList: string[] = [];
  let textBuffer = "CONTEXTO DE LA EMPRESA:\n";

  contextItems.forEach((item) => {
    if (item.type === ContextType.TEXT) {
      textBuffer += `[INFO INTERNA]: ${item.content}\n`;
    } else if (item.type === ContextType.URL) {
      hasUrls = true;
      urlList.push(item.content);
      textBuffer += `[URL SEMILLA]: ${item.content}\n`;
    } else if (item.type === ContextType.FILE && item.fileData && item.mimeType) {
      if (textBuffer.length > 0) {
        baseParts.push({ text: textBuffer });
        textBuffer = "";
      }
      baseParts.push({
        inlineData: {
          data: item.fileData,
          mimeType: item.mimeType,
        },
      });
    }
  });

  if (textBuffer.length > 0) {
    baseParts.push({ text: textBuffer });
  }

  const langInstruction = language === 'en' ? "OUTPUT JSON IN ENGLISH." : "SALIDA JSON EN ESPAÑOL.";
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      // --- PHASE 1: ARCHITECTURE & BRANDING ---
      if (onProgress) onProgress(language === 'es' ? "Fase 1: Mapeando arquitectura web..." : "Phase 1: Mapping site architecture...", 10);
      
      const modelToUse = attempt === 0 ? 'gemini-3-pro-preview' : 'gemini-2.5-pro';
      console.log(`[Crawler Phase 1] Using ${modelToUse}`);

      const step1Prompt = `
        ${langInstruction}
        ACT AS A WEB ARCHITECT & BRAND STRATEGIST.
        
        OBJECTIVE: Analyze the provided context/URLs to understand the BUSINESS STRUCTURE.
        
        TASKS:
        1. **NAVIGATION TREE**: Identify the main product categories from the menu/sitemap.
           - Find specific URLs for sections like "Laptops", "Phones", "Services", etc.
        2. **BRANDING**: Detect the primary HEX color and define the agent's personality.
        3. **SUMMARY**: Create a strategic summary of what the business sells.
        
        ACTIONS (Use Google Search):
        - Search "site:[domain] sitemap" or "site:[domain]" to find structure.
        
        OUTPUT JSON (NO PRODUCTS YET):
        {
          "systemInstruction": "Define bot personality (Sales Expert).",
          "agentName": "Agent Name",
          "summary": "Strategic summary.",
          "suggestedGreeting": "Short sales greeting.",
          "brandColor": "#HEX",
          "websiteUrl": "https://domain.com",
          "keyTopics": ["Topic 1", "Topic 2"],
          "navigationTree": [ 
             { "name": "Category Name", "url": "Real_Category_URL" } 
          ]
        }
      `;

      const step1Response = await ai.models.generateContent({
        model: modelToUse,
        contents: { parts: [...baseParts, { text: step1Prompt }] },
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
      });

      const step1Data = parseGeminiJson<AnalysisResult>(step1Response.text);
      
      // Collect sources from Step 1
      const allSources: Source[] = [];
      collectSources(step1Response, allSources);

      // --- PHASE 2: DEEP INVENTORY SCANNING ---
      if (onProgress) onProgress(language === 'es' ? "Fase 2: Escaneando inventario por categorías..." : "Phase 2: Scanning category inventory...", 50);
      
      const categories = step1Data.navigationTree?.map(c => c.name).slice(0, 6).join(", ") || "General Products";
      const domain = step1Data.websiteUrl || (urlList.length > 0 ? urlList[0] : "");

      const step2Prompt = `
        ${langInstruction}
        ACT AS A PRODUCT INVENTORY SCANNER.
        
        CONTEXT: We have identified these main categories: ${categories}.
        TARGET DOMAIN: ${domain}
        
        OBJECTIVE: Build a robust product database for the chatbot.
        
        TASKS:
        1. For EACH identified category, find 8-12 top-selling or representative products.
        2. Extract EXACT Name, Price, and REAL BUY URL.
        3. TOTAL: Aim for 20-30 diverse products.
        
        ACTIONS (Use Google Search):
        - Search "site:${domain} [category] precio" for each category.
        - Verify the URLs exist.
        
        OUTPUT JSON:
        {
          "products": [
             { 
               "id": "prod-1", 
               "name": "Product Name", 
               "price": "19.99€", 
               "description": "Brief description", 
               "buyUrl": "REAL_URL", 
               "type": "PRODUCT", 
               "tags": ["category_name", "keyword"] 
             }
          ]
        }
      `;

      // Simulate progress during heavy Step 2
      const progressInterval = setInterval(() => {
         if (onProgress) onProgress(language === 'es' ? "🕷️ Extrayendo catálogo masivo..." : "🕷️ Extracting massive catalog...", 65 + Math.random() * 10);
      }, 1500);

      const step2Response = await ai.models.generateContent({
        model: modelToUse, // Use same model for consistency
        contents: { parts: [...baseParts, { text: step2Prompt }] },
        config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
      });
      
      clearInterval(progressInterval);
      
      const step2Data = parseGeminiJson<{ products: Product[] }>(step2Response.text);
      collectSources(step2Response, allSources);

      if (onProgress) onProgress(language === 'es' ? "Finalizando base de datos..." : "Finalizing database...", 90);

      // --- MERGE & VALIDATE ---
      const combinedProducts = step2Data.products || [];
      
      // Use Step 1 structure + Step 2 products
      const finalResult: AnalysisResult = {
          ...step1Data,
          products: combinedProducts,
          sources: allSources
      };

      // Fallbacks
      if (!finalResult.websiteUrl && hasUrls) finalResult.websiteUrl = urlList[0];
      if (!finalResult.agentName) finalResult.agentName = "Asistente";

      // Strict Validation
      if (finalResult.products.length > 0) {
          const validSourceUris = new Set(allSources.map(s => s.uri));
          
          finalResult.products = finalResult.products.filter(p => {
              const url = p.buyUrl?.toLowerCase() || "";
              
              // 1. Format check
              if (!url.startsWith('http') || url.includes('url_real') || url.includes('tudominio.com')) return false;
              
              // 2. Domain check (Flexible Root)
              if (finalResult.websiteUrl) {
                  const allowedRoot = getDomainRoot(finalResult.websiteUrl);
                  if (allowedRoot && !url.includes(allowedRoot)) return false;
              }

              // 3. Grounding check (Preferred but optional if domain match is strong)
              // We allow if it matches domain OR is in sources
              return true; 
          });
      }

      if (onProgress) onProgress("OK", 100);
      return finalResult;

    } catch (error) {
      console.warn(`Analysis failed on attempt ${attempt + 1}, retrying...`, error);
      attempt++;
      if (attempt >= maxAttempts) throw error;
      await delay(2000);
    }
  }
  throw new Error("Analysis failed");
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
    
    // Sanitize query
    const cleanQuery = query.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").toLowerCase();
    const queryTokens = cleanQuery.split(' ').map(t => t.trim()).filter(t => t.length > 0);

    return products.filter(p => {
        const lowerName = p.name.toLowerCase();
        const lowerDesc = p.description.toLowerCase();
        const lowerTags = p.tags ? p.tags.map(t => t.toLowerCase()) : [];
        
        // --- NEGATIVE KEYWORDS LOGIC (EXCLUSION) ---
        // Prevent showing accessories when asking for main devices
        if (cleanQuery.includes('portatil') || cleanQuery.includes('laptop')) {
             if (lowerName.includes('memoria') || lowerName.includes('ram ') || lowerName.includes('funda') || lowerName.includes('mochila') || lowerName.includes('cargador')) return false;
        }
        if (cleanQuery.includes('tablet')) {
             if (lowerName.includes('funda') || lowerName.includes('cristal') || lowerName.includes('cargador')) return false;
        }
        // Prevent showing consoles when asking for games, and vice-versa
        if (cleanQuery.includes('juego') || cleanQuery.includes('game')) {
            if (lowerName.includes('consola') || lowerName.includes('console') || lowerName.includes('mando') || lowerName.includes('controller')) return false;
        }
        if (cleanQuery.includes('consola') || cleanQuery.includes('ps5') || cleanQuery.includes('xbox')) {
             if (lowerName.includes('juego') || lowerName.includes('game')) return false;
        }

        // Direct match
        if (lowerName.includes(cleanQuery)) return true;

        // Token match (allow short tokens >= 2 chars)
        let matches = 0;
        let requiredMatches = 1;
        if (queryTokens.length > 2) requiredMatches = 2;

        queryTokens.forEach(token => {
            if (token.length >= 2) {
                const inName = lowerName.includes(token);
                const inDesc = lowerDesc.includes(token);
                const inTags = lowerTags.some(t => t.includes(token));
                
                if (inName || inDesc || inTags) {
                    matches++;
                }
            }
        });
        
        return matches >= requiredMatches;
    }).slice(0, 5); 
};

/**
 * Sends a message to the chat model.
 * HYBRID MODE: Memory Lookup + Live Search + CATEGORY RESCUE
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
  contextSummary?: string
): Promise<{ text: string; productCards?: Product[] }> => {
  
  const botName = agentName || "Asistente";
  const cleanMessage = currentMessage.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "");
  const lowerQuery = cleanMessage.toLowerCase();

  // 1. MEMORY CHECK: Products
  let memoryCards = findProductsInMemory(cleanMessage, availableProducts);
  
  // 1.5 MEMORY CHECK: Navigation Tree (Category Rescue)
  // If no products found in memory, try to find a matching Category
  if (memoryCards.length === 0 && navigationTree) {
      navigationTree.forEach(cat => {
          const catName = cat.name.toLowerCase();
          // Check if category name is in query (e.g. "tablets" in "busco tablets")
          if (lowerQuery.includes(catName) || catName.includes(lowerQuery)) {
               memoryCards.push({
                   id: `nav-mem-${Date.now()}`,
                   name: `Ver ${cat.name}`,
                   description: language === 'es' ? `Explora toda la sección de ${cat.name}` : `Explore all ${cat.name}`,
                   price: "", // Category = No Price
                   type: "LINK",
                   buyUrl: cat.url
               });
          }
      });
  }

  const memoryContext = memoryCards.length > 0 
      ? `\n[MEMORIA INTERNA]: He encontrado esto en mi base de datos: ${memoryCards.map(p => `${p.name} (${p.buyUrl})`).join(', ')}.`
      : "";

  const langInstruction = language === 'en' 
    ? "REPLY IN ENGLISH." 
    : "RESPONDE EN ESPAÑOL.";
  
  // SALES AGENT PROMPT
  const enhancedInstruction = `
    ${langInstruction}
    ERES: ${botName}, un asistente de ventas experto.
    CONTEXTO DEL NEGOCIO (IMPORTANTE): "${contextSummary || 'Tienda online genérica'}"
    
    REGLA ANTI-ALUCINACIÓN (GROUNDING):
    - Usa el "CONTEXTO DEL NEGOCIO". Si piden algo fuera de lugar (ej. comida en tienda de electrónica), niégalo educadamente indicando a qué se dedica la tienda.
    
    REGLA DE ORO (VISUAL FIRST):
    - TU OBJETIVO ES MOSTRAR CARDS.
    - **PROHIBIDO** escribir listas de productos en texto.
    - Si encuentras productos o categorías, di: "Aquí tienes lo que buscas:" y genera la lista de enlaces para activar las cards.
    
    ESTRATEGIA HÍBRIDA DE BÚSQUEDA:
    1. Revisa mi MEMORIA INTERNA. Si hay coincidencias, úsalas.
    2. SI NO, busca en Google.
       - Si el usuario busca un producto específico, busca precio.
       - Si el usuario busca una CATEGORÍA (ej. "Tablets", "Portátiles"), busca la URL de la sección (ej. tudominio.com/tablets).
    
    FORMATO OBLIGATORIO:
    - Frase muy corta (Max 10 palabras).
    - LISTA DE VIÑETAS con los enlaces encontrados.
    
    ${memoryContext}
  `;

  try {
    const augmentedHistory = [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    ];

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: enhancedInstruction,
        tools: [{ googleSearch: {} }],
      },
      history: augmentedHistory
    });

    let finalMessage = cleanMessage;
    // Don't force "buy" if it's a broad category search, allows finding section pages
    if (finalMessage.length < 50 && !lowerQuery.includes('comprar')) {
        // Just search the term + site to find categories
    }

    const result: GenerateContentResponse = await chat.sendMessage({
      message: finalMessage
    });

    let responseText = result.text || "";
    let liveCards: Product[] = [];

    // 2. LIVE GROUNDING: Extract cards from Google Search
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
        const seenUrls = new Set<string>();
        memoryCards.forEach(p => p.buyUrl && seenUrls.add(p.buyUrl));

        let allowedRoot = "";
        try {
            if (websiteUrl) {
                allowedRoot = getDomainRoot(websiteUrl);
            }
        } catch (e) {}

        groundingChunks.forEach((chunk: any, index: number) => {
            const uri = chunk.web?.uri;
            const title = chunk.web?.title;
            
            if (uri && title && !seenUrls.has(uri)) {
                const lowerUri = uri.toLowerCase();
                
                // Flexible Domain Filtering
                const isCorrectDomain = allowedRoot ? lowerUri.includes(allowedRoot) : true;
                if (!isCorrectDomain) return;

                // Blacklist irrelevant pages
                if (lowerUri.includes('login') || lowerUri.includes('cart') || lowerUri.includes('politica')) return;

                seenUrls.add(uri);
                
                // Try to find price
                const priceMatch = title.match(/(\d+[.,]\d{2})\s?€/);
                let price = priceMatch ? priceMatch[0] : "";
                let type: 'PRODUCT' | 'LINK' = 'PRODUCT';

                // --- CATEGORY RESCUE & PRODUCT MATCH LOGIC ---
                // Lower the token limit to 2 to catch "8gb", "ram", "hp"
                const queryTerms = cleanMessage.split(' ').filter(t => t.length >= 2); 
                const isUrlMatchingQuery = queryTerms.some(t => lowerUri.includes(t.toLowerCase()));
                const isCategoryLike = lowerUri.includes('category') || lowerUri.includes('familia') || lowerUri.includes('seccion') || lowerUri.includes('listado');
                
                // Some ecommerces use specific patterns for products (e.g. MediaMarkt uses /p/ or .html not in category)
                const isProductLike = lowerUri.includes('/p/') || lowerUri.includes('/product/') || lowerUri.includes('/producto/') || (lowerUri.includes('.html') && !isCategoryLike);

                if (!price) {
                     if (isCategoryLike) {
                         type = 'LINK';
                         price = ""; // Visual indicator handled by component
                     } else if (isProductLike || isUrlMatchingQuery) {
                         // If it looks like a product URL or strongly matches query, allow it even without price
                         // This fixes the issue where product pages are discarded because title lacks price
                         type = 'PRODUCT';
                         price = ""; // Will render as "Ver Precio"
                     } else {
                         return; 
                     }
                }
                
                let cleanTitle = title.split(/[-|]/)[0].trim();
                if (cleanTitle.length > 50) cleanTitle = cleanTitle.substring(0, 47) + "...";

                liveCards.push({
                    id: `live-${Date.now()}-${index}`,
                    name: cleanTitle,
                    description: language === 'es' ? (type === 'LINK' ? "Ver Catálogo Completo" : "Disponible en tienda") : "View Category",
                    price: price, 
                    type: type,
                    buyUrl: uri,
                    imageUrl: "" 
                });
            }
        });
    }

    // 3. MERGE & FALLBACK
    let allCards: Product[] = [...liveCards, ...memoryCards]; 
    
    // Deduplicate
    const uniqueCards: Product[] = [];
    const urlSet = new Set();
    allCards.forEach(c => {
        if (c.buyUrl && !urlSet.has(c.buyUrl)) {
            urlSet.add(c.buyUrl);
            uniqueCards.push(c);
        }
    });

    // CLEANUP RESPONSE TEXT
    const splitLines = responseText.split('\n');
    let cleanText = "";
    for (const line of splitLines) {
        if (line.trim().startsWith('*') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) continue; 
        if (line.includes('http')) continue;
        cleanText += line + "\n";
    }

    // GHOST MESSAGE FIX
    if (uniqueCards.length === 0) {
        const lowerText = cleanText.toLowerCase();
        if (lowerText.includes('aquí tienes') || lowerText.includes('opciones')) {
             cleanText = language === 'es' 
              ? `No he encontrado resultados exactos, pero puedes explorar la tienda aquí: ${websiteUrl || ''}`
              : `I couldn't find exact matches, please explore the store here: ${websiteUrl || ''}`;
        }
    } else {
        if (!cleanText.trim() || cleanText.length < 5) {
             cleanText = language === 'es' ? "Aquí tienes las mejores opciones:" : "Here are the best options:";
        }
    }

    return {
      text: cleanText.trim(),
      productCards: uniqueCards.length > 0 ? uniqueCards : undefined
    };

  } catch (error) {
    console.error("Chat error", error);
    return { text: language === 'es' ? "Un momento, estoy consultando el catálogo..." : "One moment, checking catalog..." };
  }
};