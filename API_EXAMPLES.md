# API Usage Examples

## Testing API Endpoints

Use curl, Postman, or any HTTP client to test these endpoints.

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-02-18T10:30:00.000Z"
}
```

---

## Data Endpoints

### Get All Dam Locations

```bash
curl http://localhost:5000/api/data/dams
```

Response:
```json
{
  "dams": [
    {
      "id": "sardar-sarovar",
      "name": "Sardar Sarovar",
      "latitude": 21.819,
      "longitude": 73.387,
      "state": "Gujarat",
      "capacity": 163,
      "river": "Narmada"
    },
    ...
  ],
  "timestamp": "2024-02-18T10:30:00.000Z",
  "total": 10
}
```

### Get Rainfall Data

```bash
curl "http://localhost:5000/api/data/rainfall?latitude=20.5937&longitude=78.9629"
```

Response:
```json
{
  "forecast": {
    "location": { "latitude": 20.5937, "longitude": 78.9629 },
    "hourly": { ... },
    "daily": {
      "time": ["2024-02-18"],
      "precipitation_sum": [15.2]
    },
    "timestamp": "2024-02-18T10:30:00.000Z"
  },
  "historical": { ... }
}
```

### Get Earthquake Data

```bash
# Within 500km radius (default)
curl "http://localhost:5000/api/data/earthquakes?latitude=20.5937&longitude=78.9629&radius=500"

