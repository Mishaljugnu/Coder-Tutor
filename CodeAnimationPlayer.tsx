import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, AnimationStep } from '../types';
import { generateFlowchart } from '../services/azureAiBridge';

interface CodeAnimationPlayerProps {
  analysis: AnalysisResult;
  code: string;
  focusMode: boolean; 
  targetLanguage: string;
}

const renderMarkdown = (text: string | undefined | null) => {
    if (!text) return "";
    
    // Split by double newlines to create paragraph spacing
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <span key={pIdx} className={pIdx > 0 ? "mt-4 block" : "block"}>
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-cyan-400 font-bold">{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <em key={index} className="text-pink-400 italic font-medium">{part.slice(1, -1)}</em>;
            return part;
          })}
        </span>
      );
    });
};

const VariableCard: React.FC<{
  name: string;
  value: string | undefined;
  isChanged: boolean;
  focusMode: boolean;
}> = ({ name, value, isChanged, focusMode }) => {
  if (focusMode) {
    return (
      <div className={`p-3 sm:p-4 border-l-4 transition-all duration-300 flex flex-col w-full ${isChanged ? 'bg-slate-800 border-cyan-400 opacity-100 shadow-[0_0_15px_rgba(34,211,238,0.1)] translate-x-2' : 'bg-transparent border-neutral-400 opacity-50 scale-95'}`}>
       <span className={`text-[8px] sm:text-[10px] font-mono font-bold tracking-widest ${isChanged ? 'text-cyan-400' : 'text-neutral-400'}`}>{name}</span>
        <span className={`text-base sm:text-lg font-mono truncate ${isChanged ? 'text-white' : 'text-neutral-600'}`}>{value}</span>
      </div>
    );
  }

  return (
    <div className={`relative transition-all duration-300 transform w-full xs:w-[calc(50%-0.5rem)] md:w-[calc(33%-1rem)] lg:w-[160px] ${isChanged ? 'scale-105 z-10 opacity-100' : 'scale-95 opacity-50 pointer-events-none'}`}>
      <div className={`absolute -top-3 sm:-top-4 left-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-900 border-2 sm:border-4 text-[8px] sm:text-xs font-pixel-bold tracking-tighter transition-all z-10 ${isChanged ? 'border-pink-500 text-pink-400' : 'border-neutral-400 text-neutral-400'}`}>
        {name}
      </div>
      <div className={`min-h-[60px] sm:min-h-[80px] p-2 sm:p-4 pt-6 sm:pt-8 border-2 sm:border-4 flex items-center justify-center overflow-hidden transition-all ${isChanged ? 'border-pink-500 bg-pink-900/30 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-neutral-400 bg-transparent'}`}>
        <div className={`text-sm sm:text-xl font-pixel transition-all break-all text-center line-clamp-3 ${isChanged ? 'text-pink-300' : 'text-neutral-600'}`}>{value}</div>
      </div>
    </div>
  );
};

