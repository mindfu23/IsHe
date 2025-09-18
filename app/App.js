import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const GOOGLE_NEWS_API = 'https://newsapi.org/v2/everything'; // Placeholder, requires API key
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
      // Replace with your News API key
      const apiKey = 'YOUR_NEWSAPI_KEY';
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
      setError('Error fetching news. Please try again.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Is He Dead Yet?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter celebrity name"
        value={celebrity}
        onChangeText={setCelebrity}
      />
      <Button title="Check" onPress={checkCelebrity} disabled={loading || !celebrity} />
      {loading && <ActivityIndicator style={{ margin: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {result && result.dead && (
        <View style={styles.resultBox}>
          <Text style={styles.deadText}>Yes, {celebrity} appears to be dead.</Text>
          <Text style={styles.newsTitle}>{result.news.title}</Text>
          <Button title="Read News" onPress={() => Linking.openURL(result.news.url)} />
        </View>
      )}
      {result && !result.dead && (
        <View style={styles.resultBox}>
          <Text style={styles.aliveText}>No, {celebrity} is not dead!</Text>
          <Button title="Play a Brain Teaser" onPress={() => Linking.openURL(teaserUrl)} />
          <Button title="See Good News" onPress={() => Linking.openURL(positiveNewsUrl)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    margin: 10,
  },
  resultBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  deadText: {
    color: 'red',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aliveText: {
    color: 'green',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
