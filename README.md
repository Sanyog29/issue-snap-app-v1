# IssueSnap — AI-Powered Civic Issue Reporting PWA

<p align="center">
  <strong>Snap a photo. AI generates the complaint. Track resolution in real time.</strong>
</p>

---

## 📌 Overview

**IssueSnap** is an open-source civic issue reporting Progressive Web App (PWA) designed for modern municipalities and smart cities. It streamlines the complaint lifecycle for citizens and municipal staff:

1. **Citizens** point their camera at any municipal issue (potholes, garbage accumulation, broken streetlights, water leaks, drainage failures).
2. **AI VLM Engine** (Gemini 2.5 Flash via Google Genkit) analyzes the photo using vision-language tool-calling to extract the issue title, detailed description, department assignment, severity/urgency level, and life-safety hazard flags.
3. **Automated Routing & Real-Time Tracking**: Complaints are saved in Supabase with location metadata (GPS coordinates and reverse-geocoded address), indexed with a shareable tracking token, and dispatched to municipal departmental queues.
4. **Automated Transactional Emails**: Registered citizens receive immediate branded HTML confirmation emails with live tracking links, plus automated status update emails whenever staff takes field action.
5. **Staff Management & Resolution**: Municipal personnel access an authenticated live queue, acknowledge issues, and submit completion reports with proof-of-work "after" photos.
6. **Real-Time Citizen Feedback Loop**: Citizens receive push notifications and live updates, can review side-by-side before/after photos, rate municipal resolution quality, or reopen unresolved issues.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 15.3](https://nextjs.org/) (App Router, Turbopack, React 18, TypeScript) |
| **Styling & UI** | [Tailwind CSS 3.4](https://tailwindcss.com/), Custom Design System (HSL tokens, Dark/Light modes), [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives), Lucide Icons |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row-Level Security, Realtime Subscriptions, Supabase Storage) |
| **Authentication** | Supabase Auth (1-Click Google OAuth with PKCE flow, strictly role-gated staff portal) |
| **AI / Computer Vision** | [Google Genkit](https://firebase.google.com/docs/genkit) + **Gemini 2.5 Flash** with multi-tool calling (`set_title`, `set_description`, `set_category`, `set_department`, `set_priority`, `flag_safety`, `note_unclear`) |
| **Transactional Email** | Multi-tier engine: **Nodemailer** (Gmail / Custom SMTP with app password sanitization) + **Resend API** fallback + Simulated console delivery |
| **Push Notifications** | Web Push via [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging) + Background Service Worker |
| **Modular Domain Layer** | Decoupled architecture (`src/modules/{auth, email, notifications, reports, staff}`) with high cohesion and loose coupling |
| **Internationalization (i18n)** | Custom zero-dependency catalogue engine supporting **English (`en`)**, **Hindi (`hi`)**, and **Telugu (`te`)** with fallback chains |

---

## 🚀 Key Features

### Citizen Experience
- 📸 **Instant Capture Viewfinder**: Environmental camera stream with GPS auto-detection and gallery upload fallback.
- 🤖 **Vision-Language Tool Calling**: Real-time AI analysis that pre-fills category, department, severity, and description in seconds.
- ⚡ **1-Click OAuth Sign-In**: Zero-friction login/signup via Google OAuth without SMS carrier blocks or password fatigue.
- 📧 **Automated Email Receipts & Updates**: Automatic confirmation email on report filing and notification emails upon status transitions.
- 🌐 **Full Multilingual Support**: Dynamic i18n in English, Hindi (हिन्दी), and Telugu (తెలుగు) across every screen.
- 📍 **Precision Geolocation**: GPS coordinates and human-readable addresses stored with every report.
- 🔔 **Push Notifications & Live Updates**: Instant notification triggers when issues are acknowledged, in progress, or resolved.
- 🔍 **Shareable Tracking Token**: Track issue progress without requiring account creation; view audit logs and status chips.
- ⚖️ **Before/After Verification & Rating**: Inspect proof-of-work resolution photos, rate municipal action (1-5 stars), or reopen if unresolved.

### Municipal Staff & Admin Portal
- 🔒 **Role-Gated Official Access**: Non-staff accounts are strictly blocked at OAuth callback and middleware levels. Self-registration is disabled.
- 📋 **Live Queue**: Real-time Supabase postgres-change websocket stream updates staff queue dynamically without page refreshes.
- 🚦 **Priority Indicators**: Visual 4px urgency edge indicators (`urgent`, `high`, `medium`, `low`) and filterable department views.
- 📸 **Resolution Proof-of-Work**: Required "after" photo upload + resolution note prior to marking complaints as `resolved`.
- 📬 **Automated Citizen Notification**: Status changes and resolution notes automatically dispatch email notifications to reporters.

---

## 📂 Project Structure

```
issue-snap-app-v1/
├── migrations/                     # PostgreSQL database migrations (000 through 008)
│   ├── 000_full_schema.sql         # Base tables, triggers, and departments
│   ├── 001_users_auth.sql          # Auth profiles, phone/email triggers, language preferences
│   ├── 002_requests_constraints.sql# Requests table constraints, tracking token triggers, indexes
│   ├── 003_notifications.sql       # In-app notifications & device FCM token registration
│   ├── 004_rls_upgrade.sql         # Multi-tenant Row-Level Security policies & role helper functions
│   ├── 005_enforce_staff_admin_security.sql # Staff promotion functions & user_type protection
│   ├── 005_notification_preferences.sql # User notification channels & preferences
│   ├── 006_notifications_automation.sql # Triggers for automatic in-app notifications
│   ├── 007_fix_reporter_fkey.sql   # Self-healing reporter profile trigger
│   └── 008_allow_nullable_image.sql# Relax NOT NULL on original_image_url with safe fallback
├── public/                         # Static assets & PWA Service Workers
│   └── firebase-messaging-sw.js    # FCM background push notification handler
├── src/
│   ├── ai/                         # Genkit AI vision-language configuration
│   │   ├── flows/analyze-image.ts  # Vision prompt & tool execution pipeline
│   │   ├── tools/index.ts          # Genkit tool definitions (set_title, set_category, etc.)
│   │   └── genkit.ts               # Google AI plugin initialization
│   ├── app/                        # Next.js App Router routes & API endpoints
│   │   ├── actions/                # Server Actions (send-complaint-email, auth-staff)
│   │   ├── api/                    # REST API Route Handlers (devices, notifications)
│   │   ├── auth/                   # 1-Click OAuth sign-in & callback handler
│   │   ├── me/                     # Citizen's personal reports list & details
│   │   ├── notifications/          # In-app notification center
│   │   ├── report/                 # AI review, editing & submission confirmation
│   │   ├── settings/               # Language selection, dark/light theme toggle
│   │   ├── staff/                  # Staff live queue & issue resolution workspace
│   │   └── track/[token]/          # Public realtime issue tracking & rating page
│   ├── components/                 # Reusable React components (auth, capture, staff, ui)
│   ├── modules/                    # Decoupled Domain Architecture
│   │   ├── auth/                   # Pure OAuth authentication service & types
│   │   ├── email/                  # Nodemailer/Resend drivers, email templates
│   │   ├── notifications/          # Realtime, push, and in-app notification services
│   │   ├── reports/                # Report creation, image upload & fallback logic
│   │   └── staff/                  # Queue fetching, status updates, audit logs
│   ├── i18n/                       # Localization dictionaries (en, hi, te)
│   ├── lib/                        # Supabase client singleton, Firebase FCM, storage
│   ├── middleware.ts               # Next.js route guard enforcing role-based access
│   └── types/                      # TypeScript schemas (database, AI tools, notifications)
├── next.config.ts                  # Next.js runtime configuration & remote image patterns
└── package.json                    # Project dependencies & scripts
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file based on `.env.example`:

```bash
# ==========================================
# Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Server-side actions only

# ==========================================
# Google AI (Genkit & Gemini Vision)
# ==========================================
GEMINI_API_KEY=AIzaSy...

# ==========================================
# Transactional Email (Gmail SMTP or Resend)
# ==========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your.municipality.app@gmail.com
SMTP_PASS=abcd efgh ijkl mnop # 16-character Google App Password
SMTP_FROM="IssueSnap Civic Support" <your.municipality.app@gmail.com>
# Optional alternative provider:
# RESEND_API_KEY=re_123456789

# ==========================================
# Firebase Cloud Messaging (Web Push)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN... # Generated in Firebase Cloud Messaging tab
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18.18+ or 20.x
- npm / pnpm / yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd issue-snap-app-v1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase Storage:**
   In your Supabase Dashboard, create a **public** storage bucket named `complaint-images`.

4. **Apply SQL Migrations:**
   Run migrations `000` through `008` in sequence using the Supabase SQL Editor.

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002) in your browser.

6. **Validate Types & Build:**
   ```bash
   npm run typecheck
   npm run build
   ```

---

## ⚠️ Key Production Vulnerabilities & Risk Assessment

Before deploying to a public production environment, review and address the following architectural risks:

### 1. Data Exposure via Permissive Anonymous SELECT Policy
- **Vulnerability**: In `migrations/004_rls_upgrade.sql`, the policy `requests_anon_select` grants `SELECT TO anon USING (true)`.
- **Impact**: Any unauthenticated client can query `supabase.from('requests').select('*')` using the public `anon` key, exposing citizen phone numbers, exact GPS coordinates, reported descriptions, and departmental allocations.
- **Remediation**:
  - Restrict anonymous reads to public non-sensitive columns via a PostgreSQL view or RPC function (`get_request_by_token(token)`).
  - Modify the RLS policy so unauthenticated requests can only read their specific issue via `tracking_token`:
    ```sql
    DROP POLICY IF EXISTS "requests_anon_select" ON public.requests;
    CREATE POLICY "requests_anon_select" ON public.requests
      FOR SELECT TO anon USING (tracking_token IS NOT NULL);
    ```

### 2. Unrestricted File Uploads in Storage Bucket
- **Vulnerability**: Storage policies in `000_full_schema.sql` allow `INSERT` into `complaint-images` with `CHECK (bucket_id = 'complaint-images')` without file size or MIME type validation.
- **Impact**: Attackers can upload arbitrary file types (e.g., `.html`, `.svg` with embedded scripts) or upload massive files to exhaust storage quotas.
- **Remediation**:
  - Enforce file constraints in the Supabase Storage policy:
    ```sql
    CREATE POLICY "Verified complaint image upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'complaint-images'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
      );
    ```
  - Enforce max file size (e.g., 5MB) in Supabase Dashboard Bucket Settings.

### 3. API Quota Exhaustion & Denial of Service (DoS)
- **Vulnerability**: The AI vision analysis endpoint (`/report/review`) and transactional email dispatch actions (`dispatchComplaintConfirmationEmail`, `dispatchStatusUpdateEmail`) are callable without rate limiting.
- **Impact**: An automated script can trigger infinite vision analysis calls, draining Google Gemini API quotas, or spam complaint emails to trigger Gmail/SMTP suspension.
- **Remediation**:
  - Implement IP-based and user-based rate limiting using Upstash Redis or Vercel KV on server actions and API routes (e.g., max 5 complaint submissions per IP per 10 minutes).
  - Add Cloudflare Turnstile or reCAPTCHA v3 on the report review form prior to submission.

### 4. Direct Client-Side Status Mutation
- **Vulnerability**: If `migrations/004_rls_upgrade.sql` or `005` policies are bypassed or unapplied, client components (`StaffWorkspacePage`) update requests using client-side `supabase.from('requests').update(...)`.
- **Impact**: An authenticated citizen might attempt to alter statuses or resolve tickets if RLS policies are misconfigured.
- **Remediation**:
  - Always ensure `requests_employee_update` and `requests_admin_update` are strictly enforced with `public.is_admin()` or `user_type IN ('staff', 'admin')`.
  - Prefer routing status updates through server actions with server-side role validation.

---

## ⚠️ Deployment Inconsistencies & Operational Gotchas

Deploying IssueSnap to cloud platforms (Vercel, AWS Amplify, Docker, Railway) involves specific environment characteristics:

### 1. OAuth Redirect URI Mismatches in Production
- **Symptom**: `redirect_uri_mismatch` or redirecting back to `localhost` after signing in.
- **Cause**: Supabase OAuth enforces an explicit whitelist of allowed redirect URLs.
- **Fix**: In [Supabase Dashboard](https://supabase.com/dashboard) > **Authentication** > **URL Configuration**:
  - Set **Site URL** to your production domain: `https://your-domain.vercel.app`.
  - Add to **Redirect URLs**:
    - `https://your-domain.vercel.app/auth/callback*`
    - `https://*-your-team.vercel.app/auth/callback*` (for Vercel preview branches)
    - `http://localhost:9002/auth/callback*` (for local development)

### 2. SMTP Port Blocking & Serverless Timeouts (Vercel / Lambda)
- **Symptom**: Email sending hangs indefinitely or times out with socket errors.
- **Cause**:
  - Cloud hosting platforms (Vercel, AWS Lambda, Google Cloud Functions) block outbound TCP port 25.
  - Serverless functions have execution limits (10–15 seconds). Port 587 (STARTTLS) requires multi-step handshakes that may experience latency.
- **Fix**:
  - Use **Port 465 (Direct SSL)** with `smtp.gmail.com`:
    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    ```
  - For serverless production scale, configure `RESEND_API_KEY` to use Resend's fast HTTPS REST API instead of raw TCP SMTP sockets.

### 3. Edge Runtime vs. Node.js APIs in Middleware
- **Symptom**: Build warnings: `A Node.js API is used (process.version) which is not supported in the Edge Runtime`.
- **Cause**: Next.js App Router runs `middleware.ts` in the Edge Runtime. `@supabase/ssr` internally inspects some Node globals.
- **Fix**: `src/lib/node-polyfill.ts` polyfills essential globals. Ensure no heavy Node packages (like `nodemailer`, `tls`, `net`) are imported directly or indirectly into `src/middleware.ts`.

### 4. Web Push Service Worker (VAPID) Requirements
- **Symptom**: `Registration failed - push service error` or silent push failures.
- **Cause**:
  - Web Push `PushManager` is disabled on non-secure origins. It **only** operates on `https://` or `http://localhost`.
  - `NEXT_PUBLIC_FIREBASE_VAPID_KEY` must match the public key generated in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates. A placeholder key will fail.
- **Fix**: Ensure your production domain has a valid SSL certificate and configure the exact Firebase Web Push key pair in your environment variables.

### 5. Database Migration Sequence
- **Symptom**: PostgreSQL errors such as `null value in column "original_image_url" violates not-null constraint` or `requests_reporter_id_fkey` foreign key errors.
- **Cause**: Running partial migrations out of order.
- **Fix**: Ensure migrations `000` through `009` are run consecutively in your Supabase SQL editor:
  - `000_full_schema.sql` (Base tables)
  - `001` through `007` (Auth, constraints, automated notifications, reporter triggers)
  - `008_allow_nullable_image.sql` (Relaxes NOT NULL on image URLs and provisions `complaint-images` bucket)
  - `009_harden_security.sql` (Storage upload hardening, department_id resolution, and staff queue visibility)

### 6. Node 22+ CLI Flag Warning
- **Symptom**: `Warning: --localstorage-file was provided without a valid path`.
- **Cause**: Node.js 22 introduced experimental built-in localStorage support, conflicting with Turbopack's dev options flag.
- **Fix**: Safe to ignore in development; production builds (`npm run build`) do not invoke this flag.

---

## 🔒 Security Best Practices Implemented

- **Session Verification**: Next.js middleware and callback routes use `supabase.auth.getUser()` to validate JWTs against the Supabase Auth server, avoiding spoofed client cookies.
- **Rate-Limiting Protection**: Integrated sliding-window rate limiter (`src/lib/rate-limit.ts`) across report submissions, confirmation emails, and status update notifications to prevent DoS, quota exhaustion, and email flooding.
- **File & Storage Validation**: Enforced 5MB size limit and strict MIME validation (`image/jpeg`, `image/png`, `image/webp`) in report services before attempting storage uploads.
- **Server-Side Role Guard**: `updateRequestStatus` in `src/modules/staff/staff.service.ts` strictly validates that the modifying caller has `user_type IN ('staff', 'admin')` before executing database updates.
- **Defensive Image Fallback**: Report creation service guarantees `original_image_url` is never null, preventing database constraint failures during storage downtime.
- **Self-Healing Reporter Sync**: Automatically reconciles missing `public.users` profile rows before creating complaints, eliminating foreign key violation exceptions.
- **Google App Password Sanitization**: Automatically strips whitespace from 16-character Google App Passwords (`abcd efgh ijkl mnop`), ensuring reliable SMTP delivery.
- **Audit Logging**: Every status transition automatically logs an entry in `request_updates` with the modifying staff member's authenticated `user_id` and timestamp.
