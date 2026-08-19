# TrafficVerse - Simulation Engine

This directory contains the simulation backbone of the TrafficVerse Digital Twin. It handles fetching real-world road network data, converting it to a SUMO-compatible format, generating vehicle routes, and running the simulation.

## Architecture & Pipeline

The simulation pipeline currently consists of three main steps, executed sequentially:

1.  **OSM Download (`osm/download_network.py`)**
    Downloads a small real-world road network (currently centered around Chennai Central / Egmore, ~3km diameter) from OpenStreetMap using `osmnx`.
    *   Saves `chennai_central.graphml` (raw network).
    *   Saves GeoJSON files for visual debugging.

2.  **Network Preparation (`osm/prepare_network.py`)**
    Converts the OSM network into a SUMO network (`.net.xml`).
    *   Reads the network and exports as OSM XML.
    *   Calls SUMO's `netconvert` to generate `networks/chennai_test.net.xml`.
    *   Automatically cleans up geometry, guesses traffic light signals, and joins complex intersections.

3.  **Route Generation (`scripts/generate_routes.py`)**
    Generates a set of random vehicle trips to populate the network.
    *   Filters out dead-end and small edges.
    *   Generates a defined number of vehicle trips with random origins and destinations.
    *   Saves `routes/chennai_test.rou.xml`.

## Running the Simulation

A wrapper script is provided to launch the simulation with the generated configuration.

### Prerequisites
*   Python 3 installed with required packages (`osmnx`, `networkx`, `sumolib`, `traci`).
*   [Eclipse SUMO](https://eclipse.dev/sumo/) installed (the script attempts to auto-detect its location, but setting `SUMO_HOME` is recommended).

### Commands

**Run full pipeline:**
```bash
python osm/download_network.py
python osm/prepare_network.py
python scripts/generate_routes.py
```

**Run Simulation (GUI mode):**
```bash
python run_basic_simulation.py
```
This opens the `sumo-gui` interface. The simulation will auto-start.

**Run Simulation (Headless mode):**
```bash
python run_basic_simulation.py --no-gui
```
This runs the simulation in the background without a GUI, useful for validation and performance testing.

## Important Note on Routing
The simulation is currently configured with `<ignore-route-errors value="true"/>` and `<time-to-teleport value="120"/>`. Because vehicle trips are generated randomly on a raw OSM network, some routes may be impossible due to one-way streets or disconnected edges. SUMO will automatically route vehicles using A*, and teleport any vehicles that get permanently stuck.
