import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const POSITIVE_NEWS_TOPICS = ['good news', 'uplifting', 'positive stories'];
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

  const checkCelebrity = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setPositiveNewsUrl('');
    setTeaserUrl('');
    setCheckedCelebrity(celebrity);
    
    try {
      // Check Wikipedia first for more reliable information
      let wikiData = null;
      try {
        const wikiResponse = await axios.post('/.netlify/functions/wikipedia-check', {
          name: celebrity
        });
        wikiData = wikiResponse.data;
      } catch (wikiError) {
        console.warn('Wikipedia check failed, continuing with news API:', wikiError);
        // Continue to news API if Wikipedia fails
      }
      
      // Get news articles
      const response = await axios.post('/.netlify/functions/news-proxy', {
        query: `${celebrity} death`
      });
      
      const articles = response.data.articles;
      
      // Use AI to verify the information
      let aiVerification = null;
      try {
        const aiResponse = await axios.post('/.netlify/functions/ai-verify', {
          name: celebrity,
          wikiData: wikiData,
          newsArticles: articles
        });
        aiVerification = aiResponse.data;
      } catch (aiError) {
        console.warn('AI verification failed, using fallback logic:', aiError);
      }
      
      // If AI is available and confident, use its decision
      if (aiVerification && aiVerification.available && 
          aiVerification.confidence === 'high') {
        if (aiVerification.isDead) {
          // Find the most relevant article or use Wikipedia
          const relevantSource = wikiData && wikiData.found ? {
            title: `${wikiData.title} - ${aiVerification.reasoning}`,
            description: wikiData.extract,
            url: wikiData.url
          } : articles[0] || {
            title: aiVerification.reasoning,
            url: '#'
          };
          
          setResult({
            dead: true,
            news: relevantSource
          });
          setLoading(false);
          return;
        } else {
          // AI says they're alive
          setResult({ dead: false });
          setTeaserUrl(BRAIN_TEASER_URLS[Math.floor(Math.random() * BRAIN_TEASER_URLS.length)]);
          
          const topic = POSITIVE_NEWS_TOPICS[Math.floor(Math.random() * POSITIVE_NEWS_TOPICS.length)];
          const posResponse = await axios.post('/.netlify/functions/news-proxy', {
            query: topic
          });
          
          const posArticle = posResponse.data.articles[0];
          setPositiveNewsUrl(posArticle ? posArticle.url : 'https://www.goodnewsnetwork.org/');
          setLoading(false);
          return;
        }
      }
      
      // Fallback: If Wikipedia confirms death, trust that
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
      
      // Otherwise, check news API with stricter filtering
      
      // More strict checking: the celebrity name and death-related words must be close together
      const celebrityLower = celebrity.toLowerCase();
      
      const deathNews = articles.find(article => {
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || '').toLowerCase();
        const fullText = titleLower + ' ' + descLower;
        
        // Check if celebrity name appears in the text
        const celebrityWords = celebrityLower.split(' ').filter(w => w.length > 2);
        const hasCelebrityName = celebrityWords.every(word => fullText.includes(word));
        
        if (!hasCelebrityName) return false;
        
        // Look for strong death indicators
        const strongDeathIndicators = [
          'has died',
          'died at',
          'died on',
          'dies at',
          'passed away',
          'found dead',
          'death of ' + celebrityLower,
          celebrityLower + ' is dead',
          celebrityLower + ' dead',
          'confirmed dead',
          'pronounced dead',
          'obituary'
        ];
        
        // Check title first (most reliable)
        if (strongDeathIndicators.some(phrase => titleLower.includes(phrase))) {
          return true;
        }
        
        // Also check description for death confirmation
        if (descLower.includes('died') || descLower.includes('death') || 
            descLower.includes('passed away') || descLower.includes('obituary')) {
          // Make sure it's not about someone else dying or a movie/fictional death
          const isAboutCelebrity = celebrityWords.some(word => 
            descLower.substring(0, 200).includes(word)
          );
          return isAboutCelebrity;
        }
        
        return false;
      });
      
      if (deathNews) {
        setResult({
          dead: true,
          news: deathNews,
        });
      } else {
        // Not dead, show brain teaser and positive news
        setResult({ dead: false });
        setTeaserUrl(BRAIN_TEASER_URLS[Math.floor(Math.random() * BRAIN_TEASER_URLS.length)]);
        
        // Get positive news
        const topic = POSITIVE_NEWS_TOPICS[Math.floor(Math.random() * POSITIVE_NEWS_TOPICS.length)];
        const posResponse = await axios.post('/.netlify/functions/news-proxy', {
          query: topic
        });
        
        const posArticle = posResponse.data.articles[0];
        setPositiveNewsUrl(posArticle ? posArticle.url : 'https://www.goodnewsnetwork.org/');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error fetching news. Please try again.');
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
    </div>
  );
}
