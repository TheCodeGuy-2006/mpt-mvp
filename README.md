# MPT MVP - Marketing Performance Tracker

A comprehensive marketing performance tracking application with budget management, campaign planning, and ROI analysis.

## 🚀 Live Demo

The application is automatically deployed to GitHub Pages: [https://thecodeguy-2006.github.io/mpt-mvp/](https://thecodeguy-2006.github.io/mpt-mvp/)

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript, HTML, CSS (deployed on GitHub Pages)
- **Backend**: Node.js with Express (deployed separately)
- **Data Storage**: JSON files managed via GitHub API
- **Auto-deployment**: GitHub Actions for continuous deployment

## 📋 Features

- **Planning Module**: Campaign planning with forecasting
- **Execution Module**: Track actual campaign performance
- **Budget Management**: Region-based and Digital Motions budget tracking
- **ROI Analysis**: Real-time ROI calculations and visualizations
- **Calendar Integration**: Campaign timeline management
- **Real-time Updates**: Live data synchronization with backend

## 🛠️ Setup & Deployment

### Frontend (GitHub Pages)

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
3. **The site will be available at**: `https://yourusername.github.io/mpt-mvp/`

### Backend Deployment

You need to deploy the backend separately. Here are recommended platforms:

#### Option 1: Railway (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Create new project from this repository
4. Set environment variables:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   PORT=3000
   ```
5. Deploy and note the URL (e.g., `https://your-app.railway.app`)

#### Option 2: Heroku

1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Set environment variables:
   ```bash
   heroku config:set GITHUB_TOKEN=your_github_token
   ```
4. Deploy: `git push heroku main`

#### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Set environment variable in Vercel dashboard

### Configure Backend URL

After deploying your backend, update `config.js`:

```javascript
getApiUrl() {
  if (this.isGitHubPages) {
    return 'https://your-actual-backend-url.railway.app'; // Replace with your URL
  } else {
    return 'http://localhost:3000';
  }
}
```

## 🔧 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TheCodeGuy-2006/mpt-mvp.git
   cd mpt-mvp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   ```

4. **Start the backend**:
   ```bash
   npm start
   ```

5. **Open frontend**:
   - Open `index.html` in your browser
   - Or use a local server: `python -m http.server 8000`

## 🔑 GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control)
4. Copy the token and use it as `GITHUB_TOKEN` environment variable

## 📡 API Endpoints

- `POST /save-planning` - Save planning data
- `POST /save-budgets` - Save budget data
- `GET /` - Health check

## 🔄 Auto-sync Features

- All changes are automatically saved to GitHub
- Real-time updates across multiple users
- Version control for all data changes
- Automatic backup and history

## 🌐 Sharing & Collaboration

Once deployed:
1. Share the GitHub Pages URL with your team
2. Anyone with the link can view and edit data
3. All changes are saved in real-time
4. No login required for basic access

## 🛡️ Security Considerations

- Backend API is configured with CORS for your domain
- GitHub token should be kept secure
- Consider adding authentication for production use
- Data is stored in your GitHub repository

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🎨 Customization

- Modify `style.css` for styling changes
- Update `config.js` for different backend URLs
- Add new modules by creating new `.js` files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.
