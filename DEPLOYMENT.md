# Student & Attendance Management System Deployment Guide

This project is separated into two clean directories:
- **`backend/`**: Java 21 Spring Boot 3.x REST API + PostgreSQL (Supabase) + Docker (deployed on **Render**)
- **`frontend/`**: Next.js 14/15 App Router + Tailwind CSS (deployed on **Vercel**)

---

## 🌟 Key Features

1. **Role-Based Authentication**:
   - **Student Login**:
     - Login using **Roll Number** (or Email) & Password (default password is the student's roll number).
     - View profile, courses, and **Attendance Percentage** with visual gauge indicator.
     - Date-wise attendance history table (Present / Absent status, remarks, and marked by).
   - **Admin Login**:
     - Default credentials: `admin` / `admin123` (configurable via `ADMIN_PASSWORD` env var).
     - **Mark Attendance**: Select date, bulk-mark all present/absent, toggle individual students, add remarks, and persist.
     - **Attendance % Report**: Class-wide attendance percentages, total sessions, present/absent days, and low-attendance warning flags (< 75%).
     - **Student Management (CRUD)**: Add student, Edit student, Soft Delete to Trash, Restore, and Permanent Delete.
2. **Smooth Loading Animations**:
   - Shimmer skeleton loaders during data fetch.
   - Animated spinner buttons on submit/save.
   - Visual attendance progress bars.
   - Toast notifications.

---

## 1. Deploying Backend to Render

### Prerequisites:
- A Render account ([render.com](https://render.com)).
- PostgreSQL Database on Supabase (already configured in connection string).

### Deployment Steps:
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Student_Management`).
4. Settings:
   - **Environment**: Docker
   - **Branch**: `main`
   - **Root Directory**: `.` (or `backend`)
   - **Dockerfile Path**: `Dockerfile` (or `./backend/Dockerfile`)
   - **Health Check Path**: `/api/students/health`
5. Under **Environment Variables**, add:
   | Key | Recommended Value | Description |
   |-----|-------------------|-------------|
   | `PORT` | `8080` | Required internal container port |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require` | Supabase IPv4 Pooler URL |
   | `SPRING_DATASOURCE_USERNAME` | `postgres.vkfsgkryhbrzffqtffpj` | Database Username |
   | `SPRING_DATASOURCE_PASSWORD` | `viven123viven` | Database Password |
   | `FRONTEND_URL` | `*` *(or your Vercel URL)* | Allowed CORS origin |
   | `ADMIN_USERNAME` | `admin` | Admin portal username |
   | `ADMIN_PASSWORD` | `admin123` | Admin portal password |

6. Click **Create Web Service**.
7. Once deployed, copy your Render service URL (e.g. `https://crud-spring-boot-demo.onrender.com`).

---

## 2. Deploying Frontend to Vercel

### Deployment Steps:
1. Go to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Student_Management`).
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-service.onrender.com` | Your deployed Render backend URL |

6. Click **Deploy**.
7. Once finished, visit your Vercel application URL.

---

## 3. Demo Credentials

| Role | Username / Identifier | Password | Access Capabilities |
|------|-----------------------|----------|---------------------|
| **Administrator** | `admin` | `admin123` | Mark attendance by date, view attendance % report, add/edit/delete students |
| **Student** | `101` *(or student email)* | `101` | View personal attendance percentage, present/absent counts, date-wise attendance log |
