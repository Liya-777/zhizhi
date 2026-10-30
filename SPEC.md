# Specification — Role-Based Login

This document translates the earlier authentication plan into English. It preserves the development context; some planned interface restrictions differ from the current implementation. For current behavior, inspect the application source. Follow [Local Setup](docs/LOCAL_SETUP.md) for startup commands.

## 1. Objective

Provide a full-screen login page, SQLite-backed user authentication, and role-based access to the application.

| Role | Planned access |
| --- | --- |
| `user` | Research Q&A, source browsing, chat history, bookmarks, and About |
| `admin` | All user features, plus knowledge-base upload, replacement, deletion, and Mock/AI mode switching |

Show the login page when unauthenticated and the workspace after login. Store the browser's authentication state in `sessionStorage` so that it belongs to the current tab session.

## 2. Technology and authentication flow

- Backend: the standard-library `sqlite3` module and `hashlib` SHA-256 password hashing with salt.
- Frontend: token and role stored in `sessionStorage`.
- Flow: `POST /api/auth/login` → receive token and role → store session state → validate the token when the page loads.

## 3. Development commands

The earlier plan used these commands from separate terminal sessions:

```bash
cd backend && python3 -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
cd frontend && npx vite --port 5173 --host 0.0.0.0
cd backend && python3 -m pytest tests/ -q
```

For the packaged version, use the root-directory workflow in `docs/LOCAL_SETUP.md` so that the root `.env` is loaded consistently.

## 4. Files and responsibilities

| File | Responsibility |
| --- | --- |
| `backend/app/core/user_store.py` | SQLite user storage, password hashing, and session-token validation |
| `backend/app/api/auth.py` | Login, logout, and current-user endpoints |
| `frontend/src/components/LoginPage.tsx` | Full-screen login interface |
| `backend/app/models/schemas.py` | Login request, login response, and user-information schemas |
| `backend/app/main.py` | Authentication router registration |
| `frontend/src/App.tsx` | Authentication state and login/workspace rendering |
| `frontend/src/components/Sidebar.tsx` | Role-dependent navigation visibility |
| `frontend/src/components/Header.tsx` | Username, role label, and logout action |
| `frontend/src/hooks/useApi.ts` | Authentication API calls |
| `frontend/src/types.ts` | Frontend authentication types |

## 5. API outline

### Login

`POST /api/auth/login`

```json
{ "username": "admin", "password": "666666" }
```

Example successful response:

```json
{ "token": "uuid...", "role": "admin", "username": "admin" }
```

Invalid credentials return HTTP 401. Server-side error messages may remain in Chinese; the interface supplies its own localized login feedback.

### Validate the current user

`GET /api/auth/me?token=...`

```json
{ "username": "admin", "role": "admin", "valid": true }
```

An invalid or expired token returns HTTP 401.

### Log out

`POST /api/auth/logout?token=...`

```json
{ "status": "ok" }
```

The current implementation passes the logout token in the query string. The earlier plan illustrated it as a request-body field.

## 6. Database structure

The original planning schema was simplified. The implementation uses the following fields:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at REAL NOT NULL
);
```

Demo accounts are seeded for local use: `admin / 666666` and `user / 123456`.

## 7. Frontend flow

```text
Application starts
  -> Check sessionStorage for an authentication token
     -> Token exists: call GET /api/auth/me
        -> Valid: render the workspace
        -> Invalid: clear authentication state and show LoginPage
     -> No token: show LoginPage

Login form submits
  -> POST /api/auth/login
     -> Success: store token, role, and username; render the workspace
     -> Failure: show localized error feedback

User chooses Log out
  -> POST /api/auth/logout
  -> Clear authentication state and return to LoginPage
```

## 8. Planned role-dependent interface

| Area | User | Administrator |
| --- | --- | --- |
| Navigation | Q&A, sources, history, bookmarks, About | All user sections plus knowledge-base management |
| Sidebar footer | System status | System status and mode toggle |
| User menu | Username, role, account settings, logout | Username, administrator role, account settings, logout |

This table records the earlier plan. The current version also includes global language and theme settings and an administrator System section. Check `Sidebar.tsx`, `App.tsx`, and backend authorization checks for the implemented access rules.

## 9. Visual direction

Use the application's neutral silver and Gunmetal visual language, the system font stack, and consistent interaction feedback. Center the login form and align its card, controls, and primary action with the workspace design.

The current interface supports Chinese and English. Shared CSS variables provide light and dark themes.

## 10. Scope of the original plan

Required:

- Full-screen login before entering the workspace.
- Persistent users and sessions in SQLite.
- Role-dependent access to management features.
- Logout that clears authentication state.
- Token validation on page refresh.
- A login page consistent with the rest of the interface.

Outside the original scope:

- Public registration and self-service password changes.
- bcrypt-based password storage; the implementation uses SHA-256 with salt.
- JWT-based authentication; sessions use UUID tokens stored in SQLite.
- A separate permissions-middleware layer; APIs enforce authorization and the frontend controls visibility.
- Multiple simultaneous active sessions per user; creating a session replaces that user's previous session.
