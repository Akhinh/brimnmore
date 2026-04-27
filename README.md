# Brill 'n' More (BnM) — Wholesale Management System

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Charts**: Recharts
- **State**: Zustand + TanStack Query
- **Monorepo**: Turborepo
- **QR Codes**: qrcode.react

## Project Structure
```
bnm-app/
├── apps/
│   └── web/                    # Main React app
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/         # Button, Input, Card, Modal, Badge...
│       │   │   └── layout/     # AdminLayout, WorkerLayout, ProtectedRoute
│       │   ├── pages/
│       │   │   ├── auth/       # Login, Register, forget password
│       │   │   ├── admin/      # Dashboard, Inventory, Orders, Workers, Analytics, OrderLinks
│       │   │   ├── worker/     # Stock, Sell, Search, Activity
│       │   │   └── customer/   # OrderPortal (public QR link)
│       │   ├── hooks/          # useAuth
│       │   ├── lib/            # supabase client
│       │   ├── store/          # Zustand auth store
│       │   └── types/          # All TypeScript types
│       └── ...config files
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full DB schema, RLS, triggers, views
│   └── seed.sql                     # Sample product types & manufacturers
└── turbo.json
```

## Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo>
cd bnm-app
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **Anon Key**

### 3. Run Database Migrations
In your Supabase dashboard → SQL Editor, run:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed.sql`

### 4. Environment Variables
```bash
cp apps/web/.env.example apps/web/.env
```
Fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

### 5. Create First Admin Account
In Supabase Dashboard → Authentication → Users → Add User:
- Email: admin@bnm.com
- Password: (your choice)

Then in SQL Editor, manually set the role:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@bnm.com';
```

### 6. Run the App
```bash
npm run dev
```
Open http://localhost:3000

## Portals
| Portal | URL | Access |
|--------|-----|--------|
| Admin | `/admin` | Admin login |
| Worker | `/worker` | Worker login (invite-only) |
| Customer | `/order/:token` | Public (no login) |
| Login | `/login` | All users |
| Register | `/register?token=...` | Invite link |

## Features
- **Admin**: Full inventory CRUD, analytics with charts, worker invite system, QR order links, order management
- **Worker**: Browse stock, record sales with cart, search products, view own activity
- **Customer**: Browse store via QR/link, add to cart, submit order — no account needed

## Brand Colors
- Red: `#E8191A`
- Black: `#0A0A0A`
- White: `#FAFAF9`
