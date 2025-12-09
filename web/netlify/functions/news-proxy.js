const axios = require('axios');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { query, deathCheck, name } = JSON.parse(event.body);
    
    if (!query && !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query or name parameter required' })
      };
    }

    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    
    // If deathCheck is true, search for death-related news for the person
    if (deathCheck && name) {
      const deathKeywords = ['dies', 'died', 'dead', 'death', 'passes away', 'passed away', 'obituary', 'RIP'];
      const searchQueries = deathKeywords.map(keyword => `"${name}" ${keyword}`);
      
      // Search with multiple death-related queries
      const allArticles = [];
      
      for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
        try {
          const response = await axios.get('https://newsapi.org/v2/everything', {
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
        } catch (err) {
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
        const hasDeathIndicator = deathIndicators.some(indicator => fullText.includes(indicator));
        
        return hasDeathIndicator;
      });
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: relevantArticles,
          totalResults: relevantArticles.length,
          deathCheckPerformed: true
        })
      };
    }
    
    // Standard query mode
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'en',
        apiKey
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch news',
        message: error.message 
      })
    };
  }
};
