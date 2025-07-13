# MPT MVP - Marketing Planning Tool

A comprehensive marketing planning and budget management tool with GitHub Pages deployment and Cloudflare Worker integration for automatic data synchronization.

## 🚀 Live Demo

Visit the live application: **https://jordanradford.github.io/mpt-mvp/**

## ✨ Features

- **📊 Planning Module** - Manage marketing campaigns, forecasts, and KPIs
- **💰 Budget Management** - Track budget allocation and utilization
- **📈 ROI Analysis** - Calculate and monitor return on investment
- **📅 Calendar Integration** - Plan and schedule marketing activities
- **💾 Auto-Save** - Automatic synchronization to GitHub via Cloudflare Worker
- **🔄 Real-time Sync** - Changes saved instantly with visual feedback
- **📱 Responsive Design** - Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (GitHub Pages)

- Static HTML/CSS/JavaScript application
- Deployed automatically via GitHub Actions
- Responsive design with modern UI components

### Backend (Cloudflare Worker)

- Serverless API for GitHub integration
- Secure token handling and CORS support
- Auto-save functionality with debouncing

### Data Storage (GitHub Repository)

- JSON files stored in `/data` folder
- Version-controlled with complete audit trail
- Automatic commits for all changes

## 🚀 Quick Setup

### Option 1: Use the Live Version

1. Visit https://jordanradford.github.io/mpt-mvp/
2. Use the application with local storage
3. Optionally set up Cloudflare Worker for GitHub sync

### Option 2: Deploy Your Own Copy

1. **Fork this repository**
2. **Enable GitHub Pages** in repository settings
3. **Set up Cloudflare Worker** (optional, for auto-save)
4. **Configure GitHub token** for data synchronization

For detailed setup instructions, see [`QUICK_SETUP.md`](QUICK_SETUP.md).

## 📁 Project Structure

```
mpt-mvp/
├── index.html              # Main application page
├── app.js                  # Application logic and GitHub sync
├── planning.js             # Planning module
├── budgets.js              # Budget management
├── roi.js                  # ROI analysis
├── calendar.js             # Calendar functionality
├── style.css               # Application styles
├── src/
│   ├── calc.js            # KPI calculations
│   └── cloudflare-sync.js # Auto-save functionality
├── data/
│   ├── planning.json      # Planning data
│   └── budgets.json       # Budget data
├── .github/workflows/
│   └── deploy.yml         # GitHub Actions deployment
├── cloudflare-worker.js   # Cloudflare Worker code
└── docs/                  # Setup and troubleshooting guides
```

## 🔧 Local Development

### Prerequisites

- Node.js (for local server, optional)
- Modern web browser
- Git

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/jordanradford/mpt-mvp.git
   cd mpt-mvp
   ```

2. **Install dependencies** (optional, for local server)

   ```bash
   npm install
   ```

3. **Start local server** (optional)

   ```bash
   npm start
   ```

4. **Open in browser**
   - With server: http://localhost:3000
   - Without server: Open `index.html` directly

## 🌐 GitHub Pages Deployment

This repository is configured for automatic deployment to GitHub Pages:

1. **Enable GitHub Pages** in repository settings
2. **Push changes** to the main branch
3. **GitHub Actions** automatically deploys the site
4. **Access your site** at `https://yourusername.github.io/mpt-mvp/`

The deployment workflow is defined in `.github/workflows/deploy.yml`.

## ☁️ Cloudflare Worker Integration

For automatic data synchronization to GitHub:

### Quick Setup

1. **Create GitHub token** with `repo` permissions
2. **Deploy Cloudflare Worker** using `cloudflare-worker.js`
3. **Configure environment variables** in Cloudflare dashboard
4. **Test connection** in the GitHub Sync tab

### Detailed Setup

See the comprehensive setup guides:

- [`QUICK_SETUP.md`](QUICK_SETUP.md) - 5-minute setup guide
- [`CLOUDFLARE_WORKER_SETUP.md`](CLOUDFLARE_WORKER_SETUP.md) - Detailed instructions
- [`GITHUB_TOKEN_SETUP.md`](GITHUB_TOKEN_SETUP.md) - Token creation guide

## 📖 Documentation

- **[Quick Setup Guide](QUICK_SETUP.md)** - Get started in 5 minutes
- **[Cloudflare Worker Setup](CLOUDFLARE_WORKER_SETUP.md)** - Detailed Worker configuration
- **[GitHub Token Setup](GITHUB_TOKEN_SETUP.md)** - Token creation and security
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical overview

## 🔍 Testing

### Demo Page

Use `demo.html` to test your Cloudflare Worker integration:

1. Open `demo.html` in your browser
2. Enter your Worker URL
3. Test health check and save operations

### Manual Testing

1. **Health Check**: `curl https://your-worker.workers.dev/health`
2. **Save Test**: Use the demo page or browser console
3. **Integration Test**: Make changes in the app and verify GitHub commits

## 🛠️ Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Tables**: Tabulator.js for interactive data grids
- **Charts**: Chart.js for data visualization
- **Backend**: Cloudflare Workers (serverless)
- **Storage**: GitHub repository (JSON files)
- **Deployment**: GitHub Actions + GitHub Pages
- **Security**: Encrypted environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. **Check the documentation** - Most common issues are covered
2. **Review troubleshooting guide** - [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
3. **Test with demo page** - Use `demo.html` for isolated testing
4. **Check browser console** - Look for JavaScript errors
5. **Verify Cloudflare logs** - Check Worker execution logs

## 🎯 Features Roadmap

- [ ] Multi-user collaboration
- [ ] Advanced reporting and analytics
- [ ] Integration with external marketing tools
- [ ] Mobile app version
- [ ] Advanced budget forecasting
- [ ] Custom KPI definitions

---

**Live Demo**: https://jordanradford.github.io/mpt-mvp/

**Documentation**: Start with [`QUICK_SETUP.md`](QUICK_SETUP.md) for immediate setup.
