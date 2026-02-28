import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  Upload, 
  FileText, 
  Type as TypeIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeCompliance, testCaptionOnly } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const DecisionBanner = ({ decision, score }: { decision: string; score: number }) => {
  const isSafe = decision === 'SAFE TO POST';
  const isChanges = decision === 'POST WITH CHANGES';
  const isRisky = decision === 'DO NOT POST';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-8 rounded-3xl flex flex-col items-center text-center gap-4 mb-8",
        isSafe && "bg-emerald-50 border-2 border-emerald-500/20 text-emerald-900",
        isChanges && "bg-amber-50 border-2 border-amber-500/20 text-amber-900",
        isRisky && "bg-rose-50 border-2 border-rose-500/20 text-rose-900"
      )}
    >
      <div className="flex items-center gap-3">
        {isSafe && <ShieldCheck className="w-12 h-12 text-emerald-600" />}
        {isChanges && <ShieldAlert className="w-12 h-12 text-amber-600" />}
        {isRisky && <ShieldX className="w-12 h-12 text-rose-600" />}
        <h1 className="text-4xl font-bold tracking-tight">{decision}</h1>
      </div>
      <p className="text-lg opacity-80 max-w-2xl">
        Risk Score: <span className="font-mono font-bold">{score}/100</span>
      </p>
    </motion.div>
  );
};

