
import React, { useState } from 'react';
import { CopyIcon, CodeIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

interface EmbedGeneratorProps {
  token: string;
  brandColor?: string;
}

export const EmbedGenerator: React.FC<EmbedGeneratorProps> = ({ token, brandColor = "#0ea5e9" }) => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'HTML' | 'WORDPRESS' | 'SHOPIFY'>('HTML');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const embedCode = `<!-- 128Brand Chatbot Configuration -->
<script>
  window.brand128Config = {
    token: "${token}",
    theme: "light",
    primaryColor: "${brandColor}", 
  };
</script>
<!-- Universal Widget Loader -->
<script 
  id="128brand-script"
  src="https://cdn.128brand.com/widget/v1/bundle.js" 
  async 
  defer
></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    let urlToCheck = verifyUrl.trim();
    
    if (!urlToCheck) {
        return;
    }

    // Auto-fix URL protocol
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
        urlToCheck = `https://${urlToCheck}`;
        setVerifyUrl(urlToCheck);
    }

    setVerifying(true);
    setVerifyStatus('idle');

    setTimeout(() => {
      setVerifying(false);
      
      // Demo Logic: permissive validation
      const isValidDomain = urlToCheck.includes('.') && urlToCheck.length > 5; 

      if (isValidDomain) {
        setVerifyStatus('success');
      } else {
        setVerifyStatus('error');
      }
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col lg:flex-row transition-colors duration-300">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.platform}</h3>
            <div className="space-y-2">
              {[
                { id: 'HTML', label: 'HTML / Standard' },
                { id: 'WORDPRESS', label: 'WordPress' },
                { id: 'SHOPIFY', label: 'Shopify' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                    platform === p.id 
                      ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 text-brand-700 dark:text-brand-300' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                  {platform === p.id && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.installStatus}</h3>
             <div className="space-y-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="tudominio.com" 
                    value={verifyUrl}
                    onChange={(e) => setVerifyUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white"
                  />
                </div>
                <button 
                  onClick={handleVerify}
                  disabled={verifying || !verifyUrl}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white uppercase tracking-wide transition-all shadow-md ${
                    verifying ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 hover:shadow-lg transform active:scale-95'
                  }`}
                >
                  {verifying ? t.scanning : t.verifyBtn}
                </button>

                {verifyStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg border border-emerald-100 dark:border-emerald-800 flex flex-col gap-1 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 dark:bg-emerald-800 p-1 rounded-full">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="font-bold text-emerald-800 dark:text-emerald-200">{t.widgetDetected}</span>
                    </div>
                    <p className="pl-6 opacity-90 leading-relaxed">{t.widgetDetectedDesc}</p>
                  </div>
                )}
                 {verifyStatus === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-lg border border-red-100 dark:border-red-800 flex flex-col gap-2 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                         <div className="bg-red-100 dark:bg-red-800 p-1 rounded-full">
                            <svg className="w-3 h-3 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <span className="font-bold text-red-800 dark:text-red-200">{t.notDetected}</span>
                    </div>
                    <div className="pl-6 opacity-90 space-y-1">
                        <p>{t.notDetectedDesc}</p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-white dark:bg-slate-800 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.embedTitle}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.embedDesc}</p>
             </div>
             <div className="flex items-center gap-3 text-sm">
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: brandColor }}></div>
                   <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">{brandColor}</span>
                </div>
             </div>
          </div>

          <div className="relative group mb-8">
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-xs font-bold text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
              >
                {copied ? (
                   <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> {t.copied}</>
                ) : (
                   <><CopyIcon className="w-3 h-3" /> {t.copyCode}</>
                )}
              </button>
            </div>
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
               <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-2 text-xs text-slate-500 font-mono">integration.html</span>
               </div>
               <pre className="p-6 text-blue-100 text-sm font-mono overflow-x-auto leading-relaxed">
                  {embedCode}
               </pre>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
            {platform === 'HTML' && (
              <div className="animate-fade-in">
                <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                  <CodeIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" /> {t.htmlGuide}
                </h3>
                <ol className="marker:text-brand-500 dark:marker:text-brand-400 text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                  <li dangerouslySetInnerHTML={{ __html: t.htmlStep1 }} />
                  <li>{t.htmlStep2}</li>
                  <li dangerouslySetInnerHTML={{ __html: t.htmlStep3 }} />
                  <li>{t.htmlStep4}</li>
                </ol>
              </div>
            )}
            
             {platform === 'WORDPRESS' && (
                <div className="animate-fade-in">
                    <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2 mb-2">
                        {t.wordpressGuide}
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200 space-y-2">
                        <p className="font-semibold text-xs uppercase tracking-wide">{t.wpRecommended}</p>
                        <p>{t.wpStep1}</p>
                    </div>
                </div>
             )}

             {platform === 'SHOPIFY' && (
                 <div className="animate-fade-in">
                    <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2 mb-2">
                        {t.shopifyGuide}
                    </h3>
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800 text-green-800 dark:text-green-200">
                        <p dangerouslySetInnerHTML={{ __html: t.shopifyStep1 }} />
                        <p className="mt-2" dangerouslySetInnerHTML={{ __html: t.shopifyStep2 }} />
                    </div>
                 </div>
             )}
          </div>
        </div>
    </div>
  );
};
