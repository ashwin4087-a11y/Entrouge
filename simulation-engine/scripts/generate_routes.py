"""
Generate a basic, strictly validated vehicle route file for testing the SUMO network.

Requires:
  - The SUMO network file (chennai_test.net.xml)
  - sumolib (included with SUMO / pip)
"""

import os
import sys
import random
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
SIM_ROOT = os.path.dirname(SCRIPT_DIR)

NET_XML_PATH = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
ROUTE_XML_PATH = os.path.join(SIM_ROOT, "sumo", "routes", "chennai_test.rou.xml")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TARGET_VEHICLES = 42      # Number of valid test vehicles to aim for
SIM_END_TIME = 600        # Spread departures over 600 seconds (10 minutes)
RANDOM_SEED = 42          # Reproducible
MIN_EDGE_LENGTH = 50      # Minimum edge length in meters

def main():
    print("=" * 60)
    print("TrafficVerse - Robust Route Generator")
    print("=" * 60)
    print()

    if not os.path.isfile(NET_XML_PATH):
        print(f"ERROR: SUMO network not found at {NET_XML_PATH}")
        sys.exit(1)

    print(f"[1/3] Loading SUMO network: {NET_XML_PATH}")
    net = sumolib.net.readNet(NET_XML_PATH)

    all_edges = net.getEdges()
    usable_edges = [
        e for e in all_edges
        if e.allows("passenger")
        and e.getLength() >= MIN_EDGE_LENGTH
        and not e.is_fringe()
    ]

    if len(usable_edges) < 20:
        usable_edges = [e for e in all_edges if e.allows("passenger")]

    print(f"      Usable edges (passenger): {len(usable_edges)}")
    print()

    print(f"[2/3] Generating up to {TARGET_VEHICLES} fully validated vehicle routes...")
    random.seed(RANDOM_SEED)

    vehicles = []
    attempts = 0
    max_attempts = 2000

    while len(vehicles) < TARGET_VEHICLES and attempts < max_attempts:
        attempts += 1
        origin = random.choice(usable_edges)
        destination = random.choice(usable_edges)
        
        if origin.getID() == destination.getID():
            continue

        # Use SUMO's shortest path algorithm to strictly validate connectivity
        path_result = net.getShortestPath(origin, destination)
        
        # path_result is (tuple_of_edges, cost) or None if no path exists
        if path_result is not None and path_result[0] is not None:
            path_edges = path_result[0]
            if len(path_edges) >= 2:
                vehicles.append({
                    "id": f"veh_{len(vehicles)}",
                    "from": origin.getID(),
                    "to": destination.getID(),
                    "edges": " ".join([e.getID() for e in path_edges])
                })

    print(f"      Generated {len(vehicles)} valid connected routes in {attempts} attempts.")
    if len(vehicles) == 0:
        print("ERROR: Could not generate any valid routes.")
        sys.exit(1)
    print()

    # Assign departure times evenly spaced across SIM_END_TIME
    depart_interval = SIM_END_TIME / len(vehicles)
    for i, v in enumerate(vehicles):
        v["depart"] = round(i * depart_interval, 1)

    print(f"[3/3] Writing explicitly validated routes -> {ROUTE_XML_PATH}")
    os.makedirs(os.path.dirname(ROUTE_XML_PATH), exist_ok=True)

    root = ET.Element("routes")
    root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
    root.set("xsi:noNamespaceSchemaLocation", "http://sumo.dlr.de/xsd/routes_file.xsd")

    # Vehicle type (standard passenger car)
    vtype = ET.SubElement(root, "vType")
    vtype.set("id", "car")
    vtype.set("accel", "2.6")
    vtype.set("decel", "4.5")
    vtype.set("sigma", "0.5")
    vtype.set("length", "4.5")
    vtype.set("maxSpeed", "50")
    vtype.set("color", "0.2,0.8,0.2")

    # Define vehicles with explicit edge paths to absolutely guarantee connectivity
    for v in vehicles:
        veh = ET.SubElement(root, "vehicle")
        veh.set("id", v["id"])
        veh.set("type", "car")
        veh.set("depart", str(v["depart"]))
        
        route = ET.SubElement(veh, "route")
        route.set("edges", v["edges"])

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(ROUTE_XML_PATH, encoding="UTF-8", xml_declaration=True)

    print(f"      Saved {len(vehicles)} routes.")
    print()

    print("=" * 60)
    print("ROUTE GENERATION COMPLETE")
    print("=" * 60)
    print(f"  Valid Vehicles: {len(vehicles)}")
    print(f"  Depart range:   0.0 - {vehicles[-1]['depart']}s")
    print()

if __name__ == "__main__":
    main()
