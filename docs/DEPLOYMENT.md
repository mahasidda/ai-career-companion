# 🚢 Deployment Guide — AI Career Companion

## Overview

| Service   | Platform         | Cost   |
|-----------|------------------|--------|
| Frontend  | Vercel           | Free   |
| Backend   | Render           | Free   |
| Database  | PlanetScale / FreeSQLdatabases.com | Free |

---

## Step 1: MySQL Database (PlanetScale — Free)

1. Go to https://planetscale.com and create a free account
2. Create a new database: `ai_career_companion`
3. Go to **Connect** → copy the connection string
4. Run schema: Import `docs/schema.sql` via the PlanetScale console
5. Note down: HOST, USER, PASSWORD, DATABASE

**Alternative**: https://www.freesqldatabase.com (1 free MySQL DB, 5MB)

---

## Step 2: Get Gemini API Key (Free)

1. Go to https://makersuite.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key — you get 60 requests/minute free

---

## Step 3: Deploy Backend on Render

1. Push your code to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:create_app()`
5. Add Environment Variables:
   ```
   FLASK_ENV=production
   SECRET_KEY=<generate a random 32-char string>
   JWT_SECRET_KEY=<another random 32-char string>
   DB_HOST=<from PlanetScale>
   DB_USER=<from PlanetScale>
   DB_PASSWORD=<from PlanetScale>
   DB_NAME=ai_career_companion
   DB_PORT=3306
   GEMINI_API_KEY=<your gemini key>
   SMTP_EMAIL=<your gmail>
   SMTP_PASSWORD=<gmail app password>
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click **Create Web Service**
7. Note your Render URL: `https://ai-career-companion.onrender.com`

---

## Step 4: Deploy Frontend on Vercel

1. Go to https://vercel.com → **New Project**
2. Import from GitHub
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://ai-career-companion.onrender.com/api
   ```
5. Click **Deploy**

---

## Step 5: Gmail App Password (for email)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Search "App passwords" → Generate one for "Mail"
4. Use that 16-character password as `SMTP_PASSWORD`

---

## Step 6: Keep Render Awake (Free tier sleeps)

Free Render services sleep after 15 min of inactivity.

**Option A**: Use UptimeRobot (free)
1. Go to https://uptimerobot.com
2. Create HTTP monitor: `https://your-backend.onrender.com/`
3. Set interval: every 5 minutes

**Option B**: Upgrade to Render Starter ($7/month) — no sleep

---

## Local Development

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
python app.py

# Terminal 2: Frontend
cd frontend
npm install
cp .env.example .env   # set REACT_APP_API_URL=http://localhost:5000/api
npm start
```

---

## CI/CD (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## Production Checklist

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` to strong random values
- [ ] Set `FLASK_ENV=production`
- [ ] Enable HTTPS (Vercel + Render do this automatically)
- [ ] Set CORS `ALLOWED_ORIGINS` to your Vercel URL only
- [ ] Enable MySQL SSL for PlanetScale connections
- [ ] Set up UptimeRobot pings
- [ ] Test all API endpoints
