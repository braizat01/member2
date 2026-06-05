# 3D Anatomy Learning System — Quiz & Assessment Module

Member 2 deliverable: full quiz and learning assessment subsystem.

## Tech Stack

- **Frontend**: React 18 + Vite + Recharts
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via `pg`)
- **Auth**: JWT (provided by Member 3)

---

## Setup

### 1. Create the Database

Connect to PostgreSQL and create the database, then run the schema:

```bash
psql -U postgres -c "CREATE DATABASE anatomy_quiz;"
psql -U postgres -d anatomy_quiz -f backend/db/quizSchema.sql
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anatomy_quiz
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=the_same_secret_used_by_member3
CLIENT_ORIGIN=http://localhost:5173
```

> `JWT_SECRET` must match the secret Member 3 uses to sign tokens. Tokens are read from the `Authorization: Bearer <token>` header.

### 3. Install Backend Dependencies & Run Seed

```bash
cd backend
npm install
npm run seed
```

The seed script is idempotent — it truncates existing data and inserts 12 fresh questions (4 × multiple choice, 4 × identify-the-part, 4 × clinical scenario) across Skeletal, Muscular, Cardiovascular, and Nervous systems.

### 4. Start the Backend

```bash
cd backend
npm run dev
```

Backend runs at `http://localhost:5000`.

### 5. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend automatically.

---

## API Reference

All endpoints require `Authorization: Bearer <token>` unless otherwise noted.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/quiz/start` | Start a session. Body: `{ anatomical_system?, type?, count? }` |
| POST | `/api/quiz/answer` | Submit one answer. Body: `{ session_id, question_id, selected_option_id }` |
| POST | `/api/quiz/finish` | Finalize session & compute score. Body: `{ session_id }` |
| GET | `/api/quiz/results/:id` | Full results for a session |
| GET | `/api/quiz/progress` | Aggregate stats + per-system accuracy for the authenticated user |
| GET | `/api/questions` | List questions (query: `anatomical_system`, `type`, `difficulty`, `page`, `limit`) |
| GET | `/api/questions/:id` | Single question with options |
| POST | `/api/questions` | Create a question with options |
| PUT | `/api/questions/:id` | Update a question and replace its options |
| DELETE | `/api/questions/:id` | Delete a question |

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/#/` | `QuizApp` | Quiz setup form + active quiz |
| `/#/results/:sessionId` | `ResultsPage` | Score summary + per-question review |
| `/#/progress` | `ProgressDashboard` | Charts: score history, per-system accuracy |

The frontend uses **HashRouter** so it deploys to GitHub Pages without server-side routing configuration.

---

## Auth Integration (Member 3)

`authMiddleware.js` reads `process.env.JWT_SECRET`, verifies the incoming Bearer token, and attaches `req.user = { id, name }` to the request. No changes needed — just ensure the shared secret matches.

---

## Project Structure

```
quiz-module/
├── backend/
│   ├── db/
│   │   ├── quizSchema.sql        # DDL: 4 tables + indexes
│   │   └── quizData.js           # Seed: 12 sample questions
│   ├── controllers/
│   │   └── quizController.js     # All business logic
│   ├── routes/
│   │   └── quizRoutes.js         # Route → controller wiring
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   ├── db.js                     # pg Pool
│   ├── server.js                 # Express entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                # Router + nav
        ├── api/
        │   └── quizApi.js         # Fetch wrapper (attaches JWT)
        └── components/
            ├── QuizApp.jsx        # Quiz flow (setup → questions → finish)
            ├── ResultsPage.jsx    # Score + per-question review
            └── ProgressDashboard.jsx  # Recharts progress charts
```
