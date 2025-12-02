import React, { useState } from 'react';
import { ContextItem, ContextType } from '../types';
import { TrashIcon, UploadIcon, LinkIcon, FileTextIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

interface ContextBuilderProps {
  items: ContextItem[];
  onUpdate: (items: ContextItem[]) => void;
}

export const ContextBuilder: React.FC<ContextBuilderProps> = ({ items, onUpdate }) => {
  const { t } = useApp();
  const [inputText, setInputText] = useState('');
  const [inputType, setInputType] = useState<ContextType>(ContextType.TEXT);

  const addItem = () => {
    if (!inputText.trim()) return;

    const newItem: ContextItem = {
      id: Date.now().toString(),
      type: inputType,
      content: inputText
    };

    onUpdate([...items, newItem]);
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      const mimeType = file.type;

      const newItem: ContextItem = {
        id: Date.now().toString(),
        type: ContextType.FILE,
        content: `File: ${file.name}`,
        fileName: file.name,
        fileData: base64Data,
        mimeType: mimeType
      };

      onUpdate([...items, newItem]);
    };
    reader.readAsDataURL(file);
  };

  const removeItem = (id: string) => {
    onUpdate(items.filter(i => i.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Input Area */}
      <div className="md:col-span-7 space-y-6">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1.5 flex gap-1 w-fit border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setInputType(ContextType.TEXT)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputType === ContextType.TEXT 
                ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.manualText}
          </button>
          <button
            onClick={() => setInputType(ContextType.URL)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputType === ContextType.URL 
                ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.urlScraping}
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={inputType === ContextType.URL ? t.inputPlaceholderUrl : t.inputPlaceholderText}
            className="w-full min-h-[140px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none shadow-sm"
          />
          <button
            onClick={addItem}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span> 
            {inputType === ContextType.URL ? t.addUrlBtn : t.addTextBtn}
          </button>
        </div>
        
        <div className="relative my-6">
           <div className="absolute inset-0 flex items-center" aria-hidden="true">
             <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
           </div>
           <div className="relative flex justify-center">
             <span className="px-3 bg-white dark:bg-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wide">{t.orUpload}</span>
           </div>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-brand-400 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <UploadIcon className="w-6 h-6 text-brand-500 dark:text-brand-400" />
                </div>
                <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{t.clickToUpload}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">PDF, CSV, TXT (Max 10MB)</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.csv,image/png,image/jpeg,.txt" />
        </label>
      </div>

      {/* List Area */}
      <div className="md:col-span-5">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
           <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-t-xl">
             <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
               {t.dataSources}
               <span className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">{items.length}</span>
             </h3>
           </div>
           
           <div className="p-4 overflow-y-auto h-[400px] space-y-3">
             {items.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-6">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <FileTextIcon className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                 </div>
                 <p className="text-slate-900 dark:text-white font-medium text-sm">{t.noData}</p>
                 <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{t.noDataDesc}</p>
               </div>
             ) : (
               <ul className="space-y-2">
                 {items.map(item => (
                   <li key={item.id} className="group bg-white dark:bg-slate-700/30 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-md transition-all flex justify-between items-start">
                      <div className="flex items-start gap-3 overflow-hidden">
                         <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                           item.type === ContextType.URL ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                           item.type === ContextType.FILE ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                           'bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-300'
                         }`}>
                           {item.type === ContextType.URL && <LinkIcon className="w-3.5 h-3.5" />}
                           {item.type === ContextType.FILE && <UploadIcon className="w-3.5 h-3.5" />}
                           {item.type === ContextType.TEXT && <FileTextIcon className="w-3.5 h-3.5" />}
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {item.fileName || (item.type === ContextType.TEXT ? t.manualText : item.content)}
                            </p>
                            {item.type === ContextType.URL && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {t.scrapingActive}
                              </p>
                            )}
                            {item.type !== ContextType.URL && (
                              <p className="text-[10px] text-slate-400 truncate">{item.content.substring(0, 30)}...</p>
                            )}
                         </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                         <TrashIcon className="w-4 h-4" />
                      </button>
                   </li>
                 ))}
               </ul>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
