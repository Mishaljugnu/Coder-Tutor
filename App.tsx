import React, { useState, useEffect } from 'react';
import CodeAnalyzer from './components/CodeAnalyzer';
import MenuDropdown from './components/MenuDropdown';
import SettingsPanel from './components/SettingsPanel';
import AnalysisVault from './components/AnalysisVault';
import { AppMode, AppState, ToneProfile, DEFAULT_TONE, SCIENTIST_TONE, STORYTELLER_TONE, SavedAnalysis, UserSession } from './types';

// Assets
const VALID_APP_STATES = [
  'landing',
  'login',
  'setup',
  'results',
  'app',
] as const;

type LocalAppState = typeof VALID_APP_STATES[number];

const LOGO_PATH = '/logo.png';

// --- Sub-components ---

const LogoIcon: React.FC<{ mode: AppMode; focusMode: boolean; size?: 'sm' | 'lg' }> = ({ mode, focusMode, size = 'lg' }) => {
  const isVisualizer = mode === 'visualizer';
  const accentGradient = isVisualizer 
    ? 'from-pink-500 to-indigo-500' 
    : 'from-emerald-500 to-teal-500';

  const dim = size === 'lg' ? 'w-10 h-10 sm:w-16 sm:h-14' : 'w-8 h-8 sm:w-10 sm:h-10';
  
  return (
    <div className={`relative ${dim} group flex items-center justify-center`}>
      {!focusMode && (
        <div className={`absolute inset-0 bg-gradient-to-tr ${accentGradient} blur-md rounded-lg opacity-40 group-hover:opacity-80 transition-opacity animate-pulse`}></div>
      )}
      
      <div className={`relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300
        ${focusMode 
          ? 'bg-slate-900 border border-slate-700 rounded-md' 
          : 'bg-white border-2 border-black rounded-lg shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]'}`}>
        
        {!focusMode && (
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
        )}

        <img 
          src={LOGO_PATH} 
          alt="Coder Tutor Logo" 
          className={`w-[85%] h-[85%] object-contain z-20 transition-all group-hover:scale-110 
            ${focusMode ? 'grayscale brightness-75 contrast-125' : ''}`}
        />

        {focusMode && (
          <>
            <div className="absolute top-1 left-1 w-1 h-1 bg-slate-700"></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-slate-700"></div>
          </>
        )}
      </div>
    </div>
  );
};

