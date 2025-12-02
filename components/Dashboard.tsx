import React, { useState, useEffect } from 'react';
import { UserSession, ContextItem, AnalysisResult } from '../types';
import { analyzeCompanyContext, sendMessageToBot } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { ContextBuilder } from './ContextBuilder';
import { ChatPreview } from './ChatPreview';
import { EmbedGenerator } from './EmbedGenerator';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BotIcon, CodeIcon, FileTextIcon, BarChartIcon, SunIcon, MoonIcon, GlobeIcon, UploadIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  session: UserSession;
}

enum DashboardTab {
  CONTEXT = 'CONTEXT',
  PREVIEW = 'PREVIEW',
  ANALYTICS = 'ANALYTICS',
  EMBED = 'EMBED',
}

export const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.CONTEXT);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Loading Overlay State
  const [loadingPhase, setLoadingPhase] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Auto-save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Load configuration from Firebase on Mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!session.token) return;
      const config = await dbService.getBotConfig(session.token);
      if (config) {
        setAnalysisResult(config);
        // If we have a saved config, jump to preview
        setActiveTab(DashboardTab.PREVIEW);
      }
    };
    loadConfig();
  }, [session.token]);

  // Effect to AUTO-SAVE whenever analysisResult changes
  useEffect(() => {
    const autoSave = async () => {
        if (!analysisResult || !session.token) return;
        setSaveStatus('saving');
        try {
            await dbService.saveBotConfig(session.token, analysisResult);
            // Artificial delay to show "Saving..." briefly
            setTimeout(() => setSaveStatus('saved'), 800);
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };
    
    // Debounce slightly to avoid rapid writes during typing
    const timeout = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeout);
  }, [analysisResult, session.token]);

  const handleAnalyze = async () => {
    if (contextItems.length === 0) {
      alert(language === 'es' ? "Por favor añade algo de contexto primero." : "Please add some context first.");
      return;
    }
    
    setIsAnalyzing(true);
    setLoadingProgress(0);
    
    try {
      // Pass the current language to the service
      const result = await analyzeCompanyContext(contextItems, language, (phase, progress) => {
          setLoadingPhase(phase);
          setLoadingProgress(progress);
      });
      setAnalysisResult(result);
      // Auto-save handled by useEffect
      setActiveTab(DashboardTab.PREVIEW);
    } catch (e: any) {
      alert(`${language === 'es' ? 'El análisis falló' : 'Analysis failed'}: ${e.message}`);
      console.error(e);
    } finally {
      setIsAnalyzing(false);
      setLoadingPhase("");
    }
  };

  const handleColorChange = (newColor: string) => {
    if (analysisResult) {
      setAnalysisResult({ ...analysisResult, brandColor: newColor });
    }
  };

  const handleNameChange = (newName: string) => {
    if (analysisResult) {
      setAnalysisResult({ ...analysisResult, agentName: newName });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 bg-grid-pattern flex flex-col font-sans transition-colors duration-300">
      {/* Analysis Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-purple-500 to-brand-400 animate-pulse"></div>
              
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                        <span className="text-4xl">🧠</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-brand-500/30 animate-ping"></div>
                 </div>
                 
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">{t.analyzingTitle}</h3>
                    <p className="text-slate-400 text-sm h-5 transition-all duration-300">{loadingPhase || t.phaseInit}</p>
                 </div>

                 <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-brand-600 rounded-lg p-1.5 text-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M11.5 11.5v.01"></path><path d="M16 16v.01"></path></svg>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  128Brand<span className="text-brand-600 dark:text-brand-400">.IA</span>
                </span>
              </div>
              
              <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                  {analysisResult ? (
                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                         <div className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                         <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                             {saveStatus === 'saved' ? t.aiLearningActive : t.aiLearningSaving}
                         </span>
                     </div>
                  ) : null}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {[
                { id: DashboardTab.CONTEXT, label: t.tabData, icon: FileTextIcon },
                { id: DashboardTab.PREVIEW, label: t.tabChatbot, icon: BotIcon },
                { id: DashboardTab.ANALYTICS, label: t.tabAnalytics, icon: BarChartIcon },
                { id: DashboardTab.EMBED, label: t.tabIntegrate, icon: CodeIcon }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md translate-y-0' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={tab.id !== DashboardTab.CONTEXT && !analysisResult}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-300 dark:text-brand-600' : ''}`} /> 
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

              <button 
                 onClick={toggleTheme}
                 className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                 {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              </button>

              <button 
                 onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                 className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold text-xs"
              >
                 <GlobeIcon className="w-5 h-5" />
                 {language.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
        
        {activeTab === DashboardTab.CONTEXT && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 relative overflow-hidden transition-colors duration-300">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-purple-500"></div>
               
               <div className="mb-8">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.configTitle}</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
                   {t.configDesc}
                 </p>
               </div>
               
               <ContextBuilder 
                 items={contextItems} 
                 onUpdate={setContextItems} 
               />

               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || contextItems.length === 0}
                    className={`flex items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl shadow-lg transition-all transform active:scale-[0.98] ${
                      isAnalyzing || contextItems.length === 0
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400'
                        : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white hover:shadow-brand-500/25'
                    }`}
                  >
                    {t.generateFunnel}
                  </button>
               </div>
             </div>
          </div>
        )}

        {activeTab === DashboardTab.PREVIEW && analysisResult && (
           <div className="h-[calc(100vh-140px)] min-h-[650px] animate-slide-up relative">
             <ChatPreview 
               analysis={analysisResult} 
               onSendMessage={(h, m, products) => sendMessageToBot(
                   h, 
                   m, 
                   analysisResult.systemInstruction, 
                   products, 
                   language, 
                   analysisResult.websiteUrl, 
                   analysisResult.navigationTree, 
                   analysisResult.agentName,
                   analysisResult.summary
               )}
               onColorChange={handleColorChange}
               onNameChange={handleNameChange}
             />
           </div>
        )}

        {activeTab === DashboardTab.ANALYTICS && analysisResult && (
           <div className="animate-slide-up">
              <AnalyticsDashboard brandColor={analysisResult.brandColor} />
           </div>
        )}

        {activeTab === DashboardTab.EMBED && analysisResult && (
          <div className="animate-slide-up">
            <EmbedGenerator 
              token={session.token} 
              brandColor={analysisResult.brandColor} 
            />
          </div>
        )}

      </main>
    </div>
  );
};