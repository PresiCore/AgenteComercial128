import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { UserSession, AnalysisResult, ContextItem, ContextType } from "../types";

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
const storage = getStorage(app);
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
    try {
      // Query Firestore for the client token
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
   * IMPROVED: Uploads files to Firebase Storage to avoid Firestore 1MB limit.
   */
  saveBotConfig: async (token: string, analysis: AnalysisResult, contextItems: ContextItem[]): Promise<void> => {
    try {
      const configRef = doc(db, "bot_configs", token);
      
      const sanitizedAnalysis = JSON.parse(JSON.stringify(analysis));
      
      // Deep copy contextItems to avoid mutating UI state during processing
      const itemsToSave = JSON.parse(JSON.stringify(contextItems));

      // Process files: Upload content to Storage, remove Base64 from Firestore object
      const processedItems: ContextItem[] = await Promise.all(itemsToSave.map(async (item: ContextItem) => {
          if (item.type === ContextType.FILE && item.fileData && item.fileName) {
              try {
                  // Create a unique path: bot_assets/{token}/{itemId}_{fileName}
                  // Sanitize filename to avoid issues with special characters
                  const safeFileName = item.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
                  const storagePath = `bot_assets/${token}/${item.id}_${safeFileName}`;
                  const storageRef = ref(storage, storagePath);
                  
                  // Upload Base64 string
                  // item.fileData is pure Base64 (from ContextBuilder FileReader)
                  await uploadString(storageRef, item.fileData, 'base64', {
                      contentType: item.mimeType || 'application/octet-stream'
                  });
                  
                  const downloadUrl = await getDownloadURL(storageRef);
                  
                  return {
                      ...item,
                      storageUrl: downloadUrl,
                      fileData: null // Clear heavy data for Firestore document
                  };
              } catch (uploadError) {
                  console.error(`Failed to upload file ${item.fileName} to Storage:`, uploadError);
                  // On failure, we try to keep the fileData so data isn't lost, 
                  // though this might still trigger Firestore limit error.
                  return item;
              }
          }
          return item;
      }));

      const configData: BotConfiguration = {
        analysis: sanitizedAnalysis,
        contextItems: processedItems,
        updatedAt: new Date().toISOString(),
        deployed: true
      };

      await setDoc(configRef, configData, { merge: true });
      console.log("Full configuration saved for:", token);
    } catch (error) {
      console.error("Error saving config to Firestore:", error);
      throw error;
    }
  },

  /**
   * Retrieves an existing bot configuration from Firestore.
   * IMPROVED: Rehydrates file data from Firebase Storage URLs.
   */
  getBotConfig: async (token: string): Promise<BotConfiguration | null> => {
    try {
      const configRef = doc(db, "bot_configs", token);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as BotConfiguration;
        
        // Rehydrate files: If we have storageUrl but no fileData, fetch it
        // This ensures the Gemini service gets the Base64 data it needs for analysis
        if (data.contextItems && data.contextItems.length > 0) {
            const rehydratedItems = await Promise.all(data.contextItems.map(async (item) => {
                if (item.type === ContextType.FILE && item.storageUrl && !item.fileData) {
                    try {
                        const response = await fetch(item.storageUrl);
                        const blob = await response.blob();
                        const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                if (reader.result) {
                                    resolve((reader.result as string).split(',')[1]);
                                } else {
                                    reject(new Error("Empty result"));
                                }
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        return { ...item, fileData: base64 };
                    } catch (fetchError) {
                        console.error(`Failed to rehydrate file ${item.fileName}:`, fetchError);
                        // Return item as is (likely unusable for analysis but visible in list)
                        return item;
                    }
                }
                return item;
            }));
            data.contextItems = rehydratedItems;
        }

        return data;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving config from Firestore:", error);
      return null;
    }
  }
};