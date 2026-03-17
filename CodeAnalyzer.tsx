// CodeAnalyzer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, SupportedLanguage, AppMode, LearnerProfile, ToneProfile, SavedAnalysis } from '../types';
import { analyzeCode, analyzeLearnerMode } from '../services/azureAiBridge';
import { traceJavaScript, tracePython } from '../services/debugEngine';
import CodeAnimationPlayer from './CodeAnimationPlayer';
import CodeLearner from './CodeLearner';

interface CodeAnalyzerProps {
  mode: AppMode;
  focusMode: boolean; 
  demoMode: boolean;
  toneProfile: ToneProfile;
  loadedAnalysis: SavedAnalysis | null;
  onConsumeLoadedAnalysis: () => void;
  onOpenSettings: () => void;
  onSaveAnalysis: (analysis: SavedAnalysis) => void;
}

// Sample code for demo
const JS_DEMO = `function fibonacci(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    let next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}
console.log(fibonacci(5));`;

const PY_DEMO = `def factorial(n):
    if n == 0:
        return 1
    res = 1
    for i in range(1, n + 1):
        res = res * i
    return res

print(factorial(5))`;

// Supported languages for translation
const SUPPORTED_NATIVE_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Bahasa Indonesia' }, 
  { code: 'ar', name: 'العربية' },          
  { code: 'ur', name: 'اردو' },             
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'zh-Hans', name: '中文' }
];

// Loading messages for visualizer & learner
const LOADING_MESSAGES_VISUALIZER = [
  "Preparing workspace...",
  "Analyzing code structure...",
  "Tracing execution paths...",
  "Building visualization...",
  "Almost Ready!"
];

const LOADING_MESSAGES_LEARNER = [
  "Mapping concepts...",
  "Analyzing logic flow...",
  "Generating mental models...",
  "Structuring insights...",
  "Almost there..."
];

