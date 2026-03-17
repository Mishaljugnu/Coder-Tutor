
import { AnimationStep, SupportedLanguage, VariableState } from "../types";

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  pyodideInstance = await window.loadPyodide();
  return pyodideInstance;
}

const STEP_LIMIT = 500;

export async function traceJavaScript(code: string): Promise<AnimationStep[]> {
  const steps: AnimationStep[] = [];
  let lastLineReached = 1;
  
  const _pushStep = (line: number, vars: any, event: string = 'step') => {
    if (steps.length >= STEP_LIMIT) return;
    lastLineReached = line;
    const sanitized: VariableState = {};
    for (const [k, v] of Object.entries(vars)) {
      if (typeof v !== 'function' && k !== '_pushStep' && k !== 'locals') {
        try {
          if (v === undefined) sanitized[k] = "undefined";
          else if (v === null) sanitized[k] = "null";
          else if (v === "uninitialized") sanitized[k] = "uninitialized";
          else sanitized[k] = (typeof v === 'object') ? JSON.stringify(v) : String(v);
        } catch (e) {
          sanitized[k] = "[Complex State]";
        }
      }
    }
    steps.push({
      step: steps.length + 1,
      line,
      event: event as any,
      variables: sanitized,
      stack: [],
      explanation: "Tracing execution..." 
    });
  };

  try {
    // 1. Syntax check
    try {
      new Function(code);
    } catch (syntaxErr: any) {
      return [{
        step: 1,
        line: syntaxErr.lineNumber || 1,
        event: 'error',
        variables: {},
        stack: [],
        explanation: `Syntax Error: ${syntaxErr.message}`
      }];
    }
    
    // 2. Instrument lines
    const lines = code.split('\n');
    const instrumented = lines.map((l, i) => {
      const lineNum = i + 1;
      const t = l.trim();
      if (!t || t.startsWith('//')) return l;
      const identifierRegex = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
      const reserved = new Set(['let','var','const','if','for','while','return','function','switch','case','break','continue','catch','try','else','new']);

      const names = Array.from(new Set(
  (t.match(identifierRegex) || []).filter(n => !reserved.has(n))));

      
      // Use a self-invoking function with try-catch for each variable to avoid TDZ (Temporal Dead Zone) errors
      const varsToTrack =
  names.length > 0
    ? `(() => {
        const __v = {};
        ${names
          .map(
            n => `
        try {
          if (${n} !== undefined) __v["${n}"] = ${n};
        } catch (e) {}
        `
          )
          .join('\n')}
        return __v;
      })()`
    : '{}';


      if (t.startsWith('return ')) return `_pushStep(${lineNum}, ${varsToTrack}, 'return'); ${l}`;
      if (t.match(/^(if|for|while|switch|case|catch)/)) return `_pushStep(${lineNum}, ${varsToTrack}, 'condition'); ${l}`;
      
      // Mark start of line, execute line, then mark assignment/completion
    return `
${l}
_pushStep(${lineNum}, ${varsToTrack}, 'assign');
`;
    }).join('\n');

    const runner = new Function(
  '_pushStep',
  `return (async () => {
    let lastLineReached = 1;
    try {
      ${instrumented}
    } catch (runtimeErr) {
      runtimeErr._line = lastLineReached;
      throw runtimeErr;
    }
  })();`
);

try {
  await runner(_pushStep);
} catch (runtimeErr: any) {
      const errorLine = runtimeErr._line || lastLineReached || 1;
      steps.push({
        step: steps.length + 1,
        line: errorLine, 
        event: 'error',
        variables: steps.length > 0 ? steps[steps.length - 1].variables : {},
        stack: [],
        explanation: `Runtime Error: ${runtimeErr.message}`
      });
    }
    
    if (steps.length === 0) _pushStep(1, {}, 'start');
    return steps;
  } catch (criticalErr: any) {
    return [{
      step: 1,
      line: 1,
      event: 'error',
      variables: {},
      stack: [],
      explanation: `Critical Engine Fault: ${criticalErr.message}`
    }];
  }
}

export async function tracePython(code: string): Promise<AnimationStep[]> {
  try {
    const py = await getPyodide();
    const wrapper = `
import sys
import json

class Tracer:
    def __init__(self, limit):
        self.steps = []
        self.limit = limit
        self.last_vars = {}
        self.last_line = 1
    
    def trace(self, frame, event, arg):
    if len(self.steps) >= self.limit:
        return None

    if frame.f_code.co_filename == '<string>' and event in ('call', 'line'):
        v = {}
            for k, val in frame.f_locals.items():
    if k in ['sys', 'json', 't', 'Tracer', 'res', '__builtins__']:
        continue
    if not k.startswith('__') and not hasattr(val, '__call__'):
        try:
    v[k] = json.dumps(val)
except Exception:
    v[k] = str(val)
            self.last_vars = v
            self.last_line = frame.f_lineno
            self.steps.append({"line": frame.f_lineno, "vars": v})
        return self.trace

t = Tracer(${STEP_LIMIT})
sys.settrace(t.trace)
try:
    exec(${JSON.stringify(code)})
    res = {"s": True, "steps": t.steps}
except Exception as e:
    res = {"s": False, "e": str(e), "l": getattr(e, 'lineno', t.last_line), "steps": t.steps, "last_v": t.last_vars}
sys.settrace(None)
json.dumps(res)
    `;
    const raw = await py.runPythonAsync(wrapper);
    const data = JSON.parse(raw);
    
    const steps: AnimationStep[] = (data.steps || []).map((s: any, i: number) => ({
      step: i + 1,
      line: s.line,
      event: 'assign',
      variables: s.vars,
      stack: [],
      explanation: "Logic verification..."
    }));

    if (!data.s) {
      steps.push({
        step: steps.length + 1,
        line: data.l,
        event: 'error',
        variables: data.last_v || {},
        stack: [],
        explanation: `Python Error: ${data.e}`
      });
    }

    return steps;
  } catch (err: any) {
    return [{ step: 1, line: 1, event: 'error', variables: {}, stack: [], explanation: `Python Engine Fault: ${err.message}` }];
  }
}
