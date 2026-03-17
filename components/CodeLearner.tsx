import React, { useState, useEffect } from 'react';
import { LearnerProfile, TimelineState, Replacement, ConceptBlock } from '../types';

interface CodeLearnerProps {
  profile: LearnerProfile;
  focusMode: boolean;
  targetLanguage?: string;
}

const renderMarkdown = (text: string | undefined | null) => {
    if (!text) return "";
    
    // Split by double newlines to create paragraph spacing
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <p key={pIdx} className={pIdx > 0 ? "mt-4" : ""}>
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-cyan-400 font-bold">{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <em key={index} className="text-pink-400 italic font-medium">{part.slice(1, -1)}</em>;
            return part;
          })}
        </p>
      );
    });
};

/* =========================
   REPLACEMENT DETAIL MODAL
========================= */
const ReplacementDetailModal: React.FC<{ 
    original: string; 
    replacement: Replacement; 
    onClose: () => void;
    focusMode: boolean;
}> = ({ original, replacement, onClose, focusMode }) => (
  <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border-2 ${focusMode ? 'bg-[#0f172a] border-slate-600 rounded-none' : 'bg-slate-900 border-indigo-500 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-fade-in-up'}`}>
      
      <div className={`p-4 sm:p-6 flex justify-between items-center ${focusMode ? 'bg-[#1e293b] border-b border-slate-700' : 'bg-indigo-900/40 border-b-4 border-slate-950'}`}>
        <div>
           <div className={`uppercase font-bold mb-1 ${focusMode ? 'text-[8px] sm:text-[10px] font-mono text-slate-500' : 'text-[8px] sm:text-xs font-pixel-bold text-indigo-400'}`}>Refactoring_Lab</div>
           <h2 className={`uppercase ${focusMode ? 'text-lg sm:text-2xl font-mono font-black text-white' : 'text-base sm:text-2xl text-white font-pixel-bold'}`}>{replacement.title}</h2>
        </div>
        <button onClick={onClose} className="hover:bg-slate-700 rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white text-xl sm:text-2xl transition-all">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar flex flex-col gap-6 sm:gap-10">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
           <div className="flex flex-col gap-2 sm:gap-3">
              <div className={`text-[10px] font-bold uppercase tracking-widest ${focusMode ? 'font-mono text-red-400' : 'font-pixel text-red-500'}`}>[ ORIGINAL_PATERN ]</div>
              <pre className={`p-3 sm:p-4 border-2 rounded-lg font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto ${focusMode ? 'bg-black border-red-900/30 text-slate-400' : 'bg-slate-950 border-red-900/50 text-slate-400 opacity-70'}`}>
                 {original}
              </pre>
           </div>
           <div className="flex flex-col gap-2 sm:gap-3">
              <div className={`text-[10px] font-bold uppercase tracking-widest ${focusMode ? 'font-mono text-emerald-400' : 'font-pixel text-emerald-500'}`}>[ RECOMMENDED_UPDATE ]</div>
              <pre className={`p-3 sm:p-4 border-2 rounded-lg font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto shadow-xl ${focusMode ? 'bg-[#020617] border-emerald-700 text-slate-100' : 'bg-slate-950 border-emerald-500 text-emerald-400'}`}>
                 {replacement.codeSnippet}
              </pre>
           </div>
        </div>

        <div className={`p-4 sm:p-6 border-l-4 ${focusMode ? 'bg-[#1e293b] border-indigo-500' : 'bg-indigo-900/20 border-indigo-500'}`}>
            <div className={`uppercase mb-3 sm:mb-4 ${focusMode ? 'text-[8px] sm:text-[10px] font-mono text-slate-500' : 'text-[8px] sm:text-xs font-pixel-bold text-indigo-400'}`}>Architectural_Reasoning</div>
            <div className={`leading-relaxed ${focusMode ? 'text-sm sm:text-base font-mono text-slate-200' : 'text-lg sm:text-xl font-body text-slate-100'}`}>
                {renderMarkdown(replacement.explanation)} 
            </div>
        </div>
      </div>

      <div className="p-4 bg-black/20 flex justify-center">
         <button onClick={onClose} className={`px-6 sm:px-10 py-2 sm:py-3 uppercase transition-all ${focusMode ? 'bg-slate-700 text-white font-mono text-[10px] hover:bg-slate-600' : 'pixel-btn bg-indigo-600 text-white font-pixel-bold text-xs sm:text-sm'}`}>Back_to_Logic_Frame</button>
      </div>
    </div>
  </div>
);

/* =========================
   TAB BUTTON (NAV UX)
========================= */
const TabButton: React.FC<{ active: boolean; label: string; icon: string; onClick: () => void; focusMode: boolean }> = ({ active, label, icon, onClick, focusMode }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 py-4 sm:py-7 px-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all border-b-4
      flex items-center justify-center gap-3 sm:gap-4
      ${focusMode ? 'font-mono sm:text-lg' : 'font-pixel sm:text-2xl'}
      ${active
        ? (focusMode ? 'text-white border-white bg-slate-700' : 'text-emerald-300 border-emerald-500 bg-emerald-900/20')
        : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'}
    `}
  >
    {!focusMode && <span className="text-xl sm:text-3xl">{icon}</span>}
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </button>
);

