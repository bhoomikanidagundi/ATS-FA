import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { FileText, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function History() {
  const { token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const res = await fetch(`${apiUrl}/api/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50';
    if (score >= 60) return 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50';
    return 'text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50';
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-8">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-2 transition-colors">Scan History</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Review your past resume optimizations and tracking.</p>
      </header>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-600 dark:text-indigo-400" />
          <p>Loading...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-12 text-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No history yet</h3>
          <p className="text-slate-500 font-medium mb-6">Upload your first resume to see your analysis history here.</p>
          <Link to="/upload" className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-black rounded-xl hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all uppercase tracking-widest text-sm">
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] overflow-hidden transition-colors">
          <div className="flex flex-col">
            {history.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  index !== history.length - 1 ? "border-b-2 border-slate-100 dark:border-slate-800" : ""
                )}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs mb-1">{item.resume?.filename || 'Resume'}</h4>
                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className={cn(
                    "px-4 py-2 rounded-xl border-2 font-black text-sm",
                    getScoreColor(item.result.score)
                  )}>
                    Score: {item.result.score}
                  </div>
                  <Link 
                    to={`/result/${item.id}`} 
                    className="p-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl hover:border-slate-900 dark:hover:border-slate-600 hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all group"
                  >
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
