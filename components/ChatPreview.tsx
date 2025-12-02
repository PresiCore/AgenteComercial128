import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, ChatMessage, Product } from '../types';
import { SendIcon, BotIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

// Simple Cart Icon Component
const CartIcon = ({ count }: { count: number }) => (
  <div className="relative cursor-pointer p-1 hover:bg-white/10 rounded-full transition">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
        {count}
      </span>
    )}
  </div>
);

// Helper to convert Markdown links and Bold to HTML
const renderMessageText = (text: string) => {
  const urlRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  
  const partsWithLinks: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  // 1. Process Links
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      partsWithLinks.push(text.substring(lastIndex, match.index));
    }
    partsWithLinks.push(
      <a 
        key={`link-${match.index}`} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="underline decoration-white/50 hover:decoration-white font-semibold break-all transition-all"
        style={{ color: 'inherit' }}
      >
        {match[1]}
      </a>
    );
    lastIndex = urlRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    partsWithLinks.push(text.substring(lastIndex));
  }

  // 2. Process Bold inside string parts
  return partsWithLinks.flatMap((part, i) => {
    if (typeof part === 'string') {
      const subParts = [];
      let lastBIndex = 0;
      let bMatch;
      
      // Reset regex for new string
      boldRegex.lastIndex = 0;
      
      while ((bMatch = boldRegex.exec(part)) !== null) {
        if (bMatch.index > lastBIndex) {
            subParts.push(part.substring(lastBIndex, bMatch.index));
        }
        // Render bold text
        subParts.push(<strong key={`bold-${i}-${bMatch.index}`} className="font-bold">{bMatch[1]}</strong>);
        lastBIndex = boldRegex.lastIndex;
      }
      if (lastBIndex < part.length) {
        subParts.push(part.substring(lastBIndex));
      }
      return subParts.length > 0 ? subParts : [part];
    }
    return part;
  });
};

