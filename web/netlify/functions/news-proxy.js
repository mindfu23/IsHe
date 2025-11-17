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
    const { query } = JSON.parse(event.body);
    
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query parameter required' })
      };
    }

    const apiKey = process.env.REACT_APP_NEWS_API_KEY;
    
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
