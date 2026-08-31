# 🚀 ResQNet Production Deployment Guide

This guide walks you through deploying **ResQNet** with:
- **Backend & Database**: Deployed on **Render** (Express.js + Socket.IO + PostgreSQL + Prisma)
- **Frontend**: Deployed on **Vercel** (Vue 3 + Vite + OpenFreeMap + MapLibre GL)

---

## 🏗️ Deployment Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                    │
│   https://your-app.vercel.app                          │
│   - Vue 3 + Vite Single Page Application (SPA)         │
│   - OpenFreeMap + MapLibre Tactical GIS Maps           │
│   - Communicates with Render backend via HTTPS & WSS   │
└──────────────────────────┬─────────────────────────────┘
                           │ (REST APIs + Socket.IO)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Render (Backend)                     │
│   https://your-backend.onrender.com                    │
│   - Express REST API Engine & Real-Time Socket.IO      │
│   - JWT Authentication & AI Emergency Triage Pipeline  │
└──────────────────────────┬─────────────────────────────┘
                           │ (Prisma ORM)
                           ▼
┌────────────────────────────────────────────────────────┐
│              Neon PostgreSQL Database                  │
│   - Serverless Cloud Database                          │
│   - Seeded with Role Accounts & Operational Records    │
└────────────────────────────────────────────────────────┘
```

---

## PART 1: Deploy Backend & Database on Render

### Step 1: Database Setup (Neon PostgreSQL)
Your database is configured with **Neon PostgreSQL**. You do not need to create a new database on Render unless you prefer to.

- **Neon Connection String**:
  ```env
  DATABASE_URL="postgresql://neondb_owner:npg_8xqNvz5senaL@ep-fragrant-art-aebth51o-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```
- The schema has already been synchronized and seeded with default operational accounts.

---

### Step 2: Deploy the Backend Web Service
1. In the Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository (`ResQNet`).
3. Fill in the deployment settings:
   - **Name**: `resqnet-backend`
   - **Region**: Same region as your database.
   - **Branch**: `main`
   - **Root Directory**: `backend` *(Crucial!)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && node prisma/seed.js
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: Free (or Starter).

4. Scroll down to **Environment Variables** and add:
   | Key | Recommended Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Server listening port |
   | `DATABASE_URL` | *Paste Render PostgreSQL Connection URL* | PostgreSQL connection string |
   | `JWT_SECRET` | `resqnet_emergency_jwt_secret_production_2026` | Random secure string |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` *(or `*` temporarily)* | Allowed frontend origins |
   | `STORAGE_TYPE` | `local` | Upload storage mode |

5. Click **Create Web Service**.
6. Wait for the build to complete. Once active, note your backend URL:
   `https://resqnet-backend.onrender.com`

---

## PART 2: Deploy Frontend on Vercel

### Step 1: Import Project into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`ResQNet`).

### Step 2: Configure Project Settings
1. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend` *(Crucial!)*
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

2. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com` *(Your Render backend URL)* |
   | `VITE_SOCKET_URL` | `https://your-backend.onrender.com` *(Your Render backend URL)* |

3. Click **Deploy**.
4. Vercel will build and deploy your application in under 1 minute.
5. You will receive your public production URL (e.g. `https://resqnet.vercel.app`).

---

## PART 3: Connect Frontend and Backend

1. Go back to your **Render Dashboard** → `resqnet-backend` → **Environment**.
2. Update `CLIENT_URL` with your actual Vercel domain:
   ```env
   CLIENT_URL=https://your-actual-app.vercel.app
   ```
3. Click **Save Changes** (Render will automatically redeploy with the updated CORS policy).

---

## 🔑 Production Demo Accounts

After `node prisma/seed.js` runs, the following demo accounts are seeded and ready for login:

> **Default Password:** `password123`

| Role | Mobile Number | Name | Target Dashboard |
|---|---|---|---|
| **🚨 Citizen** | `+919876543210` *(or `9876543210`)* | Vignesh Kumar | `/citizen` |
| **🛡️ Admin** | `+919876543211` *(or `9876543211`)* | Command Chief Miller | `/admin/command` |
| **📡 Dispatcher** | `+919876543212` *(or `9876543212`)* | Dispatcher John Davis | `/admin/command` |
| **🚑 Paramedic** | `+919876543213` *(or `9876543213`)* | Alex Chen | `/responder` |
| **🧑‍🚒 Community Responder** | `+919876543214` *(or `9876543214`)* | Dr. Priya Sharma | `/community` |
| **🏥 Hospital Staff** | `+919876543215` *(or `9876543215`)* | Metro Central Hospital | `/hospital` |

---

## 🛠️ Verification Checklist

- [x] Backend responds to `GET /health` with `{"status":"ONLINE"}`
- [x] Database synchronized via `prisma db push` and seeded with demo accounts
- [x] Socket.IO engine establishes live WebSocket connection
- [x] Frontend Single Page Application routing handled via `frontend/vercel.json`
- [x] OpenFreeMap tiles load with 0 API keys required