const CodeAnalyzer: React.FC<CodeAnalyzerProps> = ({
  mode,
  focusMode,
  demoMode,
  toneProfile,
  loadedAnalysis,
  onConsumeLoadedAnalysis,
  onOpenSettings,
  onSaveAnalysis,
}) => {
  // -------------------------
  // State variables
  // -------------------------
  const activeToneRef = useRef<ToneProfile>(toneProfile);
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [visualizerResult, setVisualizerResult] = useState<AnalysisResult | null>(null);
  const [learnerResult, setLearnerResult] = useState<LearnerProfile | null>(null);
  const [errorDetails, setErrorDetails] = useState<{line: number, message: string}[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const RTL_LANGS = ['ar', 'ur'];
  // state
  const [targetLanguage, setTargetLanguage] = useState('en');
  const isRTL = RTL_LANGS.includes(targetLanguage);
  const isRTLFontUnsafe = ['ar', 'ur'].includes(targetLanguage);
  const rtlTextProps = isRTL
  ? {
      dir: 'rtl',
      style: {
        textAlign: 'right' as const,
        unicodeBidi: 'plaintext' as const,
      },
    } : {};

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // -------------------------
  // Effects
  // -------------------------
  
  // Cycling loading messages
  useEffect(() => {
  activeToneRef.current = toneProfile;
}, [toneProfile]);
  useEffect(() => {
  if (!loadedAnalysis) return;

  setCode(loadedAnalysis.code);

  if (loadedAnalysis.mode === 'visualizer') {
    setVisualizerResult(loadedAnalysis.visualizerData ?? null);
    setLearnerResult(null);
  } else {
    setLearnerResult(loadedAnalysis.learnerData ?? null);
    setVisualizerResult(null);
  }

  onConsumeLoadedAnalysis();
}, [loadedAnalysis]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % 5);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load demo code if demoMode is on
  useEffect(() => {
    if (demoMode && code === "") {
      setCode(language === 'javascript' ? JS_DEMO : PY_DEMO);
    }
  }, [demoMode, language]);

  // Reset saved state when code, language, or mode changes
  useEffect(() => {
    setIsSaved(false);
  }, [code, language, mode]);
  // -------------------------
  // Handlers
  // -------------------------

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setErrorDetails([]);
    setVisualizerResult(null);
    setLearnerResult(null);

    try {
      if (mode === 'visualizer') {
        // 1. Run local trace engine first
        let localTrace = null;
        try {
          localTrace = language === 'javascript'
            ? await traceJavaScript(code)
            : await tracePython(code);
        } catch (e) {
          console.warn("Local tracing failed, falling back to pure AI analysis", e);
        }

        // 2. Pass the trace to AI for explanation
       const res = await analyzeCode(
  code,
  language,
  demoMode,
  activeToneRef.current,
  targetLanguage,
  localTrace || undefined
);

        if (res.success) {
          setVisualizerResult(res.data!);
          const foundErrors = res.data!.steps.filter((s: any) => s.event === 'error');
          if (foundErrors.length > 0) {
            setErrorDetails(foundErrors.map((e: any) => ({ line: e.line, message: e.explanation })));
          }
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          setErrorDetails([{ line: 0, message: res.error || "Analysis Fault." }]);
        }

      } else { // Learner mode
        const res = await analyzeLearnerMode(code, language, demoMode, activeToneRef.current, targetLanguage);
        if (res.success) {
          setLearnerResult(res.data!);
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          setErrorDetails([{ line: 0, message: res.error || "Tutor Link Fault." }]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = () => {
    if (isSaved || (!visualizerResult && !learnerResult)) return;
 onSaveAnalysis({
  id: Math.random().toString(36).substr(2, 9),
  timestamp: Date.now(),
  code,
  language,
  mode,
  tone: toneProfile,
  visualizerData: visualizerResult || undefined,
  learnerData: learnerResult || undefined
});
    setIsSaved(true);
  };

  const handleScroll = () => {
    if (textAreaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  const lineNumbers = Array.from({ length: Math.max(code.split('\n').length, 1) }, (_, i) => i + 1);
  const accentColor = mode === 'visualizer'
    ? (focusMode ? 'text-slate-300' : 'text-pink-300')
    : (focusMode ? 'text-slate-300' : 'text-emerald-300');

  // -------------------------
  // Header Controls JSX
  // -------------------------

  const renderHeaderControls = () => (
    <div className="flex gap-2 sm:gap-4 w-full xs:w-auto justify-between items-center xs:justify-end">
      
      {/* Load Sample */}
      <button
        onClick={() => setCode(language === 'javascript' ? JS_DEMO : PY_DEMO)}
        className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-all flex items-center gap-2 whitespace-nowrap
          ${focusMode
            ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700'
            : 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-white hover:bg-indigo-900/20 rounded-md'
          }`}
      >
        <span className="text-xs">📂</span>
        Load Sample
      </button>

      {/* Language selector (JS / Python) */}
      <select
        value={language}
        onChange={e => setLanguage(e.target.value as SupportedLanguage)}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 border outline-none transition-all
          ${focusMode
            ? 'bg-[#1e293b] border-slate-500 text-slate-200 font-mono text-xs sm:text-base'
            : 'bg-slate-900 border-slate-700 ' + (!isRTLFontUnsafe ? 'font-pixel ' : '') + 'text-base sm:text-xl ' + accentColor
          }`}
      >
        <option value="javascript">Javascript</option>
        <option value="python">Python</option>
      </select>

      {/* Target Language selector */}
      <select
        value={targetLanguage}
        onChange={e => setTargetLanguage(e.target.value)}
        className="bg-slate-900 border border-slate-700 text-xs text-white p-2 rounded"
      >
        {SUPPORTED_NATIVE_LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    </div>
  );
  // -------------------------
  // Main JSX Return
  // -------------------------
  return (
  <div
  className={`max-w-6xl mx-auto p-2 sm:p-6 flex flex-col gap-6 sm:gap-10 min-h-screen
    ${focusMode ? 'font-mono' : (!isRTLFontUnsafe ? 'font-pixel' : '')}`}>

      {/* ---------- Header ---------- */}
      <div className={`transition-all duration-300 overflow-hidden relative
        ${focusMode ? 'bg-[#1e293b] border border-slate-600 rounded-none shadow-xl' : 'pixel-card bg-slate-800 shadow-[10px_10px_0_0_#000]'}`}>
        
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex flex-col xs:flex-row justify-between items-center gap-3 sm:gap-4
          ${focusMode ? 'bg-[#334155] border-slate-600' : 'border-slate-950 bg-slate-900/50'}`}>
          
          <div className="flex items-center gap-3 sm:gap-4 w-full xs:w-auto justify-between xs:justify-start">
            <h2 className={`text-sm sm:text-lg flex items-center gap-2 sm:gap-3 uppercase
            ${focusMode
            ? 'font-mono font-black text-white tracking-widest'
            : (!isRTLFontUnsafe ? 'font-pixel-bold ' : '') + accentColor}`}>

              {mode === 'visualizer' ? '⚡ Visualizer' : '🎓 Tutor'}
            </h2>

            {/* Save Session Button */}
            {(visualizerResult || learnerResult) && (
              <button
                onClick={handleSaveToVault}
                disabled={isSaved}
                className={`px-2 sm:px-3 py-1 text-[8px] sm:text-[10px] font-bold uppercase border transition-all
                  ${isSaved ? 'opacity-30 border-slate-500 text-slate-500' : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
              >
                {isSaved ? 'Saved' : 'Save Session'}
              </button>
            )}
          </div>

          {/* Controls: Load Sample, Language, Target Language */}
          {renderHeaderControls()}
        </div>

        {/* ---------- Code Editor ---------- */}
        <div className={`p-4 sm:p-6 flex flex-col gap-0 ${focusMode ? 'bg-[#1e293b]' : 'bg-[#10101a]'}`}>
          <div className={`relative flex bg-[#020617] border-2 border-slate-700 overflow-hidden shadow-inner ${focusMode ? 'rounded-none' : 'rounded-t-md border-b-0'}`}>

            {/* Line numbers */}
            <div
              dir="ltr"
              ref={gutterRef}
              className="w-10 sm:w-16 bg-[#1e293b] border-r border-slate-600 text-slate-400 text-right pt-4 sm:pt-6 pr-2 sm:pr-4 font-mono text-sm sm:text-lg select-none overflow-hidden"
              style={{ lineHeight: '2.4rem' }}
            >
              {lineNumbers.map(n => <div key={n} style={{ height: '2.4rem' }}>{n}</div>)}
            </div>

            {/* Code Textarea */}
            <textarea
              dir="ltr"
              ref={textAreaRef}
              value={code}
              onScroll={handleScroll}
              onChange={e => setCode(e.target.value)}
              className={`flex-1 min-h-[300px] sm:min-h-[480px] p-4 sm:p-6 bg-transparent outline-none resize-y leading-[2.4rem] custom-scrollbar shadow-inner font-mono
                ${focusMode ? 'text-slate-100 text-sm sm:text-lg' : 'text-cyan-400 text-base sm:text-2xl selection:bg-pink-500/30'}`}
              spellCheck={false}
              placeholder={language === 'javascript' ? "// Enter JavaScript here..." : "# Enter Python here..."}
            />
          </div>

          {/* ---------- Error Console ---------- */}
          {errorDetails.length > 0 && (
            <div className={`p-4 border-2 border-t-0 animate-fade-in-up
              ${focusMode ? 'bg-red-950/20 border-red-900 text-red-400 font-mono text-xs' : 'bg-red-950/40 border-slate-700 rounded-b-md flex flex-col gap-2'}`}>
              
              <div className={`flex items-center gap-2 mb-2 ${
              focusMode
             ? 'text-[8px] opacity-60'
             : (!isRTLFontUnsafe ? 'font-pixel-bold ' : '') + 'text-red-500 text-[10px]'}`}>

                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                CONSOLE_FAULT_REPORT
              </div>

              {errorDetails.map((err, i) => (
                <div key={i} className={`flex items-start gap-4 p-3 ${focusMode ? 'bg-black/40' : 'bg-red-600/10 border-l-4 border-red-600'}`}>
                 <div className={`shrink-0 ${
                  focusMode
                  ? 'text-red-500'
                  : (!isRTLFontUnsafe ? 'font-pixel ' : '') + 'text-red-400 text-xl'}`}>

                    LINE {err.line > 0 ? err.line : '?'}:
                  </div>
                  <div
  {...rtlTextProps}
  className={
    focusMode
      ? 'text-slate-200'
      : (!isRTLFontUnsafe ? 'font-pixel ' : '') + 'text-red-100 text-xl'
  }
>
  {err.message}
</div>

                </div>
              ))}
            </div>
          )}

          {/* ---------- Analyze Button ---------- */}
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={loading || !code.trim()}
              className={`w-full h-12 sm:h-16 font-bold tracking-widest transition-all relative border flex items-center justify-center
                ${focusMode
                  ? (loading ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600 font-mono text-xs sm:text-base')
                  : (loading
                      ? 'bg-slate-700 cursor-wait border-slate-900'
                      : (mode === 'visualizer'
                          ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-900 shadow-[4px_4px_0_0_#000]'
                          : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-900 shadow-[4px_4px_0_0_#000]') +
                       ' pixel-btn rounded-lg ' + (!isRTLFontUnsafe ? 'font-pixel-bold ' : '') + 'text-sm sm:text-xl text-white'

                    )
                }`}
            >
              <span>
                {loading
                  ? (mode === 'visualizer' ? LOADING_MESSAGES_VISUALIZER[loadingMsgIndex] : LOADING_MESSAGES_LEARNER[loadingMsgIndex])
                  : (mode === 'visualizer' ? "Visualize Logic" : "Analyze Patterns")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Results Section ---------- */}
      <div ref={resultsRef} className="scroll-mt-32">
        {!loading && mode === 'visualizer' && visualizerResult && (
          <CodeAnimationPlayer analysis={visualizerResult} code={code} focusMode={focusMode} targetLanguage={targetLanguage} />
        )}
        {!loading && mode === 'learner' && learnerResult && (
         <CodeLearner
          profile={learnerResult}
          focusMode={focusMode}
          targetLanguage={targetLanguage}/>
        )}
      </div>
    </div>
  );
};

export default CodeAnalyzer;