const Navbar: React.FC<{ 
  mode: AppMode; 
  focusMode: boolean; 
  isApp: boolean;
  demoMode: boolean;
  username: string;
  onExit: () => void;
  onModeChange: (mode: AppMode) => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  setFocusMode: (f: boolean) => void;
  startApp: (demo: boolean) => void;
}> = ({ mode, focusMode, isApp, demoMode, username, onExit, onModeChange, onOpenVault, onOpenSettings, setFocusMode, startApp }) => (
  <nav 
    className={`sticky top-0 z-50 h-16 sm:h-24 flex items-center transition-all duration-500 border-b-2 sm:border-b-4 ${focusMode ? 'bg-[#0f172a] border-slate-700' : 'bg-[#1e1b4b] shadow-[0_0_20px_rgba(0,0,0,0.5)] border-transparent'}`}
    style={focusMode ? {} : { 
        borderImage: mode === 'visualizer' 
          ? 'linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6) 1' 
          : 'linear-gradient(to right, #10b981, #06b6d4, #3b82f6) 1'
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer shrink-0" onClick={onExit}>
        <LogoIcon mode={mode} focusMode={focusMode} size="sm" />
        <div className="flex flex-col">
          <h1 className={`text-xs sm:text-3xl font-bold tracking-tight sm:tracking-widest ${focusMode ? 'text-white' : 'font-pixel-bold text-white uppercase drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]'}`}>
            CODE<span className={`text-transparent bg-clip-text bg-gradient-to-r ${mode === 'visualizer' ? 'from-pink-400 to-cyan-400' : 'from-emerald-400 to-teal-400'}`}>TUTOR</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {isApp ? (
          <>
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className={`px-2 py-1.5 sm:px-6 sm:py-2.5 text-[8px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-3 border sm:border-2 rounded-lg 
                ${focusMode 
                  ? 'bg-cyan-900/20 text-cyan-400 border-cyan-800' 
                  : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-400 hover:border-slate-600'
                }`}
            >
              <div className={`w-1 h-1 sm:w-2 sm:h-2 rounded-full ${focusMode ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
              <span className="tracking-widest uppercase hidden sm:inline">Focus Mode</span>
              <span className="sm:hidden">FOCUS</span>
            </button>

            <div className="hidden md:flex items-center p-1 bg-slate-900/50 border border-slate-800 rounded-lg">
              <button onClick={() => onModeChange('visualizer')} className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${mode === 'visualizer' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>VISUALIZER</button>
              <button onClick={() => onModeChange('learner')} className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${mode === 'learner' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>TUTOR</button>
            </div>

            <MenuDropdown 
              currentMode={mode} 
              onModeChange={onModeChange}
              onOpenVault={onOpenVault}
              onOpenSettings={onOpenSettings}
              onExit={onExit}
              isDemo={demoMode}
              username={username || 'GUEST_USER'}
              focusMode={focusMode}
            />
          </>
        ) : (
          <div className="flex gap-2 sm:gap-6">
            <button onClick={() => startApp(true)} className="hidden sm:block text-[10px] font-pixel-bold uppercase text-slate-400 hover:text-white transition-colors">Try a Demo</button>
              <button onClick={() => startApp(false)} className="pixel-btn px-3 sm:px-6 py-2 sm:py-2.5 bg-white text-black font-pixel-bold text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white">
               Start Learning
                <span className="hidden sm:inline group-hover:translate-x-1 transition-transform ml-2">→</span>
             </button>
          </div>
        )}
      </div>
    </div>
  </nav>
);

const MasterFooter: React.FC<{ focusMode: boolean; mode: AppMode; onNavigate: (m: AppMode) => void; onRestart: () => void; onOpenVault: () => void; onOpenSettings: () => void; onHome: () => void }> = ({ focusMode, mode, onNavigate, onRestart, onOpenVault, onOpenSettings, onHome }) => (
  <footer className={`relative border-t-2 sm:border-t-4 transition-all duration-700 overflow-hidden ${focusMode ? 'bg-[#0f172a] border-slate-700' : 'bg-[#0f172a] border-black'}`}>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500 opacity-30"></div>
    
    <div className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
        <div className="col-span-2 md:col-span-1 space-y-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onHome}>
            <LogoIcon mode={mode} focusMode={focusMode} size="sm" />
            <h3 className={`text-xl font-bold uppercase tracking-widest transition-colors ${focusMode ? 'text-white' : 'font-pixel-bold text-white group-hover:text-pink-400'}`}>CODE TUTOR</h3>
          </div>
          <p className={`text-sm leading-relaxed ${focusMode ? 'text-slate-500 font-mono' : 'text-slate-400 font-pixel text-lg'}`}>
            Advancing code understanding through visual execution and adaptive logic guides.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">Logic_Engine_v2.0</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] ${focusMode ? 'text-slate-400' : 'text-indigo-400'}`}>Workspaces</h4>
          <ul className={`space-y-2 text-sm ${focusMode ? 'text-slate-500 font-mono' : 'text-slate-400 font-pixel text-xl'}`}>
            <li><button onClick={() => onNavigate('visualizer')} className="hover:text-cyan-400 transition-colors">Visualizer</button></li>
            <li><button onClick={() => onNavigate('learner')} className="hover:text-emerald-400 transition-colors">Learner Mode</button></li>
            <li><button onClick={onRestart} className="hover:text-pink-400 transition-colors">Calibration Hub</button></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] ${focusMode ? 'text-slate-400' : 'text-indigo-400'}`}>Storage</h4>
          <ul className={`space-y-2 text-sm ${focusMode ? 'text-slate-500 font-mono' : 'text-slate-400 font-pixel text-xl'}`}>
            <li><button onClick={onOpenVault} className="hover:text-white transition-colors">History Vault</button></li>
            <li><button onClick={onOpenSettings} className="hover:text-white transition-colors">Tutor Settings</button></li>
            <li><a href="#" className="hover:text-white transition-colors">Session Cache</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className={`text-xs font-bold uppercase tracking-[0.2em] ${focusMode ? 'text-slate-400' : 'text-indigo-400'}`}>Resources</h4>
          <ul className={`space-y-2 text-sm ${focusMode ? 'text-slate-500 font-mono' : 'text-slate-400 font-pixel text-xl'}`}>
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">GitHub Repository</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Protocol</a></li>
          </ul>
        </div>
      </div>

      <div className={`pt-8 border-t ${focusMode ? 'border-slate-800' : 'border-slate-900'} flex flex-col md:flex-row justify-between items-center gap-6`}>
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8">
          <p className="text-slate-600 font-pixel text-xs sm:text-base uppercase tracking-widest text-center md:text-left">
            © 2025 CoderTutor Labs. All Rights Reserved.
          </p>
          <div className="flex gap-4 items-center opacity-30">
             <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
             <span className="text-slate-700 font-mono text-[10px] uppercase">ANALYSIS_ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4 group">
          <span className="text-slate-500 font-pixel text-sm sm:text-lg uppercase tracking-widest">Designed by</span>
          <span className={`px-4 py-1.5 rounded text-[10px] sm:text-base font-bold transition-all ${focusMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-900 text-white font-pixel-bold border-2 border-slate-800 shadow-[4px_4px_0_0_#000] group-hover:bg-indigo-600 group-hover:shadow-indigo-900'}`}>
            Mishal Eman
          </span>
        </div>
      </div>
    </div>
  </footer>
);

const DemoToneController: React.FC<{ tone: ToneProfile; setTone: (t: ToneProfile) => void }> = ({ tone, setTone }) => (
  <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border-y border-white/10 p-4 animate-fade-in-down flex flex-col sm:flex-row items-center justify-center gap-4 relative z-40">
     <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-pixel-bold text-yellow-500 uppercase tracking-widest">Simulation Mode Active</span>
     </div>
     <div className="h-px w-8 bg-white/10 hidden sm:block"></div>
     <div className="flex flex-wrap gap-2 justify-center">
        <button 
          onClick={() => setTone(SCIENTIST_TONE)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${JSON.stringify(tone) === JSON.stringify(SCIENTIST_TONE) ? 'bg-white text-black shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
           Clinical Scientist
        </button>
        <button 
          onClick={() => setTone(STORYTELLER_TONE)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${JSON.stringify(tone) === JSON.stringify(STORYTELLER_TONE) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
           Supportive Storyteller
        </button>
     </div>
  </div>
);

// --- Quiz Data ---
const quizQuestions = [
  { id: 'directness', q: "When a variable increases, how should it be explained?", a: "count increments by 1.", b: "This specific operation is tasked with the duty of increasing count by a single unit.", prop: 'directness', valA: 'high', valB: 'low' },
  { id: 'bluntness', q: "How should the system explain a loop finally ending?", a: "Condition False. Termination.", b: "The checks aren't passing anymore, so the process is going to stop for now.", prop: 'technicalBluntness', valA: 'high', valB: 'low' },
  { id: 'precision', q: "Do you want strictly technical terms or behavior-based descriptions?", a: "Function mutates global state.", b: "This part of the code reaches out and changes things everywhere else.", prop: 'precision', valA: 'high', valB: 'low' },
  { id: 'padding', q: "Should the logs include reassuring phrases when things go well?", a: "Status: Success.", b: "Everything is looking perfect so far, keep up the great work!", prop: 'emotionalPadding', valA: 'off', valB: 'on' },
  { id: 'metaphor', q: "How do you feel about learning via real-world analogies?", a: "Recursive frame stacking.", b: "It's like a set of Russian dolls where each doll contains a smaller version of itself.", prop: 'metaphorTolerance', valA: 'low', valB: 'high' },
  { id: 'authority', q: "How should your mentor guide you through the execution steps?", a: "Execute this line now.", b: "Let's try looking at what happens if we run this line.", prop: 'authority', valA: 'assertive', valB: 'suggestive' },
  { id: 'redundancy', q: "Would you like detailed explanations for even simple operations?", a: "Array sorted.", b: "The array has been sorted by comparing each pair of numbers and swapping them until the order is correct.", prop: 'redundancy', valA: 'low', valB: 'high' },
  { id: 'errorTone', q: "If a variable is missing, how should the fault be reported?", a: "Variable 'y' is undefined. ABORT.", b: "I can't seem to find a variable named 'y' anywhere in our notes.", prop: 'errorTone', valA: 'direct', valB: 'soft' },
  { id: 'conversational', q: "Do you prefer a clinical analyzer or a conversational tutor?", a: "Visualizer Ready.", b: "Hello! I've prepared the workspace for you to explore.", prop: 'conversational', valA: 'off', valB: 'on' },
  { id: 'density', q: "How much context do you want provided per logic branch?", a: "Branch A: Taken.", b: "Since the first check was true, the code is now following the instructions inside Branch A.", prop: 'density', valA: 'compact', valB: 'dense' },
];

const QUIZ_INDEX_KEY = 'ct_quiz_index';

const App: React.FC = () => {
  // Persistence Initialization
const [appState, setAppState] = useState<LocalAppState>(() => {
  const hasActiveTab =
    sessionStorage.getItem('ct_active_session') === 'true';

  return hasActiveTab ? 'app' : 'landing';
});

  const [mode, setMode] = useState<AppMode>('visualizer');
  const [focusMode, setFocusMode] = useState<boolean>(() => localStorage.getItem('ct_focus_mode') === 'true');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  
  const [toneProfile, setToneProfile] = useState<ToneProfile>(() => {
    const saved = localStorage.getItem('ct_tone_profile');
    return saved ? JSON.parse(saved) : DEFAULT_TONE;
  });

  const [history, setHistory] = useState<SavedAnalysis[]>(() => {
    const saved = localStorage.getItem('ct_analysis_vault');
    return saved ? JSON.parse(saved) : [];
  });

  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('ct_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(() => {
  const saved = localStorage.getItem(QUIZ_INDEX_KEY);
  const parsed = Number(saved);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  
  // Controlled Login State
  const [loginName, setLoginName] = useState('');

  const [loadedAnalysis, setLoadedAnalysis] = useState<SavedAnalysis | null>(null);

  // Sync state to localStorage
  useEffect(() => {localStorage.setItem(QUIZ_INDEX_KEY, String(currentQuizIndex));}, [currentQuizIndex]);
  useEffect(() => { localStorage.setItem('ct_focus_mode', String(focusMode)); }, [focusMode]);
  useEffect(() => { localStorage.setItem('ct_tone_profile', JSON.stringify(toneProfile)); }, [toneProfile]);
  useEffect(() => { localStorage.setItem('ct_analysis_vault', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('ct_user_session', JSON.stringify(session)); }, [session]);

  const handleModeChange = (newMode: AppMode) => setMode(newMode);
  const handleQuizAnswer = (prop: string, value: string) => {
  setToneProfile(prev => ({ ...prev, [prop]: value }));
  if (currentQuizIndex < quizQuestions.length - 1) {
    setCurrentQuizIndex(prev => prev + 1);
  } else {
    localStorage.removeItem('ct_quiz_index');
    setCurrentQuizIndex(0);
    setAppState('results');
  }
};

  const handleRestartSetup = () => {
  setToneProfile(DEFAULT_TONE);
  setCurrentQuizIndex(0);
  setAppState('setup');
  setIsSettingsOpen(false);
};


  const handleExitSession = () => {
  sessionStorage.removeItem('ct_active_session');
  localStorage.removeItem('ct_analysis_vault');
  localStorage.removeItem('ct_tone_profile');
  localStorage.removeItem('ct_user_session');
  localStorage.removeItem('ct_resume_available');

  setHistory([]);
  setSession(null);
  setDemoMode(false);
  setLoadedAnalysis(null);

  setAppState('landing');
};

const startApp = (isDemo = false) => {
  if (isDemo) {
    sessionStorage.setItem('ct_active_session', 'true');
    localStorage.setItem('ct_resume_available', 'true');
    setDemoMode(true);
    setAppState('app');
  } else {
    localStorage.removeItem('ct_resume_available'); 
    setAppState('login');
  }
};
  const handleNeuralLink = () => {
    const newSession: UserSession = {
      isLinked: true,
      username: loginName || 'Guest User',
      lastLogin: Date.now()
    };
    setSession(newSession);
    setAppState('setup');
  };

  const handleSaveAnalysis = (analysis: SavedAnalysis) => setHistory(prev => [analysis, ...prev]);
  const handleDeleteHistory = (id: string) => setHistory(prev => prev.filter(h => h.id !== id));

  // --- Main View Logic ---

  if (appState === 'landing') {
    const canResume =
    localStorage.getItem('ct_resume_available') === 'true';
    return (
      <div className="min-h-screen bg-[#110f24] text-white flex flex-col relative overflow-x-hidden selection:bg-pink-500/30">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-pink-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>
        
        <Navbar 
          mode={mode} 
          focusMode={focusMode} 
          isApp={false} 
          demoMode={demoMode} 
          username={session?.username || ''}
          onExit={handleExitSession}
          onModeChange={handleModeChange}
          onOpenVault={() => setIsVaultOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          setFocusMode={setFocusMode}
          startApp={startApp}
        />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-12 py-12 sm:py-24 lg:py-16 z-10">
          <div className="max-w-[1400px] w-full grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="flex flex-col text-center lg:text-left">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-950/40 border border-indigo-500/30 rounded-full shadow-2xl animate-fade-in-down mx-auto lg:mx-0 mb-6 sm:mb-10">
                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-ping"></div>
                 <span className="text-[7px] sm:text-[10px] font-pixel-bold text-indigo-300 uppercase tracking-[0.2em] sm:tracking-[0.3em]">A Workspace for Understanding Code</span>
              </div>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-pixel-bold leading-tight sm:leading-none tracking-tight text-white uppercase animate-fade-in-up mb-6 sm:mb-10">
                See <br />
                code <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-indigo-400 to-cyan-500 animate-text-glow">run.</span>
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-slate-400 font-pixel leading-relaxed max-w-xl opacity-90 animate-fade-in-up mx-auto lg:mx-0 mb-8 sm:mb-10">
                See execution step by step, understand data flow, and learn through explanations that fit your learning style.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-fade-in-up justify-center lg:justify-start">
               <button
                  onClick={() => {
                    if (canResume) {
                      sessionStorage.setItem('ct_active_session', 'true');
                      setAppState('app');
                    } else {
                      startApp(false);
                    }
                  }}
                  className="pixel-btn px-6 sm:px-10 py-3.5 sm:py-5 bg-white text-black font-pixel-bold text-xs sm:text-lg uppercase tracking-widest hover:bg-pink-500 hover:text-white flex items-center justify-center gap-3 sm:gap-4 group"
                >
                  {canResume ? 'Resume Learning' : 'Start Learning'}
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </button>

                <button onClick={() => startApp(true)} className="pixel-btn px-6 sm:px-10 py-3.5 sm:py-5 bg-slate-900 text-slate-300 border-slate-700 font-pixel-bold text-xs sm:text-lg uppercase tracking-widest hover:bg-indigo-900 hover:text-white">
                  Try a Demo
                </button>
              </div>
            </div>
            <div className="relative hidden lg:block animate-fade-in-up">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse"></div>
                <div className="relative bg-slate-900 border-4 border-black p-4 rounded-xl shadow-[20px_20px_0_0_#000] rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/50"></div><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div><div className="w-3 h-3 rounded-full bg-green-500/50"></div></div>
                        <div className="text-[10px] font-mono text-slate-600 uppercase">Live Trace Active</div>
                    </div>
                    <div className="space-y-4 font-mono text-sm p-4">
                        <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded">
                           <div className="text-[10px] text-indigo-400 mb-2 font-bold uppercase tracking-widest">Current Execution</div>
                           <div className="text-white">SORT_ALGORITHM.js</div>
                           <div className="text-slate-500 text-[10px] mt-1 italic">Active Step: 14</div>
                        </div>
                        <div className="mt-8 p-6 bg-black/60 border-2 border-white/5 rounded-lg">
                            <div className="flex items-center gap-3 mb-4"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div><span className="text-[10px] font-pixel-bold text-emerald-400 uppercase">Learning Insight</span></div>
                            <p className="text-slate-300 font-pixel text-xl italic">"Notice how the variable values shift as the loop processes each array index."</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        

        {/* ================= MODULE SHOWCASE ================= */}
        <section className="relative py-20 sm:py-40 z-10 bg-[#0a0a0f] border-y-4 border-black overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="text-center mb-16 sm:mb-24">
              <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[8px] sm:text-[10px] font-pixel-bold text-indigo-400 uppercase tracking-widest mb-8">Visual Code Analysis</div>
              <h2 className="text-3xl sm:text-6xl lg:text-7xl font-pixel-bold uppercase text-white mb-6">Module <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-indigo-400 to-cyan-500 animate-text-glow">Showcase</span></h2>
              <p className="text-slate-400 font-pixel text-lg sm:text-2xl max-w-2xl mx-auto">Explore the high-fidelity tools used to deconstruct your logic.</p>
            </div>

            {/* Carousel with hidden scrollbar */}
            <div className="flex overflow-x-auto gap-6 sm:gap-12 pb-12 snap-x snap-mandatory px-4 no-scrollbar scroll-smooth">
              
              {/* Feature 1: Execution Trace */}
              <div className="snap-center shrink-0 w-[280px] sm:w-[550px] group">
                <div className="pixel-card bg-slate-900/40 backdrop-blur-md border-slate-700 p-6 sm:p-10 shadow-[6px_6px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] transition-all group-hover:-translate-y-2 sm:group-hover:-translate-y-4 rounded-2xl sm:rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_#ec4899]"></div>
                        <span className="text-[8px] sm:text-[10px] font-pixel-bold text-pink-400 uppercase tracking-widest">Execution_Trace</span>
                     </div>
                     <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono">STEP_BY_STEP</span>
                  </div>
                  <div className="aspect-video bg-black/80 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6 font-mono text-[9px] sm:text-xs overflow-hidden">
                    <div className="opacity-40">01 function process() </div>
                    <div className="bg-pink-500/20 border-l-2 sm:border-l-4 border-pink-500 px-2 py-1 text-white">02   let result = 100;</div>
                    <div className="opacity-40 mt-1">03   return result;</div>
                    <div className="mt-6 sm:mt-8 pt-4 border-t border-white/5">
                        <div className="text-[7px] sm:text-[10px] text-pink-500 font-bold uppercase mb-2">Tutor_Insight</div>
                        <p className="text-slate-300 italic text-[10px] sm:text-sm">"Initialization of the result variable is complete."</p>
                    </div>
                  </div>
                  <h3 className="mt-6 sm:mt-8 text-lg sm:text-2xl font-pixel-bold text-white uppercase">Live Playback</h3>
                  <p className="mt-2 text-slate-400 font-pixel text-sm sm:text-lg">Watch execution pulse line-by-line as data flows through your source.</p>
                </div>
              </div>

              {/* Feature 2: Memory Stack */}
              <div className="snap-center shrink-0 w-[280px] sm:w-[550px] group">
                <div className="pixel-card bg-slate-900/40 backdrop-blur-md border-slate-700 p-6 sm:p-10 shadow-[6px_6px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] transition-all group-hover:-translate-y-2 sm:group-hover:-translate-y-4 rounded-2xl sm:rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
                        <span className="text-[8px] sm:text-[10px] font-pixel-bold text-cyan-400 uppercase tracking-widest">Memory_Stack</span>
                     </div>
                     <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono">STATE_SYNC</span>
                  </div>
                  <div className="aspect-video bg-black/80 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6 flex flex-wrap content-start gap-2 sm:gap-4">
                     <div className="p-2 sm:p-3 border sm:border-2 border-cyan-500 bg-cyan-900/20 text-center rounded-lg w-20 sm:w-28">
                        <div className="text-[7px] sm:text-[8px] text-cyan-400 font-bold mb-1">VAR_X</div>
                        <div className="text-white font-mono text-sm sm:text-xl">42</div>
                     </div>
                     <div className="p-2 sm:p-3 border sm:border-2 border-slate-700 opacity-40 text-center rounded-lg w-20 sm:w-28">
                        <div className="text-[7px] sm:text-[8px] text-slate-500 font-bold mb-1">VAR_Y</div>
                        <div className="text-slate-500 font-mono text-sm sm:text-xl">null</div>
                     </div>
                  </div>
                  <h3 className="mt-6 sm:mt-8 text-lg sm:text-2xl font-pixel-bold text-white uppercase">State Matrix</h3>
                  <p className="mt-2 text-slate-400 font-pixel text-sm sm:text-lg">Persistent monitoring that visualizes variable mutations in the memory stack.</p>
                </div>
              </div>

              {/* Feature 3: Logic Mapping */}
              <div className="snap-center shrink-0 w-[280px] sm:w-[550px] group">
                <div className="pixel-card bg-slate-900/40 backdrop-blur-md border-slate-700 p-6 sm:p-10 shadow-[6px_6px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] transition-all group-hover:-translate-y-2 sm:group-hover:-translate-y-4 rounded-2xl sm:rounded-3xl overflow-hidden">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#f97316]"></div>
                        <span className="text-[8px] sm:text-[10px] font-pixel-bold text-orange-400 uppercase tracking-widest">Logic_Flow</span>
                     </div>
                     <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono">AUTO_TOPOLOGY</span>
                  </div>
                  <div className="aspect-video bg-black/80 rounded-xl sm:rounded-2xl border border-white/5 p-4 sm:p-6 flex flex-col items-center justify-center gap-2">
                     <div className="px-3 sm:px-4 py-1 border border-orange-500/40 rounded text-[8px] sm:text-[10px]">main()</div>
                     <div className="w-px h-3 sm:h-4 bg-orange-500/20"></div>
                     <div className="px-3 sm:px-4 py-1 border-2 border-orange-500 bg-orange-950/20 rounded text-[8px] sm:text-[10px]">loop(i &lt; n)</div>
                  </div>
                  <h3 className="mt-6 sm:mt-8 text-lg sm:text-2xl font-pixel-bold text-white uppercase">Topology Map</h3>
                  <p className="mt-2 text-slate-400 font-pixel text-sm sm:text-lg">Automatically compile raw source code into high-fidelity logic flowcharts.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= CALIBRATION LAB ================= */}
        <section className="relative py-20 sm:py-40 z-10 bg-slate-950 border-b-4 border-black">
          <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-block px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-md text-[8px] sm:text-[10px] font-pixel-bold text-pink-400 uppercase tracking-widest mb-6 sm:mb-10">Neural Tuning</div>
              <h2 className="text-3xl sm:text-6xl font-pixel-bold leading-tight text-white uppercase mb-6 sm:mb-8">The Calibration <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-500">Hub</span></h2>
              <p className="text-slate-400 font-pixel text-lg sm:text-2xl leading-relaxed max-w-xl mb-8 sm:mb-12">
                Our 10-point calibration quiz creates a unique "Logic Persona" that dictates how our AI communicates with you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-md">
                <div className="p-4 sm:p-6 bg-slate-900 border-2 border-black rounded-xl hover:-translate-y-1 transition-transform">
                  <div className="text-indigo-400 font-pixel-bold text-sm sm:text-lg mb-2 uppercase">NERD MODE</div>
                  <p className="text-slate-500 font-pixel text-sm sm:text-base">Direct technical jargon and clinical analysis.</p>
                </div>
                <div className="p-4 sm:p-6 bg-slate-900 border-2 border-black rounded-xl hover:-translate-y-1 transition-transform">
                  <div className="text-emerald-400 font-pixel-bold text-sm sm:text-lg mb-2 uppercase">HUMAN MODE</div>
                  <p className="text-slate-500 font-pixel text-sm sm:text-base">Conversational and supportive analogies.</p>
                </div>
              </div>
            </div>
            <div className="relative group">
                <div className="absolute inset-0 bg-pink-600/10 blur-[100px] group-hover:bg-pink-600/20 transition-all"></div>
                <div className="relative pixel-card bg-slate-900 p-6 sm:p-12 shadow-[8px_8px_0_0_#000] sm:shadow-[12px_12px_0_0_#000]">
                   <h3 className="text-slate-300 font-bold text-lg sm:text-3xl text-center mb-6 sm:mb-10">How should the system explain a loop finally ending?</h3>
                   <div className="space-y-4 sm:space-y-6">
                      <div className="p-4 sm:p-6 bg-black/40 border sm:border-2 border-white/5 hover:border-pink-500 transition-all cursor-pointer group/opt">
                        <p className="text-slate-400 font-pixel text-lg sm:text-xl group-hover/opt:text-white transition-colors">"Condition False. Termination."</p>
                      </div>
                      <div className="p-4 sm:p-6 bg-black/40 border sm:border-2 border-white/5 hover:border-cyan-500 transition-all cursor-pointer group/opt">
                        <p className="text-slate-400 font-pixel text-lg sm:text-xl group-hover/opt:text-white transition-colors">"The checks aren't passing anymore, so the process is going to stop for now."</p>
                      </div>
                   </div>
                   <div className="mt-8 sm:mt-10 flex justify-center gap-2">
                      {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${i === 2 ? 'bg-pink-500' : 'bg-slate-700'}`}></div>)}
                   </div>
                </div>
            </div>
          </div>
        </section>

        {/* ================= GLOBAL TUTOR ================= */}
        <section className="relative py-20 sm:py-40 z-10 bg-[#0a0a0f] overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col items-center">
            <div className="text-center max-w-4xl mb-16 sm:mb-24">
              <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[8px] sm:text-[10px] font-pixel-bold text-cyan-400 uppercase tracking-widest mb-6 sm:mb-10">Multilingual Ecosystem</div>
              <h2 className="text-3xl sm:text-7xl font-pixel-bold text-white uppercase mb-6 sm:mb-8">Learn in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Language</span></h2>
              <p className="text-slate-400 font-pixel text-lg sm:text-2xl leading-relaxed">CodeTutor supports native translations for 8+ major languages, including RTL support for Arabic and Urdu.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-12 w-full max-w-5xl mb-12 sm:mb-20">
              {['English', 'Indonesian', 'Arabic', 'Urdu', 'Spanish', 'French', 'Hindi', 'Chinese'].map((lang, i) => (
                <div key={i} className="pixel-card bg-slate-900/50 p-4 sm:p-6 flex items-center justify-center group hover:border-cyan-500 transition-all cursor-default">
                  <span className="text-slate-400 font-pixel text-lg sm:text-xl uppercase tracking-widest group-hover:text-white">{lang}</span>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-12 bg-slate-900 border-2 sm:border-4 border-black rounded-2xl sm:rounded-3xl relative max-w-3xl w-full shadow-[10px_10px_0_0_#000] sm:shadow-[20px_20px_0_0_#000]">
               <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-lg shrink-0">🌍</div>
                    <div>
                      <div className="text-[7px] sm:text-[10px] font-pixel-bold text-slate-500 mb-1 sm:mb-2 uppercase">Input_Source</div>
                      <div className="text-white font-mono text-[10px] sm:text-sm tracking-tighter">fibonacci.py</div>
                    </div>
                  </div>
                  <div className="h-px bg-slate-800"></div>
                  <div className="text-right">
                    <div className="text-[7px] sm:text-[10px] font-pixel-bold text-cyan-400 mb-1 sm:mb-2 uppercase">Translator_Output (AR)</div>
                    <p className="text-slate-300 text-lg sm:text-2xl font-sans" dir="rtl">هنا نرى كيف تتغير قيمة المتغير في كل دورة من حلقات التكرار.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <MasterFooter focusMode={focusMode} mode={mode} onNavigate={handleModeChange} onRestart={handleRestartSetup} onOpenVault={() => setIsVaultOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)} onHome={handleExitSession} />
      </div>
    );
  }

  if (appState === 'login' || appState === 'setup' || appState === 'results') {
    return (
      <div className="min-h-screen bg-[#110f24] text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {appState === 'setup' && (
          <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-slate-900 border-b border-black z-[110]">
            <div className="h-full bg-pink-500 shadow-[0_0_15px_#ec4899] transition-all duration-700" style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }} />
          </div>
        )}
        <button onClick={handleExitSession} className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors uppercase font-pixel text-xs sm:text-sm z-50"><span>←</span> Back to Home</button>
        <div className="max-w-4xl w-full z-10 animate-fade-in-up">
          {appState === 'login' && (
            <div className="bg-slate-900 p-6 sm:p-20 border-2 sm:border-4 border-black shadow-[8px_8px_0_0_#000] sm:shadow-[12px_12px_0_0_#000] text-center space-y-8 sm:space-y-12">
              <h2 className="text-2xl sm:text-4xl font-pixel-bold uppercase">User Login</h2>
              <div className="p-4 sm:p-8 bg-black/40 border sm:border-2 border-white/5 rounded-lg space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-pixel-bold text-slate-500 uppercase tracking-widest mb-2 text-left">Your Username</label>
                  <input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="Enter your name..." className="w-full p-3 sm:p-4 bg-black border-2 border-slate-700 text-white font-pixel text-xl sm:text-2xl outline-none focus:border-indigo-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <button onClick={handleNeuralLink} className="pixel-btn px-6 py-3 sm:py-4 bg-white text-black font-pixel-bold text-xs sm:text-base uppercase">Start Session</button>
                  <button onClick={() => startApp(true)} className="pixel-btn px-6 py-3 sm:py-4 bg-slate-900 text-slate-300 font-pixel-bold text-xs sm:text-base uppercase">Try a Demo</button>
                </div>
              </div>
            </div>
          )}
          {appState === 'setup' && (
            <div className="bg-slate-900 p-6 sm:p-12 border-2 sm:border-4 border-black shadow-[8px_8px_0_0_#000] sm:shadow-[12px_12px_0_0_#000] space-y-8 sm:space-y-12">
              <h3 className="text-xl sm:text-4xl text-center font-bold">{quizQuestions[currentQuizIndex].q}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <button onClick={() => handleQuizAnswer(quizQuestions[currentQuizIndex].prop, quizQuestions[currentQuizIndex].valA)} className="p-6 sm:p-10 bg-black/40 border sm:border-2 hover:border-pink-500 transition-all text-xs sm:text-base leading-relaxed">"{quizQuestions[currentQuizIndex].a}"</button>
                <button onClick={() => handleQuizAnswer(quizQuestions[currentQuizIndex].prop, quizQuestions[currentQuizIndex].valB)} className="p-6 sm:p-10 bg-black/40 border sm:border-2 hover:border-cyan-500 transition-all text-xs sm:text-base leading-relaxed">"{quizQuestions[currentQuizIndex].b}"</button>
              </div>
            </div>
          )}
          {appState === 'results' && (
            <div className="bg-slate-900 p-10 sm:p-20 border-2 sm:border-4 border-black shadow-[10px_10px_0_0_#000] sm:shadow-[16px_16px_0_0_#000] text-center space-y-10 sm:space-y-16">
              <h2 className="text-3xl sm:text-5xl font-pixel-bold uppercase">Profile Ready</h2>
              <button
                onClick={() => {
                  sessionStorage.setItem('ct_active_session', 'true');
                  localStorage.setItem('ct_resume_available', 'true');
                  setAppState('app');
                }}
                className="pixel-btn w-full py-6 sm:py-8 bg-white text-black font-pixel-bold text-xl sm:text-3xl uppercase"
              >
                Open Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Final App View
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-700 ${focusMode ? 'bg-[#0f172a]' : 'bg-[#110f24]'} text-slate-200 overflow-x-hidden`}>
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} tone={toneProfile} setTone={setToneProfile} onRestartSetup={handleRestartSetup} focusMode={focusMode} />
    {isVaultOpen && (
  <AnalysisVault
    history={history}
    onLoad={(analysis) => {
      sessionStorage.setItem('ct_active_session', 'true');
      localStorage.setItem('ct_resume_available', 'true');

      setMode(analysis.mode);
      setLoadedAnalysis(analysis);
      setIsVaultOpen(false);
      setAppState('app');
    }}
    onDelete={handleDeleteHistory}
    onClose={() => setIsVaultOpen(false)}
    setToneProfile={setToneProfile}
    focusMode={focusMode}
  />
)}
      <Navbar 
        mode={mode} 
        focusMode={focusMode} 
        isApp={true} 
        demoMode={demoMode} 
        username={session?.username || 'GUEST_USER'}
        onExit={handleExitSession}
        onModeChange={handleModeChange}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        setFocusMode={setFocusMode}
        startApp={startApp}
      />

      {demoMode && <DemoToneController tone={toneProfile} setTone={setToneProfile} />}

      <main className="flex-1 pt-4 sm:pt-8 pb-32">
        <CodeAnalyzer
         mode={mode}
         focusMode={focusMode}
         demoMode={demoMode}
         toneProfile={toneProfile}
         loadedAnalysis={loadedAnalysis}
         onConsumeLoadedAnalysis={() => setLoadedAnalysis(null)}
         onOpenSettings={() => setIsSettingsOpen(true)}
         onSaveAnalysis={handleSaveAnalysis}
        />

      </main>

      <MasterFooter focusMode={focusMode} mode={mode} onNavigate={handleModeChange} onRestart={handleRestartSetup} onOpenVault={() => setIsVaultOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)} onHome={handleExitSession} />
    </div>
  );
};

export default App;
