# Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel + Render (Recommended)

**Pros:** Free tier available, automatic deployments, easy scaling

#### Step 1: Deploy Backend to Render

1. Push your repository to GitHub
2. Go to https://render.com and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** `flood-warning-backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`

6. Click "Advanced" and add Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   ```

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Copy the deployed URL (e.g., `https://flood-warning-backend.onrender.com`)

#### Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework:** React
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. Click "Environment Variables" and add:
   ```
   REACT_APP_API_URL=https://flood-warning-backend.onrender.com/api
   ```
   (Replace with your actual Render URL)

6. Click "Deploy"
7. Wait for deployment (3-5 minutes)

**Result:** Your app will be live at your Vercel domain!

---

### Option 2: Railway (Alternative Free Option)

**Pros:** Simple GitHub integration, quick setup

#### Backend Deployment

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Click "Add Services" → "Node.js"
5. Configure environment variables in Railway dashboard
6. Deploy

#### Frontend Deployment

1. Create a separate Railway project for frontend
2. Configure with React build settings
3. Set environment variables
4. Deploy

---

### Option 3: Heroku (Previously Popular, Now Paid)

Heroku no longer offers free tier as of November 2022.

---

### Option 4: Self-Hosted (VPS)

#### Prerequisites
- VPS with Ubuntu 20.04+ (AWS, DigitalOcean, Linode, etc.)
- SSH access
- Domain name (optional)

#### Setup

1. **Connect to VPS:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository:**
   ```bash
   git clone https://github.com/your-username/repo.git
   cd repo/backend
   npm install
   ```

5. **Start Backend with PM2:**
   ```bash
   pm2 start server.js --name "flood-backend"
   pm2 save
   pm2 startup
   ```

6. **Install Nginx (Reverse Proxy):**
   ```bash
   sudo apt-get install nginx
   ```

7. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Add:
   ```nginx
   server {
       listen 80 default_server;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location / {
           root /var/www/html;
           try_files $uri /index.html;
       }
   }
   ```

8. **Build and Deploy Frontend:**
   ```bash
   cd frontend
   npm run build
   sudo cp -r build/* /var/www/html/
   ```

9. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

10. **Enable SSL (Let's Encrypt):**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

---

## 📦 Docker Deployment

### Create Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Create Frontend Dockerfile

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Create Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - FRONTEND_URL=http://localhost:3000
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Deploy with Docker

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

---

## 🔐 Security Checklist

- [ ] Enable HTTPS/SSL certificate
- [ ] Set secure environment variables
- [ ] Enable CORS for production domain only
- [ ] Use rate limiting in production
- [ ] Regular security updates
- [ ] Monitor API usage
- [ ] Set up error logging
- [ ] Enable GZIP compression
- [ ] Add security headers (Helmet.js)
- [ ] Regular backups

---

## 📊 Monitoring

### Add Monitoring (Optional)

For production deployments, consider:
- **Uptime Robot:** Monitor if server is running
- **Sentry:** Error tracking
- **LogRocket:** Frontend error monitoring
- **DataDog:** Infrastructure monitoring

---

## 🚨 Troubleshooting Deployment

### Backend not responding
```bash
# Check if server is running
curl https://your-backend-url/api/health

# Check logs
pm2 logs flood-backend  # If using PM2
docker logs container-name  # If using Docker
```

### Frontend showing API errors
- Verify backend URL in .env
- Check CORS configuration
- Ensure backend is running
- Check network tab in browser DevTools

### Database connection issues
- Verify database is running
- Check connection string
- Verify credentials

---

## 💰 Estimated Costs

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | ✓ Frontend | $20+/month |
| Render | ✓ Backend (0.5GB RAM) | $12+/month |
| Railway | Limited | $5+/month |
| DigitalOcean | ✗ | $5+/month |
| AWS | Limited | $5-50+/month |

**Recommended Free Stack:** Vercel (Frontend) + Render (Backend)

---

## 📞 Support

If deployment fails:
1. Check service status pages
2. Review error logs
3. Verify environment variables
4. Test API endpoints locally first

---

**Version:** 1.0.0  
**Last Updated:** February 18, 2026
