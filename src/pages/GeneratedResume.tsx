import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function GeneratedResume() {
  const { id } = useParams();
  const { token } = useAuth();
  const [resume, setResume] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchResume = async () => {
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const response = await fetch(`${apiUrl}/api/resume/generated/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch generated resume');
        const data = await response.json();
        setResume(data.content);
      } catch (error) {
        console.error("Error fetching resume:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [id, token]);

  const downloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resume?.personal?.name || 'Resume'}_ATS_Optimized.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 font-bold uppercase tracking-widest">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
        Loading Resume...
      </div>
    );
  }

  if (!resume) {
    return <div className="p-8 text-center text-slate-500 font-bold dark:text-slate-400">Resume not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 fade-in">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-2 transition-colors">Your AI Resume</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Ready to download and apply.</p>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={isExporting}
          className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-white font-black rounded-xl hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
          {isExporting ? 'Exporting...' : 'Download PDF'}
        </button>
      </header>

      {/* The Printable A4 Container */}
      <div className="bg-slate-200 dark:bg-slate-800 p-4 sm:p-8 rounded-[32px] overflow-auto flex justify-center border-2 border-slate-300 dark:border-slate-700">
        <div 
          ref={resumeRef} 
          className="bg-white text-slate-900 w-[800px] min-h-[1131px] mx-auto p-12 shadow-2xl shrink-0"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900 mb-2">{resume.personal?.name}</h1>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
              {resume.personal?.location && <span>{resume.personal.location}</span>}
              {resume.personal?.phone && <><span>•</span><span>{resume.personal.phone}</span></>}
              {resume.personal?.email && <><span>•</span><span>{resume.personal.email}</span></>}
              {resume.personal?.linkedin && <><span>•</span><a href={resume.personal.linkedin} className="text-blue-600">{resume.personal.linkedin}</a></>}
              {resume.personal?.github && <><span>•</span><a href={resume.personal.github} className="text-blue-600">{resume.personal.github}</a></>}
            </div>
          </div>

          {/* Summary */}
          {resume.personal?.summary && (
            <div className="mb-5 text-[11px] leading-relaxed text-slate-800">
              {resume.personal.summary}
            </div>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">Professional Experience</h2>
              <div className="space-y-4">
                {resume.experience.map((exp: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[12px] font-bold text-slate-900">{exp.title}</h3>
                      <span className="text-[11px] font-medium text-slate-600">{exp.date}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                       <span className="text-[11px] italic text-slate-700">{exp.company}</span>
                       <span className="text-[11px] text-slate-600">{exp.location}</span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800 leading-relaxed">
                        {exp.bullets.map((b: string, j: number) => (
                          <li key={j} className="pl-1">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">Projects</h2>
              <div className="space-y-3">
                {resume.projects.map((proj: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="text-[12px] font-bold text-slate-900">
                        {proj.name} {proj.technologies && <span className="font-normal italic text-[11px] text-slate-600 ml-1">| {proj.technologies}</span>}
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">{proj.date}</span>
                    </div>
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800 leading-relaxed">
                        {proj.bullets.map((b: string, j: number) => (
                          <li key={j} className="pl-1">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">Education</h2>
              <div className="space-y-3">
                {resume.education.map((edu: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-[12px] font-bold text-slate-900">{edu.school}</h3>
                      <span className="text-[11px] font-medium text-slate-600">{edu.date}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                       <span className="text-[11px] italic text-slate-700">{edu.degree}</span>
                       <span className="text-[11px] text-slate-600">{edu.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume.skills && (resume.skills.languages?.length > 0 || resume.skills.frameworks?.length > 0 || resume.skills.tools?.length > 0) && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">Technical Skills</h2>
              <div className="space-y-1 text-[11px] text-slate-800">
                {resume.skills.languages?.length > 0 && (
                  <div><span className="font-bold">Languages:</span> {resume.skills.languages.join(', ')}</div>
                )}
                {resume.skills.frameworks?.length > 0 && (
                  <div><span className="font-bold">Frameworks:</span> {resume.skills.frameworks.join(', ')}</div>
                )}
                {resume.skills.tools?.length > 0 && (
                  <div><span className="font-bold">Tools:</span> {resume.skills.tools.join(', ')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
