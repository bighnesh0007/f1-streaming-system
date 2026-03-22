# F1 Streaming System

End-to-end pipeline that ingests **OpenF1** race data, streams it through **Apache Kafka**, persists it in **MySQL**, and serves it via a **Node.js** REST API with **SSE/WebSocket** plus a **Next.js** dashboard.

## Architecture

| Component | Role |
|-----------|------|
| **Producer** (Python) | Polls OpenF1, publishes to Kafka topics (drivers, telemetry, laps, positions, weather, and more). |
| **Consumer** (Python) | Consumes Kafka messages, writes to MySQL, analytics/ML helpers. |
| **Backend** (Node.js) | REST API, Server-Sent Events, WebSocket — port **3001** by default. |
| **Frontend** (Next.js) | Web UI — port **3000** in development. |

## Prerequisites

- **Node.js** (LTS) — backend and frontend
- **Python 3** — producer and consumer
- **Apache Kafka** — reachable from producer/consumer config
- **MySQL** — schema/migrations under `sql/`

## Quick start (Windows)

From the repository root:

```powershell
.\start_all_services.ps1
```

This opens four terminals: backend, frontend, producer, and consumer.

## Manual setup

### 1. Environment variables

Copy or create `.env` files where needed (they are **not** committed):

- Root / shared: `.env` (if used by scripts)
- `backend/.env` — DB, Kafka-related settings as required by `backend/config`
- `producer/.env` — OpenF1 session, Kafka brokers, topic names
- `consumer/.env` — Kafka and MySQL connection settings

Never commit real secrets or API keys.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Producer

```bash
cd producer
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

### 5. Consumer

```bash
cd consumer
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Database

Apply migrations or schema as documented in `sql/` (e.g. run `migrate.py` if that is your workflow).

## Repository layout

```
f1-streaming-system/
├── backend/          # Express API
├── consumer/         # Kafka → MySQL consumer
├── frontend/         # Next.js app
├── producer/         # OpenF1 → Kafka producer
├── sql/              # Schema / migrations
├── start_all_services.ps1
└── README.md
```

## License

See individual `package.json` / project files for license details.
