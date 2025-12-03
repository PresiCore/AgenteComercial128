
export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
}

export enum ContextType {
  TEXT = 'TEXT',
  URL = 'URL',
  FILE = 'FILE',
}

export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';

export interface ContextItem {
  id: string;
  type: ContextType;
  content: string; // Text content or URL
  fileName?: string;
  fileData?: string; // Base64 for files
  mimeType?: string;
}

export interface SiteCategory {
  name: string;
  url: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  price?: string; // Optional for generic navigation cards
  description: string;
  imageUrl?: string;
  buyUrl?: string;
  type?: 'PRODUCT' | 'SERVICE' | 'LINK';
  tags?: string[]; // New: keywords for internal search
}

export interface Source {
  title: string;
  uri: string;
}

export interface ContactInfo {
  sales?: string;
  support?: string;
  technical?: string;
}

export interface AnalysisResult {
  agentName?: string; // Customizable bot name
  systemInstruction: string;
  summary: string;
  suggestedGreeting: string;
  keyTopics: string[];
  products: Product[]; // List of specific products
  navigationTree?: SiteCategory[]; // New: List of detected main categories/pages
  brandColor?: string; // Hex code for brand branding
  sources?: Source[]; // Structured list of detected sources
  websiteUrl?: string; // Main website URL detected
  contactInfo?: ContactInfo; // New: Contact channels
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  productCards?: Product[]; // Products to display in a carousel/grid
}

export interface UserSession {
  token: string;
  email: string;
  isActive: boolean; // Simulates payment status
  role?: 'admin' | 'user';
}