/* =========================
   CONCEPT CARD (VISUAL BLOCK)
========================= */
const ConceptCard: React.FC<{ 
  concept: ConceptBlock; 
  index: number; 
  focusMode: boolean;
}> = ({ concept, index, focusMode }) => {
  const { title, description, type, imageUrl } = concept;

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-2xl border-l-4 sm:border-l-8 shadow-xl sm:shadow-2xl transition-all duration-300 flex flex-col gap-4 overflow-hidden
          ${focusMode 
            ? 'border-slate-600 bg-[#334155]' 
            : (type === 'concept' ? 'border-emerald-500 from-emerald-900/40 to-slate-900 bg-gradient-to-br' : type === 'state' ? 'border-pink-500 from-pink-900/40 to-slate-900 bg-gradient-to-br' : 'border-indigo-500 from-indigo-900/40 to-slate-900 bg-gradient-to-br')}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-center relative z-10 mb-2">
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] ${focusMode ? 'font-mono text-slate-400' : 'font-pixel text-slate-400'}`}>
          {type}
        </span>
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        <h4 className={`text-xl sm:text-2xl uppercase tracking-tighter ${focusMode ? 'font-mono font-black text-white' : 'font-pixel-bold text-white'}`}>{title}</h4>
        <div className={`text-base sm:text-lg leading-relaxed ${focusMode ? 'font-mono text-slate-200' : 'font-body text-slate-200'}`}>
          {renderMarkdown(description)}
        </div>
      </div>

      {imageUrl && (
        <div className={`mt-4 aspect-square w-full relative group overflow-hidden border-2 ${focusMode ? 'bg-black border-slate-700 shadow-inner' : 'bg-slate-950 border-white/10 rounded-xl shadow-2xl'}`}>
          <div className="relative w-full h-full">
            <img src={imageUrl} alt={title} className={`w-full h-full object-cover transition-all group-hover:scale-105 ${focusMode ? 'grayscale contrast-125 brightness-75' : ''}`} />
            <div className={`absolute inset-0 pointer-events-none ${focusMode ? 'bg-cyan-900/10 mix-blend-overlay' : 'bg-gradient-to-t from-black/60 to-transparent'}`}></div>
          </div>
        </div>
      )}

      <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 text-6xl sm:text-9xl opacity-10 rotate-12 select-none pointer-events-none">
        {type === 'concept' ? '💡' : type === 'state' ? '💾' : '⚙️'}
      </div>
    </div>
  );
};

/* =========================
   TIMELINE NODE
========================= */
const VerticalTimelineNode: React.FC<{ step: number; label: string; value: string; codeSnippet: string; isLast: boolean; onClick: () => void; focusMode: boolean }> = ({ step, label, value, codeSnippet, isLast, onClick, focusMode }) => (
  <div className={`flex gap-3 sm:gap-6 relative group cursor-pointer ${focusMode ? 'mb-4' : 'mb-6 sm:mb-8'}`} onClick={onClick}>
    {!isLast && (
      <div className={`absolute left-4 sm:left-7 h-full w-0.5 sm:w-1 ${focusMode ? 'top-8 sm:top-10 bg-slate-700' : 'top-10 sm:top-12 bg-slate-800 group-hover:bg-emerald-800'} transition-colors`} />
    )}
    <div className={`rounded-full border-2 sm:border-4 flex items-center justify-center shrink-0 transition-all 
                    ${focusMode 
                      ? 'w-8 h-8 sm:w-10 sm:h-10 border-slate-600 bg-slate-800 text-xs sm:text-base font-mono text-slate-200' 
                      : 'w-10 h-10 sm:w-14 sm:h-14 border-slate-700 bg-slate-800 group-hover:border-emerald-400 group-hover:scale-105 sm:group-hover:scale-110 font-pixel-bold text-sm sm:text-xl text-white'}`}>
      {step}
    </div>
    <div className={`flex-1 p-4 sm:p-6 border-l-2 sm:border-l-4 transition-all 
                    ${focusMode 
                      ? 'border-slate-500 bg-[#1e293b] hover:bg-slate-800 shadow-md' 
                      : 'rounded-xl border-slate-700 bg-slate-900/50 group-hover:border-emerald-500 shadow-lg'}`}>
      <div className={`uppercase mb-1 sm:mb-2 tracking-widest ${focusMode ? 'text-[8px] sm:text-xs font-mono font-bold text-slate-400' : 'text-[8px] sm:text-xs font-pixel-bold text-slate-500'}`}>{label}</div>
      <div className={`mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none ${focusMode ? 'text-sm sm:text-base font-mono text-slate-100' : 'text-slate-300 font-body text-lg sm:text-xl'}`}>
        {renderMarkdown(value)}
      </div>
      {codeSnippet && (
        <pre className={`p-2 sm:p-4 rounded border border-white/5 font-mono text-[10px] sm:text-sm overflow-x-auto ${focusMode ? 'bg-[#020617] text-slate-300' : 'bg-[#0f172a] text-emerald-300'}`}>
          {codeSnippet}
        </pre>
      )}
    </div>
  </div>
);

/* =========================
   FOCUS OVERLAY
========================= */
const FocusOverlay: React.FC<{ 
    step: TimelineState; 
    onClose: () => void; 
    onNext: () => void; 
    onPrev: () => void; 
    onOpenReplacement: () => void;
    hasPrev: boolean; 
    hasNext: boolean; 
    focusMode: boolean;
}> = ({ step, onClose, onNext, onPrev, onOpenReplacement, hasPrev, hasNext, focusMode }) => (
  <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`w-full max-w-6xl h-[95vh] sm:h-[90vh] bg-[#1e293b] flex flex-col overflow-hidden border-2 ${focusMode ? 'border-slate-600 rounded-none shadow-2xl' : 'rounded-2xl border-slate-700 shadow-2xl animate-fade-in-up'}`}>
      <div className={`p-4 sm:p-8 flex justify-between items-center ${focusMode ? 'bg-[#334155] border-b border-slate-600' : 'border-b-4 border-slate-900 bg-slate-900'}`}>
        <div className="flex flex-col">
            <span className={`uppercase font-bold mb-1 ${focusMode ? 'text-[10px] sm:text-xs font-mono text-slate-400' : 'text-[8px] sm:text-[10px] font-pixel-bold text-emerald-500'}`}>LOGIC_ANALYSIS_FRAME</span>
            <h2 className={`uppercase ${focusMode ? 'text-base sm:text-2xl font-mono font-black text-white tracking-tight' : 'text-base sm:text-2xl text-white font-pixel-bold'}`}>{step.label}</h2>
        </div>
        <button onClick={onClose} className="hover:bg-slate-700 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white text-2xl sm:text-3xl transition-all">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 custom-scrollbar">
        <div className="flex flex-col gap-6 sm:gap-10">
            <div className={`p-4 sm:p-8 border-2 ${focusMode ? 'bg-[#020617] border-slate-700 shadow-inner' : 'bg-[#0f172a] rounded-xl border-emerald-500/30'}`}>
                <div className={`uppercase mb-4 sm:mb-6 ${focusMode ? 'text-[10px] sm:text-xs font-mono text-slate-500 border-b border-slate-800 pb-2' : 'text-[8px] sm:text-[10px] font-pixel-bold text-emerald-400'}`}>Snippet Source</div>
                <pre className={`font-mono leading-relaxed whitespace-pre-wrap ${focusMode ? 'text-slate-100 text-sm sm:text-lg' : 'text-emerald-300 text-base sm:text-2xl'}`}>
                  {step.codeSnippet}
                </pre>
            </div>
            
            {step.alternatives && (
                <button 
                    onClick={onOpenReplacement}
                    className={`p-4 sm:p-8 border-2 text-left group transition-all transform hover:scale-[1.01] active:scale-[0.99]
                        ${focusMode ? 'bg-[#020617] border-slate-600 hover:border-indigo-500' : 'bg-yellow-900/10 border-yellow-500/30 rounded-xl hover:border-yellow-500'}`}
                >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl group-hover:rotate-12 transition-transform">⚡</span>
                            <div className={`uppercase ${focusMode ? 'text-[10px] sm:text-sm font-mono font-black text-yellow-400' : 'text-[8px] sm:text-[10px] font-pixel-bold text-yellow-500'}`}>Deep_DIVE: {step.alternatives.title}</div>
                        </div>
                    </div>
                    <div className={`mb-4 sm:mb-6 leading-relaxed line-clamp-2 ${focusMode ? 'text-xs sm:text-base font-mono text-slate-400' : 'text-yellow-100 font-pixel text-base sm:text-xl'}`}>
                      {renderMarkdown(step.alternatives.explanation)}
                    </div>
                </button>
            )}
        </div>
        
        <div className="flex flex-col gap-8 lg:gap-12">
            <div className="space-y-4 sm:space-y-6">
                <div className={`uppercase ${focusMode ? 'text-[10px] sm:text-xs font-mono font-bold text-slate-500 border-b border-slate-800 pb-2' : 'text-[8px] sm:text-[10px] font-pixel-bold text-slate-500'}`}>Technical Explanation</div>
                <div className={`leading-relaxed ${focusMode ? 'text-base sm:text-lg font-mono text-slate-100' : 'text-slate-200 text-xl sm:text-3xl font-body'}`}>
                    {renderMarkdown(step.detailedExplanation)}
                </div>
            </div>
        </div>
      </div>

      <div className={`p-4 sm:p-6 flex justify-between items-center ${focusMode ? 'bg-[#334155] border-t border-slate-600' : 'border-t-4 border-slate-900 bg-slate-900'}`}>
        <button disabled={!hasPrev} onClick={onPrev} className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 text-slate-200 font-mono text-sm sm:text-xl border border-slate-600 hover:bg-slate-700 disabled:opacity-30 transition-colors uppercase font-bold">←</button>
        <button disabled={!hasNext} onClick={onNext} className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-100 text-slate-900 font-mono text-sm sm:text-xl border border-white hover:bg-slate-300 disabled:opacity-30 transition-colors uppercase font-bold">→</button>
      </div>
    </div>
  </div>
);

