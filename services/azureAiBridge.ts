
export function getStrictToneProtocol(t: any): string {
  return `
TONE ENFORCEMENT RULES (MANDATORY — NO EXCEPTIONS):

These rules apply ONLY to human-readable string fields:
- summary
- explanation
- hudMessage
- mentalModelTip
- description
- detailedExplanation
- purpose
- deepExplanation.what
- deepExplanation.why
- deepExplanation.connectivity

MODE DEFINITIONS:

SCIENTIST MODE (COLD TERMINAL):
Activated when precision=high OR technicalBluntness=high.

- ACT AS A COLD TERMINAL.
- Use zero adjectives unless strictly technical.
- Use formal computer science terminology.
- Prefer terms like: L-Value, R-Value, call stack, heap, stack frame, O-Notation.
- Use short, declarative sentences.
- NO metaphors.
- NO encouragement.
- NO reassurance.
- NO first-person language.

STORYTELLER MODE (SUPPORTIVE TUTOR):
Activated when emotionalPadding=on OR conversational=on.

- ACT AS A STORYTELLER AND TEACHER.
- NEVER use the words: "index", "iteration", "boolean".
- Replace them with: "position", "round", "yes/no".
- Use analogies freely (boxes, drawers, echoes, nesting dolls).
- Use calm, reassuring language.
- First-person is allowed ("we", "let’s").
- If something is correct, say so reassuringly.

RULE APPLICATION:

DIRECTNESS:
${t.directness === 'high'
  ? '- Be concise. State outcomes directly.'
  : '- Build understanding step by step before conclusions.'}

TECHNICAL LANGUAGE:
${t.technicalBluntness === 'high'
  ? '- Use academic terminology without simplification.'
  : '- Use everyday language. Explain ideas, not jargon.'}

PRECISION:
${t.precision === 'high'
  ? '- Use exact technical phrasing. Metaphors are FORBIDDEN.'
  : '- Prioritize intuition over strict terminology.'}

EMOTIONAL PADDING:
${t.emotionalPadding === 'on'
  ? '- Actively reassure the learner when behavior is correct.'
  : '- Do NOT reassure. State facts only.'}

METAPHORS:
${t.metaphorTolerance === 'high'
  ? `- You MUST teach using a concrete example from the CURRENT CODE.
- The example must reference:
  • a real variable name
  • a real line or step
  • a real value change
- Metaphors without a concrete example are FORBIDDEN.`
  : '- Metaphors are NOT allowed.'}

VOICE:
${t.conversational === 'on'
  ? '- Sound like a patient human tutor.'
  : '- Sound like documentation or a compiler.'}

CRITICAL:
- You MUST follow the active mode.
- Do NOT blend modes.
- Do NOT explain the rules.
- Do NOT add text outside the JSON.
`.trim();
}

// ----------------------------
// Demo mode tone override
// ----------------------------
function applyDemoToneOverride(tone: any, isDemo: boolean) {
  if (!isDemo) return tone;

  if (tone?.emotionalPadding === 'on') {
    return {
      directness: 'low',
      technicalBluntness: 'low',
      precision: 'low',
      emotionalPadding: 'on',
      metaphorTolerance: 'high',
      conversational: 'on',
    };
  }

  return {
    directness: 'high',
    technicalBluntness: 'high',
    precision: 'high',
    emotionalPadding: 'off',
    metaphorTolerance: 'low',
    conversational: 'off',
  };
}



function cleanJsonResponse(content: string): any {
  if (!content) return null;

  try {
    // Try to extract JSON from a markdown block if present
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = content.match(markdownRegex);
    const target = match ? match[1] : content;

    // Locate first { and last } to strip any prefix/suffix text
    const startIdx = target.indexOf('{');
    const endIdx = target.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonCandidate = target.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonCandidate);
    }

    return JSON.parse(target.trim());
  } catch (e) {
    console.error("AI JSON Parsing Error:", e, "Raw Content:", content);
    return { error: "Invalid JSON format", rawContent: content };
  }
}

