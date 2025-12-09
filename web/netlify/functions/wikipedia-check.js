const axios = require('axios');

// Wikipedia API requires a User-Agent header
const WIKI_HEADERS = {
  'User-Agent': 'IsHeDeadYet/1.0 (https://github.com/mindfu23/IsHe)'
};

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
      },
      headers: WIKI_HEADERS
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
        exchars: 5000  // Get first 5000 characters to catch historical figures
      },
      headers: WIKI_HEADERS
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
    const originalExtract = page.extract; // Keep original for regex
    const categories = page.categories || [];
    
    // Check categories for death-related ones
    const hasDeathCategory = categories.some(cat => {
      const catTitle = cat.title.toLowerCase();
      return catTitle.includes('deaths') || 
             catTitle.includes('deceased') ||
             /\d{4}\s+deaths/.test(catTitle);  // e.g., "1945 deaths"
    });
    
    // First, check for the common Wikipedia bio pattern: "Name (birth date – death date)"
    // This catches patterns like "August 11, 1953 – July 24, 2025" or "1953 – 2025"
    const fullDateRangePattern = /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\s*[–—-]\s*(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i;
    const yearRangePattern = /\b(\d{4})\s*[–—-]\s*(\d{4})\b/;
    
    // Check for full date range (birth – death) in first 500 chars (bio intro)
    const introText = originalExtract.substring(0, 500);
    const hasFullDateRange = fullDateRangePattern.test(introText);
    
    // Check for year range and ensure it's not birth-present
    const yearMatch = introText.match(yearRangePattern);
    let hasYearRange = false;
    if (yearMatch) {
      const endYear = parseInt(yearMatch[2]);
      // If end year is a valid death year (not in the future, and after 1900)
      if (endYear <= new Date().getFullYear() && endYear > 1900) {
        hasYearRange = true;
      }
    }
    
    const deathIndicators = [
      /born.*\d{4}.*died.*\d{4}/i,  // "born 1930...died 2025"
      'died',
      'passed away',
      'deceased',
      ') was an american',  // Past tense "was" after dates often indicates death
      ') was a '  // Generic past tense pattern
    ];

    // Check if "present" appears (means they're alive)
    const isStillAlive = extract.includes('present') && /\d{4}\s*[–-]\s*present/i.test(extract);
    
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

    // Determine if dead based on various indicators
    const isDead = hasDeathCategory || hasFullDateRange || hasYearRange || deathIndicators.some(indicator => {
      if (indicator instanceof RegExp) {
        return indicator.test(originalExtract);  // Use original text for regex with case sensitivity
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
