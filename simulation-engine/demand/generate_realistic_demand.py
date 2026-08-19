"""
Generate realistic OD demand and write a route file for the Chennai network.
This script:
- Reads the SUMO network
- Classifies edges into rough zones (residential/arterial/highway/industrial/mixed)
- Samples departure times from a piecewise demand profile (deterministic seed)
- Selects OD pairs according to weighted probabilities between zones
- For each OD, asks SUMO (via TraCI) to compute a valid route using `simulation.findRoute`
- Writes a vehicle-based route file to the standard `sumo/routes/chennai_test.rou.xml` (backing up existing file)

Usage:
    python simulation-engine/demand/generate_realistic_demand.py --total 180 --seed 42

"""
import os
import sys
import argparse
import random
import time
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Add SUMO tools to path
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
    print("ERROR: Could not find SUMO_HOME. Set SUMO_HOME environment variable.")
    sys.exit(1)

os.environ["SUMO_HOME"] = sumo_home
import sumolib
import traci

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_ROOT = os.path.dirname(SCRIPT_DIR)
NET_XML = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
ROU_XML = os.path.join(SIM_ROOT, "sumo", "routes", "chennai_test.rou.xml")
BACKUP_ROU = ROU_XML + ".bak"
SUMOCFG = os.path.join(SIM_ROOT, "sumo", "configs", "chennai_test.sumocfg")

# Zones (we will build lists of edge ids per zone)

