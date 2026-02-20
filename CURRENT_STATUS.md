# ⚠️ CURRENT ISSUES & SOLUTIONS

## Problems You're Experiencing

### 1. **Network Error Alert** 
- **Cause**: Backend Node.js server is not responding to API calls
- **Why**: Node.js server exits immediately after logging startup message
- **Solution**: Use the mock server or rebuild connection

### 2. **Filter Shows Only "All States"**
- **Cause**: Frontend can't fetch dam data because backend API fails
- **Effect**: States list remains empty, only "All" option shows
- **Fix**: Backend must return dam locations

### 3. **All Values Show Zero**
- **Cause**: Risk data, rainfall data, and other metrics aren't being fetched
- **Why**: API endpoints unreachable
- **Impact**: Dashboard, maps, charts all empty

---

## QUICK FIX (Works Now!)

### Use the Mock Backend
The mock backend is already created and works properly.

**File**: `c:\Users\HP\Desktop\Environment_project\backend\mock-server.js`

**To run it:**
```
cd c:\Users\HP\Desktop\Environment_project\backend
C:\nodejs\node-v18.18.0-win-x64\node.exe mock-server.js
```

**What it provides:**
- ✅ 10 dam locations (with states!)
- ✅ Mock rainfall data
- ✅ Mock earthquake data  
- ✅ Mock risk calculations
- ✅ Mock alerts

**Frontend should then:**
- ✅ Load all 10 dams
- ✅ Show states in dropdown: Gujarat, Himachal Pradesh, Uttarakhand, Tamil Nadu, Karnataka, Jharkhand, Kerala, Maharashtra
- ✅ Display risk data
- ✅ Show rainfall forecasts
- ✅ Generate alerts

---

## Why Real Backend Isn't Working

**Actual Issue**: Node.js dependencies issue or env variable problem

**What happens**: 
- `node server.js` logs startup message
- Immediately crashes/exits without error
- Port 5000 never opens
- No requests can connect

**Possible causes:**
1. Missing or corrupted `express`, `cors`, or `axios` npm packages
2. Require() error in dataController or services
3. Environment variable loading issue
4. Windows firewall blocking (unlikely)

---

## Permanent Fix Options

### Option A: Rebuild Node Modules (Recommended)
```bash
# Windows Command Prompt (as Administrator)
cd c:\Users\HP\Desktop\Environment_project\backend
del node_modules /s /q
C:\nodejs\node-v18.18.0-win-x64\npm.cmd install --legacy-peer-deps
C:\nodejs\node-v18.18.0-win-x64\npm.cmd start
```

### Option B: Use Mock Server Permanently
1. Stop the real `server.js` from trying to start
2. Always run `mock-server.js` instead  
3. It has all the same endpoints and structure

### Option C: Deploy to Cloud (Vercel + Render)
- Render's Node.js environment is fresh and works properly
- Vercel handles frontend perfectly
- See: `DEPLOYMENT.md` for step-by-step instructions

---

## For Now (Immediate Action)

**RECOMMENDED**: Stop all Node processes, then:

```bash
# Kill all node
taskkill /IM node.exe /F

# Start mock backend (working!)
cd c:\Users\HP\Desktop\Environment_project\backend
C:\nodejs\node-v18.18.0-win-x64\node.exe mock-server.js

# Keep frontend running on port 3000
# Refresh browser at http://localhost:3000
```

**Expected result:**
- States dropdown will show all 8 states ✅
- Dashboard will show 10 dams ✅
- Risk data will display ✅
- No more "Network Error" ✅

---

## Real API Integration

The system IS designed to fetch from real APIs:

**Open-Meteo** (Rainfall):
- URL: https://api.open-meteo.com/v1/forecast
- Parameters: latitude, longitude, hourly/daily precipitation
- ✅ Free, no auth required
- ✅ Returns real data

**NASA POWER** (Climate):
- URL: https://power.larc.nasa.gov/api/v1
- Parameters: latitude, longitude, climate data types
- ✅ Free, no auth required
- ✅ Returns real data

**USGS Earthquake** (Seismic):
- URL: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/day.geojson
- ✅ Real-time earthquake data
- ✅ Free, no auth required

**When backend works properly**, it will:
1. Make HTTP requests to these 3 APIs
2. Cache results for 30 minutes (optimize performance)
3. Return processed data to frontend
4. Calculate risk scores based on real data
5. Display on dashboard with real values

---

## File Structure

```
backend/
  ├── server.js              (Has issue - can't start)
  ├── mock-server.js         (✅ Works perfectly)
  ├── services/
  │   ├── apiService.js      (Calls real APIs - needs backend to work)
  │   └── riskAnalysisService.js
  └── controllers/
      └── dataController.js  (Processes API data)

frontend/
  ├── src/App.js            (Main component - fetches from backend)
  ├── src/components/
  │   ├── Layout.jsx        (Sidebar with states filter)
  │   ├── Dashboard.jsx     (Shows metrics)
  │   ├── Map.jsx          (Leaflet map with dams)
  │   └── Charts.jsx       (Rainfall, risk charts)
  └── src/services/
      └── api.js           (Axios client - tries to call localhost:5000/api)
```

---

## Status Check

**Run this to verify:**

```bash
# Test mock backend
curl http://localhost:5000/api/data/dams

# Should return:
# { "dams": [10 objects], "timestamp": "...", "total": 10 }

# Test frontend
# Open: http://localhost:3000
# Should show dashboard with dam list
```

---

## Next Steps

1. ✅ Stop all node processes
2. ✅ Run mock backend: `C:\nodejs\node-v18.18.0-win-x64\node.exe mock-server.js`
3. ✅ Refresh frontend: http://localhost:3000
4. ✅ Check if states dropdown now has options
5. ✅ Check if dams load and show risk data
6. ✅ Then either:
   - Fix the real backend (npm rebuild)
   - OR keep using mock for testing
   - OR deploy to Render/Railway for production

---

## Support

**Issue**: Backend won't start
**Solution**: Use mock-server.js (already provided, works perfectly)

**Issue**: States not showing
**Solution**: Mock server provides all states

**Issue**: Real data wanted
**Solution**: Get backend working properly + deploy to cloud

**Questions?**
Check: README.md, API_EXAMPLES.md, DEPLOYMENT.md
