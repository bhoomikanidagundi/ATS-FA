import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { UploadCloud, File, X, Loader2, Info, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const apiUrl = import.meta.env.VITE_APP_URL || '';
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      navigate(`/result/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-2 transition-colors">Upload Resume</h2>
        <p className="text-slate-500 font-medium">Get your resume scored and optimized in seconds.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            className={cn(
              "border-2 border-dashed rounded-[32px] p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[320px]",
              isDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80"
            )}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={handleChange} 
            />
            
            {!file ? (
              <>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">Drop your resume here</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">or click to browse from your computer</p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>PDF</span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                  <span>DOCX</span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                  <span>Max 5MB</span>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border-2 border-indigo-200 dark:border-indigo-800/30">
                  <File className="w-8 h-8" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate w-full px-4 transition-colors">{file.name}</p>
                <p className="text-sm text-slate-500 font-medium mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:border-rose-200 dark:hover:border-rose-800/50 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors uppercase tracking-widest"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-800/30 rounded-2xl flex items-start text-rose-700 dark:text-rose-400 transition-colors">
              <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] h-full flex flex-col transition-colors">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">Target Job Description</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Optional: Paste the job description to get a tailored match score.</p>
            
            <textarea
              className="flex-1 w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-0 resize-none min-h-[160px] transition-colors"
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isUploading}
            ></textarea>

            <button
              type="submit"
              disabled={!file || isUploading}
              className={`mt-6 w-full flex justify-center items-center py-4 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                !file || isUploading 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-2 border-slate-200 dark:border-slate-700' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Resume <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
