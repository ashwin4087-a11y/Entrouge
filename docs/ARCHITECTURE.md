# Architecture

## Overview

```
                    ENTROUGE
                       │
              ┌────────▼────────┐
              │ React + Vite     │
              │ TypeScript       │
              └────────┬─────────┘
                       │
              ┌────────▼────────┐
              │ MapLibre + OSM   │
              │ Road Network     │
              └────────┬─────────┘
                       │
                 REST / JSON
                       │
              ┌────────▼────────┐
              │ FastAPI          │
              └───────┬─────────┘
                      / \
                     /   \
            ┌────────▼┐ ┌─▼─────────┐
            │ NetworkX│ │ OpenAI API│
            │Simulator│ │ Copilot   │
            └────┬────┘ └────┬──────┘
                 │            │
                 └──────┬─────┘
                        ▼
                 Impact Results
```

## Components

### Frontend (`frontend/`)

- **MapView** — MapLibre map with road network GeoJSON layer; click to select segments
- **ScenarioPanel** — Configure closures/modifications and trigger simulation
- **ImpactDashboard** — Before/after metrics and Recharts visualizations
- **CopilotChat** — Natural-language scenario creation and result explanation

### Backend (`backend/`)

- **REST API** — `/api/network`, `/api/simulate`, `/api/copilot`
- **Simulation service** — Delegates to `simulation` package
- **Copilot service** — OpenAI function calling to parse requests and explain results

### Simulation (`simulation/`)

- **Road graph** — NetworkX graph from GeoJSON (nodes = intersections, edges = road segments)
- **Traffic model** — Lightweight demand assignment: shortest-path routing with capacity constraints
- **Impact metrics** — Travel time, congestion index, CO₂ estimate, affected trip count

## Data Flow

1. Frontend loads network GeoJSON from `/api/network`
2. User selects edge(s) and defines scenario (e.g. `close` for 3 hours)
3. POST `/api/simulate` with `baseline` vs `scenario` parameters
4. Backend runs simulation twice, returns delta metrics + per-edge congestion
5. Frontend updates map colors and charts
6. User asks Copilot → POST `/api/copilot` with message + context → structured scenario or explanation

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render or Railway |

Environment: `VITE_API_URL`, `OPENAI_API_KEY`.

## MVP Boundaries

Not in MVP: SUMO, PostGIS, Redis/Celery, WebSockets, auth, multi-city infra. See [ROADMAP.md](ROADMAP.md).
