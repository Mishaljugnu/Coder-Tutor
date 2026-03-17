// ----------------------------
// Supported languages & app modes
// ----------------------------
export type SupportedLanguage = 'javascript' | 'python';
export type AppMode = 'visualizer' | 'learner';
export type AppState = 'landing' | 'login' | 'setup' | 'results' | 'app';

// ----------------------------
// Code execution / animation structures
// ----------------------------
export interface VariableState {
  [key: string]: string;
}

export interface AnimationStep {
  step: number;
  line: number;
  event: 'start' | 'assign' | 'call' | 'return' | 'condition' | 'loop' | 'print' | 'end' | 'error';
  variables: VariableState;
  stack: string[];
  explanation: string;
  hudMessage?: string;
  mentalModelTip?: string;
  output?: string;
}

export interface AnalysisResult {
  language: SupportedLanguage;
  summary: string;
  flowchart?: string;
  steps: AnimationStep[];
}

// ----------------------------
// Learner mode structures
// ----------------------------
export interface ConceptBlock {
  title: string;
  description: string;
  type: 'concept' | 'state' | 'logic';
  imageUrl?: string; // AI-generated visual metaphor
}

export interface Replacement {
  title: string;
  codeSnippet: string;
  explanation: string;
}

export interface TimelineState {
  step: number;
  label: string;
  valueChange: string;
  codeSnippet: string;
  detailedExplanation: string;
  purpose: string;
  alternatives: Replacement | null;
}

export interface LearnerProfile {
  language: SupportedLanguage;
  concepts: ConceptBlock[];
  timeline: TimelineState[];
  deepExplanation: {
    what: string;
    why: string;
    connectivity: string;
  };
}

// ----------------------------
// Tone profile & defaults
// ----------------------------
export interface ToneProfile {
  directness: 'high' | 'low';
  technicalBluntness: 'high' | 'low';
  precision: 'high' | 'low';
  emotionalPadding: 'on' | 'off';
  metaphorTolerance: 'high' | 'low';
  authority: 'assertive' | 'suggestive';
  redundancy: 'high' | 'low';
  errorTone: 'direct' | 'soft';
  conversational: 'on' | 'off';
  density: 'compact' | 'dense';
}

export const DEFAULT_TONE: ToneProfile = {
  directness: 'high',
  technicalBluntness: 'high',
  precision: 'high',
  emotionalPadding: 'off',
  metaphorTolerance: 'low',
  authority: 'assertive',
  redundancy: 'low',
  errorTone: 'direct',
  conversational: 'off',
  density: 'compact'
};

export const SCIENTIST_TONE: ToneProfile = {
  directness: 'high',
  technicalBluntness: 'high',
  precision: 'high',
  emotionalPadding: 'off',
  metaphorTolerance: 'low',
  authority: 'assertive',
  redundancy: 'low',
  errorTone: 'direct',
  conversational: 'off',
  density: 'compact'
};

export const STORYTELLER_TONE: ToneProfile = {
  directness: 'low',
  technicalBluntness: 'low',
  precision: 'low',
  emotionalPadding: 'on',
  metaphorTolerance: 'high',
  authority: 'suggestive',
  redundancy: 'high',
  errorTone: 'soft',
  conversational: 'on',
  density: 'dense'
};

// ----------------------------
// Saved analysis / session
// ----------------------------
export interface SavedAnalysis {
  id: string;
  timestamp: number;
  code: string;
  language: SupportedLanguage;
  mode: AppMode;
  tone: ToneProfile; // full tone profile persisted
  visualizerData?: AnalysisResult;
  learnerData?: LearnerProfile;
}

export interface UserSession {
  isLinked: boolean;
  username: string;
  lastLogin: number;
}
