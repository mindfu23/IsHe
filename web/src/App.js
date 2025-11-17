import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const GOOGLE_NEWS_API = 'https://newsapi.org/v2/everything';
const POSITIVE_NEWS_TOPICS = ['good news', 'uplifting', 'positive stories'];
const BRAIN_TEASER_URLS = [
  'https://www.riddles.com/',
  'https://www.brainzilla.com/',
  'https://www.funology.com/riddles/',
  'https://www.puzzleprime.com/',
];

export default function App() {
  const [celebrity, setCelebrity] = useState('');
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
    
    try {
      // Get API key from environment variable
      const apiKey = process.env.REACT_APP_NEWS_API_KEY;
      
      // Debug logging (remove after testing)
      console.log('Environment check:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
      });
      
      if (!apiKey) {
        setError('News API key is not configured. Please add REACT_APP_NEWS_API_KEY to your .env file.');
        setLoading(false);
        return;
      }

      const response = await axios.get(GOOGLE_NEWS_API, {
        params: {
          q: `${celebrity} death`,
          sortBy: 'publishedAt',
          language: 'en',
          apiKey,
        },
      });
      
      const articles = response.data.articles;
      const deathNews = articles.find(article =>
        /dead|death|dies|passed away|obituary/i.test(article.title + article.description)
      );
      
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
        const posResponse = await axios.get(GOOGLE_NEWS_API, {
          params: {
            q: topic,
            sortBy: 'publishedAt',
            language: 'en',
            apiKey,
          },
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
          <div className="dead-text">Yes, {celebrity} appears to be dead.</div>
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
          <div className="alive-text">No, {celebrity} is not dead!</div>
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
