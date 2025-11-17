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

    // Get the page content
    const pageResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        titles: pageTitle,
        prop: 'extracts|info',
        exintro: true,
        explaintext: true,
        format: 'json',
        inprop: 'url'
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

    // Check for death indicators in the first paragraph
    const extract = page.extract.toLowerCase();
    const deathIndicators = [
      'died',
      'death',
      'passed away',
      'deceased',
      /\d{4}\s*[-–]\s*\d{4}/  // Birth-death year pattern like "1947 – 2016"
    ];

    const isDead = deathIndicators.some(indicator => {
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
