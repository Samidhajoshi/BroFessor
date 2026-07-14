# Brofessor

A peer-to-peer skill-exchange platform. List skills you can teach and skills you want to learn, get matched with compatible users, schedule a session with a video-call link, chat in real time, and rate each other afterward. Profiles can also be run through an AI-powered analyzer for a completeness score and personalized feedback.

> Originally prototyped as a Java Swing + SQLite desktop app, then rebuilt from scratch as a production-style web application.

---

## Features

- **JWT authentication** with BCrypt password hashing
- **Two account types** with different matching rules:
  - `LEARNER` — one-directional requests, pays points to learn
  - `BARTER_USER` — bidirectional skill-for-skill trades
- **Skill compatibility validation**, enforced on both frontend (instant UX feedback) and backend (authoritative)
- **Session scheduling** with double-booking prevention, past-date prevention, and support for Google Meet / Zoom / Microsoft Teams / Jitsi links
- **Points economy** — earn points teaching, spend points learning, refunds on cancellation
- **Real-time chat** over WebSocket/STOMP/SockJS with typing indicators, online presence, and read receipts
- **Automatic session reminders** (30 min / 10 min / at start time) via a background scheduler
- **Public profiles** with photo upload, GitHub/LinkedIn links, projects, and written reviews
- **AI profile analyzer** — a deterministic rule-based score (0–100) plus short AI-generated coaching text (Groq, `llama-3.3-70b-versatile`), cached for 24 hours per profile
- **In-app notifications** for nearly every state change (requests, sessions, ratings, chat rooms)

---

## Tech Stack

**Backend**
- Java 21+, Spring Boot 3.2
- Spring Security + JWT (`jjwt`)
- Spring Data JPA / Hibernate
- MySQL
- Spring WebSocket (STOMP over SockJS)
- Spring Scheduler
- Cloudinary (profile photo storage)
- Lombok
- Maven

**Frontend**
- React 18 + Vite 5
- React Router
- Axios
- `@stomp/stompjs` + `sockjs-client`

**AI**
- Groq API — `llama-3.3-70b-versatile`

---

## Project Structure

```
brofessor-chat/
├── backend/
│   └── src/main/java/com/skillify/
│       ├── entity/          User, UserSkill, Session, SkillRequest, Notification, enums
│       ├── repository/      Spring Data JPA repositories
│       ├── service/          AuthService, UserService, SessionService, SkillRequestService, NotificationService
│       ├── controller/       REST controllers (/api/auth, /api/users, /api/sessions, /api/requests, /api/notifications)
│       ├── security/          JwtUtil, JwtAuthFilter, CustomUserDetailsService, UserPrincipal
│       ├── config/            SecurityConfig, WebConfig, CloudinaryConfig
│       ├── chat/               ChatRoom/Message entities, ChatService, PresenceService, WebSocketConfig
│       ├── ai/                  ProfileScoreService (rules), GroqService (LLM), ProfileAnalysisService (orchestrator)
│       ├── scheduler/         ReminderScheduler
│       └── util/               MeetingLinkValidator
└── frontend/
    └── src/
        ├── api/            axios service wrappers + websocket.js (STOMP client)
        ├── context/        AuthContext.jsx
        ├── components/     Navbar, UserCard, SkillTagInput, chat/, sessions/
        ├── pages/          Landing, Login, Register, Dashboard, BrowseUsers, Profile, Sessions,
        │                   Calendar, Requests, Chat, Notifications, ProfileAnalyzer
        ├── utils/          compatibility.js, resolvePhotoUrl.js
        └── styles/         index.css (burgundy #7A1E34 / olive green #5A6B3A theme)
```

---

## Prerequisites

- **Java 21+** and **Maven**
- **Node.js 18+** and **npm**
- **MySQL** (local instance, or a hosted one)
- A **Groq API key** ([console.groq.com](https://console.groq.com)) — required for the AI profile analyzer
- (Optional) A **Cloudinary** account — used for profile photo uploads

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/Samidhajoshi/BroFessor.git
cd BroFessor
```

### 2. Backend

The backend reads all secrets from environment variables, with safe local defaults baked into `application.properties`:

| Variable | Default (local) | Required in production? |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/brofessor?...` | Yes |
| `DB_USERNAME` | `root` | Yes |
| `DB_PASSWORD` | *(empty)* | Yes |
| `JWT_SECRET` | dev placeholder (32+ bytes) | **Yes — replace this** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Yes |
| `GROQ_API_KEY` | *(none)* | Yes, for the AI analyzer |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | *(none)* | Yes, for photo uploads |
| `PORT` | `8080` | No |

MySQL will auto-create the `brofessor` database on first run (`createDatabaseIfNotExist=true`), and Hibernate will create/update tables (`spring.jpa.hibernate.ddl-auto=update`).

**Set the Groq key** (Windows / PowerShell, permanent for your user):

```powershell
[System.Environment]::SetEnvironmentVariable("GROQ_API_KEY", "your-key-here", "User")
```

**macOS/Linux** (add to `~/.bashrc` / `~/.zshrc`):

```bash
export GROQ_API_KEY="your-key-here"
```

> Don't put `GROQ_API_KEY` in `application.properties` directly — it gets overwritten on rebuilds. Environment variables are the reliable path.

Run the backend:

```bash
cd backend
mvn spring-boot:run
```

The API will start on `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` if your backend isn't at the default address:

```
VITE_API_URL=http://localhost:8080/api
```

Run the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Building for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/skillify-backend-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview   # to preview the production build locally
```

---

## Notable Implementation Details

- **JDK 25 + Lombok**: requires `annotationProcessorPaths` explicitly configured in the `maven-compiler-plugin` (already set up in `pom.xml`) with a recent enough Lombok version.
- **Vite + SockJS**: SockJS expects a Node-style `global` object; this is polyfilled via `define: { global: 'globalThis' }` in `vite.config.js`.
- **Skill matching is authoritative on the backend**: the frontend's `compatibility.js` mirrors the same rules for instant feedback, but `SkillRequestService` re-validates independently server-side — the cached user object on the client can go stale, so it can never be trusted as the sole gate.
- **Static uploads**: `/uploads/**` is explicitly permitted in `SecurityConfig`, or profile photo requests will be blocked by Spring Security.

---

## API Overview

| Area | Base path |
|---|---|
| Auth | `/api/auth/**` (public) |
| Users & profiles | `/api/users/**` |
| Skill requests | `/api/requests/**` |
| Sessions | `/api/sessions/**` |
| Chat (REST) | `/api/chat/**` |
| Chat (WebSocket) | `/ws` (SockJS handshake, STOMP over it) |
| Notifications | `/api/notifications/**` |
| AI profile analysis | `/api/profile/analyze`, `/api/profile/analysis/latest`, `/api/profile/analysis/history` |

All routes except `/api/auth/**`, `/ws/**`, and `/error` require a `Authorization: Bearer <jwt>` header.

---

## License

Add your preferred license here (e.g., MIT).