const ScoreCard = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div className="glass-panel p-6 flex flex-col gap-2">
    <span className="data-grid-header">{label}</span>
    <div className="flex items-end gap-2">
      <span className="text-4xl font-bold font-mono">{score}</span>
      <span className="text-sm opacity-50 mb-1">/100</span>
    </div>
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={cn("h-full rounded-full", color)}
      />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Caption Tester State
  const [testCaption, setTestCaption] = useState('');
  const [isTestingCaption, setIsTestingCaption] = useState(false);
  const [captionTestResult, setCaptionTestResult] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!video && !caption && !script) return;
    setIsAnalyzing(true);
    setResults(null);

    try {
      let videoBase64 = undefined;
      if (video) {
        const reader = new FileReader();
        videoBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(video);
        });
      }

      const data = await analyzeCompliance(videoBase64, caption, script);
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTestCaption = async () => {
    if (!testCaption) return;
    setIsTestingCaption(true);
    try {
      const data = await testCaptionOnly(testCaption);
      setCaptionTestResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTestingCaption(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-xl">TikTok Shop Compliance <span className="text-slate-400 font-normal">V2</span></span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#analyzer" className="text-sm font-medium hover:text-slate-600">Analyzer</a>
            <a href="#caption-tester" className="text-sm font-medium hover:text-slate-600">Caption Tester</a>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded uppercase">Strict Mode Active</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        
        <section id="analyzer" className="mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Inputs */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5" /> Content Input
                </h2>
                <p className="text-slate-500 text-sm">Upload your video and provide metadata for a full multimodal policy check.</p>
              </div>

              {/* Video Upload */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 min-h-[300px]",
                  isDragActive ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400",
                  videoPreview && "border-none p-0 overflow-hidden bg-black"
                )}
              >
                <input {...getInputProps()} />
                {videoPreview ? (
                  <div className="relative w-full h-full group">
                    <video src={videoPreview} className="w-full h-full object-contain" controls />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setVideo(null); setVideoPreview(null); }}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/40 p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Drop video here or click to browse</p>
                      <p className="text-sm text-slate-400 mt-1">MP4, MOV up to 50MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Text Inputs */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="data-grid-header flex items-center gap-2">
                    <TypeIcon className="w-3 h-3" /> Caption / Description
                  </label>
                  <textarea 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter the caption you plan to use..."
                    className="w-full h-24 bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="data-grid-header flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Script (Optional)
                  </label>
                  <textarea 
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Paste the video script for deeper analysis..."
                    className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!video && !caption && !script)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing Compliance...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Run Advanced Analysis
                  </>
                )}
              </button>
            </div>

            {/* Right: Results Dashboard */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {results ? (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <DecisionBanner decision={results.finalDecision} score={results.overallRiskScore} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ScoreCard label="Caption Risk" score={results.captionRiskScore} color="bg-amber-500" />
                      <ScoreCard label="Video Risk" score={results.videoRiskScore} color="bg-rose-500" />
                    </div>

                    {/* Flagged Segments */}
                    <div className="glass-panel p-8 space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-500" /> Flagged Violations
                      </h3>
                      <div className="space-y-4">
                        {results.flaggedSegments.length > 0 ? results.flaggedSegments.map((seg: any, i: number) => (
                          <div key={i} className="border-l-2 border-rose-500 pl-4 py-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{seg.timestamp}</span>
                              <span className="font-bold text-sm">{seg.issue}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{seg.policyReasoning}</p>
                          </div>
                        )) : (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">No major video violations detected.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fixes & Rewrites */}
                    <div className="grid grid-cols-1 gap-8">
                      <div className="glass-panel p-8 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Required Fixes
                        </h3>
                        <ul className="space-y-3">
                          {results.exactFixes.map((fix: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              {fix}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="glass-panel p-8 space-y-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold">Safer Caption Rewrite</h3>
                          <div className="bg-slate-50 p-4 rounded-xl text-sm italic border border-slate-100">
                            "{results.saferCaption}"
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold">Safer Script Rewrite</h3>
                          <div className="bg-slate-50 p-4 rounded-xl text-sm italic border border-slate-100 whitespace-pre-wrap">
                            {results.saferScript}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[600px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-12 gap-4"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Awaiting Analysis</h3>
                      <p className="text-slate-400 max-w-sm mt-2">Upload content and click "Run Advanced Analysis" to see the compliance dashboard.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Caption Tester Module */}
        <section id="caption-tester" className="pt-24 border-t border-slate-200">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Test Caption Safety</h2>
              <p className="text-slate-500">Instantly check if your product description or caption triggers policy flags.</p>
            </div>

            <div className="glass-panel p-8 space-y-6">
              <div className="relative">
                <textarea 
                  value={testCaption}
                  onChange={(e) => setTestCaption(e.target.value)}
                  placeholder="Paste your caption here..."
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                />
                <button 
                  onClick={handleTestCaption}
                  disabled={isTestingCaption || !testCaption}
                  className="absolute bottom-4 right-4 bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {isTestingCaption ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Check
                </button>
              </div>

              <AnimatePresence>
                {captionTestResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-6 border-t border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {captionTestResult.status === 'SAFE' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : captionTestResult.status === 'CHANGES' ? (
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-500" />
                        )}
                        <span className={cn(
                          "font-bold text-xl",
                          captionTestResult.status === 'SAFE' && "text-emerald-600",
                          captionTestResult.status === 'CHANGES' && "text-amber-600",
                          captionTestResult.status === 'RISKY' && "text-rose-600"
                        )}>
                          {captionTestResult.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="data-grid-header block">Risk Score</span>
                        <span className="text-2xl font-mono font-bold">{captionTestResult.riskScore}/100</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="data-grid-header">Flagged Phrases</h4>
                      <div className="flex flex-wrap gap-2">
                        {captionTestResult.flaggedPhrases.length > 0 ? captionTestResult.flaggedPhrases.map((p: string, i: number) => (
                          <span key={i} className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full border border-rose-100">
                            {p}
                          </span>
                        )) : <span className="text-xs text-slate-400 italic">None detected</span>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="data-grid-header">Safe Rewrite</h4>
                      <div className="bg-emerald-50 p-4 rounded-xl text-sm italic text-emerald-900 border border-emerald-100">
                        "{captionTestResult.saferRewrite}"
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 flex gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      {captionTestResult.reasoning}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Architecture & Future Ideas */}
        <section className="mt-32 pt-24 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tight">System Architecture</h3>
              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p>
                  <strong>Multimodal Pipeline:</strong> Uses Gemini 3.1 Pro for parallel analysis of video frames, audio transcription, and text metadata.
                </p>
                <p>
                  <strong>Decision Engine:</strong> Weighted scoring model prioritizing high-risk categories like medical claims and transformation narratives.
                </p>
                <p>
                  <strong>Conservative Bias:</strong> The model is tuned to flag "borderline" content as <em>Post with Changes</em> to ensure maximum account safety.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tight">V3 Roadmap</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1.5 shrink-0" />
                  <strong>Auto-Correction:</strong> Generative AI to automatically edit video frames to blur "Before/After" text.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1.5 shrink-0" />
                  <strong>Voiceover Safety:</strong> Real-time audio tone analysis to detect "aggressive selling" or "shouting" which can trigger TikTok's quality flags.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1.5 shrink-0" />
                  <strong>Competitor Benchmarking:</strong> Compare content against top-performing safe videos in the same category.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-32 border-t border-slate-200 py-12 text-center">
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
          TikTok Shop Compliance Engine • V2.0.0 • Senior AI Safety Protocol
        </p>
      </footer>
    </div>
  );
}