const CodeLearner: React.FC<CodeLearnerProps> = ({ profile, focusMode }) => {
  const [activeTab, setActiveTab] = useState<'what' | 'why' | 'connectivity'>('what');
  const [focusedStepIndex, setFocusedStepIndex] = useState<number | null>(null);
  const [replacementDetail, setReplacementDetail] = useState<{ original: string; replacement: Replacement } | null>(null);
  const [concepts, setConcepts] = useState<ConceptBlock[]>(profile.concepts || []);

  useEffect(() => {
    setConcepts(profile.concepts || []);
  }, [profile]);

  if (!profile) return null;

  const labels = {
    what: "Systemic Function",
    why: "Architectural Rationale",
    connectivity: "Conceptual Context"
  };

  const icons = {
    what: "🔍",
    why: "⚖️",
    connectivity: "🌐"
  };

  return (
    <div className={`flex flex-col gap-8 sm:gap-12 pb-20 sm:pb-32 ${focusMode ? '' : 'animate-fade-in-up'}`}>

      {focusedStepIndex !== null && profile.timeline && (
        <FocusOverlay 
            step={profile.timeline[focusedStepIndex]} 
            onClose={() => setFocusedStepIndex(null)}
            onNext={() => setFocusedStepIndex(i => Math.min(profile.timeline.length - 1, i! + 1))}
            onPrev={() => setFocusedStepIndex(i => Math.max(0, i! - 1))}
            onOpenReplacement={() => {
                const step = profile.timeline[focusedStepIndex!];
                if (step.alternatives) {
                    setReplacementDetail({ original: step.codeSnippet, replacement: step.alternatives });
                }
            }}
            hasPrev={focusedStepIndex > 0}
            hasNext={focusedStepIndex < profile.timeline.length - 1}
            focusMode={focusMode}
        />
      )}

      {replacementDetail && (
          <ReplacementDetailModal 
            original={replacementDetail.original}
            replacement={replacementDetail.replacement}
            onClose={() => setReplacementDetail(null)}
            focusMode={focusMode}
          />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {concepts.map((c, i) => (
            <ConceptCard 
              key={i} 
              concept={c}
              index={i} 
              focusMode={focusMode} 
            />
        ))}
      </div>

      {/* TAB TERMINAL -EXPANDED FOR BETTER INFORMATIONAL DENSITY */}
      <div className={`${focusMode ? 'bg-[#1e293b] border border-slate-600 shadow-xl' : 'pixel-card overflow-hidden bg-slate-900 shadow-[12px_12px_0_0_#000]'}`}>
        <div className={`flex ${focusMode ? 'bg-[#334155] border-b border-slate-600' : 'border-b-4 border-slate-950 bg-slate-800'}`}>
          <TabButton active={activeTab === 'what'} label={labels.what} icon={icons.what} onClick={() => setActiveTab('what')} focusMode={focusMode} />
          <TabButton active={activeTab === 'why'} label={labels.why} icon={icons.why} onClick={() => setActiveTab('why')} focusMode={focusMode} />
          <TabButton active={activeTab === 'connectivity'} label={labels.connectivity} icon={icons.connectivity} onClick={() => setActiveTab('connectivity')} focusMode={focusMode} />
        </div>
        <div className={`p-8 sm:p-20 min-h-[400px] flex items-center justify-center transition-all duration-500 ${focusMode ? 'bg-[#0f172a]' : 'bg-[#0a0a0f]'}`}>
            <div className="max-w-4xl flex flex-col items-center gap-4 animate-fade-in text-left">
                <div className={`w-16 h-1 bg-gradient-to-r ${focusMode ? 'from-slate-700 to-slate-500' : 'from-emerald-500 to-indigo-500'} mb-6 rounded-full`}></div>
                <div className={`leading-[1.6] tracking-tight ${focusMode ? 'text-xl sm:text-2xl font-mono text-slate-100': 'text-2xl sm:text-4xl font-body text-slate-100'}`}>
                    {renderMarkdown((profile.deepExplanation as any)[activeTab])}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-[0.4em] mt-8 opacity-40 ${focusMode ? 'text-slate-600 font-mono' : 'text-slate-700 font-pixel'}`}>Authorized_Knowledge_Segment</div>
            </div>
        </div>
      </div>

      <div className={`${focusMode ? 'bg-[#1e293b] border border-slate-600 p-4 sm:p-8 shadow-2xl' : 'pixel-card p-5 sm:p-10 bg-[#0d1117]'}`}>
        <h3 className={`uppercase mb-8 sm:mb-12 border-b pb-4 sm:pb-6 flex items-center gap-2 sm:gap-4 ${focusMode ? 'text-slate-400 font-mono text-[10px] sm:text-sm font-black border-slate-700 tracking-[0.2em] sm:tracking-[0.3em]' : 'text-lg sm:text-2xl font-pixel-bold text-emerald-400 border-slate-900'}`}>
            {!focusMode && <span className="w-2 h-2 sm:w-4 sm:h-4 bg-emerald-500 rounded-full animate-pulse"></span>}
            LOGIC_TRANSCRIPTION_STREAM
        </h3>
        <div className="max-w-4xl mx-auto">
            {(profile.timeline || []).map((node, i) => (
                <VerticalTimelineNode 
                    key={i} 
                    step={node.step} 
                    label={node.label} 
                    value={node.detailedExplanation} 
                    codeSnippet={node.codeSnippet} 
                    isLast={i === profile.timeline.length - 1} 
                    onClick={() => setFocusedStepIndex(i)}
                    focusMode={focusMode}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default CodeLearner;
