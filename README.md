# CyberOne 🛡️

**Professional cybersecurity scanning platform** — scan any domain or IP for open ports, subdomains, SSL grade, data breaches, technologies, WHOIS, and DNS records. Deployable on Vercel free tier in under 10 minutes.

![CyberOne Screenshot](https://placeholder.com/screenshot)

---

## Features

| Feature | API Used | Free Tier |
|---|---|---|
| Subdomain enumeration | SecurityTrails | 50 queries/month |
| Open port scanning | Shodan | 100 queries/month |
| SSL certificate analysis | SSL Labs | Unlimited |
| Data breach lookup | HaveIBeenPwned | $3.50/mo (cheapest) |
| WHOIS info | WhoisXML API | 500 queries/month |
| DNS records | Google DNS | Unlimited |
| Technology detection | Wappalyzer | 50 queries/month |
| PDF report export | jsPDF (client-side) | Free |
| User accounts | Supabase | 500MB, 50k users |
| Rate limiting | Upstash Redis | 10k requests/day |

---

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes (Vercel Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Rate Limiting**: Upstash Redis
- **Auth**: bcrypt + JWT (no third-party auth service)
- **PDF**: jsPDF + jsPDF-autotable (client-side)

---

## Prerequisites

1. [Vercel account](https://vercel.com) (free)
2. [Supabase account](https://supabase.com) (free)
3. [Upstash account](https://upstash.com) (free)
4. API keys from the table above

---

## Deployment Guide

### Step 1: Clone & Setup

```bash
git clone https://github.com/yourname/cyberone.git
cd cyberone
npm install
cp .env.example .env.local
```

### Step 2: Supabase Setup

1. Go to [app.supabase.com](https://app.supabase.com) → New Project
2. Note your project URL and keys from **Settings → API**
3. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run
4. Verify tables created: `users` and `scans`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Step 3: Upstash Redis Setup

1. Go to [console.upstash.com](https://console.upstash.com) → Create Database
2. Choose **Redis** → Select free region → Create
3. Copy the REST URL and Token from the dashboard

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

### Step 4: API Keys

Get free API keys from each service:

**SecurityTrails** (subdomains)
- Sign up at [securitytrails.com](https://securitytrails.com/corp/api)
- Dashboard → API Key

**Shodan** (ports)
- Sign up at [account.shodan.io](https://account.shodan.io)
- My Account → API Key (free: 100 queries/month)

**SSL Labs** (SSL grade)
- No key needed — completely free

**HaveIBeenPwned** (breaches)
- [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)
- $3.50/month — cheapest plan, skip if budget is $0

**WhoisXML API** (WHOIS)
- Sign up at [whoisxmlapi.com](https://www.whoisxmlapi.com)
- 500 free queries/month

**Google DNS** (DNS records)
- No key needed — completely free

**Wappalyzer** (technologies)
- Sign up at [wappalyzer.com](https://www.wappalyzer.com/api/)
- 50 free queries/month

**JWT Secret**
```bash
# Generate a secure secret:
openssl rand -hex 32
```

### Step 5: Local Development

```bash
# Fill in .env.local with all your keys, then:
npm run dev
# Open http://localhost:3000
```

### Step 6: Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
# Follow prompts, add environment variables when asked
```

**Option B: Vercel Dashboard**
1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add all environment variables from `.env.example`
5. Deploy!

### Step 7: Add Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add every variable from `.env.example` with your actual values.

---

## Rate Limits

| User Type | Scans/Day | Storage |
|---|---|---|
| Anonymous | 1 | None |
| Logged in | 3 | Full history |

Rate limits reset every 24 hours (sliding window via Upstash Redis).

> **Note**: If Upstash is not configured, rate limiting is disabled (all requests pass through).

---

## Project Structure

```
cyberone/
├── pages/
│   ├── index.tsx          # Main UI
│   ├── _app.tsx
│   ├── _document.tsx
│   └── api/
│       ├── scan.ts        # POST /api/scan — runs all scanners
│       ├── auth.ts        # POST /api/auth — login/signup
│       ├── history.ts     # GET /api/history — user scan history
│       └── report.ts      # POST /api/report — report metadata
├── components/
│   ├── AuthModal.tsx      # Login/signup modal
│   ├── ScanResults.tsx    # Results display
│   └── ScanHistory.tsx    # Past scans sidebar
├── lib/
│   ├── scanner.ts         # All API integrations (Promise.all)
│   ├── auth.ts            # JWT sign/verify
│   ├── supabase.ts        # Supabase client
│   ├── ratelimit.ts       # Upstash rate limiter
│   └── pdfGenerator.ts    # Client-side PDF generation
├── styles/
│   └── globals.css        # Tailwind + cyber theme
├── supabase-schema.sql    # Database setup
├── .env.example           # All required env vars
├── vercel.json            # Function config
└── README.md
```

---

## API Reference

### POST /api/scan
```json
// Request
{ "target": "example.com" }

// Response
{
  "success": true,
  "results": {
    "target": "example.com",
    "timestamp": "2024-01-01T00:00:00Z",
    "subdomains": { "found": [...], "total": 42 },
    "ports": { "ports": [{ "port": 80, "service": "HTTP" }] },
    "ssl": { "grade": "A+", "validTo": "2025-01-01" },
    "breaches": { "breached": false, "breaches": [] },
    "whois": { "registrar": "...", "createdDate": "..." },
    "dns": { "a": ["1.2.3.4"], "mx": [...] },
    "technologies": { "technologies": [{ "name": "nginx" }] }
  }
}
```

### POST /api/auth
```json
// Signup
{ "action": "signup", "email": "user@example.com", "password": "secure123" }

// Login
{ "action": "login", "email": "user@example.com", "password": "secure123" }

// Response
{ "token": "eyJhb...", "user": { "id": "uuid", "email": "..." } }
```

### GET /api/history
```
Authorization: Bearer <token>

Response: { "scans": [{ "id", "target", "created_at", "results_json" }] }
```

---

## Vercel Free Tier Limits

| Resource | Free Limit | CyberOne Usage |
|---|---|---|
| Serverless function duration | 10 seconds | ≤10s (parallel scans) |
| Function invocations | 100k/month | Normal usage |
| Bandwidth | 100GB/month | Minimal |
| Deployments | Unlimited | ✓ |

> **Important**: The 10-second timeout on Vercel free tier means some slow APIs (SSL Labs) may timeout. SSL Labs analysis can take 60+ seconds for new domains. Consider caching or async polling for production.

---

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- JWTs expire in 7 days
- All API keys are server-side only (never exposed to client)
- RLS enabled on Supabase tables
- Rate limiting prevents abuse
- **Only scan targets you own or have explicit permission to test**

---

## Disclaimer

This tool is for **authorized security testing only**. Scanning systems without permission may be illegal. The authors are not responsible for misuse.

---

## License

MIT
