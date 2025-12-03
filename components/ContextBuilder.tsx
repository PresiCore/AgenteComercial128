

import React, { useState, useEffect } from 'react';
import { ContextItem, ContextType } from '../types';
import { TrashIcon, UploadIcon, BotIcon, UsersIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

interface ContextBuilderProps {
  items: ContextItem[];
  onUpdate: (items: ContextItem[]) => void;
}

export const ContextBuilder: React.FC<ContextBuilderProps> = ({ items, onUpdate }) => {
  const { t } = useApp();
  const [inputText, setInputText] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState<string[]>([]);

  // State for Contact Emails
  const [supportEmail, setSupportEmail] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [techEmail, setTechEmail] = useState('');

  // Hydrate emails from items on load
  useEffect(() => {
    const support = items.find(i => i.content.startsWith('[CONTACTO_SOPORTE]:'));
    const sales = items.find(i => i.content.startsWith('[CONTACTO_VENTAS]:'));
    const tech = items.find(i => i.content.startsWith('[CONTACTO_TECNICO]:'));

    if (support) setSupportEmail(support.content.replace('[CONTACTO_SOPORTE]: ', ''));
    if (sales) setSalesEmail(sales.content.replace('[CONTACTO_VENTAS]: ', ''));
    if (tech) setTechEmail(tech.content.replace('[CONTACTO_TECNICO]: ', ''));
  }, []);

  // Sync emails to ContextItems
  const updateEmailContext = (type: 'SOPORTE' | 'VENTAS' | 'TECNICO', value: string) => {
    const prefix = `[CONTACTO_${type}]:`;
    const newItems = items.filter(i => !i.content.startsWith(prefix));
    
    if (value.trim()) {
      newItems.push({
        id: `contact-${type.toLowerCase()}`,
        type: ContextType.TEXT,
        content: `${prefix} ${value.trim()}`
      });
    }
    onUpdate(newItems);
  };

  const addInstruction = () => {
    if (!inputText.trim()) return;

    // Use a specific prefix to denote this is a Business Rule/Indication
    const newItem: ContextItem = {
      id: Date.now().toString(),
      type: ContextType.TEXT,
      content: `[REGLA DE NEGOCIO]: ${inputText}`
    };

    onUpdate([...items, newItem]);
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const feedbackMessages: Set<string> = new Set();
    
    const readFile = (file: File): Promise<ContextItem> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          const mimeType = file.type;
          
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (ext === 'csv' || ext === 'xlsx') {
              feedbackMessages.add('✅ Base de Datos');
              feedbackMessages.add('✅ Precios');
          } else if (ext === 'pdf') {
              feedbackMessages.add('✅ Catálogo');
          } else {
              feedbackMessages.add('✅ Archivo');
          }

          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: ContextType.FILE,
            content: `Archivo: ${file.name}`,
            fileName: file.name,
            fileData: base64Data,
            mimeType: mimeType
          });
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const newItems = await Promise.all(Array.from(files).map(readFile));

      setUploadFeedback(Array.from(feedbackMessages));
      onUpdate([...items, ...newItems]);
      
      setTimeout(() => setUploadFeedback([]), 3000);
      e.target.value = '';
    } catch (error) {
      console.error("Error processing files:", error);
    }
  };

  const removeItem = (id: string) => {
    onUpdate(items.filter(i => i.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Configuration Area */}
      <div className="md:col-span-7 space-y-8">
        
        {/* Agent Indications */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
           
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <BotIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              {t.agentInstructionsTitle}
           </h3>
           
           {/* Base Persona Indicator */}
           <div className="mb-6 bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800 flex gap-3 items-start">
              <div className="bg-brand-100 dark:bg-brand-800 p-1.5 rounded-lg shrink-0">
                  <span className="text-xl">🏆</span>
              </div>
              <div>
                  <p className="text-sm text-brand-900 dark:text-brand-100 font-bold mb-0.5">
                     Modo Activado: Mejor Vendedor & Experto en Embudos
                  </p>
                  <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
                     El agente ya está programado para ser tu mejor vendedor: cualifica, persuade y cierra ventas. 
                     <strong>No necesitas decirle cómo vender.</strong> Solo dile tus reglas (descuentos, envíos, etc.).
                  </p>
              </div>
           </div>

           <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">
              {t.agentInstructionsDesc}
           </p>

           <div className="space-y-3">
             <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.agentInstructionsPlaceholder}
                  className="w-full min-h-[80px] border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
             </div>
             <button
               onClick={addInstruction}
               disabled={!inputText.trim()}
               className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               <span className="text-lg leading-none">+</span> 
               {t.addInstructionsBtn}
             </button>
           </div>
        </div>

        {/* Contact Channels */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {t.contactChannelsTitle}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t.contactChannelsDesc}
            </p>

            <div className="grid grid-cols-1 gap-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Soporte / Garantías</label>
                  <input 
                    type="email"
                    value={supportEmail}
                    onChange={(e) => {
                       setSupportEmail(e.target.value);
                       updateEmailContext('SOPORTE', e.target.value);
                    }}
                    placeholder={t.emailSupportPlaceholder}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800 dark:text-slate-200"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Ventas B2B</label>
                    <input 
                      type="email"
                      value={salesEmail}
                      onChange={(e) => {
                        setSalesEmail(e.target.value);
                        updateEmailContext('VENTAS', e.target.value);
                      }}
                      placeholder={t.emailSalesPlaceholder}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800 dark:text-slate-200"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Servicio Técnico</label>
                    <input 
                      type="email"
                      value={techEmail}
                      onChange={(e) => {
                        setTechEmail(e.target.value);
                        updateEmailContext('TECNICO', e.target.value);
                      }}
                      placeholder={t.emailTechPlaceholder}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800 dark:text-slate-200"
                    />
                 </div>
               </div>
            </div>
        </div>

        <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Knowledge Base (Files) */}
        <div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <span className="text-xl">📚</span>
              {t.knowledgeBaseTitle}
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t.knowledgeBaseDesc}
           </p>

           <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl opacity-5 group-hover:opacity-20 transition duration-500 blur"></div>
              <label className="relative flex flex-col items-center justify-center w-full h-32 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 border-dashed cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-all overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50">
                  
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center z-10">
                      <div className="p-2 bg-brand-50 dark:bg-slate-700 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300">
                         <UploadIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                         {t.uploadLabel}
                      </p>
                      <p className="text-xs text-slate-400">
                         {t.uploadSubLabel}
                      </p>
                  </div>

                  {/* Visual Feedback Tags */}
                  {uploadFeedback.length > 0 && (
                     <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 flex flex-wrap items-center justify-center gap-2 p-4 animate-fade-in z-20">
                        {uploadFeedback.map((tag, i) => (
                           <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded shadow-sm border border-emerald-200 dark:border-emerald-800">
                              {tag}
                           </span>
                        ))}
                     </div>
                  )}

                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.csv,.xlsx,.txt,.json,.doc,.docx" multiple />
              </label>
           </div>
        </div>
      </div>

      {/* Item List */}
      <div className="md:col-span-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col transition-colors">
           <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 rounded-t-xl">
             <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
               {t.dataSources}
               <span className="bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 py-0.5 px-2 rounded-full text-xs font-bold">{items.length}</span>
             </h3>
           </div>
           
           <div className="p-4 overflow-y-auto h-[500px] space-y-3 custom-scrollbar">
             {items.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                 <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">📋</span>
                 </div>
                 <p className="text-slate-900 dark:text-white font-medium text-sm">{t.noData}</p>
                 <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t.noDataDesc}</p>
               </div>
             ) : (
               <ul className="space-y-2">
                 {items.map(item => {
                   const isContact = item.content.startsWith('[CONTACTO');
                   
                   return (
                   <li key={item.id} className="group bg-white dark:bg-slate-700/20 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 transition-all flex justify-between items-start">
                      <div className="flex items-start gap-3 min-w-0">
                         <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                           item.type === ContextType.FILE 
                             ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                             : isContact
                               ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                               : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                         }`}>
                           {item.type === ContextType.FILE 
                              ? <UploadIcon className="w-3.5 h-3.5" /> 
                              : isContact 
                                ? <UsersIcon className="w-3.5 h-3.5" />
                                : <BotIcon className="w-3.5 h-3.5" />
                           }
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {item.fileName || (item.content.replace(/\[.*?\]: /, ''))}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                              {item.type === ContextType.FILE 
                                ? 'Base de Conocimiento' 
                                : isContact 
                                  ? 'Contacto'
                                  : 'Regla de Negocio'}
                            </p>
                         </div>
                      </div>
                      <button onClick={() => {
                        // If it's a contact item, clear the state input too
                        if (item.content.startsWith('[CONTACTO_SOPORTE]')) setSupportEmail('');
                        if (item.content.startsWith('[CONTACTO_VENTAS]')) setSalesEmail('');
                        if (item.content.startsWith('[CONTACTO_TECNICO]')) setTechEmail('');
                        removeItem(item.id);
                      }} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                         <TrashIcon className="w-4 h-4" />
                      </button>
                   </li>
                 )}}
               </ul>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
