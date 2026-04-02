# KeySight — Keystroke Analytics & Session Reconstruction Platform

> **Warning**: This project is for educational and research purposes only. Do not deploy any component on machines you do not own or without explicit written consent. Unauthorized surveillance is illegal.

---

## Overview

KeySight is a full-stack surveillance platform that captures keystrokes on Windows, reconstructs sessions from raw key sequences, extracts behavioral patterns, and presents everything through an analytics dashboard.

Unlike a basic keylogger that just logs keystrokes, KeySight treats the problem as a data pipeline: raw keystroke streams → session reconstruction → content extraction → behavioral analytics → cold storage. The result is a system that transforms noisy, fragmented keystroke data into structured intelligence about a user's digital behavior.

The architecture spans four distinct layers:

```
[Windows C++ Keylogger]          ← endpoint agent, encrypted upload
         │                       
         │ HTTPS/AES-128-CBC     
         ↓                       
[Node.js/Express Backend]         ← ingestion, processing, storage routing
    │           │                
    ↓           ↓                
[MongoDB]    [Google Drive]       ← structured analytics | raw archive
    │                              
    ↓                              
[React Dashboard]                 ← admin interface
    │                              
    ↓                              
[Python FLAN-T5 Microservice]    ← NLP-based session refinement
```

---

## Architecture

### 1. Endpoint Agent — C++ Keylogger

**Location:** `Keylogger/v1/`

The keylogger is a ~1.6MB Windows binary that operates with near-zero external dependencies. It installs a `WH_KEYBOARD_LL` low-level keyboard hook — the same API layer that keyloggers, accessibility tools, and input routing libraries use — and captures every keystroke with per-event metadata:

```json
{
  "timestamp": "2025-07-16T17:53:22.123Z",
  "window": "Chrome — github.com/arjunverma",
  "key": "H"
}
```

**Design decisions:**

- **No external libraries**: Minimizes binary size and AV fingerprinting. The JSON serialization library is the only dependency that required a third-party include.
- **Local encryption**: All logs are encrypted with AES-128-CBC before writing to disk. Logs survive offline periods and are cleared only after confirmed backend upload.
- **Distributed cache**: The local cache is fragmented across multiple file locations to avoid pattern detection by security tools.
- **Auto-update mechanism**: Every upload request receives a config update in the response. The keylogger can change `serverName`, `intervalMinutes`, payload behavior, or scheduling parameters on the fly — no redeployment required. If the backend changes, the agent adapts automatically.
- **Clipboard monitoring**: A separate thread polls the clipboard every 500ms to capture copy events that wouldn't appear as keystrokes (e.g., password manager autofill).
- **Persistence**: Configurable autostart via registry run keys.

The binary can be delivered as a raw executable, wrapped in an HTA/LNK loader, or sent via email — Gmail and WhatsApp do not flag it as malicious.

---

### 2. Backend — Node.js/Express

**Location:** `Backend/`

The backend is a REST API that handles ingestion, processing, storage routing, and admin authentication.

**Ingestion pipeline:**

```
POST / (encrypted logs + hostname)
         │
         ↓
  ┌──────────────────┐
  │ ClientProfile     │  ← find or create by hostname
  │ lookup           │
  └──────────────────┘
         │
         ↓
  ┌──────────────────┐
  │ cleanRawLogs.js  │  ← session reconstruction
  │                  │    - Group by activity window
  │                  │    - 5-min idle gap = session boundary
  │                  │    - Reconstruct text from key labels
  │                  │    - Calculate typing speed, bursts
  │                  │    - Detect clipboard events
  │                  │    - Categorize app by window title
  └──────────────────┘
         │
         ↓
  ┌──────────────────┐
  │ contentDetection  │  ← regex-based extraction
  │ .js               │    - Emails, passwords, OTPs
  │                  │    - Credit cards, phone numbers
  │                  │    - URLs, IP addresses
  │                  │    - Context-aware content typing
  └──────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
[MongoDB]  [Google Drive]
```

**Data architecture:**

| Model | Purpose |
|-------|---------|
| `ClientProfile` | Lifetime aggregate per device — total keystrokes, app usage breakdown, extracted sensitive data |
| `ClientDaily` | Per-day analytics — sessions, WPM distribution, context switches, behavioral patterns |
| `User` | Admin accounts for dashboard access |

**Google Drive cold storage:**