// ----------------------------
// Core wrapper to call the serverless API
// ----------------------------
export async function analyzeWithAI(messages: any[], targetLanguage: string = 'en') {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, targetLanguage }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("API returned error status:", res.status, text);
      return {
        success: false,
        data: null,
        error: `Server returned ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    console.log("Raw API response:", data);

    // API returned an explicit error
    if (data.error) {
      return {
        success: false,
        data: null,
        error: `AI Error: ${data.error}`,
      };
    }

    // Handle new structure (parsed + raw) from backend
    if (data.parsed) {
      return {
        success: true,
        data: data.parsed,
        raw: data.raw,
        error: null,
      };
    }

   const content =
  data?.content ??
  data?.choices?.[0]?.message?.content ??
  data?.raw?.choices?.[0]?.message?.content;

if (!content) {
  return {
    success: false,
    data: null,
    error: "No content in AI response",
    raw: data,
  };
}


    const parsedData = cleanJsonResponse(content);

    if (parsedData?.error) {
      return {
        success: false,
        data: null,
        error: parsedData.error,
        raw: parsedData.rawContent,
      };
    }

    return {
      success: true,
      data: parsedData,
      raw: data,
      error: null,
    };
  } catch (networkErr: any) {
    console.error("Network or fetch error:", networkErr);
    return {
      success: false,
      data: null,
      error: `Network error: ${networkErr.message || networkErr}`,
    };
  }
}

// ----------------------------
// Main AI analysis functions
// ----------------------------
export async function analyzeCode(
  code: string,
  language: string,
  _isDemo: boolean,
  tone: any,
  targetLanguage: string = 'en',
  trace?: any[]
): Promise<any> {

  // ✅ CORRECT: compute effective tone INSIDE the function
  const effectiveTone = applyDemoToneOverride(tone, _isDemo);

  const traceGuidance = trace 
  ? `An actual execution trace is provided below. Do NOT hallucinate your own steps. Use these specific steps as the basis for your analysis.

CRITICAL CONSTRAINT:
- When TRACE_DATA is provided, the "variables" object in your JSON MUST contain ONLY keys that appear in the provided TRACE_DATA.
- Do NOT infer, add, or rename variables that are not present in TRACE_DATA.

TRACE_DATA:
${JSON.stringify(trace)}`

    : `Perform a logical step-by-step trace of how this code would execute in a standard ${language} environment.`;

  const systemPrompt = `
You are a high-fidelity code execution visualizer. 
FLOWCHART OPTIMIZATION RULES:
- Collapse repeated loop iterations into a single logical path
- Do NOT expand recursive calls fully
- Prefer clarity over exhaustiveness

${traceGuidance}

Your goal is to return a JSON object matching the following structure:
{
  "language": "${language}",
  "summary": "A brief overview of what the code does",
  "steps": [
    {
      "step": number,
      "line": number,
      "event": "start" | "assign" | "call" | "return" | "condition" | "loop" | "print" | "end" | "error",
      "variables": { "varName": "stringRepresentationOfValue" },
      "stack": ["functionName"],
      "explanation": "Human readable explanation of this specific line's logic",
      "hudMessage": "Optional short status message",
      "mentalModelTip": "Optional tip for understanding the concept"
    }
  ]
}
${getStrictToneProtocol(effectiveTone)}
IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting or conversational filler.
`.trim();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Code to narrate:\n\n${code}` }
  ];

  return analyzeWithAI(messages, targetLanguage);
}
export async function analyzeLearnerMode(
  code: string,
  language: string,
  _isDemo: boolean,
  tone: any,
  targetLanguage: string = 'en' 
): Promise<any> {

  // ✅ CORRECT: compute effective tone INSIDE the function
  const effectiveTone = applyDemoToneOverride(tone, _isDemo);

  const systemPrompt = `
You are an expert programming tutor. 
Analyze the provided ${language} code and return a JSON object matching the following structure:
{
  "language": "${language}",
  "concepts": [
    { "title": "Concept Name", "description": "Explanation", "type": "concept" | "state" | "logic" }
  ],
  "timeline": [
    { 
      "step": number, 
      "label": "Brief Title", 
      "valueChange": "Summary of state change", 
      "codeSnippet": "Relevant line of code", 
      "detailedExplanation": "Deep dive into why this happens", 
      "purpose": "The architectural goal of this line",
      "alternatives": { "title": "Refactoring Idea", "codeSnippet": "New Code", "explanation": "Why this is better" } | null
    }
  ],
  "deepExplanation": {
    "what": "Systemic function",
    "why": "Architectural rationale",
    "connectivity": "Conceptual context"
  }
}
${getStrictToneProtocol(effectiveTone)}
IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting or conversational filler.
`.trim();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this ${language} code for a learner:\n\n${code}` }
  ];

  return analyzeWithAI(messages, targetLanguage);
}

// ----------------------------
// Optional placeholders for visual features
// ----------------------------
// ----------------------------
// Optional placeholders for visual features
// ----------------------------
export async function generateFlowchart(
  code: string,
  traceGuidance: string = "",
  targetLanguage: string = "en"
): Promise<string> {

  const systemPrompt = `
You are a high-fidelity code execution visualizer.
${traceGuidance}

MANDATORY:
- Output MUST be valid Mermaid
- Use 'graph TD' as the first line
- Node syntax MUST be: NodeID["Label Text"]
- ALWAYS wrap node labels in double quotes
- NEVER use unquoted parentheses inside labels
- Example: A["fibonacci(5)"]

Return ONLY a JSON object:
{ "flowchart": "mermaid_string_here" }
`.trim();

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: code }
  ];

  const res = await analyzeWithAI(messages, targetLanguage);

  if (!res || !res.success) {
    throw new Error(res?.error || 'Flowchart generation failed');
  }

  const flow = res.data?.flowchart;
  if (!flow || typeof flow !== 'string') {
    throw new Error('Invalid flowchart from AI');
  }

  return flow;
}
