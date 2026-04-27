import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ArrowRight, BarChart3, Clock, Zap, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, token } = useAuth();
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

  const recentAnalysis = history[0];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded uppercase tracking-wider">
              Welcome
            </span>
            <span className="text-slate-400 text-xs font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">Hello, {user?.name.split(' ')[0]}</h2>
          <p className="text-slate-500 font-medium mt-1">Ready to optimize your resume?</p>
        </div>
        <Link to="/upload" className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-white font-black rounded-xl hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all text-center inline-flex items-center justify-center gap-2">
           <Zap className="w-5 h-5 fill-current" />
           New Scans
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] flex flex-col justify-between h-full transition-colors">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Latest Score</h3>
            {recentAnalysis ? (
              <>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={cn("text-8xl md:text-9xl font-black leading-none tracking-tighter", getScoreColor(recentAnalysis.result.score))}>
                    {recentAnalysis.result.score}
                  </span>
                  <span className="text-3xl font-black text-slate-300 dark:text-slate-700">/100</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-300">{recentAnalysis.result.summary}</p>
              </>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                 <BarChart3 className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                 <p className="text-slate-500 font-bold">No resumes analyzed yet</p>
              </div>
            )}
          </div>
          
          {recentAnalysis && (
            <Link to={`/result/${recentAnalysis.id}`} className="mt-8 inline-flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest">
              View Full Report <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[32px] p-8 text-white flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(49,46,129,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,27,75,1)] transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-widest">Recent Activity</span>
            </div>
            
            <div className="space-y-4 mt-6">
              {history.length > 0 ? (
                history.slice(0, 3).map((item) => (
                  <Link key={item.id} to={`/result/${item.id}`} className="block group">
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors border border-white/10">
                      <div>
                        <p className="font-bold text-white truncate max-w-[160px] sm:max-w-[200px]">{item.resume?.filename}</p>
                        <p className="text-xs text-indigo-200 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-lg text-sm font-black",
                        item.result.score >= 80 ? "bg-emerald-500 text-white" : item.result.score >= 60 ? "bg-amber-400 text-amber-900" : "bg-rose-500 text-white"
                      )}>
                        {item.result.score}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 mt-6">
                  <p className="text-indigo-200 text-sm font-medium text-center">Your scan history will appear here.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex flex-col gap-3">
             <Link to="/builder" className="w-full py-4 bg-white text-indigo-600 rounded-xl font-black flex justify-center items-center gap-2 hover:bg-indigo-50 transition-colors uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(30,27,75,0.5)]">
               <Wand2 className="w-4 h-4" /> Try AI Builder
             </Link>
             <Link to="/history" className="text-sm font-black text-indigo-200 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center">
               See All History
             </Link>
          </div>
        </div>
      </section>
    </>
  );
}
