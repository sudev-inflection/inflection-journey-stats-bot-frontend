# Deployment Instructions

## Netlify Deployment

### 1. Build Configuration
The project is configured to work with Netlify out of the box. The following files handle the configuration:

- `netlify.toml` - Main Netlify configuration
- `public/_redirects` - SPA routing configuration
- `public/_headers` - MIME type configuration

### 2. Environment Variables
Set these environment variables in your Netlify dashboard:

```
VITE_OPENAI_API_KEY=your-actual-openai-api-key
VITE_MCP_SERVER_URL=your-mcp-server-url
VITE_OPENAI_MODEL=gpt-4
```

### 3. Build Settings
- **Build command**: `yarn build`
- **Publish directory**: `dist`
- **Node version**: 18 or higher

### 4. Deploy
1. Connect your repository to Netlify
2. Set the environment variables
3. Deploy

## Vercel Deployment (Alternative)

### 1. Configuration
The project includes `vercel.json` for Vercel deployment.

### 2. Environment Variables
Set the same environment variables in Vercel dashboard.

### 3. Deploy
```bash
npm i -g vercel
vercel
```

## Local Production Testing

### Using Express Server
```bash
yarn build
yarn start
```

### Using Vite Preview
```bash
yarn build
yarn preview
```

## Troubleshooting

### MIME Type Errors
If you see "Failed to fetch" or MIME type errors:
1. Ensure `netlify.toml` is in the root directory
2. Check that `public/_headers` file exists
3. Verify environment variables are set

### SPA Routing Issues
If direct URLs don't work:
1. Ensure `public/_redirects` file exists
2. Check `netlify.toml` redirects configuration

### Build Failures
1. Check Node.js version (18+ required)
2. Ensure all dependencies are installed
3. Check for TypeScript errors 