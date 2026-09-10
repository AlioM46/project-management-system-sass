# 🚀 Project Management SaaS

A production-grade, multi-tenant project management platform built with **Laravel 12** and **Next.js 16**. Designed with real-world SaaS constraints — workspace isolation, granular RBAC, workflow engines, real-time chat, audit trails, and more.

---

## 🌐 Live Demo

- **Live Application:** [https://project-management-system-frontend-6v3s.onrender.com](https://project-management-system-frontend-6v3s.onrender.com)
- **Backend API:** [https://project-management-system-sass.onrender.com](https://project-management-system-sass.onrender.com)

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Backend Setup](#backend-laravel)
  - [Frontend Setup](#frontend-nextjs)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [API Overview](#-api-overview)
- [License](#-license)

---

## ✨ Features

### Multi-Tenancy & Workspaces
- **Workspace isolation** — single database, shared tables, strict `workspace_id` scoping via middleware & global Eloquent scopes
- Create, switch, and manage multiple workspaces
- Invite members via tokenized email invitations
- Per-workspace roles and membership management

### Authentication & Security
- JWT-based stateless authentication (`tymon/jwt-auth`)
- Email verification with signed, expiring links
- Password reset flow with secure tokens
- All auth flows redirect through the frontend for seamless UX

### Roles & Permissions (RBAC)
- Fine-grained permission keys (e.g. `project.create`, `task.assign`, `comment.delete_any`)
- Custom roles per workspace with drag-and-drop permission syncing
- System-seeded default roles (Admin, Member, Viewer)
- Centralized `Gate::before()` enforcement — no permission logic in controllers

### Project Management
- Full CRUD for projects (workspace-scoped)
- Project status tracking
- Soft delete with restore capability
- Dashboard overview with project statistics

### Task Management & Workflow Engine
- Full CRUD for tasks with priority and due dates
- **State machine workflow** — status transitions: `TODO → IN_PROGRESS → BLOCKED → DONE → CANCELLED`
- Task assignment to workspace members
- Task history tracking (status changes, reassignment, edits)
- Drag-and-drop Kanban board UI

### Real-Time Chat
- **Direct messages (DM)**, **group conversations**, and **project channels**
- Real-time messaging via **Pusher** WebSockets + **Laravel Echo**
- Voice messages with waveform playback (`wavesurfer.js`)
- File & image attachments (AWS S3)
- Message reactions, starring, and pinning
- Read receipts and delivery status
- User blocking
- @mention support in messages
- Online presence indicators
- Chat search with message context

### Comments & Mentions
- Threaded comments on tasks
- `@{username}` mention tokens parsed server-side
- Mention-triggered notifications with duplicate prevention

### Notifications
- Real-time in-app notifications via WebSocket broadcast
- Notification types: mentions, task assignments, status changes, invitations
- Mark as read / mark all as read
- Per-workspace notification preferences (mute projects, mention-only, etc.)

### Audit Logs
- Comprehensive audit trail for security-critical actions
- Tracks: who changed what, old value → new value, timestamps
- Workspace-scoped audit log viewer (permission-protected)

### Dashboard & Reporting
- Overview dashboard with key metrics
- Task statistics by status and priority
- Charts and visualizations (`Recharts`)

### UI & Design
- **Dark mode** fully supported (via `next-themes`)
- Modern, polished UI with Tailwind CSS v4
- Responsive layout with collapsible sidebar
- Component library: Shadcn UI primitives (Button, Dialog, Card, Input, etc.)
- Micro-animations and smooth transitions
- DiceBear avatars for users

---

## 🛠 Tech Stack

### Backend (`server/`)
| Technology | Purpose |
|---|---|
| **PHP 8.2+** | Runtime |
| **Laravel 12** | API framework |
| **JWT Auth** | Stateless authentication |
| **PostgreSQL / MySQL** | Database |
| **Pusher** | WebSocket broadcasting |
| **AWS S3** | File storage |
| **Pest** | Testing framework |
| **Docker** | Containerized deployment |
| **Nginx + PHP-FPM** | Production web server (via Supervisor) |

### Frontend (`client/`)
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework with RSC |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Shadcn UI** | Component primitives |
| **Laravel Echo + Pusher JS** | Real-time WebSocket client |
| **Recharts** | Data visualization |
| **@hello-pangea/dnd** | Drag-and-drop (Kanban board) |
| **wavesurfer.js** | Audio waveform player |
| **date-fns** | Date formatting |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon library |

---

## 🏗 Architecture

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│         Next.js Frontend        │       │        Laravel Backend           │
│         (App Router / RSC)      │       │        (Stateless REST API)      │
│                                 │       │                                  │
│  ┌───────────┐ ┌──────────────┐ │       │  ┌────────────┐ ┌────────────┐  │
│  │   Pages   │ │  Features    │ │ HTTP  │  │ Controllers│ │  Actions   │  │
│  │ (App Dir) │ │ (Components, │ │◄─────►│  │ (Routing)  │ │ (Business  │  │
│  │           │ │  Hooks, API) │ │  JWT  │  │            │ │  Logic)    │  │
│  └───────────┘ └──────────────┘ │       │  └────────────┘ └────────────┘  │
│                                 │       │         │              │         │
│  ┌──────────────────────────┐   │       │  ┌──────┴──────────────┴──────┐  │
│  │     Laravel Echo         │   │  WS   │  │   Eloquent Models          │  │
│  │     (Pusher Client)      │◄──┼──────►│  │   + Global Scopes          │  │
│  └──────────────────────────┘   │       │  │   + Tenant Isolation       │  │
│                                 │       │  └───────────────────────────┘  │
└─────────────────────────────────┘       │         │                       │
                                          │    ┌────┴───────┐               │
                                          │    │ PostgreSQL │               │
                                          │    │  / MySQL   │               │
                                          │    └────────────┘               │
                                          └──────────────────────────────────┘
```

### Key Design Decisions

- **Decoupled architecture** — Laravel serves exclusively as a stateless REST API; Next.js handles all rendering and client state
- **Modular backend** — domain logic organized into self-contained modules (`Auth`, `Chat`, `Projects`, `Tasks`, `Workspace`, etc.)
- **Actions over Controllers** — business logic lives in single-purpose Action classes, keeping controllers thin
- **DTOs for structured input** — typed Data Transfer Objects instead of raw Request objects in domain actions
- **Strict multi-tenancy** — every tenant-aware model enforces `workspace_id` scoping via global Eloquent scopes and middleware

---

## 📁 Project Structure

```
project-management-system-sass/
├── client/                          # Next.js Frontend
│   ├── app/                         # App Router pages & layouts
│   │   ├── (auth)/                  # Auth pages (login, register, verify, reset)
│   │   ├── accept-invite/           # Workspace invitation acceptance
│   │   ├── dashboard/               # Main app dashboard
│   │   │   ├── admin/               # Admin panel
│   │   │   ├── audit-logs/          # Audit log viewer
│   │   │   ├── chat/                # Real-time chat
│   │   │   ├── projects/            # Project list & detail
│   │   │   ├── settings/            # Workspace settings
│   │   │   ├── tasks/               # Task board (Kanban)
│   │   │   └── team/                # Team management
│   │   └── onboarding/              # First-time workspace setup
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Primitives (Button, Dialog, Card, etc.)
│   │   ├── layout/                  # Sidebar, header, navigation
│   │   ├── modals/                  # Reusable modal components
│   │   └── notifications/           # Notification bell & dropdown
│   ├── features/                    # Feature modules
│   │   ├── auth/                    # Auth API, pages, components
│   │   ├── chat/                    # Chat components, hooks, types
│   │   ├── comments/                # Comment system
│   │   ├── dashboard/               # Dashboard API & widgets
│   │   ├── notifications/           # Notification hooks & API
│   │   ├── profile/                 # User profile management
│   │   ├── projects/                # Project API & types
│   │   ├── roles-permissions/       # RBAC management UI
│   │   ├── settings/                # Settings components
│   │   ├── tasks/                   # Task API & types
│   │   ├── team/                    # Team invitation & management
│   │   └── workspaces/              # Workspace switching & API
│   ├── lib/                         # Utilities (apiClient, queryClient)
│   └── shared/                      # Shared types & constants
│
├── server/                          # Laravel Backend
│   ├── app/
│   │   ├── Modules/                 # Domain modules
│   │   │   ├── Auth/                # Authentication & verification
│   │   │   ├── Audit/               # Audit logging service
│   │   │   ├── Chat/                # Real-time messaging
│   │   │   ├── Comments/            # Task comments & mentions
│   │   │   ├── Notifications/       # In-app & email notifications
│   │   │   ├── Projects/            # Project management
│   │   │   ├── RolesPermissions/    # RBAC system
│   │   │   ├── Tasks/               # Task management & workflow
│   │   │   └── Workspace/           # Multi-tenancy & invitations
│   │   ├── Providers/               # Service providers
│   │   └── Services/                # Cross-cutting services (Mail, etc.)
│   ├── config/                      # Laravel configuration
│   ├── database/                    # Migrations & seeders
│   ├── docker/                      # Docker configs (Nginx, Supervisor)
│   ├── routes/                      # API & WebSocket channel routes
│   ├── tests/                       # Pest test suites
│   ├── Dockerfile                   # Production Docker image
│   └── composer.json                # PHP dependencies
│
└── .agents/                         # AI agent rules & standards
    └── AGENTS.md                    # Project coding standards
```

---

## 📦 Prerequisites

- **PHP** >= 8.2
- **Composer** >= 2.x
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** 8.0+ or **PostgreSQL** 14+
- **Pusher** account (for WebSocket broadcasting)
- **AWS S3** bucket (for file uploads — optional for local dev)

---

## 🚀 Getting Started

### Backend (Laravel)

```bash
# 1. Navigate to server directory
cd server

# 2. Install PHP dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Generate JWT secret
php artisan jwt:secret

# 6. Run database migrations
php artisan migrate

# 7. Seed default roles & permissions
php artisan db:seed

# 8. Start the development server
composer dev
```

> The `composer dev` command starts the API server, queue worker, and Vite dev server concurrently.

### Frontend (Next.js)

```bash
# 1. Navigate to client directory
cd client

# 2. Install Node dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your backend API URL

# 4. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 🔐 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `APP_URL` | Backend base URL | `http://127.0.0.1:8000` |
| `DB_CONNECTION` | Database driver | `pgsql` or `mysql` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `5432` or `3306` |
| `DB_DATABASE` | Database name | `pm_multi_tenant` |
| `DB_USERNAME` | Database user | `root` |
| `DB_PASSWORD` | Database password | — |
| `JWT_SECRET` | JWT signing key | _(auto-generated)_ |
| `JWT_TTL` | Token TTL (minutes) | `320` |
| `MAIL_MAILER` | Mail transport | `smtp` / `google_script` |
| `MAIL_FROM_ADDRESS` | Sender email | `noreply@yourdomain.com` |
| `BROADCAST_CONNECTION` | Broadcasting driver | `pusher` |
| `PUSHER_APP_ID` | Pusher app ID | — |
| `PUSHER_APP_KEY` | Pusher app key | — |
| `PUSHER_APP_SECRET` | Pusher app secret | — |
| `PUSHER_APP_CLUSTER` | Pusher cluster | `eu` |
| `AWS_ACCESS_KEY_ID` | S3 access key | — |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | — |
| `AWS_BUCKET` | S3 bucket name | — |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:3000` |

### Frontend (`client/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://127.0.0.1:8000/api` |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher public key | — |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster | `eu` |

---

## 🌐 Deployment

### Backend (Docker on Render)

The backend is containerized with a production-ready Docker image:

- **Base image:** `php:8.4-fpm-alpine`
- **Web server:** Nginx + PHP-FPM managed by Supervisor
- **Database:** PostgreSQL (recommended for Render)

```bash
# Build the Docker image
docker build -t pm-backend ./server

# Run locally
docker run -p 10000:10000 --env-file ./server/.env pm-backend
```

**Render deployment steps:**
1. Connect your repository to Render
2. Select **Docker** as the runtime
3. Set the **Root Directory** to `server`
4. Configure environment variables in the Render dashboard
5. Deploy

### Frontend (Vercel / Render)

```bash
cd client
npm run build   # Produces a production-optimized build
npm start       # Starts the production server
```

Or connect to **Vercel** for automatic deployments with Next.js optimizations.

---

## 📡 API Overview

All API endpoints follow a standardized JSON envelope:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "errors": null
}
```

### Core Modules

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | `/api/auth/*` | Register, login, logout, verify email, reset password |
| **Workspaces** | `/api/workspaces/*` | CRUD workspaces, switch context |
| **Members** | `/api/members/*` | Invite, accept, remove, change roles |
| **Projects** | `/api/projects/*` | CRUD projects (workspace-scoped) |
| **Tasks** | `/api/tasks/*` | CRUD tasks, status transitions, assignment |
| **Comments** | `/api/comments/*` | Add/delete comments, mention parsing |
| **Chat** | `/api/conversations/*` | DM, group, project channels, messages |
| **Notifications** | `/api/notifications/*` | List, mark read, preferences |
| **Roles** | `/api/roles/*` | CRUD roles, sync permissions |
| **Audit Logs** | `/api/audit-logs/*` | View audit trail (admin) |

> All workspace-scoped endpoints require the `X-Workspace-Id` header.

---

## 🧪 Testing

### Backend

```bash
cd server

# Run all tests
php artisan test

# Run with Pest
./vendor/bin/pest
```

### Frontend

```bash
cd client

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).