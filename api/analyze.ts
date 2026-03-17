export const runtime = "nodejs";
const AZURE_API_VERSION = "2024-12-01-preview";

/* -------------------------------------------------
   ENGLISH-ONLY tone polish (UI-facing only)
--------------------------------------------------*/
function applyTonePostTranslation(
  text: string,
  toneHint: "supportive" | "clinical"
) {
  if (!text) return text;
  const normalized = text.trim();

  if (toneHint === "supportive") {
  return normalized;
}

  if (toneHint === "clinical") {
    return normalized
      .replace(/^(here['’]s what['’]s happening:|let['’]s see|okay,)/i, "")
      .trim();
  }

  return normalized;
}

/* -------------------------------------------------
   Code-like detector (FIXED – explanation-safe)
--------------------------------------------------*/
function isCodeLike(text: string): boolean {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 15) return true;

  if (/```/.test(t)) return true;
  if (
    /^\s*(const|let|var|function|class|if|for|while|return|import|export)\b/m.test(
      t
    )
  ) {
    return true;
  }

  // Heavy symbol density → real code
  const symbolRatio =
    (t.match(/[{}[\];=<>()]/g)?.length || 0) / t.length;

  return symbolRatio > 0.18;
}

/* -------------------------------------------------
   Recursive collector (REAL mutation, no pass-by-value)
--------------------------------------------------*/
type Collector = { get: () => string; set: (v: string) => void };

function collectTranslatableText(
  node: any,
  collectors: Collector[],
  parent?: any,
  key?: string | number
) {
  if (typeof node === "string") {
    if (!isCodeLike(node) && parent && key !== undefined) {
      collectors.push({
        get: () => parent[key],
        set: (v) => {
          parent[key] = v; 
        },
      });
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectTranslatableText(item, collectors, node, index)
    );
    return;
  }

  if (typeof node === "object" && node !== null) {
    Object.entries(node).forEach(([k, v]) =>
      collectTranslatableText(v, collectors, node, k)
    );
  }
}

/* -------------------------------------------------
   Main handler
--------------------------------------------------*/
export default async function handler(req: any, res: any) {
  if (
    !process.env.AZURE_OPENAI_KEY ||
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_OPENAI_DEPLOYMENT
  ) {
    return res.status(500).json({ error: "Azure OpenAI not configured." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, targetLanguage = "en" } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const systemContent =
      messages.find((m: any) => m.role === "system")?.content || "";

    const toneHint: "supportive" | "clinical" = /padding:\s*on|supportive|reassurance|mentor|gentle/i.test(systemContent)
    ? "supportive"
    : "clinical";

    const aiResponse = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_OPENAI_KEY!,
        },
        body: JSON.stringify({ messages, temperature: 0.4 }),
      }
    );

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No content from Azure" });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    } catch {
      parsed = null;
    }
    if (
  parsed &&
  targetLanguage !== "en" &&
  process.env.AZURE_TRANSLATOR_KEY &&
  !parsed.flowchart 
) {
      const collectors: Collector[] = [];
      collectTranslatableText(parsed, collectors);

      const texts = collectors.map((c) => c.get());
      const translated = await translateText(texts, targetLanguage);

      translated.forEach((t, i) => collectors[i]?.set(t));
    }
    if (parsed && targetLanguage === "en") {
      const collectors: Collector[] = [];
      collectTranslatableText(parsed, collectors);
     collectors.forEach((c) => {
  const v = c.get();

  if (
    typeof v === "string" &&
    v.length > 30 
  ) {
    c.set(applyTonePostTranslation(v, toneHint));
  }
});
    }
    return res.json({ parsed });
  } catch (e: any) {
    console.error("Handler error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

/* -------------------------------------------------
   Azure Translator helper
--------------------------------------------------*/
async function translateText(texts: string[], targetLang: string) {
  if (!texts.length) return texts;

  const url = `${process.env.AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${targetLang}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_KEY!,
      "Ocp-Apim-Subscription-Region": process.env.AZURE_TRANSLATOR_REGION!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(texts.map((t) => ({ text: t }))),
  });

  const data = await res.json();
  return data.map((x: any) => x.translations[0].text);
}
