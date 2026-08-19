# Demo Flow

## Hero Scenario

**"What happens if we close Anna Salai for three hours during evening rush?"**

### Step 1 — Open the app

- Map loads with Chennai central road network
- Anna Salai corridor highlighted as a major arterial

### Step 2 — Select road

- Click Anna Salai segment on the map
- Side panel shows road name, length, capacity, current congestion

### Step 3 — Create scenario

**Option A — Manual**

- Action: Close road
- Duration: 3 hours
- Time profile: Evening rush (17:00–20:00)
- Click **Run Simulation**

**Option B — Copilot**

- Type: "Close Anna Salai for 3 hours during evening rush"
- Copilot extracts scenario and runs simulation automatically

### Step 4 — Compare impact

Dashboard shows:

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Avg travel time | — | — | +X% |
| Congestion index | — | — | +X |
| CO₂ estimate | — | — | +X kg |
| Affected commuters | — | — | N |

Map colors shift: alternate routes (Mount Road, Poonamallee High Road) show increased congestion.

### Step 5 — Ask Copilot

- "Why did Mount Road get worse?"
- Copilot explains diversion paths, capacity limits, and suggests mitigation (e.g. signal timing on alternate arterials)

## Smoke Test Checklist

- [ ] Map loads without errors
- [ ] Road click selects segment
- [ ] Simulation returns in &lt; 5s
- [ ] Charts update with before/after data
- [ ] Copilot responds (with valid API key)
- [ ] Backend health: `GET /api/health`
