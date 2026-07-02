# IdeaTech Internship Management Portal (ITIMP)

ITIMP is an enterprise-grade Work From Home (WFH) Internship Lifecycle Management Platform developed for **IdeaTech (PVT) LTD**. It handles the complete lifecycle from intern application/registration to daily activity tracking (attendance, reports, logbooks), task board allocations, performance gamification (levels & XP), automatic warning escalations, auto-termination triggers, leave applications, and secure certificate generation with QR-code validations.

---

## 🏗️ System Architecture

ITIMP is architected as a decoupled monorepo featuring an Express API backend and a Next.js App Router frontend:

```mermaid
graph TD
    A[Next.js Client App] -->|Proxy /api| B[Express.js Server]
    B -->|Prisma Client| C[(PostgreSQL Database)]
    B -->|SMTP Connection| D[Nodemailer Mail Server]
    B -->|PDFKit Generator| E[Local PDF Upload Storage]
    B -->|Google Generative AI| F[Gemini API]
```

### Key Modules:
1. **Core Authentication & Auth Rules:** Role-Based Access Control (RBAC) via cryptographically signed JWT.
2. **WFH Attendance Engine:** Late login checks (grace threshold: 9:15 AM) and checkout calculations.
3. **Task Sprint Board:** Kanban columns (Pending, Working, Needs Review, Rejected) with supervisor raters granting XP.
4. **Automation Engine:** Scans logs daily to apply violations for missing check-ins/reports. Suspends accounts and fires HR notices if inactive for 5 consecutive days.
5. **PDF Generator:** Generates Digital ID Cards with verification QR codes and Landscape Internship Certificates.
6. **AI Assistant:** Provides chatbot query replies and compiles weekly performance logs into structured markdown reports.

---

## 📂 Folder Structure

```
IdeaTech-Internship-Management-Portal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database relations mapping
│   │   └── seed.ts             # Default mock and operational data
│   ├── src/
│   │   ├── controllers/        # Express API request handlings
│   │   ├── middleware/         # JWT parsing & RBAC security
│   │   ├── routes/             # Routing registry endpoints
│   │   ├── services/           # Mailer, PDF generators, AI, Automation
│   │   ├── utils/              # Multer, DB instances
│   │   └── app.ts              # Entrypoint server setup
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── app/                # Next.js App Router pages
    │   ├── components/         # Glassmorphic sidebars & cards
    │   └── context/            # Auth and Theme provider states
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## 📊 Database Schema (ERD)

The database schema utilizes PostgreSQL, mapped via Prisma ORM:

```mermaid
erDiagram
    USER ||--o| INTERN_PROFILE : "has profile"
    USER ||--o{ ATTENDANCE : "logs check-ins"
    USER ||--o{ DAILY_REPORT : "logs reports"
    USER ||--o{ LOGBOOK : "logs learnings"
    USER ||--o{ TASK : "assigned tasks"
    USER ||--o{ MEETING_ATTENDANCE : "attends meetings"
    USER ||--o{ LEAVE_REQUEST : "applies leaves"
    USER ||--o{ CERTIFICATE : "holds certs"
    USER ||--o{ WARNING : "receives warnings"
    USER ||--o{ ACTIVITY_LOG : "triggers audits"
    
    DEPARTMENT ||--o{ INTERN_PROFILE : "has interns"
    PROJECT ||--o{ TASK : "groups tasks"
    PROJECT ||--o{ PROJECT_MEMBER : "has members"
    MEETING ||--o{ MEETING_ATTENDANCE : "tracks joiners"
```

---

## 📡 API Documentation

### Public Endpoints:
- `POST /api/auth/register-intern` - Submit new candidate registration form (Multipart: text + PDF file `cv`).
- `POST /api/auth/login` - Secure login returning JWT token.
- `GET /api/certificates/verify/:key` - Public QR verification search.
- `GET /api/departments` - List registered departments.

### Private Endpoints (Requires JWT in Header `Authorization: Bearer <JWT>`):

#### Intern Actions:
- `POST /api/attendance/checkin` - Clock in.
- `POST /api/attendance/checkout` - Clock out (calculates hours).
- `GET /api/attendance/my` - Personal attendance metrics.
- `POST /api/reports/submit` - Submit daily report (Multipart `screenshot`).
- `GET /api/reports/my` - Fetch report history.
- `POST /api/logbook/submit` - Log daily activity (Multipart `attachment`).
- `GET /api/logbook/my` - Chronological logbook timeline.
- `POST /api/leaves/apply` - Apply for leave (Multipart `document`).
- `GET /api/leaves/my` - Fetch leave history.
- `GET /api/certificates/my` - Download completed certificates.
- `POST /api/chatbot/chat` - Interact with ITA (AI Support).

#### Mentor & Team Lead Actions:
- `POST /api/reports/review/:reportId` - Approve/Reject daily report.
- `GET /api/reports/pending` - Fetch pending reports.
- `POST /api/logbook/review/:logbookId` - Mentor approval and comments.
- `GET /api/logbook/pending` - Fetch pending logbook entries.
- `POST /api/tasks` - Assign new task (TL/Admin).
- `POST /api/tasks/review/:taskId` - Approve task submission.
- `POST /api/meetings` - Schedule sprint meeting.
- `POST /api/meetings/grade/:meetingId/:userId` - Rate meeting participation.
- `GET /api/chatbot/feedback/:internId` - Fetch AI-compiled weekly reviews.

#### HR & Admin Actions:
- `POST /api/auth/approve/:profileId` - Approve intern (generates sequences Intern ID & ID card).
- `POST /api/auth/reject/:profileId` - Decline registration.
- `GET /api/auth/pending-applications` - Fetch pending applications.
- `POST /api/leaves/review/:leaveId` - Approve/Decline leave request.
- `POST /api/certificates/generate` - Issue completion certificate.
- `GET /api/analytics/dashboard` - Dashboard stats and distribution logs.
- `POST /api/admin/trigger-checks` - Force-trigger warning checks.

---

## 🚀 Installation & Local Development

### Prerequisites:
- Node.js (v18+)
- PostgreSQL Database Server

### 1. Database Configuration
Rename/configure your `.env` in the `/backend` folder:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/itimp?schema=public"
JWT_SECRET="your_jwt_private_key"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### 2. Set Up the Backend
```bash
cd backend
npm install
npx prisma generate
# Run migrations to provision tables
npx prisma db push
# Seed the default admin and candidates
npm run prisma:seed
# Start dev api server
npm run dev
```

*Seed User Logins:*
- **Super Admin:** `admin@ideatech.lk` (Password: `password123`)
- **HR Manager:** `hr@ideatech.lk` (Password: `password123`)
- **Team Leader:** `tl@ideatech.lk` (Password: `password123`)
- **Mentor:** `mentor@ideatech.lk` (Password: `password123`)
- **Active Intern:** `intern@ideatech.lk` (Password: `password123`)

### 3. Set Up the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🌐 Production Deployment

### Backend (Railway / Render):
1. Provision a PostgreSQL instance.
2. Link the repository, specify the start command as `npm run build && npm start`.
3. Map environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`).

### Frontend (Vercel / Netlify):
1. Import the `/frontend` subfolder.
2. Build commands: `npm run build`.
3. Proxy calls to the API backend (handled automatically by `next.config.mjs`).