# Custom radius
curl "http://localhost:5000/api/data/earthquakes?latitude=20.5937&longitude=78.9629&radius=1000"
```

Response:
```json
{
  "center": { "latitude": 20.5937, "longitude": 78.9629 },
  "radius": 500,
  "earthquakes": [
    {
      "id": "us1000abc1",
      "magnitude": 4.5,
      "depth": 10,
      "place": "xyz region",
      "time": "2024-02-18T08:30:00.000Z",
      "coordinates": { "latitude": 21.5, "longitude": 75.3 }
    }
  ],
  "timestamp": "2024-02-18T10:30:00.000Z",
  "total": 3
}
```

### Get Reservoir Levels

```bash
curl http://localhost:5000/api/data/reservoirs
```

Response:
```json
{
  "dams": [
    {
      "id": "sardar-sarovar",
      "name": "Sardar Sarovar",
      "currentLevel": 87.5,
      "capacity": 163,
      "lastUpdated": "2024-02-18T10:30:00.000Z",
      "trend": "increasing"
    },
    ...
  ],
  "timestamp": "2024-02-18T10:30:00.000Z",
  "total": 10
}
```

### Get All Environmental Data

```bash
curl "http://localhost:5000/api/data/all?latitude=20.5937&longitude=78.9629"
```

Response:
```json
{
  "rainfall": { ... },
  "earthquakes": { ... },
  "reservoirs": { ... },
  "dams": { ... },
  "timestamp": "2024-02-18T10:30:00.000Z"
}
```

---

## Risk Endpoints

### Calculate Risk for Specific Dam

```bash
curl -X POST http://localhost:5000/api/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{"damId": "sardar-sarovar", "state": "Gujarat"}'
```

Response:
```json
{
  "dam": {
    "id": "sardar-sarovar",
    "name": "Sardar Sarovar",
    "state": "Gujarat",
    "river": "Narmada",
    "capacity": 163,
    "coordinates": { "latitude": 21.819, "longitude": 73.387 }
  },
  "floodRisk": {
    "current": {
      "score": 65,
      "level": "MEDIUM",
      "factors": [
        "High reservoir level (85%)",
        "Moderate rainfall expected (50-80mm)",
        "Rainfall trend increasing (moderate)"
      ],
      "timestamp": "2024-02-18T10:30:00.000Z"
    },
    "prediction24h": {
      "current": 65,
      "predicted24h": 75,
      "trend": "increasing",
      "change": 10
    }
  },
  "landslideRisk": {
    "current": {
      "score": 35,
      "level": "LOW",
      "factors": ["Moderate rainfall accumulation (50-100mm)"],
      "timestamp": "2024-02-18T10:30:00.000Z"
    },
    "prediction24h": {
      "current": 35,
      "predicted24h": 38,
      "trend": "stable",
      "change": 3
    }
  },
  "environmentalData": {
    "rainfall": {
      "forecast": 55.2,
      "accumulation": 62.1
    },
    "earthquakes": {
      "recentCount": 2,
      "maxMagnitude": 4.2
    },
    "reservoir": {
      "level": 87.5,
      "trend": "increasing"
    }
  },
  "alerts": [
    {
      "id": "flood-1708239000000",
      "type": "FLOOD",
      "severity": "MEDIUM",
      "location": "Sardar Sarovar",
      "message": "⚡ MODERATE FLOOD RISK at Sardar Sarovar. Monitor conditions.",
      "score": 65,
      "timestamp": "2024-02-18T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-02-18T10:30:00.000Z"
}
```

### Get All Risks

```bash
curl http://localhost:5000/api/risk/all
```

Response:
```json
{
  "risks": [
    {
      "dam": {
        "id": "sardar-sarovar",
        "name": "Sardar Sarovar",
        "state": "Gujarat",
        "coordinates": { "latitude": 21.819, "longitude": 73.387 }
      },
      "floodRisk": "MEDIUM",
      "floodScore": 65,
      "landslideRisk": "LOW",
      "landslideScore": 35,
      "overallRisk": 65
    },
    {
      "dam": {
        "id": "bhakra-nangal",
        "name": "Bhakra Nangal",
        "state": "Himachal Pradesh",
        "coordinates": { "latitude": 31.519, "longitude": 76.395 }
      },
      "floodRisk": "LOW",
      "floodScore": 25,
      "landslideRisk": "MEDIUM",
      "landslideScore": 55,
      "overallRisk": 55
    }
  ],
  "timestamp": "2024-02-18T10:30:00.000Z",
  "total": 10
}
```

### Get Alerts

```bash
# All alerts
curl http://localhost:5000/api/risk/alerts

# High severity only
curl "http://localhost:5000/api/risk/alerts?severity=HIGH"

# Medium severity only
curl "http://localhost:5000/api/risk/alerts?severity=MEDIUM"
```

Response:
```json
{
  "alerts": [
    {
      "id": "flood-1708239000000",
      "type": "FLOOD",
      "severity": "HIGH",
      "location": "Sardar Sarovar",
      "message": "⚠️ HIGH FLOOD RISK at Sardar Sarovar. High reservoir level, Heavy rainfall expected",
      "score": 85,
      "timestamp": "2024-02-18T10:30:00.000Z"
    },
    {
      "id": "landslide-1708239000001",
      "type": "LANDSLIDE",
      "severity": "MEDIUM",
      "location": "Western Ghats",
      "message": "⚡ MODERATE LANDSLIDE RISK. Exercise caution.",
      "score": 55,
      "timestamp": "2024-02-18T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-02-18T10:30:00.000Z",
  "total": 2
}
```

---

## Error Handling Examples

### Missing Required Parameters

Request:
```bash
curl http://localhost:5000/api/data/rainfall
```

Response (400):
```json
{
  "error": "Latitude and longitude are required"
}
```

### Invalid Dam ID

Request:
```bash
curl -X POST http://localhost:5000/api/risk/calculate \
  -H "Content-Type: application/json" \
  -d '{"damId": "invalid-dam"}'
```

Response (404):
```json
{
  "error": "Dam not found"
}
```

### Rate Limit Exceeded

Response (429):
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Server Error

Response (500):
```json
{
  "error": "Internal Server Error",
  "timestamp": "2024-02-18T10:30:00.000Z"
}
```

---

## Using with Frontend

The frontend automatically makes these API calls:

```javascript
// Get all dams
GET /api/data/dams

// Get rainfall data for selected dam
GET /api/data/rainfall?latitude=X&longitude=Y

// Calculate risk for selected dam
POST /api/risk/calculate
Body: { damId: "...", state: "..." }

// Get all risks (for map markers)
GET /api/risk/all

// Get active alerts
GET /api/risk/alerts

// Auto-refresh every 10 minutes
All endpoints called repeatedly
```

---

## Postman Collection

Create a Postman collection with these requests:

```json
{
  "info": {
    "name": "Flood & Landslide Warning API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/health"
      }
    },
    {
      "name": "Get All Dams",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/data/dams"
      }
    },
    {
      "name": "Get All Risks",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/risk/all"
      }
    },
    {
      "name": "Calculate Risk",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/risk/calculate",
        "body": {
          "mode": "raw",
          "raw": "{\"damId\": \"sardar-sarovar\", \"state\": \"Gujarat\"}"
        }
      }
    }
  ]
}
```

---

## JavaScript/Axios Examples

### Fetch All Risks

```javascript
import axios from 'axios';

const fetchAllRisks = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/risk/all');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### Calculate Risk for Dam

```javascript
const calculateRisk = async (damId, state) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/risk/calculate',
      { damId, state }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### Get Active Alerts

```javascript
const getAlerts = async (severity = 'all') => {
  try {
    const response = await axios.get(
      'http://localhost:5000/api/risk/alerts',
      { params: { severity } }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## Performance Tips

1. **Cache responses** locally for 30-60 seconds
2. **Batch requests** when possible (use `/api/data/all`)
3. **Filter data** client-side to reduce requests
4. **Use webhooks** for real-time updates (if available)
5. **Monitor API rate limits** to avoid throttling

---

**Last Updated:** February 18, 2026
