import React, { useState } from 'react';
import { UserSession } from '../types';
import { useApp } from '../contexts/AppContext';
import { dbService } from '../services/dbService';

interface AuthScreenProps {
  onLogin: (session: UserSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const { t } = useApp();
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!inputToken.trim()) {
        setError(t.errorTokenRequired);
        return;
    }

    setIsLoading(true);

    try {
      // Validate against Firebase
      const session = await dbService.validateToken(inputToken.trim());
      
      if (session) {
        if (!session.isActive) {
           setError(t.errorTokenInactive);
           setIsLoading(false);
           return;
        }
        onLogin(session);
      } else {
        setError("Token inválido o no encontrado.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-600/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10 z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500 text-white mb-4 shadow-lg shadow-brand-500/30">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">128Brand AI</h1>
          <p className="text-slate-300 text-sm">{t.loginTitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 pl-1">
              {t.tokenLabel}
            </label>
            <div className="relative group">
              <input
                id="token"
                type="text"
                required
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder={t.tokenPlaceholder}
                className="block w-full px-4 py-3.5 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-500 transition-all transform active:scale-[0.98] ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t.verifying}
              </span>
            ) : t.loginButton}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-slate-500">{t.secureText}</p>
        </div>
      </div>
    </div>
  );
};