import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const POSITIVE_NEWS_TOPICS = ['good news', 'uplifting', 'positive stories'];
const MIN_FAME_THRESHOLD = 1000000; // 1 million
const BRAIN_TEASER_URLS = [
  'https://www.riddles.com/',
  'https://www.brainzilla.com/',
  'https://www.funology.com/riddles/',
  'https://www.puzzleprime.com/puzzles/',
];

export default function App() {
  const [celebrity, setCelebrity] = useState('');
  const [checkedCelebrity, setCheckedCelebrity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [positiveNewsUrl, setPositiveNewsUrl] = useState('');
  const [teaserUrl, setTeaserUrl] = useState('');
  const [notFamousEnough, setNotFamousEnough] = useState(false);

  const checkCelebrity = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPositiveNewsUrl('');
    setTeaserUrl('');
    setCheckedCelebrity(celebrity);
    setNotFamousEnough(false);
    
    try {
      // Step 1: Check Google for result count and knowledge graph info
      let googleData = null;
      try {
        const googleResponse = await axios.post('/.netlify/functions/google-search', {
          name: celebrity
        });
        googleData = googleResponse.data;
        console.log('Google data:', googleData);
        
        // If Google has definitive death info in knowledge graph, use it
        if (googleData && googleData.found && googleData.hasDied) {
          setResult({
            dead: true,
            news: {
              title: `${celebrity} (Google Knowledge Graph)`,
              description: `Death date: ${googleData.deathDate || 'Confirmed deceased'}`,
              url: `https://www.google.com/search?q=${encodeURIComponent(celebrity)}`
            }
          });
          setLoading(false);
          return;
        }
      } catch (googleError) {
        console.warn('Google check failed, continuing with other sources:', googleError);
      }
      
      // Step 2: If famous (>20M results), check Wikipedia
      const isFamous = googleData && googleData.isFamous;
      console.log('Is famous:', isFamous, 'Result count:', googleData?.resultCount);
      
      let wikiData = null;
      if (isFamous) {
        try {
          const wikiResponse = await axios.post('/.netlify/functions/wikipedia-check', {
            name: celebrity
          });
          wikiData = wikiResponse.data;
          console.log('Wikipedia data:', wikiData);
          
          // If Wikipedia confirms death, trust it
          if (wikiData && wikiData.found && wikiData.isDead) {
            setResult({
              dead: true,
              news: {
                title: `${wikiData.title} (Wikipedia)`,
                description: wikiData.extract,
                url: wikiData.url
              }
            });
            setLoading(false);
            return;
          }
        } catch (wikiError) {
          console.warn('Wikipedia check failed:', wikiError);
        }
      }
      
      // Step 3: If Wikipedia doesn't show death (or person not famous), check NewsAPI
      // Use death-specific search with keywords: dies, dead, passes away, etc.
      let newsDeathCheck = null;
      try {
        const newsResponse = await axios.post('/.netlify/functions/news-proxy', {
          deathCheck: true,
          name: celebrity
        });
        newsDeathCheck = newsResponse.data;
        console.log('News death check:', newsDeathCheck);
        
        if (newsDeathCheck && newsDeathCheck.articles && newsDeathCheck.articles.length > 0) {
          // Found death-related news, verify it's about this person actually dying
          const deathArticle = newsDeathCheck.articles[0];
          
          // Additional verification: Use AI if available
          let aiVerification = null;
          try {
            const aiResponse = await axios.post('/.netlify/functions/ai-verify', {
              name: celebrity,
              wikiData: wikiData,
              newsArticles: newsDeathCheck.articles,
              googleData: googleData
            });
            aiVerification = aiResponse.data;
          } catch (aiError) {
            console.warn('AI verification failed:', aiError);
          }
          
          // If AI is confident about death, use it
          if (aiVerification && aiVerification.available && 
              aiVerification.confidence === 'high' && aiVerification.isDead) {
            setResult({
              dead: true,
              news: {
                title: deathArticle.title,
                description: deathArticle.description || aiVerification.reasoning,
                url: deathArticle.url
              }
            });
            setLoading(false);
            return;
          }
          
          // Otherwise, if we have strong news evidence
          const titleLower = deathArticle.title.toLowerCase();
          const strongDeathPhrases = ['has died', 'dies at', 'passed away', 'dead at', 'found dead', 'obituary'];
          const hasStrongEvidence = strongDeathPhrases.some(phrase => titleLower.includes(phrase));
          
          if (hasStrongEvidence) {
            setResult({
              dead: true,
              news: deathArticle
            });
            setLoading(false);
            return;
          }
        }
      } catch (newsError) {
        console.warn('News death check failed:', newsError);
      }
      
      // Step 4: If not famous, still do a basic Wikipedia and news check
      if (!isFamous && !wikiData) {
        try {
          const wikiResponse = await axios.post('/.netlify/functions/wikipedia-check', {
            name: celebrity
          });
          wikiData = wikiResponse.data;
          
          if (wikiData && wikiData.found && wikiData.isDead) {
            setResult({
              dead: true,
              news: {
                title: `${wikiData.title} (Wikipedia)`,
                description: wikiData.extract,
                url: wikiData.url
              }
            });
            setLoading(false);
            return;
          }
        } catch (wikiError) {
          console.warn('Wikipedia fallback check failed:', wikiError);
        }
      }
      
      // Step 5: Check if person is not famous enough to be sure
      // Less than 1 million Google results AND no Wikipedia page
      const googleResultCount = googleData?.resultCount || 0;
      const hasWikipediaPage = wikiData && wikiData.found;
      
      if (googleResultCount < MIN_FAME_THRESHOLD && !hasWikipediaPage) {
        setNotFamousEnough(true);
        setLoading(false);
        return;
      }
      
      // No death found - person is alive
      setResult({ dead: false });
      setTeaserUrl(BRAIN_TEASER_URLS[Math.floor(Math.random() * BRAIN_TEASER_URLS.length)]);
      
      // Get positive news
      const topic = POSITIVE_NEWS_TOPICS[Math.floor(Math.random() * POSITIVE_NEWS_TOPICS.length)];
      try {
        const posResponse = await axios.post('/.netlify/functions/news-proxy', {
          query: topic
        });
        const posArticle = posResponse.data.articles?.[0];
        setPositiveNewsUrl(posArticle ? posArticle.url : 'https://www.goodnewsnetwork.org/');
      } catch {
        setPositiveNewsUrl('https://www.goodnewsnetwork.org/');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching data. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1 className="title">Is He Dead Yet?</h1>
      
      <input
        className="input"
        type="text"
        placeholder="Enter celebrity name"
        value={celebrity}
        onChange={(e) => setCelebrity(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && celebrity && !loading && checkCelebrity()}
      />
      
      <button 
        className="btn-primary"
        onClick={checkCelebrity} 
        disabled={loading || !celebrity}
      >
        {loading ? 'Checking...' : 'Check'}
      </button>
      
      {loading && <div className="loader"></div>}
      
      {error && <div className="error">{error}</div>}
      
      {result && result.dead && (
        <div className="result-box">
          <div className="dead-text">Yes, {checkedCelebrity} appears to be dead.</div>
          <div className="news-title">{result.news.title}</div>
          <button 
            className="btn-secondary"
            onClick={() => window.open(result.news.url, '_blank')}
          >
            Read News
          </button>
        </div>
      )}
      
      {result && !result.dead && (
        <div className="result-box">
          <div className="alive-text">No, {checkedCelebrity} is not dead!</div>
          <button 
            className="btn-secondary"
            onClick={() => window.open(teaserUrl, '_blank')}
          >
            Play a Brain Teaser
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.open(positiveNewsUrl, '_blank')}
          >
            See Good News
          </button>
        </div>
      )}
      
      {notFamousEnough && (
        <div className="result-box">
          <div className="uncertain-text">They might not be famous enough to be sure.</div>
        </div>
      )}
    </div>
  );
}