// --- Product Carousel Component ---
interface ProductCarouselProps {
  products: Product[];
  brandColor: string;
  onAddToCart: (p: Product) => void;
  onBuy: (p: Product) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, brandColor, onAddToCart, onBuy }) => {
  const { t } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 260; 
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group w-full max-w-full mt-3">
      {products.length > 1 && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md border border-gray-100 rounded-full p-1.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:outline-none hidden md:flex"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      )}

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="snap-center shrink-0 w-[220px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group/card"
          >
            <div className="h-28 bg-gray-50 relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                    <span className="text-2xl mb-1">🛍️</span>
                  </div>
                )}
                
                {product.price && (
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-gray-900 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-gray-100">
                    {product.price}
                  </div>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <h4 className="font-bold text-gray-900 text-xs mb-1 truncate leading-tight" title={product.name}>{product.name}</h4>
              <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
              
              <div className="mt-auto space-y-1.5">
                  <button 
                    onClick={() => onBuy(product)}
                    className="w-full py-1.5 text-white text-[10px] font-bold rounded-lg transition-transform active:scale-95 flex justify-center items-center gap-1 shadow-sm hover:shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {product.price ? t.buyNow : t.viewDetail}
                  </button>
                  
                  {product.price && (
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-medium rounded-lg transition-colors border border-gray-100"
                    >
                      {t.addToCart}
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md border border-gray-100 rounded-full p-1.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:outline-none hidden md:flex"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface ChatPreviewProps {
  analysis: AnalysisResult;
  onSendMessage: (history: ChatMessage[], currentMessage: string, products: Product[]) => Promise<{ text: string; productCards?: Product[] }>;
  onColorChange?: (newColor: string) => void;
  onNameChange?: (newName: string) => void;
}

export const ChatPreview: React.FC<ChatPreviewProps> = ({ analysis, onSendMessage, onColorChange, onNameChange }) => {
  const { t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: analysis.suggestedGreeting }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const brandColor = analysis.brandColor || '#0ea5e9'; 
  const agentName = analysis.agentName || (t.agentNamePlaceholder.split(',')[0]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); 

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const response = await onSendMessage(newHistory, userMsg, analysis.products);
    
    setMessages([...newHistory, { 
      role: 'model', 
      text: response.text, 
      productCards: response.productCards 
    }]);
    setIsTyping(false);
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const buyNow = (product: Product) => {
    if (product.buyUrl) {
        window.open(product.buyUrl, '_blank');
    } else {
        alert(`Checkout: ${product.name}`);
    }
  };

  return (
    <div className="flex h-full gap-8">
      {/* Bot Info Sidebar - Adaptable to Dark Mode */}
      <div className="w-1/3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-y-auto hidden lg:block h-full transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.previewTitle}</h3>
           <div className="px-2 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-md border border-brand-100 dark:border-brand-800">{t.livePreview}</div>
        </div>
        
        <div className="space-y-6">
            {/* Branding & Name Editor */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 space-y-4">
               {/* Color Picker */}
               <div className="flex items-center gap-3">
                 <div className="relative group/picker shrink-0">
                    <input 
                       type="color" 
                       value={brandColor} 
                       onChange={(e) => onColorChange?.(e.target.value)}
                       className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                       title={t.brandingHint}
                    />
                    <div 
                      className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover/picker:ring-brand-200 transition-all" 
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="opacity-0 group-hover/picker:opacity-100">🖌️</span>
                    </div>
                 </div>
                 <div className="flex-1">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                       {t.brandingEditable}
                    </h4>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{brandColor.toUpperCase()}</p>
                 </div>
               </div>

               {/* Name Editor */}
               <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                      {t.agentNameLabel}
                  </label>
                  <input 
                    type="text" 
                    value={agentName}
                    onChange={(e) => onNameChange?.(e.target.value)}
                    placeholder={t.agentNamePlaceholder}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
               </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.strategyDetected}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-lg shadow-sm">
                {analysis.summary}
              </p>
            </div>

            {/* Display Detected Navigation / Sitemap */}
            {analysis.navigationTree && analysis.navigationTree.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.navDetected}</h4>
                   <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                      <ul className="space-y-1.5">
                        {analysis.navigationTree.map((cat, idx) => (
                           <li key={idx} className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                             <a 
                               href={cat.url} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="text-xs text-brand-600 dark:text-brand-400 hover:underline truncate"
                             >
                               {cat.name}
                             </a>
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
            )}

            {/* Display Detected Sources */}
            {analysis.sources && analysis.sources.length > 0 && (
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.sourcesDetected}</h4>
                   <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                      <ul className="space-y-1.5">
                        {analysis.sources.map((source, idx) => (
                           <li key={idx} className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                             <a 
                               href={source.uri} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="text-xs text-brand-600 dark:text-brand-400 hover:underline truncate"
                               title={source.uri}
                             >
                               {source.title}
                             </a>
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.productsDetected} ({analysis.products.length})</h4>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {analysis.products.length === 0 ? (
                   <p className="text-xs text-slate-400 italic">{t.noProducts}</p>
                ) : (
                  analysis.products.map((prod) => (
                    <div key={prod.id} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-300 transition-colors cursor-default group">
                       <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center shrink-0">
                          {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-cover rounded-md" /> : <span className="text-xs">📦</span>}
                       </div>
                       <div className="overflow-hidden min-w-0">
                         <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-brand-600 transition-colors">{prod.name}</p>
                         <div className="flex items-center gap-2">
                            {prod.price && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded">{prod.price}</p>}
                            {prod.type === 'LINK' && <p className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{t.link}</p>}
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Phone Mockup Container - Keeping it Light/Neutral to simulate standard user experience */}
      <div className="flex-1 flex justify-center items-center h-full py-2">
        <div className="relative w-[360px] h-full max-h-[720px] bg-slate-900 rounded-[3rem] shadow-2xl border-[8px] border-slate-900 ring-1 ring-white/10 overflow-hidden flex flex-col">
           {/* Status Bar Mock */}
           <div className="h-6 bg-black w-full flex justify-between px-6 items-center text-white text-[10px] font-medium z-20">
              <span>9:41</span>
              <div className="flex gap-1">
                 <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                 <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
              </div>
           </div>

           {/* Chat Header */}
           <div 
             className="px-4 py-3 flex items-center justify-between shadow-sm z-10 backdrop-blur-md bg-opacity-95 transition-colors duration-500"
             style={{ backgroundColor: brandColor }}
           >
              <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                        <BotIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-transparent rounded-full"></div>
                </div>
                <div className="text-white">
                  <h3 className="text-sm font-bold leading-none">{agentName}</h3>
                  <p className="text-[10px] opacity-80 mt-0.5 font-medium">Online</p>
                </div>
              </div>
              <CartIcon count={cart.length} />
           </div>

           {/* Messages - ALWAYS LIGHT inside the phone for consistency */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
             <div className="text-center text-[10px] text-slate-400 my-2 font-medium uppercase tracking-wide">Today</div>
             
             {messages.map((msg, idx) => (
               <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                 {msg.role === 'user' ? (
                   <div 
                     className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm text-white whitespace-pre-wrap"
                     style={{ backgroundColor: brandColor, backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)' }}
                   >
                     {renderMessageText(msg.text)}
                   </div>
                 ) : (
                   <div className="max-w-[85%] bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-slate-700 shadow-sm whitespace-pre-wrap">
                     {renderMessageText(msg.text)}
                   </div>
                 )}

                 {/* Carousel */}
                 {msg.productCards && msg.productCards.length > 0 && (
                   <ProductCarousel 
                     products={msg.productCards} 
                     brandColor={brandColor} 
                     onBuy={buyNow} 
                     onAddToCart={addToCart} 
                   />
                 )}
               </div>
             ))}
             
             {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
             )}
             <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-3 bg-white border-t border-slate-100">
             <form onSubmit={handleSend} className="flex gap-2 items-center">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={t.inputPlaceholderChat}
                 className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-inset outline-none transition-all text-slate-800 placeholder-slate-400"
                 style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
               />
               <button 
                 type="submit" 
                 disabled={isTyping || !input.trim()}
                 className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
                 style={{ backgroundColor: brandColor }}
               >
                 <SendIcon className="w-4 h-4 translate-x-0.5" />
               </button>
             </form>
           </div>
        </div>
      </div>
    </div>
  );
};