const CodeAnimationPlayer: React.FC<CodeAnimationPlayerProps> = ({ analysis, code, focusMode, targetLanguage }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flowchart, setFlowchart] = useState<string | null>(analysis.flowchart || null);
  const [generatingFlowchart, setGeneratingFlowchart] = useState(false);
  
  const activeLineRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const steps = analysis?.steps || [];
  const currentStep = steps[currentStepIndex];
  const isErrorStep = currentStep?.event === 'error';

  const persistentVariables = steps.slice(0, currentStepIndex + 1).reduce((acc, step) => {
    return { ...acc, ...step.variables };
  }, {} as Record<string, string>);

  const allEncounteredVariables = Object.keys(persistentVariables);

  useEffect(() => {
    if (activeLineRef.current && codeContainerRef.current) {
      codeContainerRef.current.scrollTo({ top: activeLineRef.current.offsetTop - 100, behavior: 'smooth' });
    }
  }, [currentStepIndex]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      if (isErrorStep) { setIsPlaying(false); return; }
      timer = setTimeout(() => setCurrentStepIndex(prev => prev + 1), focusMode ? 1000 : 2000);
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, focusMode, isErrorStep]);

 useEffect(() => {
  if (!flowchart || !mermaidRef.current) return;

  let mounted = true;

  (async () => {
    try {
      let mermaidLib: any;

      try {
        const imported = await import('mermaid');
        mermaidLib = imported.default ?? imported;
      } catch {
        mermaidLib = (window as any).mermaid;
      }

      if (!mermaidLib) {
        mermaidRef.current!.innerText = 'Mermaid not loaded.';
        return;
      }

      mermaidLib.initialize({
        startOnLoad: false,
        theme: 'dark',
      });

      mermaidRef.current.innerHTML = '';

      const id = `flowchart-${Date.now()}`;
      const f = flowchart.trim();
      if (!(f.startsWith('flowchart') || f.startsWith('graph'))) {
        mermaidRef.current.innerText = 'Invalid flowchart format.';
        return;
      }
      const { svg } = await mermaidLib.render(id, flowchart);

      if (mounted) {
        mermaidRef.current.innerHTML = svg;
      }
    } catch (err: any) {
      if (mounted) {
        mermaidRef.current.innerText =
          'Failed to render flowchart: ' + (err?.message ?? String(err));
      }
    }
  })();

  return () => {
    mounted = false;
  };
}, [flowchart]);


