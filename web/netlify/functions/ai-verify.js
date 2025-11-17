const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { name, wikiData, newsArticles } = JSON.parse(event.body);
    
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name parameter required' })
      };
    }

    const claudeApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!claudeApiKey) {
      console.warn('Claude API key not configured, skipping AI check');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          available: false,
          reason: 'API key not configured'
        })
      };
    }

    // Prepare context for Claude
    let context = `I need to determine if ${name} is deceased or still alive.\n\n`;
    
    if (wikiData && wikiData.found) {
      context += `Wikipedia information:\nTitle: ${wikiData.title}\nExtract: ${wikiData.extract}\n\n`;
    }
    
    if (newsArticles && newsArticles.length > 0) {
      context += `Recent news articles:\n`;
      newsArticles.slice(0, 3).forEach((article, i) => {
        context += `${i + 1}. ${article.title}\n${article.description || ''}\n\n`;
      });
    }

    const prompt = `${context}Based on the information above, is ${name} deceased? Respond with a JSON object containing:
- "isDead" (boolean): true if deceased, false if alive
- "confidence" (string): "high", "medium", or "low"
- "reasoning" (string): brief explanation of your conclusion
- "source" (string): what information led to this conclusion (e.g., "Wikipedia shows death date", "No credible death reports")

Be very careful about false positives. Only say someone is dead if there is clear evidence.`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const claudeResponse = response.data.content[0].text;
    
    // Try to parse JSON from Claude's response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = claudeResponse.match(/```json\n?(.*?)\n?```/s) || 
                       claudeResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : claudeResponse;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', claudeResponse);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          available: false,
          reason: 'Failed to parse AI response'
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        available: true,
        ...result
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        available: false,
        error: 'Failed to get AI verification',
        message: error.message 
      })
    };
  }
};
