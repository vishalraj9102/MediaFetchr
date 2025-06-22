# MediaFetchr Frontend Deployment Guide

## Deploying to Render (Frontend Only)

### Step 1: Prepare Your Repository
Make sure your repository structure looks like this:
```
MediaFetchr/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json
│   ├── build.sh
│   └── render.yaml
├── render.yaml
├── package.json
└── README.md
```

### Step 2: Deployment Options

#### Option A: Deploy from Root Directory (Recommended)
1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Static Site"**
3. **Connect your GitHub repository**
4. **The root `render.yaml` will be automatically detected**

#### Option B: Deploy from Frontend Directory
1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Static Site"**
3. **Connect your GitHub repository**
4. **Set Root Directory to**: `frontend`
5. **The frontend `render.yaml` will be automatically detected**

#### Option C: Manual Configuration
If the render.yaml files don't work, configure manually:

**For Root Directory Deployment:**
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`

**For Frontend Directory Deployment:**
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

### Step 3: Set Environment Variables

In your Render service settings, add:
- `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api`

### Step 4: Deploy Backend Later

When you're ready to deploy the backend:
1. Create a new Web Service for the backend
2. Update the `REACT_APP_API_URL` environment variable to point to your backend URL
3. The frontend will automatically connect to the new backend

## Troubleshooting

### Build Fails with "index.html not found"
**Try these solutions in order:**

1. **Use Option B**: Deploy from frontend directory
   - Set Root Directory to `frontend` in Render
   - Use build command: `npm install && npm run build`
   - Use publish directory: `build`

2. **Use Option C**: Manual configuration
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`

3. **Check file structure**:
   - Verify `frontend/public/index.html` exists
   - Verify `frontend/package.json` exists

### API Calls Fail
- Set the `REACT_APP_API_URL` environment variable to your backend URL
- Make sure your backend is deployed and accessible
- Check CORS settings on your backend

### Static Assets Not Loading
- Verify that all assets are in the `frontend/public` directory
- Check that the build process completed successfully
- Ensure the publish directory is set correctly

## Development vs Production

### Local Development
```bash
cd frontend
npm start
```
- Uses `http://localhost:3000`
- API calls go to `http://localhost:5000/api`

### Production (Render)
- Served as static files
- API calls go to your deployed backend URL
- Configure via `REACT_APP_API_URL` environment variable

## Recommended Approach

**Start with Option B (Deploy from Frontend Directory)** as it's the most reliable:
1. Set Root Directory to `frontend`
2. Use the frontend `render.yaml` configuration
3. This ensures all paths are relative to the frontend directory 