const handleGenerateFlowchart = async () => {
  setGeneratingFlowchart(true);
  try {
    const traceGuidance = "";
    const generated = await generateFlowchart(code, focusMode, traceGuidance, targetLanguage);
    setFlowchart(generated);
  } catch (err: any) {
    console.error("Flowchart generation failed:", err);
    if (mermaidRef.current) mermaidRef.current.innerText = 'Flowchart generation failed: ' + (err?.message ?? String(err));
  } finally {
    setGeneratingFlowchart(false);
  }
};

  if (!currentStep) return null;

  return (
    <div className="flex flex-col gap-6 sm:gap-12 w-full animate-fade-in-up">
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="flex flex-col gap-6">
          <div className={`${focusMode ? 'bg-[#020617] border border-slate-700' : 'pixel-card bg-slate-900'} h-[400px] sm:h-[500px] overflow-hidden flex flex-col`}>
            <div className={`px-4 py-3 flex justify-between items-center ${focusMode ? 'bg-[#1e293b] border-b border-slate-700' : 'border-b-4 border-slate-950 bg-slate-800'}`}>
              <h3 className={`${focusMode ? 'text-slate-400 font-mono text-[10px] sm:text-sm' : 'text-cyan-300 font-pixel text-lg sm:text-2xl'} tracking-widest uppercase`}>Execution_Trace</h3>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono uppercase">Read_Only</span>
            </div>
            <div ref={codeContainerRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
              {code.split('\n').map((line, idx) => {
                const isActive = idx + 1 === currentStep.line;
                const highlight = isErrorStep && isActive ? 'bg-red-950/40 border-l-4 border-red-500' : (isActive ? 'bg-indigo-900/40 border-l-4 border-pink-500' : 'opacity-40');
                return (
                  <div key={idx} ref={isActive ? activeLineRef : null} className={`flex px-2 py-0.5 ${highlight}`}>
                    <span className="w-8 text-right mr-6 font-mono text-slate-500 text-xs">{idx + 1}</span>
                    <span className={`font-mono text-sm sm:text-lg ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${focusMode ? 'bg-[#1e293b] border border-slate-700 p-6' : 'pixel-card p-6 bg-slate-800 shadow-[8px_8px_0_0_#000]'}`}>
            <div className="flex flex-col xs:flex-row gap-4 justify-between items-center border-b border-slate-700 pb-6 mb-6">
                <div className="flex gap-2">
                    <button onClick={() => setCurrentStepIndex(0)} className={`${focusMode ? 'p-2 bg-slate-800 border border-slate-700' : 'pixel-btn p-2 bg-white text-indigo-700 font-bold'}`}>RESET</button>
                    <button 
                      onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.max(0, currentStepIndex - 1)); }} 
                      className={`${focusMode ? 'px-4 bg-slate-800 border border-slate-700' : 'pixel-btn px-4 bg-white text-indigo-700 text-xl font-bold'}`}
                    >
                      ←
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={isErrorStep} className={`${focusMode ? 'px-8 py-2 bg-cyan-800 text-cyan-50 font-mono text-sm' : 'pixel-btn px-8 py-2 bg-indigo-600 text-white font-bold uppercase'}`}>{isPlaying ? 'PAUSE' : 'PLAY'}</button>
                    <button 
                      onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1)); }} 
                      className={`${focusMode ? 'px-4 bg-slate-800 border border-slate-700' : 'pixel-btn px-4 bg-white text-indigo-700 text-xl font-bold'}`}
                    >
                      →
                    </button>
                </div>
                <div className={`${focusMode ? 'font-mono text-slate-300' : 'bg-slate-950 px-6 py-2 border-4 border-slate-700 text-cyan-400 font-pixel text-xl'}`}>
                    STEP {currentStepIndex + 1} / {steps.length}
                </div>
            </div>
            <div className={`p-6 min-h-[140px] flex flex-col justify-center transition-all ${isErrorStep ? 'bg-red-950/40 border-4 border-red-600' : (focusMode ? 'bg-[#0f172a] border border-slate-700' : 'bg-black/40 border-4 border-slate-900 rounded-lg')}`}>
                <div className={`uppercase mb-2 text-[10px] font-bold tracking-widest ${isErrorStep ? 'text-red-500' : 'text-indigo-400'}`}>{isErrorStep ? 'FAULT_DETECTED' : 'LOGIC_INSIGHT'}</div>
                <div className={`${focusMode ? 'font-mono text-lg' : 'font-body text-xl sm:text-2xl'} text-white leading-tight`}>
                    {renderMarkdown(currentStep.explanation)}
                </div>
            </div>
          </div>
        </div>

        <div className={`${focusMode ? 'bg-[#1e293b] border border-slate-700' : 'pixel-card bg-slate-900'} flex flex-col min-h-[500px]`}>
            <div className={`px-6 py-4 border-b-4 border-slate-950 bg-slate-800`}>
                <h3 className="text-emerald-300 font-pixel text-2xl tracking-widest uppercase">Memory_Registry</h3>
            </div>
            <div className="flex-1 p-6 flex flex-wrap content-start gap-12 overflow-y-auto custom-scrollbar">
                {allEncounteredVariables.length === 0 ? (
                    <div className="w-full text-center py-20 opacity-20 font-pixel text-2xl text-slate-400 uppercase tracking-widest">NO_STATE_CAPTURED</div>
                ) : (
                    allEncounteredVariables.map(name => {
                        const isChanged = currentStep.variables && Object.prototype.hasOwnProperty.call(currentStep.variables, name);
                        return <VariableCard key={name} name={name} value={persistentVariables[name]} isChanged={isChanged} focusMode={focusMode} />;
                    })
                )}
            </div>
        </div>
      </div>

      <div className={`${focusMode ? 'bg-[#1e293b] border border-slate-700' : 'pixel-card bg-slate-900'} min-h-[300px] overflow-hidden`}>
        <div className="px-6 py-4 bg-slate-800 border-b-4 border-slate-950 flex justify-between items-center">
            <h3 className="text-orange-400 font-pixel text-2xl tracking-widest uppercase">Logic_Topology</h3>
            <button onClick={handleGenerateFlowchart} className="pixel-btn px-4 py-1 bg-orange-600 text-white font-bold text-[10px]">{generatingFlowchart ? "MAPPING..." : "GENERATE_MAP"}</button>
        </div>
        <div className="p-10 flex items-center justify-center overflow-x-auto min-h-[200px]">
            <div ref={mermaidRef} className="w-full flex justify-center"></div>
        </div>
      </div>
    </div>
  );
};

export default CodeAnimationPlayer;
