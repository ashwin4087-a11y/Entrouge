"""
TrafficVerse - Route Validation Script
Verifies that all routes in the generated route file are fully connected
and valid within the SUMO network.
"""

import os
import sys
import xml.etree.ElementTree as ET

# Add SUMO tools to path for sumolib
SUMO_SEARCH_PATHS = [
    os.environ.get("SUMO_HOME", ""),
    r"C:\Program Files (x86)\Eclipse\Sumo",
    r"C:\Program Files\Eclipse\Sumo",
    r"C:\sumo",
]

for p in SUMO_SEARCH_PATHS:
    tools_dir = os.path.join(p, "tools") if p else ""
    if os.path.isdir(tools_dir):
        if tools_dir not in sys.path:
            sys.path.insert(0, tools_dir)
        break

import sumolib

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_ROOT = SCRIPT_DIR

NET_XML_PATH = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
ROUTE_XML_PATH = os.path.join(SIM_ROOT, "sumo", "routes", "chennai_test.rou.xml")

def main():
    print("=" * 60)
    print("TrafficVerse Route Validation")
    print("=" * 60)
    print()

    if not os.path.exists(NET_XML_PATH):
        print(f"ERROR: Network file not found: {NET_XML_PATH}")
        sys.exit(1)
        
    if not os.path.exists(ROUTE_XML_PATH):
        print(f"ERROR: Route file not found: {ROUTE_XML_PATH}")
        sys.exit(1)

    print("Loading network...")
    net = sumolib.net.readNet(NET_XML_PATH)

    print("Parsing routes...")
    tree = ET.parse(ROUTE_XML_PATH)
    root = tree.getroot()

    total_vehicles = 0
    valid_routes = 0
    invalid_routes = 0
    disconnected_transitions = 0

    for vehicle in root.findall("vehicle"):
        total_vehicles += 1
        route_elem = vehicle.find("route")
        
        if route_elem is None or not route_elem.get("edges"):
            invalid_routes += 1
            print(f"Warning: Vehicle '{vehicle.get('id')}' has no valid route edges.")
            continue
            
        edges = route_elem.get("edges").split()
        
        if len(edges) < 2:
            invalid_routes += 1
            print(f"Warning: Vehicle '{vehicle.get('id')}' has a route with fewer than 2 edges.")
            continue
            
        is_valid = True
        
        # Check every consecutive edge transition for connectivity
        for i in range(len(edges) - 1):
            e1_id = edges[i]
            e2_id = edges[i+1]
            
            try:
                e1 = net.getEdge(e1_id)
                e2 = net.getEdge(e2_id)
            except KeyError as e:
                is_valid = False
                print(f"Warning: Edge {e} in route for vehicle '{vehicle.get('id')}' does not exist in network.")
                break

            # Check if e1 connects to e2
            connections = e1.getOutgoing()
            if e2 not in connections:
                is_valid = False
                disconnected_transitions += 1
                print(f"Warning: Disconnected transition in vehicle '{vehicle.get('id')}': {e1_id} -> {e2_id}")
                break

        if is_valid:
            valid_routes += 1
        else:
            invalid_routes += 1

    print()
    print("--- Validation Results ---")
    print(f"Vehicles: {total_vehicles}")
    print(f"Valid routes: {valid_routes}")
    print(f"Invalid routes: {invalid_routes}")
    print(f"Disconnected transitions: {disconnected_transitions}")
    print()

    if invalid_routes > 0:
        print("ERROR: Invalid routes detected. Please regenerate routes.")
        sys.exit(1)
    else:
        print("SUCCESS: All routes are strictly valid and fully connected.")
        sys.exit(0)

if __name__ == "__main__":
    main()
