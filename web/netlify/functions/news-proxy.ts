import axios from 'axios';
import type { Handler, HandlerResponse } from '@netlify/functions';
import { aiGuard } from './lib/ai-guard';
import { asV2 } from './lib/v2-adapter';

const APP_ORIGIN = 'https://ishe.netlify.app';
const CORS = { 'Access-Control-Allow-Origin': APP_ORIGIN, Vary: 'Origin' };
const MAX_NAME = 100;
const MAX_QUERY = 100;

function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
    body: JSON.stringify(body),
  };
}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const handler: Handler = async (event) => {
  // Protects the NewsAPI quota: POST only, small body, Origin allowlist,
  // per-visitor and global daily caps (separate counters from ai-verify).
  // One "Check" in the app makes up to two calls here.
  const blocked = await aiGuard(event, {
    store: 'news-usage',
    perIpDaily: 40,
    globalDaily: 500,
    maxBodyBytes: 2_000,
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
    const query = str(body?.query, MAX_QUERY);
    const name = str(body?.name, MAX_NAME);
    const deathCheck = body?.deathCheck === true;

    if (!query && !name) {
      return json(400, { error: 'Query or name parameter required' });
    }

    // Server-side only. Never use a REACT_APP_-prefixed name: Create React App
    // builds those into the public browser bundle.
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.error('NEWS_API_KEY not set in Netlify environment variables');
      return json(500, { error: 'News service not configured' });
    }

    // If deathCheck is true, search for death-related news for the person
    if (deathCheck && name) {
      const deathKeywords = ['dies', 'died', 'dead', 'death', 'passes away', 'passed away', 'obituary', 'RIP'];
      const searchQueries = deathKeywords.map(keyword => `"${name}" ${keyword}`);

      // Search with multiple death-related queries
      const allArticles: any[] = [];

      for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
        try {
          const response = await axios.get('https://newsapi.org/v2/everything', {
            timeout: 10000,
            params: {
              q: searchQuery,
              sortBy: 'publishedAt',
              language: 'en',
              pageSize: 5,
              apiKey
            }
          });

          if (response.data.articles) {
            allArticles.push(...response.data.articles);
          }
        } catch (err: any) {
          console.warn(`Query "${searchQuery}" failed:`, err.message);
        }
      }

      // Deduplicate articles by URL
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
      );

      // Filter to only include articles that actually mention the person's death
      const nameLower = name.toLowerCase();
      const nameWords = nameLower.split(' ').filter(w => w.length > 2);

      const relevantArticles = uniqueArticles.filter(article => {
        const titleLower = (article.title || '').toLowerCase();
        const descLower = (article.description || '').toLowerCase();
        const fullText = titleLower + ' ' + descLower;

        // Check if the person's name appears
        const hasName = nameWords.every(word => fullText.includes(word));
        if (!hasName) return false;

        // Check for death indicators in close proximity to name
        const deathIndicators = ['dies', 'died', 'dead', 'death', 'passes away', 'passed away', 'obituary', 'rip'];
        return deathIndicators.some(indicator => fullText.includes(indicator));
      });

      return json(200, {
        articles: relevantArticles,
        totalResults: relevantArticles.length,
        deathCheckPerformed: true
      });
    }

    if (!query) return json(400, { error: 'Query parameter required' });

    // Standard query mode
    const response = await axios.get('https://newsapi.org/v2/everything', {
      timeout: 10000,
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 10,
        apiKey
      }
    });

    return json(200, response.data);
  } catch (error: any) {
    console.error('Error:', error?.message);
    return json(500, { error: 'Failed to fetch news' });
  }
};

export default asV2(handler);
