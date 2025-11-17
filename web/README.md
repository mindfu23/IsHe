# Is He Dead Yet? - Web Version

A React web application that checks if a celebrity is still alive using news APIs. If they're alive, it offers brain teasers and positive news to brighten your day!

## Features

- Check celebrity status using real-time news data
- Brain teaser links for entertainment
- Positive news suggestions
- Responsive design for mobile and desktop

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get a free API key from [NewsAPI.org](https://newsapi.org/)

3. Create a `.env` file in the web directory:
```bash
cp .env.example .env
```

4. Add your API key to the `.env` file:
```
REACT_APP_NEWS_API_KEY=your_actual_api_key_here
```

## Running Locally

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment

See `DEPLOYMENT.md` for detailed instructions on deploying to Netlify.

## Environment Variables

- `REACT_APP_NEWS_API_KEY` - Your NewsAPI.org API key (required)

## Technologies Used

- React 18
- Axios for API requests
- NewsAPI.org for news data
- CSS3 for styling
