# Entrouge

**Simulate the city before you change the city.**

Entrouge is an AI-powered urban mobility simulation platform that helps planners explore the impact of road and traffic decisions before implementing them in the real world.

## Core Workflow

1. **Select a road** on the city map
2. **Create a what-if scenario** (close, restrict, or modify)
3. **Simulate traffic redistribution** via graph-based model
4. **Compare impact** — congestion, travel time, emissions, affected commuters
5. **Ask the AI Copilot** why it happened

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+

### Backend + Simulation

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # add OPENAI_API_KEY for Copilot
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Repository Structure

```
entrouge/
├── frontend/       # React + Vite + MapLibre UI
├── backend/        # FastAPI REST API
├── simulation/     # NetworkX traffic simulation
├── data/           # Sample road network GeoJSON
└── docs/           # Architecture and product docs
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, TypeScript, Vite, Tailwind, shadcn/ui, MapLibre, Recharts |
| Backend | FastAPI, Python |
| Simulation | NetworkX, GeoJSON |
| AI | OpenAI API (function calling) |

## Example Scenario

> "What happens if we close Anna Salai for three hours during evening rush?"

The Copilot parses the request, creates the scenario, runs the simulation, visualizes affected roads, and explains results with mitigation options.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Roadmap](docs/ROADMAP.md)
- [Demo Flow](docs/DEMO_FLOW.md)

## License

MIT
