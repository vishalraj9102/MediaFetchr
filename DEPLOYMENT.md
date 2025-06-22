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
│   └── package.json
├── render.yaml
└── README.md
```

### Step 2: Render Configuration

#### Option A: Using render.yaml (Recommended)
The `render.yaml` file is already configured with:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`
- **Node Version**: 20.x

#### Option B: Manual Configuration
If you prefer to configure manually in Render dashboard:

**Build Command:**
```bash
cd frontend && npm install && npm run build
```

**Publish Directory:**
```
frontend/build
```

**Environment Variables:**
- `NODE_VERSION`: `20.0.0`
- `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api` (set this when you deploy the backend)

### Step 3: Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Static Site"**
3. **Connect your GitHub repository**
4. **The render.yaml will be automatically detected and used**

### Step 4: Set Environment Variables

In your Render service settings, add:
- `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api`

### Step 5: Deploy Backend Later

When you're ready to deploy the backend:
1. Create a new Web Service for the backend
2. Update the `REACT_APP_API_URL` environment variable to point to your backend URL
3. The frontend will automatically connect to the new backend

## Troubleshooting

### Build Fails with "index.html not found"
- The build command should be: `cd frontend && npm install && npm run build`
- The publish directory should be: `frontend/build`
- Verify that `frontend/public/index.html` exists in your repository

### API Calls Fail
- Set the `REACT_APP_API_URL` environment variable to your backend URL
- Make sure your backend is deployed and accessible
- Check CORS settings on your backend

### Static Assets Not Loading
- Verify that all assets are in the `frontend/public` directory
- Check that the build process completed successfully
- Ensure the publish directory is set to `frontend/build`

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