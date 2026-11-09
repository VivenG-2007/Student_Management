# Deployment & Environment Variables Guide (Render + Vercel)

This guide explains how to deploy both the **Spring Boot Backend** to **Render** and the **Frontend** to **Vercel**, and connect them seamlessly via environment variables.

---

## Architecture Overview

```
┌─────────────────────────────────┐               ┌──────────────────────────────────────┐
│        Vercel (Frontend)        │               │         Render (Backend)             │
│  Single Page App (HTML/CSS/JS)  │ ────────────> │   Spring Boot 3.x + Java 21          │
│                                 │   HTTPS CORS  │   REST API (/api/students)           │
│  Env Var: BACKEND_URL           │               │   Env Var: FRONTEND_URL, PORT        │
└─────────────────────────────────┘               └──────────────────┬───────────────────┘
                                                                     │
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │ Supabase PostgreSQL  │
                                                          │ Pooler Port: 5432    │
                                                          └──────────────────────┘
```

---

## 1. Deploying Backend to Render

### Option A: Using the Blueprint (`render.yaml`)
1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Configure environment variables for Render and Vercel"
   git push origin main
   ```
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select your repository (`Student_Management`).
5. Render will automatically read `render.yaml` and configure the service:
   - **Environment:** Docker
   - **Plan:** Free
   - **Health Check Path:** `/api/students/health`

### Option B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Student_Management`).
3. Choose **Docker** as the runtime.
4. Set **Branch** to `main`.
5. Set **Dockerfile Path** to `./Dockerfile.render` (if using blueprint `render.yaml`, this is configured automatically).
6. Under **Health Check Path**, enter: `/api/students/health`.
6. Under **Environment Variables**, add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `PORT` | `8080` | Required internal port (Render maps dynamic external port) |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require` | Database JDBC URL |
   | `SPRING_DATASOURCE_USERNAME` | `postgres.vkfsgkryhbrzffqtffpj` | Database Username |
   | `SPRING_DATASOURCE_PASSWORD` | `viven123viven` | Database Password |
   | `FRONTEND_URL` | `*` *(or your Vercel URL: `https://your-app.vercel.app`)* | Allowed CORS origin |

7. Click **Create Web Service**.
8. Once deployed, copy your Render service URL (e.g., `https://crud-spring-boot-demo.onrender.com`).

> **Note on Render Free Tier:**
> Free instances spin down after 15 minutes of inactivity. When a request arrives, it takes ~30-40 seconds to wake up (cold start). The frontend has built-in auto-retry and a friendly "Waking up backend..." indicator.

---

## 2. Deploying Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Student_Management`).
4. In the **Configure Project** screen:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (or leave default, `vercel.json` automatically triggers `node build-env.js`)
   - **Output Directory:** `public`
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `BACKEND_URL` | `https://your-service.onrender.com` | Your deployed Render backend URL (no trailing slash) |

6. Click **Deploy**.
7. Once deployed, open your Vercel URL (e.g., `https://your-app.vercel.app`).

---

## 3. How Environment Variables Connect Them

### Frontend (Vercel):
1. **At Build Time:** Vercel runs `node build-env.js`, which reads `process.env.BACKEND_URL` and generates `public/env-config.js`:
   ```javascript
   window.__ENV__ = {
     BACKEND_URL: "https://crud-spring-boot-demo.onrender.com"
   };
   ```
2. **At Runtime:** The frontend loads `env-config.js` and targets `${BACKEND_URL}/api/students`.
3. **Serverless Fallback:** If you change `BACKEND_URL` in Vercel settings without redeploying, `api/config.js` serves the updated URL dynamically.
4. **Automatic Fallback:** If no environment variable is provided, the frontend detects it is hosted on `*.vercel.app` and defaults to `https://crud-spring-boot-demo.onrender.com`.
5. **In-Browser Override:** You can also click **API Config** in the top navigation bar anytime to change the backend target directly in the UI.

### Backend (Render):
1. **CORS Connection:** Spring Boot reads `cors.allowed-origins=${FRONTEND_URL:*}` via `WebConfig.java`. It permits requests, credentials, and pre-flight `OPTIONS` requests from your Vercel domain.
2. **Health Checks:** Render checks `/api/students/health` to confirm the container is healthy before routing traffic.

