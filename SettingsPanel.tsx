
import React from 'react';
import { ToneProfile } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tone: ToneProfile;
  setTone: React.Dispatch<React.SetStateAction<ToneProfile>>;
  onRestartSetup: () => void;
  focusMode: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, tone, setTone, onRestartSetup, focusMode }) => {
  const updateTone = (prop: keyof ToneProfile, val: ToneProfile[keyof ToneProfile]) => {
    setTone(prev => ({ ...prev, [prop]: val }));
  };

  const Toggle = ({ 
    label, 
    prop, 
    valA, 
    valB, 
    labelA, 
    labelB, 
    current 
  }: { 
    label: string, 
    prop: keyof ToneProfile, 
    valA: any, 
    valB: any, 
    labelA: string, 
    labelB: string, 
    current: any 
  }) => (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-pixel-bold uppercase tracking-widest ${focusMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
        <button 
          onClick={() => updateTone(prop, valA)}
          className={`py-2 px-3 text-[10px] font-pixel-bold uppercase transition-all rounded ${current === valA ? (focusMode ? 'bg-cyan-600 text-white shadow-lg' : 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]') : (focusMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-400')}`}
        >
          {labelA}
        </button>
        <button 
          onClick={() => updateTone(prop, valB)}
          className={`py-2 px-3 text-[10px] font-pixel-bold uppercase transition-all rounded ${current === valB ? (focusMode ? 'bg-cyan-600 text-white shadow-lg' : 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]') : (focusMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-400')}`}
        >
          {labelB}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[420px] z-[101] transition-transform duration-500 transform ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${focusMode ? 'bg-[#0f172a] border-l border-slate-700' : 'bg-[#1e1b4b] border-l-8 border-slate-950 shadow-[-10px_0_40px_rgba(0,0,0,0.5)]'}`}>
        <div className={`p-8 flex justify-between items-center ${focusMode ? 'bg-[#1e293b] border-b border-slate-700' : 'bg-slate-900 border-b-4 border-slate-950 shadow-xl'}`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-pixel-bold uppercase ${focusMode ? 'text-slate-500' : 'text-pink-500'} tracking-widest`}>Preference_Core</span>
            <h2 className={`text-2xl font-pixel-bold text-white uppercase mt-1`}>Settings</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-white text-2xl transition-colors">✕</button>
        </div>

        <div className="p-8 space-y-10 h-[calc(100%-180px)] overflow-y-auto custom-scrollbar">
          <Toggle label="Tone" prop="conversational" valA="off" valB="on" labelA="Direct" labelB="Conversational" current={tone.conversational} />
          <Toggle label="Detail" prop="density" valA="compact" valB="dense" labelA="Compact" labelB="Full" current={tone.density} />
          <Toggle label="Redundancy" prop="redundancy" valA="low" valB="high" labelA="Minimal" labelB="Expanded" current={tone.redundancy} />
          <Toggle label="Metaphor" prop="metaphorTolerance" valA="low" valB="high" labelA="Off" labelB="On" current={tone.metaphorTolerance} />
          <Toggle label="Precision" prop="precision" valA="high" valB="low" labelA="Technical" labelB="Behavioral" current={tone.precision} />
          <Toggle label="Emotional Padding" prop="emotionalPadding" valA="off" valB="on" labelA="Off" labelB="On" current={tone.emotionalPadding} />

          <div className="h-px bg-white/5"></div>

          <Toggle label="Directness" prop="directness" valA="high" valB="low" labelA="High" labelB="Low" current={tone.directness} />
          <Toggle label="Technical Bluntness" prop="technicalBluntness" valA="high" valB="low" labelA="High" labelB="Low" current={tone.technicalBluntness} />
          <Toggle label="Authority Style" prop="authority" valA="assertive" valB="suggestive" labelA="Assertive" labelB="Suggestive" current={tone.authority} />
          <Toggle label="Error Feedback" prop="errorTone" valA="direct" valB="soft" labelA="Direct" labelB="Soft" current={tone.errorTone} />
          
          <div className="pt-10 border-t border-white/5">
            <button 
              onClick={onRestartSetup}
              className={`w-full py-5 font-pixel-bold text-sm uppercase transition-all rounded-lg ${focusMode ? 'bg-slate-800 text-slate-400 border border-slate-600 hover:text-white hover:bg-slate-700' : 'pixel-btn bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Restart Calibration Quiz
            </button>
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 w-full p-8 border-t ${focusMode ? 'bg-[#1e293b] border-slate-700' : 'bg-slate-900 border-slate-950'}`}>
          <p className="text-[10px] font-pixel text-slate-500 leading-relaxed uppercase tracking-widest text-center">
            Logic model updates in real-time.<br/>No manual save required.
          </p>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
