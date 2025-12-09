const axios = require('axios');

const WIKI_HEADERS = {
  'User-Agent': 'IsHeDeadYet/1.0 (https://github.com/mindfu23/IsHe)'
};

async function checkWikipedia(name) {
    try {
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
            return { found: false };
        }
        
        const pageTitle = searchResults[0].title;
        
        const pageResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                titles: pageTitle,
                prop: 'extracts',
                explaintext: true,
                format: 'json',
                exchars: 2000
            },
            headers: WIKI_HEADERS
        });
        
        const pages = pageResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (!page || !page.extract) {
            return { found: false };
        }
        
        const extract = page.extract.toLowerCase();
        const originalExtract = page.extract;
        const introText = originalExtract.substring(0, 500);
        
        // Check for "present" (means alive)
        const isStillAlive = extract.includes('present') && /\d{4}\s*[–-]\s*present/i.test(extract);
        
        // Check for full date range: "August 11, 1953 – July 24, 2025"
        const fullDateRangePattern = /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\s*[–—-]\s*(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i;
        const hasFullDateRange = fullDateRangePattern.test(introText);
        
        // Check for year range: "1953 – 2025"
        const yearRangePattern = /\b(\d{4})\s*[–—-]\s*(\d{4})\b/;
        const yearMatch = introText.match(yearRangePattern);
        let hasYearRange = false;
        if (yearMatch) {
            const endYear = parseInt(yearMatch[2]);
            if (endYear <= new Date().getFullYear() && endYear > 1900) {
                hasYearRange = true;
            }
        }
        
        // Check for past tense "was" pattern
        const wasPastTense = /\)\s*was\s+an?\s+/i.test(introText);
        
        // Check for death keywords
        const hasDeathKeyword = ['died', 'passed away', 'deceased'].some(kw => extract.includes(kw));
        
        const isDead = !isStillAlive && (hasFullDateRange || hasYearRange || hasDeathKeyword || wasPastTense);
        
        return {
            found: true,
            title: page.title,
            isDead: isDead,
            isAlive: isStillAlive,
            debug: {
                hasFullDateRange,
                hasYearRange,
                wasPastTense,
                hasDeathKeyword,
                yearMatch: yearMatch ? yearMatch[0] : null
            },
            snippet: introText.substring(0, 250)
        };
    } catch (err) {
        return { error: err.message };
    }
}

async function testPerson(name) {
    console.log('\n' + '='.repeat(60));
    console.log('Testing: ' + name);
    console.log('='.repeat(60));
    
    const wiki = await checkWikipedia(name);
    console.log('\n📚 Wikipedia Check:');
    console.log('   Found:', wiki.found ? 'YES' : 'NO');
    if (wiki.found) {
        console.log('   Title:', wiki.title);
        console.log('   Debug:', JSON.stringify(wiki.debug, null, 2));
        console.log('   Snippet:', wiki.snippet + '...');
    }
    
    if (wiki.isDead) {
        console.log('\n🔴 RESULT: DEAD');
    } else if (wiki.isAlive) {
        console.log('\n🟢 RESULT: ALIVE (confirmed)');
    } else {
        console.log('\n🟢 RESULT: ALIVE (no death indicators)');
    }
}

async function runTests() {
    await testPerson('Woody Allen');
    await testPerson('Hulk Hogan');
    await testPerson('Donald Trump');
    await testPerson('Elvis Presley');
}

runTests();
