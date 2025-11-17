# Deploying Is He Dead Yet to Netlify

This guide provides step-by-step instructions for deploying your React web app to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account (sign up free at [netlify.com](https://netlify.com))
- Your NewsAPI.org API key

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push Your Code to GitHub

1. Initialize a git repository (if not already done):
```bash
cd /Users/jamesbeach/Documents/visual-studio-code/github-copilot/IsHe/web
git init
```

2. Create a new repository on GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name it `is-he-dead-yet`
   - Don't initialize with README (you already have files)
   - Click "Create repository"

3. Add and commit your files:
```bash
git add .
git commit -m "Initial commit - React web app"
```

4. Connect to GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/is-he-dead-yet.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Netlify

1. **Log in to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Sign in with GitHub

2. **Create a New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify to access your repositories

3. **Select Your Repository**
   - Find and click `is-he-dead-yet`

4. **Configure Build Settings**
   - **Base directory:** `web`
   - **Build command:** `npm run build`
   - **Publish directory:** `web/build`
   - Click "Show advanced" → "New variable"

5. **Add Environment Variables**
   - Variable name: `REACT_APP_NEWS_API_KEY`
   - Value: Your actual NewsAPI.org API key
   - Click "Add"

6. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes for the build to complete

7. **Your Site is Live!**
   - Netlify will assign a URL like `random-name-123.netlify.app`
   - You can customize it: Site settings → Domain management → Options → Edit site name

### Step 3: Configure Custom Domain (Optional)

1. In Netlify, go to "Domain settings"
2. Click "Add custom domain"
3. Follow instructions to connect your domain
4. Netlify provides free HTTPS automatically

---

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This opens a browser window to authorize the CLI.

### Step 3: Initialize and Deploy

1. Navigate to your project:
```bash
cd /Users/jamesbeach/Documents/visual-studio-code/github-copilot/IsHe/web
```

2. Initialize Netlify:
```bash
netlify init
```

3. Follow the prompts:
   - Create & configure a new site
   - Choose your team
   - Give your site a name
   - Build command: `npm run build`
   - Directory to deploy: `build`

4. Set environment variable:
```bash
netlify env:set REACT_APP_NEWS_API_KEY "your_api_key_here"
```

5. Deploy:
```bash
netlify deploy --prod
```

---

## Method 3: Manual Drag & Drop

### Step 1: Build Your Project Locally

1. Make sure you have your API key in `.env`:
```bash
cd /Users/jamesbeach/Documents/visual-studio-code/github-copilot/IsHe/web
echo "REACT_APP_NEWS_API_KEY=your_api_key" > .env
```

2. Build the project:
```bash
npm install
npm run build
```

### Step 2: Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the `build` folder onto the deployment area
3. Your site will be live in seconds!

**Note:** This method doesn't connect to GitHub, so updates require manual rebuilds and re-uploads.

---

## Post-Deployment

### Update Your App

If you deployed via GitHub:
1. Make changes to your code
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Description of changes"
git push
```
3. Netlify automatically rebuilds and deploys!

If you deployed manually:
1. Make changes
2. Run `npm run build`
3. Drag the new `build` folder to Netlify

### Monitor Your Site

- **Build logs:** Check for errors in the Netlify dashboard
- **Analytics:** Enable Netlify Analytics (paid feature)
- **Forms:** Enable form submissions if needed
- **Functions:** Add serverless functions for API key security (advanced)

### Troubleshooting

**Build fails?**
- Check build logs in Netlify dashboard
- Verify environment variables are set correctly
- Make sure `package.json` has all dependencies

**API not working?**
- Verify `REACT_APP_NEWS_API_KEY` is set in Netlify environment variables
- Check NewsAPI.org quota (free tier = 100 requests/day)
- Check browser console for errors

**Site not updating?**
- Clear Netlify cache: Deploys → Trigger deploy → Clear cache and deploy

---

## Security Best Practices

### Important: Protect Your API Key

The current setup exposes your API key in the browser. For production:

1. **Create a Netlify Function** (recommended):
   - Move API calls to a serverless function
   - Keep API key secure on the server
   - Frontend calls your function instead of NewsAPI directly

2. **Rate Limiting:**
   - Implement rate limiting to prevent abuse
   - Monitor API usage on NewsAPI.org dashboard

3. **Alternative:** Use a backend service:
   - Create a simple Node.js/Express backend
   - Deploy backend separately (Heroku, Railway, etc.)
   - Frontend calls your backend, which calls NewsAPI

---

## Cost

- **Netlify:** Free tier includes:
  - 100GB bandwidth/month
  - Unlimited sites
  - Continuous deployment
  - HTTPS
  - 300 build minutes/month

- **NewsAPI.org:** Free tier includes:
  - 100 requests/day
  - Development only (not for production)
  - Consider upgrading ($449/month) for production

---

## Next Steps

1. ✅ Deploy your site
2. Test the celebrity lookup feature
3. Share the URL with friends
4. Consider adding:
   - More news sources
   - Better error handling
   - Loading states
   - User favorites
   - Social sharing

---

## Useful Commands

```bash
# Install dependencies
npm install

# Run locally
npm start

# Build for production
npm run build

# Deploy with Netlify CLI
netlify deploy --prod

# View Netlify logs
netlify logs

# Open site in browser
netlify open:site
```

---

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [React Documentation](https://react.dev/)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)

---

## Support

- Netlify Community: [community.netlify.com](https://community.netlify.com/)
- React Community: [react.dev/community](https://react.dev/community)

**Happy deploying! 🚀**
