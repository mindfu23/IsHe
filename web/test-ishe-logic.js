const axios = require('axios');
const cheerio = require('cheerio');

const FAMOUS_THRESHOLD = 20000000;

async function checkGoogle(name) {
    try {
        const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(name)}"`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract result count
        let resultCount = 0;
        const resultStatsText = $('#result-stats').text() || '';
        const resultMatch = resultStatsText.match(/About\s+([\d,]+)\s+results/i) ||
                            resultStatsText.match(/([\d,]+)\s+results/i);
        
        if (resultMatch) {
            resultCount = parseInt(resultMatch[1].replace(/,/g, ''));
        }
        
        // Check for death info
        let hasDied = false;
        $('div[data-attrid]').each((i, elem) => {
            const text = $(elem).text();
            const attrid = $(elem).attr('data-attrid');
            if (text.toLowerCase().includes('died') || 
                (attrid && attrid.toLowerCase().includes('died'))) {
                hasDied = true;
            }
        });
        
        const pageText = $.text();
        if (pageText.includes('Died:') || pageText.includes('Died\n')) {
            hasDied = true;
        }
        
        return {
            resultCount,
            isFamous: resultCount >= FAMOUS_THRESHOLD,
            hasDied
        };
    } catch (err) {
        return { error: err.message };
    }
}

async function checkWikipedia(name) {
    try {
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
            return { found: false };
        }
        
        const pageTitle = searchResults[0].title;
        
        const pageResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                titles: pageTitle,
                prop: 'extracts|categories',
                explaintext: true,
                format: 'json',
                exchars: 2000
            }
        });
        
        const pages = pageResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (!page || !page.extract) {
            return { found: false };
        }
        
        const extract = page.extract.toLowerCase();
        
        // Check for "present" (means alive)
        const isStillAlive = /\d{4}\s*[–-]\s*present/.test(extract) || extract.includes('present)');
        
        // Check for death indicators
        const deathIndicators = [
            /\b\d{4}\s*[-–—]\s*\d{4}\b/,
            'died',
            'death',
            'passed away',
            'deceased'
        ];
        
        const hasDeath = !isStillAlive && deathIndicators.some(indicator => {
            if (indicator instanceof RegExp) return indicator.test(page.extract);
            return extract.includes(indicator);
        });
        
        return {
            found: true,
            title: page.title,
            isDead: hasDeath,
            isAlive: isStillAlive,
            snippet: page.extract.substring(0, 200)
        };
    } catch (err) {
        return { error: err.message };
    }
}

async function testPerson(name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log('='.repeat(60));
    
    // Step 1: Google
    console.log('\n📊 Step 1: Google Search');
    const google = await checkGoogle(name);
    console.log(`   Result count: ${google.resultCount?.toLocaleString() || 'N/A'}`);
    console.log(`   Is famous (>20M): ${google.isFamous ? 'YES' : 'NO'}`);
    console.log(`   Google says dead: ${google.hasDied ? 'YES' : 'NO'}`);
    
    if (google.hasDied) {
        console.log('\n�� RESULT: DEAD (confirmed by Google Knowledge Graph)');
        return;
    }
    
    // Step 2: Wikipedia (if famous)
    if (google.isFamous) {
        console.log('\n📚 Step 2: Wikipedia Check (famous person)');
        const wiki = await checkWikipedia(name);
        console.log(`   Found: ${wiki.found ? 'YES' : 'NO'}`);
        if (wiki.found) {
            console.log(`   Title: ${wiki.title}`);
            console.log(`   Shows alive: ${wiki.isAlive ? 'YES' : 'NO'}`);
            console.log(`   Shows dead: ${wiki.isDead ? 'YES' : 'NO'}`);
            console.log(`   Snippet: ${wiki.snippet}...`);
        }
        
        if (wiki.isDead) {
            console.log('\n🔴 RESULT: DEAD (confirmed by Wikipedia)');
            return;
        }
        
        if (wiki.isAlive) {
            console.log('\n🟢 RESULT: ALIVE (Wikipedia shows "present")');
            return;
        }
    }
    
    // If we get here with no death confirmation
    console.log('\n🟢 RESULT: ALIVE (no death confirmation found)');
}

async function runTests() {
    await testPerson('Woody Allen');
    await testPerson('Hulk Hogan');
    await testPerson('Donald Trump');
}

runTests();
