import os
import sys

# SUMO Setup
SUMO_SEARCH_PATHS = [
    os.environ.get("SUMO_HOME", ""),
    r"C:\Program Files (x86)\Eclipse\Sumo",
    r"C:\Program Files\Eclipse\Sumo",
    r"C:\sumo",
]

sumo_home = None
for p in SUMO_SEARCH_PATHS:
    if p and os.path.isdir(os.path.join(p, "tools")):
        sumo_home = p
        if os.path.join(p, "tools") not in sys.path:
            sys.path.insert(0, os.path.join(p, "tools"))
        break

if not sumo_home:
    print("ERROR: Could not find SUMO_HOME.")
    sys.exit(1)
os.environ["SUMO_HOME"] = sumo_home

import traci
import sumolib

SIM_ROOT = r"d:\projects-2\TrafficVerse\simulation-engine"
NET_XML = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
SUMOCFG = os.path.join(SIM_ROOT, "sumo", "configs", "chennai_test.sumocfg")

def main():
    binary_path = os.path.join(sumo_home, "bin", "sumo")
    traci.start([binary_path, "-c", SUMOCFG])
    
    print("Finding route between unconnected edges...")
    stage = traci.simulation.findRoute("28138953-AddedOnRampEdge", "23499970#2")
    print("Edges:", stage.edges)
    print("Cost:", stage.cost)
    print("Length:", stage.length)
    
    traci.close()

if __name__ == "__main__":
    main()
