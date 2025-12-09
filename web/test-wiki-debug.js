const axios = require('axios');

async function testWikipedia() {
    try {
        console.log('Making request to Wikipedia API...');
        
        const searchResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                list: 'search',
                srsearch: 'Woody Allen',
                format: 'json',
                srlimit: 1
            },
            headers: {
                'User-Agent': 'IsHeDeadYet/1.0 (https://github.com/mindfu23/IsHe; contact@example.com)'
            }
        });
        
        console.log('Response status:', searchResponse.status);
        console.log('Response data:', JSON.stringify(searchResponse.data, null, 2));
        
        const searchResults = searchResponse.data?.query?.search;
        console.log('Search results:', searchResults);
        
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
    }
}

testWikipedia();
