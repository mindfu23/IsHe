import axios from 'axios';
import type { Handler, HandlerResponse } from '@netlify/functions';
import { aiGuard } from './lib/ai-guard';
import { asV2 } from './lib/v2-adapter';

// First model is the one we want; later ones are used only if an earlier one
// has been retired (Anthropic answers 404). claude-3-5-sonnet-20241022 was
// retired, which silently turned this check off. Fixed list: the caller never
// chooses the model.
const MODELS = ['claude-sonnet-5', 'claude-haiku-4-5'];

// Browser calls must come from the app itself. Requests with no Origin header
// (server-to-server, mobile) still go through the per-visitor and daily caps.
const APP_ORIGIN = 'https://ishe.netlify.app';
const CORS = { 'Access-Control-Allow-Origin': APP_ORIGIN, Vary: 'Origin' };

// Caps on every caller-supplied field that reaches the prompt.
const MAX_NAME = 100;
const MAX_WIKI_TITLE = 200;
const MAX_WIKI_EXTRACT = 4000;
const MAX_ARTICLES = 5;
const MAX_ARTICLE_TITLE = 300;
const MAX_ARTICLE_DESC = 600;
const MAX_DATE = 40;

function json(statusCode: number, body: Record<string, unknown>): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
    body: JSON.stringify(body),
  };
}

/** A string field, trimmed and cut to max chars; anything else becomes ''. */
function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function callClaude(apiKey: string, prompt: string) {
  for (let i = 0; i < MODELS.length; i++) {
    try {
      return await axios.post('https://api.anthropic.com/v1/messages', {
        model: MODELS[i],
        max_tokens: 500,
        // Sonnet 5 thinks by default; this short JSON answer doesn't need it,
        // and thinking would share the 500-token budget.
        thinking: { type: 'disabled' },
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        timeout: 20000,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      });
    } catch (error: any) {
      const retired = error.response && error.response.status === 404;
      if (!retired || i === MODELS.length - 1) throw error;
      console.warn(`Model ${MODELS[i]} returned 404 (retired?); falling back to ${MODELS[i + 1]}. Update MODELS in ai-verify.ts.`);
    }
  }
  throw new Error('No model available');
}

const handler: Handler = async (event) => {
  // POST only, body ≤ 40 KB, Origin allowlist, per-visitor and global daily caps.
  // Every attempt counts, including ones rejected below as malformed.
  const blocked = await aiGuard(event, {
    store: 'ai-usage',
    perIpDaily: 20,
    globalDaily: 300,
    maxBodyBytes: 40_000,
    allowedOrigins: [APP_ORIGIN],
    headers: CORS,
  });
  if (blocked) return blocked;

  try {
    let body: any;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
    if (!body || typeof body !== 'object') return json(400, { error: 'Invalid request' });

    const name = str(body.name, MAX_NAME);
    if (!name) return json(400, { error: 'Name parameter required' });

    const claudeApiKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeApiKey) {
      console.warn('Claude API key not configured, skipping AI check');
      return json(200, { available: false, reason: 'API key not configured' });
    }

    const wikiData = body.wikiData && typeof body.wikiData === 'object' ? body.wikiData : null;
    const googleData = body.googleData && typeof body.googleData === 'object' ? body.googleData : null;
    const newsArticles: any[] = Array.isArray(body.newsArticles) ? body.newsArticles.slice(0, MAX_ARTICLES) : [];

    // Prepare context for Claude
    let context = `I need to determine if ${name} is deceased or still alive.\n\n`;

    if (googleData && googleData.found) {
      context += `Google Knowledge Graph:\nHas death date: ${googleData.hasDied === true}\n`;
      const deathDate = str(googleData.deathDate, MAX_DATE);
      const birthDate = str(googleData.birthDate, MAX_DATE);
      if (deathDate) context += `Death date: ${deathDate}\n`;
      if (birthDate) context += `Birth date: ${birthDate}\n`;
      context += '\n';
    }

    if (wikiData && wikiData.found) {
      context += `Wikipedia information:\nTitle: ${str(wikiData.title, MAX_WIKI_TITLE)}\nExtract: ${str(wikiData.extract, MAX_WIKI_EXTRACT)}\n\n`;
    }

    const articles = newsArticles
      .filter(a => a && typeof a === 'object')
      .map(a => ({ title: str(a.title, MAX_ARTICLE_TITLE), description: str(a.description, MAX_ARTICLE_DESC) }))
      .filter(a => a.title || a.description);
    if (articles.length > 0) {
      context += `Recent news articles:\n`;
      articles.forEach((article, i) => {
        context += `${i + 1}. ${article.title}\n${article.description}\n\n`;
      });
    }

    const prompt = `${context}Based on the information above, is ${name} deceased? Respond with a JSON object containing:
- "isDead" (boolean): true if deceased, false if alive
- "confidence" (string): "high", "medium", or "low"
- "reasoning" (string): brief explanation of your conclusion
- "source" (string): what information led to this conclusion (e.g., "Wikipedia shows death date", "No credible death reports")

Be very careful about false positives. Only say someone is dead if there is clear evidence.`;

    const response = await callClaude(claudeApiKey, prompt);
    const claudeResponse: string = response.data?.content?.[0]?.text ?? '';

    // Try to parse JSON from Claude's response
    let result: any;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = claudeResponse.match(/```json\n?(.*?)\n?```/s) ||
                       claudeResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : claudeResponse;
      result = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Claude response:', claudeResponse);
      return json(200, { available: false, reason: 'Failed to parse AI response' });
    }

    // Return only the expected fields.
    return json(200, {
      available: true,
      isDead: result?.isDead === true,
      confidence: str(result?.confidence, 20),
      reasoning: str(result?.reasoning, 1000),
      source: str(result?.source, 300),
    });
  } catch (error: any) {
    console.error('Error:', error?.message);
    return json(500, { available: false, error: 'Failed to get AI verification' });
  }
};

export default asV2(handler);