Sessions are too large to store long-term in a regular database. Raw keystroke sessions are organized in Google Drive:

```
KeySight/
├── hostname/
│   ├── 16-07-2025/
│   │   ├── session_001.json   (~1MB chunks)
│   │   ├── session_002.json
│   │   └── ...
│   ├── 17-07-2025/
│   └── ...
```

Files roll over at 10MB. The system uses OAuth2 with 48 pre-provisioned Google accounts — when one fills up, the batch processor automatically switches to the next. This is free, elastic, and has no database cost.

**Config push:**

The `POST /` response carries the current `configValues`. On next check-in, the keylogger applies any changes. This means the backend can update endpoint URLs, upload intervals, or behavioral parameters without touching the binary.

---

### 3. Frontend — React + TypeScript

**Location:** `Frontend/`

A dashboard for managing the entire operation:

- **Auth** — JWT-based login/signup with bcrypt password hashing
- **Victims list** — All tracked devices with summary statistics
- **Victim dashboard** — Per-device analytics: typing speed trends, session heatmaps, app usage breakdown (pie/bar charts), extracted sensitive data, behavioral metrics (WPM, backspace rate, context switches)
- **Config editor** — Push runtime config updates to any keylogger instantly
- **Daily logs** — Session-level view with reconstructed text and metadata

Tech stack: React 18, TypeScript 5.8, Vite 7, TailwindCSS 3.4, Radix UI, Recharts 2.15.

---

### 4. NLP Microservice — Python/FastAPI + FLAN-T5

**Location:** `Microservice/`

A FastAPI wrapper around Google's FLAN-T5 (small) model. It takes raw or partially-reconstructed keystroke sequences and infers what the user was doing:

- `"goo"` + `chrome.google.com` window → `google.com`
- `"leet"` + context of code platform → `leetcode`
- Fragmented typing across chunked uploads → coherent session reconstruction

**Why a local model and not a public API?** Keystroke logs may contain sensitive data. Sending that to a third-party LLM API is a data governance problem. FLAN-T5 small runs on modest hardware and keeps all processing in-house.

---

## Data Flow

1. Keylogger captures keystrokes + clipboard events, encrypts locally
2. Periodic upload (default 1 min) to `POST /`
3. Backend creates/updates `ClientProfile`, runs session reconstruction
4. Processed data splits: structured analytics → MongoDB; raw sessions → Google Drive
5. Backend response carries updated config; keylogger applies it
6. FLAN-T5 microservice refines low-confidence segments
7. Admin browses the React dashboard for behavioral insights

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Keylogger | C++, Windows API (`WH_KEYBOARD_LL`, `WinInet`) |
| Encryption | AES-128-CBC |
| Backend | Node.js, Express.js 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| Cold Storage | Google Drive API v3, OAuth2 |
| Frontend | React 18, TypeScript 5.8, Vite 7, TailwindCSS, Recharts |
| NLP Service | Python 3, FastAPI, HuggingFace Transformers (FLAN-T5) |

---

## Setup

### Backend

```bash
cd Backend
npm install
```

Create `.env`:
```env
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
DATABASE_NAME=windows_keylogger
JWT_SECRET=your_secret_here
PORT=8000
EMAIL_USER=your@gmail.com
EMAIL_APP_PASSWORD=your_app_password
DRIVE_EMAIL=your@gmail.com
CREDENTIALS={"web":{"client_id":"...","client_secret":"...","redirect_uris":["..."]}}
```

```bash
npm start
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API base is hardcoded in `Frontend/src/utils/api.ts`.

### NLP Microservice

```bash
cd Microservice
pip install -r requirements.txt
uvicorn flan_service:app --reload --port 8001
```

### Keylogger (Windows)

1. Edit `Keylogger/v1/keylogger_state.json` — set `serverName` and `backend_port`
2. Build with `compile.bat` (MSVC or MinGW)
3. Run on a machine you own

---

## Security Considerations

This project demonstrates concepts relevant to defensive security research:

- Low-level Windows API hooking patterns and their detection surface
- Client-side encryption before exfiltration
- Session reconstruction from fragmented keystroke streams
- OAuth2 token storage and abuse vectors in cloud storage
- JWT-based command-and-control authentication
- Behavioral analytics from timing and metadata alone

Understanding how these systems work is foundational to building better endpoint defenses, writing detection rules, and researching input acquisition threats.