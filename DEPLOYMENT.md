# Deployment Instructions for BookVault Pro

This document provides instructions for deploying the BookVault Pro PDF reader application to various environments.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Local Development Deployment

1. Clone the repository:
   ```
   git clone <repository-url>
   cd pdf-reader-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

   This will start both the backend server (on port 5000) and the React development server (on port 3000).

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Production Deployment

### Option 1: Deploy to a VPS or Dedicated Server

1. Clone the repository on your server:
   ```
   git clone <repository-url>
   cd pdf-reader-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the React application:
   ```
   npm run build
   ```

4. Start the production server:
   ```
   NODE_ENV=production npm start
   ```

   Or use the production script:
   ```
   npm run prod
   ```

5. The application will be available at:
   ```
   http://your-server-ip:5000
   ```

6. For production use, it's recommended to set up a reverse proxy (like Nginx) and use a process manager (like PM2).

### Option 2: Deploy to Heroku

1. Create a Heroku account and install the Heroku CLI.

2. Login to Heroku:
   ```
   heroku login
   ```

3. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```

4. Add a Procfile to the root of your project:
   ```
   web: npm run prod
   ```

5. Commit your changes:
   ```
   git add .
   git commit -m "Add Heroku deployment files"
   ```

6. Push to Heroku:
   ```
   git push heroku main
   ```

7. Your app will be available at:
   ```
   https://your-app-name.herokuapp.com
   ```

### Option 3: Deploy to Vercel or Netlify (Frontend Only)

For this option, you'll need to deploy the backend separately.

1. Deploy the backend to a server or a service like Heroku.

2. Update the API endpoints in the frontend code to point to your backend URL.

3. Deploy the frontend to Vercel or Netlify following their documentation.

## Environment Variables

The following environment variables can be configured:

- `PORT`: The port on which the server will run (default: 5000)
- `NODE_ENV`: The environment mode ('development' or 'production')

## Database

The application uses SQLite, which stores the database in a file. In production, you might want to:

1. Regularly backup the `pdfreader.db` file
2. Consider migrating to a more robust database like PostgreSQL or MySQL for high-traffic scenarios

## File Storage

Uploaded PDFs are stored in the `uploads` directory. Make sure this directory:

1. Has appropriate permissions
2. Is included in your backup strategy
3. Has sufficient disk space

For production with many files, consider using a cloud storage solution like AWS S3.

## Security Considerations

1. The authentication is currently based on a simple code. For production, consider implementing a more robust authentication system.
2. Ensure your server has HTTPS enabled.
3. Regularly update dependencies to patch security vulnerabilities.

## Troubleshooting

If you encounter issues during deployment:

1. Check the server logs
2. Ensure all dependencies are installed
3. Verify that the database file is writable
4. Check that the uploads directory exists and is writable 