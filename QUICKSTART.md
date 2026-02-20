# Quick Start Guide

## ⚡ 5-Minute Setup

### Windows Users
```bash
# Run setup script
setup.bat
```

### macOS/Linux Users
```bash
# Make script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

### Manual Setup (All Platforms)

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm start
```

Backend will run on `http://localhost:5000`

#### 2. Frontend Setup (Open new terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Frontend will open at `http://localhost:3000`

---

## 🐳 Docker Quick Start

```bash
# Build and run all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

App will be available at `http://localhost:3000`

---

## 🔍 Verify Installation

### Test Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"OK","timestamp":"..."}
```

### Test Frontend
Open `http://localhost:3000` in browser - you should see the dashboard

---

## 📊 First Steps

1. **View Dashboard:** Shows overview KPIs and alerts
2. **Explore Map:** Click on dam markers to see risk details
3. **Check Analytics:** View rainfall and risk trend charts
4. **Filter by State:** Use sidebar to filter dams by region

---

## ❓ Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Dependencies Won't Install
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Errors
1. Ensure backend is running: `npm start` in backend folder
2. Check `.env` files are properly configured
3. Verify internet connection (for external APIs)

---

**Next:** Read `README.md` for full documentation
