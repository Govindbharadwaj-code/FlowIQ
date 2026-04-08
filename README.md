# FlowIQ - Intelligent Workflow Management System

[![CI Pipeline](https://github.com/your-org/FlowIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/FlowIQ/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)

FlowIQ is a production-ready intelligent workflow management system with rule-based AI task classification, real-time notifications via WebSocket, role-based access control, and comprehensive analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FlowIQ Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────┐         ┌──────────────────────────────────┐  │
│   │   Frontend   │ ──────► │          Backend API             │  │
│   │  React/Vite  │ ◄────── │       Express + Socket.IO        │  │
│   │   Port 3000  │         │          Port 5000               │  │
│   └──────────────┘         └──────┬───────────┬──────────────┘  │
│                                   │           │                   │
│                          ┌────────▼──┐  ┌────▼──────┐          │
│                          │PostgreSQL │  │   Redis   │          │
│                          │  Port 5432│  │ Port 6379 │          │
│                          │  (Data)   │  │  (Cache)  │          │
│                          └───────────┘  └───────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **AI Task Classification** — Rule-based engine classifies tasks by priority (critical/high/medium/low), generates tags and summaries without external API dependencies
- **Real-time Notifications** — WebSocket (Socket.IO) push notifications for task assignments, escalations, and updates
- **Role-Based Access Control** — Three roles: `admin`, `manager`, `user` with appropriate permission guards
- **Bulk Task Ingestion** — Ingest up to 100 tasks at once from external sources (email, ticket systems, datasets)
- **Analytics Dashboard** — Charts for task status, priority distribution, 30-day trends, and agent performance
- **Audit Logging** — Every action is logged with user, IP, timestamp, and before/after values
- **Task Lifecycle** — Full lifecycle: create → assign → in_progress → escalate → resolve with feedback
- **Comments** — Per-task threaded comments with internal/external toggle

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | PostgreSQL 16 (pg pool) |
| Cache | Redis 7 |
| Auth | JWT (jsonwebtoken) |
| WebSocket | Socket.IO 4 |
| Logging | Winston |
| Security | Helmet, CORS, express-rate-limit, XSS |
| Testing | Jest + Supertest |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router 6 |
| HTTP | Axios |
| WebSocket | socket.io-client |
| Charts | Recharts |
| Icons | Lucide React |
| Date Utils | date-fns |

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/your-org/FlowIQ.git
cd FlowIQ

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Option 2: Local Development

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Setup

Create `backend/.env` from `backend/.env.example`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

DATABASE_URL=postgresql://flowiq_user:flowiq_pass@localhost:5432/flowiq_db
REDIS_URL=redis://localhost:6379

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:3000
```

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks` | Create task (AI classified) | Any |
| GET | `/api/tasks` | List tasks with filters & pagination | Any |
| GET | `/api/tasks/:id` | Get task + comments | Any |
| PUT | `/api/tasks/:id` | Update task | Any |
| POST | `/api/tasks/:id/assign` | Assign task to user | Manager/Admin |
| POST | `/api/tasks/:id/escalate` | Escalate task | Any |
| POST | `/api/tasks/:id/resolve` | Resolve task with feedback | Any |
| DELETE | `/api/tasks/:id` | Delete task | Admin |
| POST | `/api/tasks/bulk-ingest` | Bulk ingest tasks array | Manager/Admin |
| POST | `/api/tasks/:id/comments` | Add comment | Any |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/dashboard` | Dashboard stats | Any |
| GET | `/api/analytics/trends` | 30-day task trend | Any |
| GET | `/api/analytics/agent-performance` | Agent metrics | Manager/Admin |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/mark-all-read` | Mark all as read |

## Database Schema

The PostgreSQL schema includes 5 tables:
- **users** — User accounts with roles and profile data
- **tasks** — Tasks with AI fields (ai_priority, ai_tags, ai_summary, ai_confidence)
- **task_comments** — Per-task threaded comments
- **notifications** — User notifications with reference links
- **audit_logs** — Full audit trail for all actions

Schema file: `backend/src/models/schema.sql`

## AI Engine

FlowIQ uses a rule-based AI engine (no external API required):

**Priority Classification:**
- `critical` — keywords: urgent, critical, down, outage, emergency
- `high` — keywords: bug, error, broken, failed, crash, exception
- `medium` — keywords: feature, improve, request, slow, enhancement
- `low` — everything else

**Tag Generation:** Automatically tags tasks with labels like `bug`, `feature-request`, `security`, `performance`, `api`, `data`

## Testing

```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- --watch         # Watch mode
```

Tests use Jest mocks for database and Redis — no real database needed.

## Deployment

### Production Docker Compose
```bash
# Set production secrets
export JWT_SECRET=$(openssl rand -base64 64)

# Build and start
docker-compose -f docker-compose.yml up -d --build

# Check status
docker-compose ps
```

### Environment Variables for Production
- `JWT_SECRET` — Strong random string (min 32 chars)
- `DATABASE_URL` — Production PostgreSQL URL
- `REDIS_URL` — Production Redis URL
- `CORS_ORIGIN` — Your frontend domain (e.g., `https://flowiq.yourcompany.com`)
- `NODE_ENV` — Set to `production`

## Project Structure

```
FlowIQ/
├── backend/
│   ├── src/
│   │   ├── config/         # database, redis, logger
│   │   ├── controllers/    # auth, tasks, analytics, notifications
│   │   ├── middleware/     # auth, auditLog, errorHandler
│   │   ├── models/         # schema.sql
│   │   ├── routes/         # Express routers
│   │   ├── services/       # notificationService
│   │   ├── utils/          # aiEngine
│   │   └── app.js          # Express + Socket.IO app
│   ├── tests/              # Jest + Supertest tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Tasks, Dashboard
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # All page components
│   │   ├── services/       # api.js, socket.js
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## License

MIT
