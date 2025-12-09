const axios = require('axios');

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
        const originalExtract = page.extract;
        
        // Check for "present" (means alive)
        const isStillAlive = /\d{4}\s*[–-]\s*present/i.test(originalExtract) || 
                             extract.includes('present)') ||
                             /born.*\d{4}\)/.test(extract) && !/died|death/.test(extract);
        
        // Check for death indicators
        const dateRangeMatch = originalExtract.match(/\((\d{4})\s*[-–—]\s*(\d{4})\)/);
        let hasDeath = false;
        
        if (dateRangeMatch) {
            const endYear = parseInt(dateRangeMatch[2]);
            if (endYear <= new Date().getFullYear()) {
                hasDeath = true;
            }
        }
        
        if (!hasDeath && !isStillAlive) {
            const deathIndicators = ['died', 'death of', 'passed away', 'deceased'];
            hasDeath = deathIndicators.some(indicator => extract.includes(indicator));
        }
        
        return {
            found: true,
            title: page.title,
            isDead: hasDeath && !isStillAlive,
            isAlive: isStillAlive,
            snippet: page.extract.substring(0, 300)
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
        console.log('   Shows alive:', wiki.isAlive ? 'YES ✓' : 'NO');
        console.log('   Shows dead:', wiki.isDead ? 'YES' : 'NO');
        console.log('   Snippet:', wiki.snippet + '...');
    }
    
    if (wiki.isDead) {
        console.log('\n🔴 RESULT: DEAD');
    } else {
        console.log('\n🟢 RESULT: ALIVE');
    }
}

async function runTests() {
    await testPerson('Woody Allen');
    await testPerson('Hulk Hogan');
    await testPerson('Donald Trump');
    // Also test a deceased person to make sure that still works
    await testPerson('Elvis Presley');
}

runTests();
