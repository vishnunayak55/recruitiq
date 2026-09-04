# RecruitIQ — AI Resume Screening Platform

A full-stack AI-powered resume screening SaaS with ATS scoring, job description matching, and Razorpay payments.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + TypeScript + Vite        |
| Styling     | Tailwind CSS                        |
| Backend     | Node.js + Express + TypeScript      |
| Database    | PostgreSQL (Supabase or local)      |
| AI          | Anthropic Claude (claude-sonnet-4-6)|
| Payments    | Razorpay (₹3 Pro / ₹5 Premium)     |
| Auth        | JWT (bcrypt password hashing)       |

---

## Project Structure

```
recruitiq/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   ├── middleware/auth.ts    # JWT authentication
│   │   ├── providers/anthropic.ts# AI provider abstraction
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /signup, /login, GET /me
│   │   │   ├── resumes.ts        # Upload, analyze, list, delete
│   │   │   └── payments.ts       # Razorpay create-order + verify
│   │   ├── services/resumeParser.ts # PDF + DOCX extraction
│   │   ├── types/index.ts
│   │   └── utils/db.ts           # PostgreSQL + schema init
│   ├── .env                      # ← fill this in
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx               # Routes
    │   ├── main.tsx              # Entry
    │   ├── context/AuthContext.tsx
    │   ├── lib/api.ts            # Axios instance
    │   ├── components/
    │   │   ├── layout/Navbar.tsx
    │   │   ├── layout/ProtectedRoute.tsx
    │   │   └── resume/AnalysisReport.tsx
    │   └── pages/
    │       ├── Landing.tsx
    │       ├── Auth.tsx          # Login + Signup
    │       ├── Analyzer.tsx      # Upload + ATS analysis
    │       ├── Dashboard.tsx
    │       ├── History.tsx
    │       ├── Report.tsx        # Single analysis view
    │       ├── Pricing.tsx       # Razorpay checkout
    │       └── About.tsx
    └── package.json
```

---

## Setup Instructions

### 1. Database

#### Option A — Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the **Connection String** from Settings → Database
3. Paste into `DATABASE_URL` in `.env`

#### Option B — Local PostgreSQL
```bash
createdb recruitiq
```
Set `DATABASE_URL=postgresql://postgres:password@localhost:5432/recruitiq`

Tables are **auto-created** on first server start.

---

### 2. Backend

```bash
cd backend

# Copy and fill in your keys
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY, Razorpay keys, DB URL

npm install
npm run dev
# Server starts on http://localhost:5000
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

---

## Environment Variables (backend/.env)

| Variable              | Where to get it                                    |
|-----------------------|----------------------------------------------------|
| `DATABASE_URL`        | Supabase → Settings → Database → Connection String |
| `JWT_SECRET`          | Any long random string (min 32 chars)              |
| `ANTHROPIC_API_KEY`   | [console.anthropic.com](https://console.anthropic.com) |
| `RAZORPAY_KEY_ID`     | [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same as above                                      |
| `FRONTEND_URL`        | `http://localhost:5173` (dev) or your domain       |

---

## API Endpoints

```
POST  /api/auth/signup
POST  /api/auth/login
GET   /api/auth/me

POST  /api/resumes/upload          # multipart/form-data, field: "resume"
GET   /api/resumes                 # list user's analyses
GET   /api/resumes/:id             # get single analysis
DELETE /api/resumes/:id
POST  /api/resumes/:id/job-match   # { job_description: string }

POST  /api/payments/create-order   # { plan: "pro" | "premium" }
POST  /api/payments/verify         # Razorpay signature verification
GET   /api/payments/subscription
```

---

## Pricing (Razorpay)

| Plan    | Price | Features                          |
|---------|-------|-----------------------------------|
| Free    | ₹0    | 2 analyses, basic ATS score       |
| Pro     | ₹3    | Unlimited analyses, job matching  |
| Premium | ₹5    | Everything + priority processing  |

Payment flow: Frontend → `/api/payments/create-order` → Razorpay modal → `/api/payments/verify` (signature verified server-side) → plan upgraded in DB.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Server-side Razorpay signature verification (HMAC-SHA256)
- Users can only access their own resumes (user_id check on every query)
- API keys never exposed to frontend
- Rate limiting: 100 req/15min global, 10 uploads/hr
- File validation: only PDF/DOCX, max 10MB

---

## Deployment

### Backend (Railway / Render / Fly.io)
1. Set all environment variables in dashboard
2. `npm run build && npm start`

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add environment variable if needed (API is proxied via Vite in dev; in prod, update `api.ts` baseURL to your backend URL)

> **Production note:** Update `src/lib/api.ts` baseURL from `/api` to `https://your-backend.com/api` for production builds.
