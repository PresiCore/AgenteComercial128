import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { UserSession, AnalysisResult } from "../types";

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
  updatedAt: string;
  deployed: boolean;
}

export interface DbClient {
  token: string;
  email: string;
  isActive: boolean;
  role: 'admin' | 'user';
  domain?: string;
}

export const dbService = {
  /**
   * Validates a token against the Firestore 'clients' collection.
   * Includes a hardcoded fallback for the ADMIN token to ensure access before DB setup.
   */
  validateToken: async (token: string): Promise<UserSession | null> => {
    // 1. Hardcoded Admin Backdoor (Crucial for initial setup)
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
        
        // Return valid session based on DB data
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
      // Fallback for simulation/offline if DB fails
      if (token === 'demo123') {
          return { token: 'demo123', email: 'demo@user.com', isActive: true, role: 'user' };
      }
      throw error;
    }
  },

  /**
   * Saves the generated bot configuration to Firestore.
   */
  saveBotConfig: async (token: string, analysis: AnalysisResult): Promise<void> => {
    try {
      // We use the token as the document ID for the config for 1-to-1 mapping
      // In a real multi-user scenario, we might use a separate ID or Client ID.
      const configRef = doc(db, "bot_configs", token);
      
      const configData: BotConfiguration = {
        analysis,
        updatedAt: new Date().toISOString(),
        deployed: true
      };

      await setDoc(configRef, configData, { merge: true });
      console.log("Configuration saved to Firestore for token:", token);
    } catch (error) {
      console.error("Error saving config to Firestore:", error);
      throw error;
    }
  },

  /**
   * Retrieves an existing bot configuration from Firestore.
   */
  getBotConfig: async (token: string): Promise<AnalysisResult | null> => {
    try {
      const configRef = doc(db, "bot_configs", token);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as BotConfiguration;
        return data.analysis;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving config from Firestore:", error);
      return null;
    }
  }
};