# CleaniSense

Hyperlocal Community Pollution Monitoring & Hotspot Detection Platform.

CleaniSense combines citizen reports, image analysis, weather conditions, air quality information, and geospatial clustering to identify pollution hotspots, estimate severity, predict escalation over a 24-hour window, and assist municipal authorities in prioritizing response efforts.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic (v2)
- **Database**: SQLite (Local Dev) / PostgreSQL (Staging/Prod)

## Project Directory Structure

```
CleaniSense/
├── frontend/             # Next.js 15 client application
│   ├── app/              # App router pages & layouts
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library integrations (API client, etc.)
│   ├── contexts/         # React Contexts (Auth, UI, etc.)
│   ├── services/         # API connection handlers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # General helpers
│   ├── public/           # Static assets (images, icons)
│   └── middleware.ts     # Next.js request middleware
│
├── backend/              # FastAPI server application
│   ├── app/
│   │   ├── api/          # Route version packages
│   │   │   └── v1/
│   │   │       └── routers/
│   │   ├── core/         # Core config & security
│   │   ├── database/     # DB connections & sessions
│   │   ├── middleware/   # FastAPI middlewares
│   │   ├── models/       # SQLAlchemy models
│   │   ├── repositories/ # Data access pattern layer
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Core business logic processing
│   │   └── utils/        # General helpers
│   │   └── main.py       # Main API entrypoint
│   ├── tests/            # pytest modules
│   ├── requirements.txt  # Python requirements
│   └── .env.example      # Example environment variables
│
├── docs/                 # Documentation and diagrams
└── README.md             # This document
```

## Setup Instructions

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment configuration and configure settings:
   ```bash
   cp .env.example .env
   ```
5. Start development API server:
   ```bash
   uvicorn app.main:app --reload
   ```