def classify_edges(net):
    residential = []
    arterial = []
    highway = []
    industrial = []
    mixed = []

    for edge in net.getEdges():
        eid = edge.getID()
        try:
            if eid.startswith(":"):
                continue
        except Exception:
            continue

        # Basic heuristics based on lane count and length
        lanes = edge.getLaneNumber()
        length = edge.getLength()

        if lanes <= 1 and length < 120:
            residential.append(eid)
        elif lanes == 2 and length < 300:
            arterial.append(eid)
        elif lanes >= 3 or length >= 300:
            highway.append(eid)
        else:
            mixed.append(eid)

    # If any category is empty, distribute edges to ensure non-empty
    all_edges = [e.getID() for e in net.getEdges() if not e.getID().startswith(":")]
    if not residential:
        residential = random.sample(all_edges, max(1, len(all_edges)//10))
    if not arterial:
        arterial = random.sample(all_edges, max(1, len(all_edges)//8))
    if not highway:
        highway = random.sample(all_edges, max(1, len(all_edges)//15))
    if not mixed:
        mixed = random.sample(all_edges, max(1, len(all_edges)//12))
    if not industrial:
        industrial = random.sample(all_edges, max(1, len(all_edges)//20))

    return {
        'residential': residential,
        'commercial': arterial,
        'highway': highway,
        'industrial': industrial,
        'mixed': mixed,
    }

def piecewise_departure(total, seed):
    # Produce `total` departure times in seconds over horizon 0..900
    random.seed(seed)
    times = []
    for i in range(total):
        # Spread departures more evenly while still building toward the closure window.
        # This keeps the demo busy without spawning too many vehicles at the same junction.
        base = i * (900.0 / max(1, total))
        if base < 180:
            jitter = random.uniform(-6, 10)
        elif base < 290:
            jitter = random.uniform(-4, 12)
        elif base < 600:
            jitter = random.uniform(0, 18)
        else:
            jitter = random.uniform(0, 10)
        t = max(0.0, min(900.0, base + jitter))
        times.append(round(t, 3))
    times.sort()
    return times

VEHICLE_TYPES = [
    ('car', 0.76),
    ('motorcycle', 0.10),
    ('bus', 0.06),
    ('lcv', 0.08),
]

VTYPE_DEFS = {
    'car': {'accel':2.0, 'decel':4.2, 'sigma':0.45, 'tau':1.5, 'minGap':3.0, 'length':4.5, 'maxSpeed':23},
    'motorcycle': {'accel':2.5, 'decel':4.2, 'sigma':0.55, 'tau':1.1, 'minGap':1.4, 'length':2.2, 'maxSpeed':27},
    'bus': {'accel':0.9, 'decel':3.2, 'sigma':0.45, 'tau':2.0, 'minGap':3.5, 'length':12.0, 'maxSpeed':18},
    'lcv': {'accel':1.6, 'decel':3.8, 'sigma':0.5, 'tau':1.7, 'minGap':3.0, 'length':6.0, 'maxSpeed':20},
}

OD_WEIGHTS = [
    # (from_zone, to_zone, weight)
    ('residential','commercial', 0.25),
    ('residential','highway', 0.12),
    ('residential','residential', 0.10),
    ('commercial','residential', 0.20),
    ('commercial','commercial', 0.10),
    ('highway','commercial', 0.08),
    ('mixed','commercial', 0.05),
    ('industrial','commercial', 0.10),
]

def choose_vtype(rand):
    r = rand.random()
    acc = 0.0
    for vt, w in VEHICLE_TYPES:
        acc += w
        if r <= acc:
            return vt
    return VEHICLE_TYPES[0][0]

def weighted_choice(choices, rand):
    total = sum(w for _,_,w in choices)
    r = rand.random() * total
    upto = 0
    for a,b,w in choices:
        if upto + w >= r:
            return a,b
        upto += w
    return choices[-1][0], choices[-1][1]

def prettify_xml(elem):
    rough = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough)
    return reparsed.toprettyxml(indent='  ')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--total', type=int, default=100)
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()

    if not os.path.exists(NET_XML):
        print(f"ERROR: network not found: {NET_XML}")
        sys.exit(1)

    net = sumolib.net.readNet(NET_XML)
    zones = classify_edges(net)

    rand = random.Random(args.seed)
    # Precompute departure times
    dep_times = piecewise_departure(args.total, args.seed)

    # Start a lightweight SUMO to compute routes via TraCI.findRoute
    binary = os.path.join(sumo_home, 'bin', 'sumo')
    sumo_cmd = [binary, '-c', SUMOCFG]
    # Start SUMO and attach
    print("Starting SUMO to compute routes (temporary)...")
    traci.start(sumo_cmd, label='generator')
    conn = traci.getConnection('generator')

    vehicles = []
    attempts = 0
    i = 0
    while i < args.total and attempts < args.total * 10:
        attempts += 1
        # choose OD zone pair
        from_zone, to_zone = weighted_choice(OD_WEIGHTS, rand)
        if from_zone not in zones or to_zone not in zones:
            continue
        if not zones[from_zone] or not zones[to_zone]:
            continue
        origin = rand.choice(zones[from_zone])
        dest = rand.choice(zones[to_zone])
        if origin == dest:
            continue

        # compute a route using SUMO's routing engine
        try:
            # choose a vType temporarily to pass to findRoute
            vtype = choose_vtype(rand)
            stage = conn.simulation.findRoute(origin, dest, vType=vtype, routingMode=1)
            edges = list(stage.edges)
            if not edges:
                continue
            # validate connectivity quickly
            valid = True
            for k in range(len(edges)-1):
                try:
                    e1 = net.getEdge(edges[k])
                    e2 = net.getEdge(edges[k+1])
                    if e2 not in e1.getOutgoing():
                        valid = False
                        break
                except Exception:
                    valid = False
                    break
            if not valid:
                continue

            depart = dep_times[i]
            vtype = choose_vtype(rand)
            veh_id = f"veh_{i}"
            # small variation in speedFactor (kept conservative to reduce collisions)
            speedFactor = round(0.80 + rand.random()*0.20, 3)  # 0.80 - 1.00
            vehicles.append({
                'id': veh_id,
                'depart': depart,
                'type': vtype,
                'speedFactor': speedFactor,
                'edges': edges,
            })
            i += 1
        except Exception as e:
            # route computation may fail; skip
            continue

    print(f"Generated {len(vehicles)} vehicles (attempts={attempts})")
    traci.close()

    # Backup existing route file
    if os.path.exists(ROU_XML):
        print(f"Backing up existing route file to {BACKUP_ROU}")
        try:
            os.replace(ROU_XML, BACKUP_ROU)
        except Exception:
            # fallback copy
            import shutil
            shutil.copy(ROU_XML, BACKUP_ROU)

    # Write route file
    print(f"Writing route file to {ROU_XML}")
    root = ET.Element('routes')

    # write vTypes
    for vt, _ in VEHICLE_TYPES:
        attrs = {'id': vt}
        defs = VTYPE_DEFS.get(vt, {})
        attrs.update({k:str(v) for k,v in defs.items()})
        ET.SubElement(root, 'vType', attrs)

    # write vehicles
    for v in vehicles:
        veh_elem = ET.SubElement(root, 'vehicle', {'id':v['id'], 'depart':str(v['depart']), 'type':v['type'], 'speedFactor':str(v['speedFactor'])})
        route_elem = ET.SubElement(veh_elem, 'route', {'edges':' '.join(v['edges'])})

    xml_str = prettify_xml(root)
    with open(ROU_XML, 'w', encoding='utf-8') as f:
        f.write(xml_str)

    print('Done. Generated route file.')
    # quick stats
    counts = {}
    for v in vehicles:
        counts[v['type']] = counts.get(v['type'], 0) + 1
    print('Vehicle type counts:', counts)

if __name__ == '__main__':
    main()
