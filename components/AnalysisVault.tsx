import React from 'react';
import { SavedAnalysis, ToneProfile } from '../types';

interface AnalysisVaultProps {
  history: SavedAnalysis[];
  onLoad: (analysis: SavedAnalysis) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  setToneProfile: (tone: ToneProfile) => void; 
  focusMode: boolean;
}

const AnalysisVault: React.FC<AnalysisVaultProps> = ({ history, onLoad, onDelete, onClose, setToneProfile, focusMode }) => {
  const handleLoad = (analysis: SavedAnalysis) => {
   if (analysis.tone) {
  setToneProfile(analysis.tone);
}
    onLoad(analysis);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`h-full w-full max-w-2xl flex flex-col shadow-2xl transition-transform animate-fade-in-right ${
          focusMode ? 'bg-[#0f172a] border-l border-slate-700' : 'bg-slate-900 border-l-4 border-indigo-500'
        }`}
      >
        {/* Header */}
        <div
          className={`p-8 flex justify-between items-center ${
            focusMode ? 'bg-[#1e293b] border-b border-slate-700' : 'bg-slate-800 border-b-4 border-slate-950'
          }`}
        >
          <div>
            <div
              className={`uppercase font-bold mb-1 ${
                focusMode ? 'text-[10px] font-mono text-slate-500' : 'text-xs font-pixel-bold text-indigo-400'
              }`}
            >
              Vault_Storage
            </div>
            <h2
              className={`uppercase ${
                focusMode ? 'text-xl font-mono font-black text-white' : 'text-2xl text-white font-pixel-bold'
              }`}
            >
              ANALYSIS HISTORY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-slate-700 rounded-lg w-10 h-10 flex items-center justify-center text-white text-2xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none space-y-4">
              <div className="text-6xl">📭</div>
              <p
                className={`${
                  focusMode ? 'font-mono text-slate-500 text-xs tracking-widest uppercase' : 'font-pixel text-2xl text-slate-400 uppercase'
                }`}
              >
                No records found in the saved history.
              </p>
            </div>
          ) : (
            history
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((item) => (
                <div
                  key={item.id}
                  className={`group relative p-6 border-2 transition-all cursor-pointer ${
                    focusMode
                      ? 'bg-[#1e293b] border-slate-700 hover:border-cyan-500'
                      : 'bg-slate-800 border-slate-700 hover:border-indigo-500 hover:translate-x-1'
                  }`}
                  onClick={() => handleLoad(item)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          focusMode ? 'text-slate-500' : 'text-indigo-400'
                        }`}
                      >
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <h3
                        className={`font-bold mt-1 uppercase ${
                          focusMode ? 'font-mono text-slate-200' : 'font-pixel text-xl text-white'
                        }`}
                      >
                        {item.language.toUpperCase()} {item.mode.toUpperCase()} SESSION
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-900/40 text-red-500 transition-all rounded"
                    >
                      🗑️
                    </button>
                  </div>

                  <pre
                    className={`p-3 rounded font-mono text-xs line-clamp-2 overflow-hidden ${
                      focusMode ? 'bg-black text-slate-500' : 'bg-slate-950 text-indigo-300 opacity-60'
                    }`}
                  >
                    {item.code}
                  </pre>

                  <div className="mt-4 flex gap-4">
                    <div
                      className={`px-2 py-1 text-[8px] font-bold uppercase border ${
                        focusMode ? 'border-slate-600 text-slate-500' : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {item.mode === 'visualizer' ? 'Steps Saved' : 'Concept Map'}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${focusMode ? 'bg-[#0f172a] border-slate-700' : 'bg-slate-950 border-slate-900'}`}>
          <p className="text-[10px] font-mono text-slate-600 uppercase text-center tracking-widest">
            Data persists in local storage. Clearing browser cache will wipe vault.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisVault;
