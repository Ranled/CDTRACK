# CD TRACK — Code Dreamers Academic Tracking System

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Version](https://img.shields.io/badge/Version-1.08.20-blue)]()

A high-performance, responsive academic productivity Progressive Web App (PWA) built for the **Code Dreamers (BSCS 4-B)** student section.

---

## 🌟 Key Features

- 📅 **Optimized Calendar** — Instant, optimistic event creation with zero UI freeze, color-coded categories, and detailed drawer views.
- 📊 **Academic Dashboard** — Real-time progress ring, daily schedule, upcoming urgent deadlines, and recent announcements.
- 📝 **Centralized Class Notes** — Shared sticky-note board visible to all members with full-view reading modal, color tags, and pinning.
- 📢 **Full-View Announcements** — Organization-wide updates with high-resolution image support and full-screen detail modals.
- 🔔 **Real-Time Notifications** — Instant notifications powered by Supabase Realtime for deadlines, events, and announcements.
- 🔍 **Global Search** — Fast fuzzy search across events, notes, and announcements.
- 🌙 **Dark & Light Mode** — Seamless theme switching with system preference detection and zero-FOUC script.
- 📲 **1-Click PWA Installation** — Direct install button in top navigation for Android, iOS Safari, and Desktop Chrome/Edge.
- 🔐 **Role-Based Access Control (RBAC)** — Secure separation of Member and Administrator privileges backed by PostgreSQL Row Level Security.

---

## 🛡️ Security & Access Control

CD TRACK implements enterprise-grade security practices across frontend, network, and database layers:

### 1. Environment Variable Protection
- **No Credentials in Code:** Database connection URLs and anon keys are managed strictly via `.env` and loaded at runtime.
- **Git Protection:** `.env` and sensitive local configuration files are excluded from version control via `.gitignore`.

### 2. Row Level Security (RLS)
Every table in the PostgreSQL database is guarded with strict Row Level Security policies:
- **Events & Announcements:** Read access granted to authenticated users; write/edit/delete restricted exclusively to verified administrators.
- **Class Notes:** Read access granted to all authenticated members; write operations restricted to administrators.
- **Profiles & Reminders:** User-isolated data access ensuring users cannot read or modify other accounts' private data.

### 3. Public Key vs Service Role Isolation
- Only the **public anon key** is used on the client application.
- The high-privilege `service_role` key is **never** bundled or exposed to the client, preventing unauthorized administrative overrides.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (Hooks, Memoization, Optimistic UI) |
| **Language** | TypeScript 5 (Strict Type Checking) |
| **Styling & Design** | TailwindCSS v3 + Radix UI + Lucide Icons |
| **State & Data Fetching** | TanStack Query v5 + React Context API |
| **Backend & Database** | Supabase (PostgreSQL 15, Auth, Realtime Engine) |
| **PWA & Offline** | `vite-plugin-pwa` + Workbox Caching Strategy |
| **Build & Bundling** | Vite 5 |
| **Deployment** | Vercel Serverless Edge Network |

---

## 🛠️ Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Ranled/CDTRACK.git
cd CDTRACK
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your own Supabase project details:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set Up Database Schema
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** → **New Query**.
3. Copy and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. All tables, RLS policies, automated triggers, and composite performance indexes will be generated.

### 4. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 BSCS 4-B Elected Classroom Officers

| Position | Officer |
|---|---|
| **Mayor** | Raian Lee D. Vallejo |
| **Vice Mayor** | Jhona Mae R. Tayco |
| **Secretary** | Janelle Sespeñe |
| **Treasurer** | Frankie Jane Manggana |
| **Auditor** | Christian Jay Tumampil |
| **Councilors** | John Louie S. Castillon<br>Michelle Danielle Macasa<br>Kirt Dologuin |
| **Muse** | Kimberly Italia |
| **Escort** | Jayvee Ascaño |

---

## 📦 Production Build & Deployment

```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

### Deploying to Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set the framework preset to **Vite**.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## 👨‍💻 Developer & Credits

- **Built by:** Dev. Raian Lee D. Vallejo
- **Section:** BSCS 4-B · Code Dreamers
- **Version:** `1.08.20`
