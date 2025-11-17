const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name } = JSON.parse(event.body);
    
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name parameter required' })
      };
    }

    // Search Wikipedia for the person
    const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: name,
        format: 'json',
        srlimit: 1
      }
    });

    const searchResults = searchResponse.data.query.search;
    if (!searchResults || searchResults.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }

    const pageTitle = searchResults[0].title;

    // Get the page content - get more than just intro
    const pageResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        titles: pageTitle,
        prop: 'extracts|info|categories',
        explaintext: true,
        format: 'json',
        inprop: 'url',
        exlimit: 1,
        exchars: 2000  // Get first 2000 characters instead of just intro
      }
    });

    const pages = pageResponse.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (!page || !page.extract) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false })
      };
    }

    // Check for death indicators in the text
    const extract = page.extract.toLowerCase();
    const categories = page.categories || [];
    
    // Check categories for death-related ones
    const hasDeathCategory = categories.some(cat => 
      cat.title.toLowerCase().includes('deaths') || 
      cat.title.toLowerCase().includes('deceased')
    );
    
    const deathIndicators = [
      /\d{4}\s*[-–—]\s*\d{4}/,  // Birth-death year pattern like "1947 – 2016"
      /\(\s*\d{4}\s*[-–—]\s*\d{4}\s*\)/,  // (1947 – 2016)
      /january|february|march|april|may|june|july|august|september|october|november|december\s+\d{1,2},?\s+\d{4}/i,  // Date of death
      'died',
      'death',
      'passed away',
      'deceased'
    ];

    // Check if "present" appears (means they're alive)
    const isStillAlive = extract.includes('present') && /\d{4}\s*[–-]\s*present/.test(extract);
    
    if (isStillAlive) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          found: true,
          title: page.title,
          extract: page.extract.substring(0, 500),
          isDead: false,
          url: page.fullurl
        })
      };
    }

    const isDead = hasDeathCategory || deathIndicators.some(indicator => {
      if (indicator instanceof RegExp) {
        return indicator.test(extract);
      }
      return extract.includes(indicator);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        found: true,
        title: page.title,
        extract: page.extract.substring(0, 500),
        isDead: isDead,
        url: page.fullurl
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch Wikipedia data',
        message: error.message 
      })
    };
  }
};
