# CD TRACK — Code Dreamers Academic Tracking System

A premium academic productivity Progressive Web App (PWA) built for the Code Dreamers organization.

![CD TRACK](./public/logo.png)

## Features

- 📅 **Calendar** — Monthly calendar with color-coded event pills by category
- 📊 **Dashboard** — Academic progress ring, today's schedule, upcoming deadlines
- 📝 **Notes** — Personal sticky note board with color tags and pinning
- 📢 **Announcements** — Organization-wide posts (admin-managed)
- 🔔 **Notifications** — Real-time browser push notifications
- 🔍 **Global Search** — Search across events, notes, and announcements
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 📱 **PWA** — Installable, offline support via service worker
- 🔐 **Role-based Access** — Admin (CDADMIN00) and User (CD01) roles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | TailwindCSS v3 |
| Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| Routing | React Router v6 |
| Data | TanStack Query v5 |
| Backend | Supabase (Auth + PostgreSQL) |
| PWA | vite-plugin-pwa + Workbox |
| Dates | date-fns |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open the **SQL Editor**
3. Run the entire contents of `supabase/schema.sql`
4. This creates all tables, RLS policies, triggers, and indexes

### 3. Start the development server
```bash
npm run dev
```

### 4. Open the app
Navigate to `http://localhost:5173`

## Access Codes

| Code | Role | Permissions |
|------|------|-------------|
| `CD01` | Member | View events, notes, announcements, receive notifications |
| `CDADMIN00` | Administrator | Full CRUD on events, announcements, send notifications to all |

## Deployment to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://ccdpzvscbdefficypude.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Deploy!

## Event Categories

| Category | Color |
|----------|-------|
| Event | 🔵 Blue |
| Assignment | 🟡 Yellow |
| Deadline | 🔴 Red |
| Project | 🟢 Green |
| Thesis / Capstone | 🟣 Purple |
| Meeting | 🟠 Orange |
| Quiz | 🩵 Cyan |
| Exam | 🩷 Pink |
| Holiday | 🟩 Emerald |

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopNav, AppLayout
│   ├── calendar/        # EventForm
│   └── ui/              # shadcn components
├── contexts/
│   ├── AuthContext.tsx  # Supabase auth + role management
│   └── ThemeContext.tsx # Dark/light mode
├── lib/
│   ├── supabase.ts      # Supabase client + types
│   └── utils.ts         # Helpers, category colors, formatters
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CalendarPage.tsx
│   ├── NotesPage.tsx
│   ├── AnnouncementsPage.tsx
│   ├── AboutPage.tsx
│   └── ProfilePage.tsx
└── App.tsx              # Router + providers
```

---

Built with ❤️ by Code Dreamers Dev Team · Version 1.0.0
