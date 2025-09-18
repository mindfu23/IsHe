# Is He Dead Yet?

A cross-platform mobile app (Android/iOS) to check if a celebrity is dead by searching trending Google news. If not, it offers a random brain teaser and a link to positive news.

## Features
- Search for a celebrity's death in trending news
- If alive, play a random brain teaser or riddle
- Get a link to a positive news story

## Setup

1. Install dependencies:
   ```bash
   cd app
   npm install
   ```
2. Add your NewsAPI key in `App.js` (replace `YOUR_NEWSAPI_KEY`)
3. Run on Android:
   ```bash
   npm run android
   ```
   Or on iOS:
   ```bash
   npm run ios
   ```

## Notes
- Uses [NewsAPI](https://newsapi.org/) for news search (free API key required)
- Brain teasers and positive news are linked from external sites
