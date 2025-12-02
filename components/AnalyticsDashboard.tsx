import React from 'react';
import { BarChartIcon, TrendingUpIcon, UsersIcon, DollarSignIcon, DownloadIcon, CalendarIcon, FilterIcon } from './Icons';
import { useApp } from '../contexts/AppContext';

interface AnalyticsDashboardProps {
  brandColor?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ brandColor = '#0ea5e9' }) => {
  const { t } = useApp();
  const [dateRange, setDateRange] = React.useState('7');

  // Mock Data simulation for the dashboard
  const stats = [
    { 
      label: t.totalConversations, 
      value: '2,845', 
      change: '+12.5%', 
      isPositive: true, 
      icon: UsersIcon 
    },
    { 
      label: t.conversionRate, 
      value: '18.2%', 
      change: '+4.1%', 
      isPositive: true, 
      icon: TrendingUpIcon 
    },
    { 
      label: t.attributedSales, 
      value: '€14,250', 
      change: '+8.3%', 
      isPositive: true, 
      icon: DollarSignIcon 
    },
    { 
      label: t.satisfaction, 
      value: '4.8/5', 
      change: '+0.2', 
      isPositive: true, 
      icon: BarChartIcon 
    },
  ];

  const topProducts = [
    { name: 'Fibra 1Gb + Móvil Ilimitado', hits: 450, percentage: 85 },
    { name: 'Pack Familiar Total', hits: 320, percentage: 65 },
    { name: 'Solo Fibra 600Mb', hits: 210, percentage: 40 },
    { name: 'Móvil 50GB', hits: 180, percentage: 35 },
  ];

  const funnelSteps = [
    { label: t.funnelVisitors, value: 5000, color: 'bg-slate-200 dark:bg-slate-700' },
    { label: t.funnelInteractions, value: 2845, color: 'bg-brand-200 dark:bg-brand-900/50' },
    { label: t.funnelLeads, value: 950, color: 'bg-brand-400 dark:bg-brand-700' },
    { label: t.funnelSales, value: 517, color: 'bg-brand-600 dark:bg-brand-500' },
  ];

  const handleDownload = () => {
    // Generate CSV Content
    const headers = ["Metric", "Value", "Change"];
    const rows = stats.map(s => [s.label, s.value, s.change]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
             </div>
             <select 
               value={dateRange}
               onChange={(e) => setDateRange(e.target.value)}
               className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
             >
                <option value="7">{t.last7Days}</option>
                <option value="30">{t.last30Days}</option>
             </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                <FilterIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
             </button>
             <button 
                onClick={handleDownload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-brand-500 transition-colors shadow-lg shadow-slate-900/10"
             >
                <DownloadIcon className="w-4 h-4" />
                {t.exportData}
             </button>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-16 h-16 text-slate-900 dark:text-white" />
             </div>
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                 <stat.icon className="w-5 h-5" />
               </div>
               {stat.isPositive ? (
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                   {stat.change}
                 </span>
               ) : (
                 <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{stat.change}</span>
               )}
             </div>
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.activityTitle}</h3>
           </div>
           
           <div className="h-[300px] w-full flex items-end justify-between gap-2 px-2 relative">
              {/* Background Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                 <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0"></div>
                 <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0"></div>
                 <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0"></div>
                 <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0"></div>
              </div>

              {/* Simple CSS Bar Chart Simulation */}
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 80, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group h-full relative z-10">
                   <div 
                     className="w-full rounded-t-sm opacity-80 hover:opacity-100 transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                     style={{ height: `${height}%`, backgroundColor: brandColor }}
                   >
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {Math.floor(height * 2.5)} chats
                     </div>
                   </div>
                </div>
              ))}
           </div>
           <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium uppercase tracking-wider">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              <span className="hidden sm:inline">M</span><span className="hidden sm:inline">T</span><span className="hidden sm:inline">W</span>
              <span className="hidden sm:inline">T</span><span className="hidden sm:inline">F</span><span className="hidden sm:inline">S</span><span className="hidden sm:inline">S</span>
           </div>
        </div>

        <div className="flex flex-col gap-6">
            {/* Sales Funnel */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t.funnelTitle}</h3>
                <div className="space-y-3 relative">
                     <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
                     {funnelSteps.map((step, i) => (
                         <div key={i} className="relative z-10">
                             <div className="flex items-center gap-3 mb-1">
                                 <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${step.color}`}></div>
                                 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{step.label}</span>
                             </div>
                             <div className="ml-6 pl-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{step.value.toLocaleString()}</span>
                                    {i > 0 && (
                                        <span className="text-xs text-red-500 font-medium mb-1">
                                            -{Math.round(((funnelSteps[i-1].value - step.value) / funnelSteps[i-1].value) * 100)}%
                                        </span>
                                    )}
                                </div>
                                <div className={`h-1.5 w-full rounded-full mt-1 ${step.color} bg-opacity-50`}></div>
                             </div>
                         </div>
                     ))}
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t.topProductsTitle}</h3>
            <div className="space-y-6 flex-1">
                {topProducts.map((prod, i) => (
                    <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{prod.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">{prod.hits} {t.consultations}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${prod.percentage}%`, backgroundColor: brandColor }}
                        ></div>
                    </div>
                    </div>
                ))}
            </div>
            <button className="mt-6 w-full py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {t.viewFullReport}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};
