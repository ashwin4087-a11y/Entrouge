"""
TrafficVerse - Simulation Diagnostic Script
Reads the network and routes, runs a headless simulation, and reports statistics.
"""

import os
import sys
import subprocess
import xml.etree.ElementTree as ET

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SUMO_DIR = os.path.join(SCRIPT_DIR, "sumo")
NET_XML_PATH = os.path.join(SUMO_DIR, "networks", "chennai_test.net.xml")
ROUTE_XML_PATH = os.path.join(SUMO_DIR, "routes", "chennai_test.rou.xml")
SUMOCFG_PATH = os.path.join(SUMO_DIR, "configs", "chennai_test.sumocfg")

# Common SUMO install locations on Windows
SUMO_SEARCH_PATHS = [
    os.environ.get("SUMO_HOME", ""),
    r"C:\Program Files (x86)\Eclipse\Sumo",
    r"C:\Program Files\Eclipse\Sumo",
    r"C:\sumo",
]

def find_sumo_binary(name):
    """Find a SUMO binary (sumo.exe or sumo-gui.exe)."""
    for p in SUMO_SEARCH_PATHS:
        if not p:
            continue
        for binary_name in (f"{name}.exe", name):
            path = os.path.join(p, "bin", binary_name)
            if os.path.isfile(path):
                return path
    return None

def parse_network_stats():
    """Parse .net.xml for node, edge, and tlLogic counts."""
    nodes = 0
    edges = 0
    tls = 0
    if not os.path.exists(NET_XML_PATH):
        return nodes, edges, tls
    
    for event, elem in ET.iterparse(NET_XML_PATH, events=('end',)):
        if elem.tag == 'junction':
            if elem.get('type') != 'internal':
                nodes += 1
            elem.clear()
        elif elem.tag == 'edge':
            if not elem.get('id', '').startswith(':'): # Skip internal edges
                edges += 1
            elem.clear()
        elif elem.tag == 'tlLogic':
            tls += 1
            elem.clear()
    return nodes, edges, tls

def parse_route_stats():
    """Parse .rou.xml for vehicle counts and depart range."""
    vehicles = 0
    min_depart = float('inf')
    max_depart = -1.0
    
    if not os.path.exists(ROUTE_XML_PATH):
        return vehicles, 0.0, 0.0
        
    for event, elem in ET.iterparse(ROUTE_XML_PATH, events=('end',)):
        if elem.tag == 'trip' or elem.tag == 'vehicle':
            vehicles += 1
            depart = float(elem.get('depart', 0))
            if depart < min_depart: min_depart = depart
            if depart > max_depart: max_depart = depart
            elem.clear()
            
    if min_depart == float('inf'):
        min_depart = 0.0
        
    return vehicles, min_depart, max_depart

def run_simulation():
    """Run headless SUMO and parse statistics from stderr/stdout."""
    sumo_binary = find_sumo_binary("sumo")
    if not sumo_binary:
        return None
        
    cmd = [
        sumo_binary,
        "-c", SUMOCFG_PATH,
        "--duration-log.statistics"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    stats = {
        "inserted": 0,
        "arrived": 0,
        "running": 0,
        "teleports": 0,
        "duration": 0.0
    }
    
    # Parse output
    lines = result.stderr.split('\n') + result.stdout.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith("Inserted:"):
            stats["inserted"] = int(line.split(":")[1].strip())
        elif line.startswith("Running:"):
            stats["running"] = int(line.split(":")[1].strip())
        elif line.startswith("Simulation ended at time:"):
            stats["duration"] = float(line.split(":")[1].strip().rstrip('.'))
        elif line.startswith("Teleports:"):
            # Teleports: 3 (Wrong Lane: 3) -> parse the leading number
            parts = line.split(":")
            if len(parts) > 1:
                val = parts[1].strip().split(" ")[0]
                stats["teleports"] = int(val)
                
    # Arrivals = Inserted - Running
    stats["arrived"] = stats["inserted"] - stats["running"]
    
    return stats

def main():
    print("=" * 60)
    print("TrafficVerse - Simulation Diagnostic")
    print("=" * 60)
    print()
    
    nodes, edges, tls = parse_network_stats()
    print("--- Network Statistics ---")
    print(f"Nodes (junctions): {nodes}")
    print(f"Edges (roads):     {edges}")
    print(f"Traffic Lights:    {tls}")
    print()
    
    vehicles, min_dep, max_dep = parse_route_stats()
    print("--- Route Statistics ---")
    print(f"Trips/Routes:      {vehicles}")
    print(f"Depart Range:      {min_dep:.1f}s to {max_dep:.1f}s")
    print()
    
    print("--- Simulation Execution ---")
    print("Running headless simulation to gather runtime stats...")
    stats = run_simulation()
    
    if stats:
        print(f"Simulation Duration: {stats['duration']}s")
        print(f"Vehicles Inserted:   {stats['inserted']}")
        print(f"Vehicles Arrived:    {stats['arrived']}")
        print(f"Vehicles Running:    {stats['running']} (at end)")
        print(f"Teleports:           {stats['teleports']}")
    else:
        print("Error: Could not run simulation.")
        
    print()
    print("=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
