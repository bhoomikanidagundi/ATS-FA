import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Download, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Result() {
  const { id } = useParams();
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const res = await fetch(`${apiUrl}/api/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const target = data.history.find((h: any) => h.id === id);
          if (target) {
            setAnalysis(target);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [id, token]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold dark:text-slate-400">Loading analysis...</div>;
  }

  if (!analysis) {
    return <div className="p-8 text-center text-slate-500 font-bold dark:text-slate-400">Analysis not found.</div>;
  }

  const { result, resume } = analysis;

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      const addHeader = (text: string, fontSize = 16) => {
        checkPageBreak(15);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin, yPos);
        yPos += fontSize * 0.4 + 4;
        doc.setFont('helvetica', 'normal');
      };

      const addText = (text: string, fontSize = 12, isBold = false) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        if (!text) return;
        const lines = doc.splitTextToSize(text, maxLineWidth);
        checkPageBreak(lines.length * (fontSize * 0.4) + 6);
        doc.text(lines, margin, yPos);
        yPos += lines.length * (fontSize * 0.4) + 6;
      };

      // Title & Date
      addHeader('ATS Analysis Report', 24);
      yPos += 4;
      addText(`Resume: ${resume.filename || 'Unknown'}`, 12, true);
      addText(`Date Analyzed: ${new Date(analysis.createdAt).toLocaleDateString()}`, 10);
      yPos += 8;

      // Score & Summary
      addHeader(`Overall Score: ${result.score || 0} / 100`, 18);
      addHeader('Executive Summary', 14);
      addText(result.summary || 'No summary available.', 12);
      yPos += 4;

      // Breakdown
      addHeader('Match Breakdown', 16);
      addText(`Keyword Match: ${result.keywordMatch || 0}%`, 12);
      addText(`Skill Relevance: ${result.skillRelevance || 0}%`, 12);
      yPos += 4;

      // Formatting & Section Issues
      if (result.formattingIssues?.length || result.sectionCompleteness?.length) {
        addHeader('Formatting & Completeness Issues', 16);
        result.formattingIssues?.forEach((issue: string) => {
          addText(`• Format: ${issue}`, 12);
        });
        result.sectionCompleteness?.forEach((issue: string) => {
          addText(`• Missing Section: ${issue}`, 12);
        });
        yPos += 4;
      }

      // Missing Keywords
      if (result.missingKeywords?.length) {
        addHeader('Missing Keywords', 16);
        addText(result.missingKeywords.join(', '), 12);
        yPos += 4;
      }

      // Actionable Tips
      if (result.suggestions?.length) {
        addHeader('Actionable Improvements', 16);
        result.suggestions.forEach((sug: any) => {
          addText(`[${(sug.section || 'General').toUpperCase()}]`, 10, true);
          addText(sug.tip || '', 12);
          if (sug.example) {
             addText(`Example: "${sug.example}"`, 11);
          }
          yPos += 2;
        });
        yPos += 4;
      }

      // Bullet Rewrites
      if (result.bulletRewrites?.length) {
        addHeader('Bullet Point AI Rewrites', 16);
        result.bulletRewrites.forEach((rewrite: any) => {
          addText('BEFORE:', 10, true);
          addText(`"${rewrite.original}"`, 11);
          addText('AFTER (Optimized):', 10, true);
          addText(`"${rewrite.rewritten}"`, 11);
          yPos += 4;
        });
      }

      doc.save(`${(resume.filename || 'Resume').replace(/[^a-z0-9]/gi, '_')}_ATS_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Link to="/history" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">History</Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-slate-900 dark:text-slate-100 truncate max-w-[200px] transition-colors">{resume.filename}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">Analysis Report</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Review your ATS optimization breakdown</p>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={isExporting}
          className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-white font-black rounded-xl hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-5 h-5" /> {isExporting ? 'Generating...' : 'Download PDF Report'}
        </button>
      </header>

      <div ref={reportRef} className="space-y-8 pt-4">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[32px] p-8 border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
          <div className="space-y-4 text-center md:text-left flex-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Overall Score</h3>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-8xl md:text-9xl font-black leading-none tracking-tighter dark:text-white">{result.score}</span>
              <span className="text-3xl font-black text-slate-300 dark:text-slate-700">/100</span>
            </div>
            
            {result.summary && (
              <div className="pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Executive Summary</h4>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-300 leading-relaxed max-w-md">{result.summary}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Keyword Match</span>
                <span className="text-slate-900 dark:text-white">{result.keywordMatch}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <div className="h-full bg-slate-900 dark:bg-slate-300 rounded-full transition-all" style={{ width: `${result.keywordMatch}%` }}></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Skill Relevance</span>
                <span className="text-slate-900 dark:text-white">{result.skillRelevance}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <div className="h-full bg-slate-900 dark:bg-slate-300 rounded-full transition-all" style={{ width: `${result.skillRelevance}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Keywords / Actionable Tips Header Area equivalent */}
        <div className="lg:col-span-5 bg-indigo-600 dark:bg-indigo-900 rounded-[32px] p-8 text-white flex flex-col shadow-[8px_8px_0px_0px_rgba(49,46,129,1)] dark:shadow-[8px_8px_0px_0px_rgba(30,27,75,1)] transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase tracking-widest">AI Insights</span>
            </div>
            <h4 className="text-2xl font-bold leading-tight mb-2">Missing Capabilities</h4>
            <p className="text-indigo-100 text-sm mb-6">Incorporate these keywords to improve your score against similar job descriptions.</p>
          </div>
          
          {result.missingKeywords?.length > 0 ? (
             <div className="flex flex-wrap gap-2 mb-auto">
               {result.missingKeywords.map((kw: string, i: number) => (
                 <span key={i} className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">{kw}</span>
               ))}
             </div>
          ) : (
             <div className="text-sm font-bold text-emerald-300">No critical missing keywords detected.</div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Actionable Tips */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Format & Completeness</h4>
          <ul className="space-y-3">
             {result.formattingIssues?.map((issue: string, i: number) => (
                 <li key={i} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                   <div className="w-5 h-5 bg-amber-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                     <span className="text-white text-xs font-black">!</span>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">Formatting Issue</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{issue}</p>
                   </div>
                 </li>
             ))}
             {result.sectionCompleteness?.map((issue: string, i: number) => (
                 <li key={`sec-${i}`} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                   <div className="w-5 h-5 bg-rose-500 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
                     <span className="text-white text-xs font-black">!</span>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white">Section Missing</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{issue}</p>
                   </div>
                 </li>
             ))}
          </ul>

          <div className="pt-4 space-y-4">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Structure Suggestions</h4>
             <div className="space-y-4">
               {result.suggestions?.map((sug: any, i: number) => (
                 <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 transition-colors">
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{sug.section}</p>
                   <p className="text-sm font-bold text-slate-900 dark:text-white">{sug.tip}</p>
                   {sug.example && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg transition-colors">"{sug.example}"</p>
                   )}
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Bullet Rewrites */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Impact Rewrites</h4>
          {result.bulletRewrites?.length > 0 ? (
            <div className="space-y-4">
              {result.bulletRewrites.map((rewrite: any, i: number) => (
                <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Before</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-through">"{rewrite.original}"</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase flex items-center gap-1 mb-1">
                      <Check className="w-3 h-3 border border-indigo-500 dark:border-indigo-400 rounded-full p-0.5" /> AI After
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">"{rewrite.rewritten}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed transition-colors">
                <span className="text-slate-400 font-bold text-sm">No rewrites suggested.</span>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
