import React, { useState, useRef, useEffect } from 'react';
import { AppMode } from '../types';

interface MenuDropdownProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
  isDemo: boolean;
  username: string;
  focusMode: boolean;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ 
  currentMode, 
  onModeChange, 
  onOpenVault, 
  onOpenSettings, 
  onExit,
  isDemo,
  username,
  focusMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (fn: () => void) => {
    fn();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Session Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border-2 transition-all duration-300 group
          ${isOpen 
            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
            : (focusMode 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-300')
          }`}
      >
        <div className="relative">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          {isDemo && <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_5px_#eab308]"></span>}
        </div>
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden xs:block`}>
          {isDemo ? 'Demo Mode' : (username || 'Account')}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-14 w-64 sm:w-72 overflow-hidden z-[100] animate-fade-in-down origin-top-right
          ${focusMode ? 'bg-[#0f172a] border border-slate-700' : 'bg-[#1e293b] border-2 border-slate-800 shadow-2xl rounded-xl'}`}>
          
           {/* Header Info */}
           <div className={`px-6 py-4 border-b ${focusMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-900/50 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-1">
                 <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${isDemo ? 'text-yellow-500' : 'text-cyan-500'}`}>
                    {isDemo ? 'SANDBOX_SIMULATION' : 'SESSION_ACTIVE'}
                 </span>
                 <span className="text-[8px] text-slate-500 font-mono">v2.0.4</span>
              </div>
              <div className={`font-pixel text-lg sm:text-xl truncate ${focusMode ? 'text-slate-200' : 'text-white'}`}>
                {username}
              </div>
           </div>

           <div className="p-2 space-y-1">
             {/* Tools */}
             <button 
               onClick={() => handleAction(onOpenVault)}
               className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-slate-800 transition-colors"
             >
                <span className="text-xl opacity-60">💾</span>
                <div className="text-xs font-bold text-slate-300">Execution History</div>
             </button>

             <button 
               onClick={() => handleAction(onOpenSettings)}
               className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-slate-800 transition-colors"
             >
                <span className="text-xl opacity-60">⚙️</span>
                <div className="text-xs font-bold text-slate-300">Personalization</div>
             </button>

             <div className="h-px bg-slate-800 my-1 mx-2"></div>

             {/* Navigation */}
             <button 
               onClick={() => handleAction(onExit)}
               className={`w-full text-left px-4 py-4 flex items-center gap-3 rounded-lg transition-colors group
                 ${isDemo ? 'hover:bg-yellow-900/20' : 'hover:bg-red-900/20'}`}
             >
                <span className={`text-xl group-hover:scale-110 transition-transform`}>
                    {isDemo ? '🚪' : '🛑'}
                </span>
                <div className="flex-1">
                    <div className={`text-xs font-black uppercase tracking-widest ${isDemo ? 'text-yellow-500' : 'text-red-500'}`}>
                        {isDemo ? 'Exit Demo' : 'End Session'}
                    </div>
                    <div className="text-[8px] text-slate-500 uppercase">Return to Main Hub</div>
                </div>
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MenuDropdown;
