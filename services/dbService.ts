import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { UserSession, AnalysisResult, ContextItem } from "../types";

// Firebase Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyD-NDye57DtuizDO4kJ4CRXDd9oneTOVLM",
  authDomain: "brand-ai-chatbot-saas.firebaseapp.com",
  projectId: "brand-ai-chatbot-saas",
  storageBucket: "brand-ai-chatbot-saas.firebasestorage.app",
  messagingSenderId: "817610112880",
  appId: "1:817610112880:web:d400016532cc152f0019b5",
  measurementId: "G-N3KW67L7D5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Initialize Analytics
const analytics = getAnalytics(app);

// Types for DB
export interface BotConfiguration {
  analysis: AnalysisResult;
  contextItems: ContextItem[]; // New: Persist the source files/rules
  updatedAt: string;
  deployed: boolean;
}

export interface DbClient {
  token: string;
  email: string;
  isActive: boolean;
  role: 'admin' | 'user';
  domain?: string;
  expirationDate?: string | null;
}

export const dbService = {
  /**
   * Validates a token against the Firestore 'clients' collection.
   */
  validateToken: async (token: string): Promise<UserSession | null> => {
    // 1. Hardcoded Admin Backdoor
    if (token === 'ADMIN_TOKEN_SECURE_128') {
      return {
        token,
        email: 'admin@128brand.com',
        isActive: true,
        role: 'admin'
      };
    }

    try {
      // 2. Query Firestore for the client token
      const clientsRef = collection(db, "clients");
      const q = query(clientsRef, where("token", "==", token));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0].data() as DbClient;
        
        // --- NUEVA LÓGICA DE CADUCIDAD ---
        if (clientDoc.expirationDate) {
            const now = new Date();
            const expiration = new Date(clientDoc.expirationDate);
            
            // Si hoy es mayor que la fecha de expiración -> Bloquear
            if (now > expiration) {
                console.warn("Token caducado el:", expiration);
                return { 
                    token: clientDoc.token,
                    email: clientDoc.email,
                    isActive: false, // Forzamos inactivo para que el login falle visualmente
                    role: clientDoc.role || 'user'
                };
            }
        }
        // ---------------------------------
        
        return {
          token: clientDoc.token,
          email: clientDoc.email,
          isActive: clientDoc.isActive,
          role: clientDoc.role || 'user'
        };
      }
      
      return null; // Token not found

    } catch (error) {
      console.error("Error validating token in Firestore:", error);
      return null;
    }
  },

  /**
   * Saves the generated bot configuration AND the context items (files) to Firestore.
   */
  saveBotConfig: async (token: string, analysis: AnalysisResult, contextItems: ContextItem[]): Promise<void> => {
    try {
      const configRef = doc(db, "bot_configs", token);
      
      const sanitizedAnalysis = JSON.parse(JSON.stringify(analysis));
      // Note: Firestore has a 1MB limit per doc. Large files might need Firebase Storage in production.
      // For this implementation, we assume files are optimized or small PDFs/CSVs.
      const sanitizedContext = JSON.parse(JSON.stringify(contextItems));

      const configData: BotConfiguration = {
        analysis: sanitizedAnalysis,
        contextItems: sanitizedContext,
        updatedAt: new Date().toISOString(),
        deployed: true
      };

      await setDoc(configRef, configData, { merge: true });
      console.log("Full configuration (including files) saved for:", token);
    } catch (error) {
      console.error("Error saving config to Firestore:", error);
      throw error;
    }
  },

  /**
   * Retrieves an existing bot configuration from Firestore.
   */
  getBotConfig: async (token: string): Promise<BotConfiguration | null> => {
    try {
      const configRef = doc(db, "bot_configs", token);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as BotConfiguration;
        return data; // Return full object including contextItems
      }
      return null;
    } catch (error) {
      console.error("Error retrieving config from Firestore:", error);
      return null;
    }
  }
};