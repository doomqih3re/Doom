# DOOM AI is MY PROJECT

This portfolio is fully designed, coded and owned by Saurbh Meena (16) & family - DOOM BROTHERS.
All code in `index.html` is our original work.

---

## 📸 Pexels Creative Intelligence API Integration

The application integrates the official **Pexels REST API v1** via a secure server-side Node.js/Express proxy architecture. All requests to Pexels are made from the backend so that your API key is never exposed to client browsers or network inspection tools.

### Backend Endpoints:
- `GET /api/pexels/status` — Verifies backend connection status, configuration, and API health.
- `GET /api/pexels/curated?per_page=18&page=1` — Retrieves curated, trending high-definition photography.
- `GET /api/pexels/search?query=cyberpunk&per_page=18&page=1` — Searches millions of 4K photos and visual references by query with optional orientation/size filters.
- `GET /api/pexels/videos?query=abstract&per_page=8&page=1` — Searches high-resolution stock video clips.

---

## 🚀 NASA Open APIs & Space Intelligence Integration

The application integrates the official **NASA Open APIs** via server-side proxy handlers.

### Backend Endpoints:
- `GET /api/nasa/status` — Verifies NASA API connection status, configuration, and API health.
- `GET /api/nasa/apod` — Live Astronomy Picture of the Day (APOD) with high-res space imagery, title, explanation, date, and copyright.
- `GET /api/nasa/asteroids` — Live Near-Earth Objects (NeoWs) asteroid tracking feed.
- `GET /api/nasa/epic` — Earth Polychromatic Imaging Camera (EPIC) deep-space photos of planet Earth.
- `GET /api/nasa/search?q=james+webb` — Official NASA Image and Video Library search.

---

## 🔐 Passwordless OTP Authentication System

The application features an enterprise-grade passwordless One-Time Password (OTP) system:
- `POST /api/auth/send-otp` — Sends a secure 6-digit verification code with 45s resend cooldown.
- `POST /api/auth/verify-otp` — Verifies the code and issues a signed bearer authentication token.
- `GET /api/auth/me` — Authenticates user sessions and permissions.
- `POST /api/auth/logout` — Revokes active session tokens.

---

## 🐙 Connecting on GitHub & Environment Setup

### 1. Environment Variable Declaration
When running or deploying the backend, declare both API keys in your `.env` file:

```env
# .env
PEXELS_API_KEY=dwliuU1D2inZAlHTEzfrZMnHmowfmCm9qjHWZ9KSeR4gfW3Vdh9pM8LC
NASA_API_KEY=34PDrNQCbU6p2dB84y4vIfG2Q1j9dvj0UjQbHwzL
```

A template is provided in `.env.example`.

### 2. GitHub Repository Secrets Configuration
To deploy from GitHub (e.g. GitHub Actions, Cloud Run, Vercel, Render, Railway, or Heroku):
1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Add secret 1: Name: `PEXELS_API_KEY`, Value: `dwliuU1D2inZAlHTEzfrZMnHmowfmCm9qjHWZ9KSeR4gfW3Vdh9pM8LC`
4. Add secret 2: Name: `NASA_API_KEY`, Value: `34PDrNQCbU6p2dB84y4vIfG2Q1j9dvj0UjQbHwzL`
5. In your deployment configuration or workflow file, map the secret:
   ```yaml
   env:
     PEXELS_API_KEY: ${{ secrets.PEXELS_API_KEY }}
   ```

### 3. Local Development
```bash
# Install dependencies
npm install

# Start Express server on port 3000
npm run dev
# or
npm start
```

### 4. Git Push Guide
```bash
git init
git add .
git commit -m "feat: integrate Pexels Creative API backend proxy and PWA/mobile packages"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```
> Note: `.env` is listed in `.gitignore` to prevent sensitive credentials from leaking into public Git commits.

