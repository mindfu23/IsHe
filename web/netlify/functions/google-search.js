const axios = require('axios');
const cheerio = require('cheerio');

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

    // Perform Google search with exact name in quotes for better accuracy
    const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(name)}"`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract result count from Google
    // Usually in format "About X results" or "About X,XXX,XXX results"
    let resultCount = 0;
    let isFamous = false;
    const FAMOUS_THRESHOLD = 20000000; // 20 million
    
    const resultStatsText = $('#result-stats').text() || '';
    const resultMatch = resultStatsText.match(/About\s+([\d,]+)\s+results/i) ||
                        resultStatsText.match(/([\d,]+)\s+results/i);
    
    if (resultMatch) {
      resultCount = parseInt(resultMatch[1].replace(/,/g, ''));
      isFamous = resultCount >= FAMOUS_THRESHOLD;
    }
    
    // Look for death date in Google's Knowledge Graph
    let hasDied = false;
    let deathDate = null;
    let birthDate = null;
    
    // Check for "Died" label in knowledge panel
    $('div[data-attrid]').each((i, elem) => {
      const text = $(elem).text();
      const attrid = $(elem).attr('data-attrid');
      
      // Look for died/death information
      if (text.toLowerCase().includes('died') || 
          (attrid && attrid.toLowerCase().includes('died'))) {
        hasDied = true;
        deathDate = text;
      }
      
      // Look for born information
      if (text.toLowerCase().includes('born') || 
          (attrid && attrid.toLowerCase().includes('born'))) {
        birthDate = text;
      }
    });
    
    // Alternative: Check for date range pattern (1930-2025)
    const pageText = $.text();
    const dateRangeMatch = pageText.match(/\b(\d{4})\s*[-–—]\s*(\d{4})\b/);
    
    if (dateRangeMatch) {
      const [_, birth, death] = dateRangeMatch;
      // Only consider it a death date if the second year is not in the future
      const currentYear = new Date().getFullYear();
      if (parseInt(death) <= currentYear) {
        hasDied = true;
        if (!deathDate) deathDate = death;
        if (!birthDate) birthDate = birth;
      }
    }
    
    // Look for explicit "Died:" text in knowledge panel
    if (pageText.includes('Died:') || pageText.includes('Died\n')) {
      hasDied = true;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        found: true,
        hasDied: hasDied,
        deathDate: deathDate,
        birthDate: birthDate,
        name: name,
        resultCount: resultCount,
        isFamous: isFamous
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        found: false,
        error: 'Failed to fetch Google data',
        message: error.message 
      })
    };
  }
};
