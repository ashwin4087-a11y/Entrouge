"""
TrafficVerse - Road Closure Scenario
Runs the normal baseline simulation, then dynamically closes a road at 300s,
reroutes affected vehicles, and compares the metrics to show the impact.
Now with advanced visual demo features!
"""

import os
import sys
import json
import argparse
import time as ptime
import xml.etree.ElementTree as ET

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
from validate_runtime_route import validate_route, path_exists

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_ROOT = os.path.dirname(SCRIPT_DIR)
NET_XML = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
ROU_XML = os.path.join(SIM_ROOT, "sumo", "routes", "chennai_test.rou.xml")
SUMOCFG = os.path.join(SIM_ROOT, "sumo", "configs", "chennai_test.sumocfg")
RESULTS_DIR = os.path.join(SIM_ROOT, "results")

def find_closure_candidate(min_length=50):
    print("========================================")
    print("TRAFFICVERSE CLOSURE CANDIDATE")
    print("========================================")
    
    net = sumolib.net.readNet(NET_XML)
    tree = ET.parse(ROU_XML)
    
    edge_usage = {}
    for veh in tree.getroot().findall("vehicle"):
        route_elem = veh.find("route")
        if route_elem is None: continue
        edges = route_elem.get("edges").split()
        for i, edge_id in enumerate(edges):
            if i > 0 and i < len(edges) - 1:
                edge_usage[edge_id] = edge_usage.get(edge_id, 0) + 1
                
    sorted_edges = sorted(edge_usage.items(), key=lambda x: x[1], reverse=True)
    
    best_edge = None
    
    # Try finding an edge matching the target length
    for edge_id, count in sorted_edges:
        if edge_id.startswith(":"): continue 
        edge_obj = net.getEdge(edge_id)
        if not edge_obj.allows("passenger"): continue
        if edge_obj.getLength() >= min_length:
            best_edge = edge_id
            break

    # Progressive fallback if no 50m edge works
    if not best_edge and min_length > 10:
        return find_closure_candidate(min_length=min_length - 10)

    if not best_edge:
        print("ERROR: Could not find a suitable edge to close.")
        sys.exit(1)

    print(f"Selected edge: {best_edge}")
    print(f"Vehicles using edge: {edge_usage[best_edge]}")
    print(f"Edge length: {net.getEdge(best_edge).getLength():.2f}m")
    print("========================================\n")
    
    return best_edge

def run_simulation(name, close_edge=None, closure_time=300, use_gui=False, is_demo=False):
    binary = "sumo-gui" if use_gui else "sumo"
    binary_path = os.path.join(sumo_home, "bin", binary)

    sumo_cmd = [binary_path, "-c", SUMOCFG]
    if use_gui and not is_demo:
        sumo_cmd.extend(["--start", "--quit-on-end"])
    elif is_demo:
        sumo_cmd.extend(["--start"]) # Keep open and start automatically

    traci.start(sumo_cmd)
    
    net = sumolib.net.readNet(NET_XML) if close_edge else None
    
    metrics = {
        "departed": 0, "arrived": 0, "teleports": 0,
        "speeds": [], "waits": [], "duration": 0,
        "edge_usage": {}, "timeseries": []
    }
    
    closure_metrics = {
        "affected": 0, "rerouted": 0, "failed": 0,
        "processed_vehicles": set()
    }
    
    vehicles_on_edges = {} 
    
    print(f"Starting {name} simulation...")
    
    while traci.simulation.getMinExpectedNumber() > 0:
        time = traci.simulation.getTime()
        
        # ACTIVATE CLOSURE
        if close_edge and time == closure_time:
            edge_obj = net.getEdge(close_edge)
            length = edge_obj.getLength()
            
            print("\n========================================")
            print("ROAD CLOSURE ACTIVATED")
            print("========================================")
            print(f"Time: {time}s")
            print(f"Edge: {close_edge}")
            print(f"Length: {length:.2f} m")
            
            # Close it to passengers
            traci.edge.adaptTraveltime(close_edge, 1e6)
            edge_lane_count = traci.edge.getLaneNumber(close_edge)
            for i in range(edge_lane_count):
                traci.lane.setDisallowed(f"{close_edge}_{i}", ["passenger"])

            if use_gui:
                print("\nVISUAL STATUS:")
                print("RED HIGHLIGHT ACTIVE")
                print("CLOSURE MARKER ACTIVE")
                print("========================================\n")
                
                # Visual Demo Effects
                shape = edge_obj.getShape()
                if shape:
                    mid_idx = len(shape) // 2
                    mid_pt = shape[mid_idx]
                    
                    # 1. Zoom and center
                    traci.gui.setOffset("View #0", mid_pt[0], mid_pt[1])
                    traci.gui.setZoom("View #0", 2500)
                    
                    # 2. Add POI marker
                    traci.poi.add(
                        poiID=f"marker_{close_edge}",
                        x=mid_pt[0], y=mid_pt[1],
                        color=(255, 0, 0, 255),
                        poiType="CLOSED",
                        layer=200
                    )
                    
                    # 3. Draw red polygon over the road to highlight it
                    # Widen the shape a bit to cover the lanes nicely
                    poly_shape = []
                    for pt in shape:
                        poly_shape.append((pt[0]-5, pt[1]-5))
                    for pt in reversed(shape):
                        poly_shape.append((pt[0]+5, pt[1]+5))
                        
                    traci.polygon.add(
                        polygonID=f"poly_{close_edge}",
                        shape=poly_shape,
                        color=(255, 50, 50, 200),
                        fill=True,
                        layer=100
                    )
                    
                    # 4. Also toggle selection for native SUMO lane highlighting
                    for i in range(edge_lane_count):
                        traci.gui.toggleSelection(f"{close_edge}_{i}", "lane")

                if is_demo:
                    # Pause so the judge can observe the exact moment of closure
                    print("🔄 REROUTING VEHICLES...\n")
                    ptime.sleep(3)

        traci.simulationStep()
        time = traci.simulation.getTime()
        
        metrics["departed"] += traci.simulation.getDepartedNumber()
        metrics["arrived"] += traci.simulation.getArrivedNumber()
        metrics["teleports"] += traci.simulation.getStartingTeleportNumber()
        
        active_vehs = traci.vehicle.getIDList()
        
        # Track edge usage
        for v in active_vehs:
            edge = traci.vehicle.getRoadID(v)
            if not edge.startswith(":"):
                if edge not in vehicles_on_edges:
                    vehicles_on_edges[edge] = set()
                vehicles_on_edges[edge].add(v)
                
        # REROUTING LOGIC
        if close_edge and time >= closure_time:
            for v in active_vehs:
                if v not in closure_metrics["processed_vehicles"]:
                    route = traci.vehicle.getRoute(v)
                    if close_edge in route:
                        closure_metrics["affected"] += 1
                        
                        curr_edge = traci.vehicle.getRoadID(v)
                        curr_lane = traci.vehicle.getLaneID(v)
                        curr_idx = traci.vehicle.getRouteIndex(v)
                        
                        if curr_edge.startswith(":"):
                            curr_edge = route[curr_idx]
                            
                        dest_edge = route[-1]
                        
                        print(f"\n[REROUTE ATTEMPT] Vehicle: {v}")
                        print(f"Current edge: {curr_edge}")
                        print(f"Current lane: {curr_lane}")
                        print(f"Original route: {route}")
                        print(f"Current route index: {curr_idx}")
                        print(f"Destination edge: {dest_edge}")

                        # Check physical graph connectivity first to avoid native SUMO warning spam
                        has_path = path_exists(net, curr_edge, dest_edge, close_edge)
                        
                        if not has_path:
                            print(f"Candidate reroute: NONE")
                            print(f"Valid: False")
                            print(f"Vehicle: {v}")
                            print(f"Reroute: FAILED")
                            print(f"Current edge: {curr_edge}")
                            print(f"Destination: {dest_edge}")
                            print(f"Reason: No valid alternative route")
                            closure_metrics["failed"] += 1
                            closure_metrics["processed_vehicles"].add(v)
                            continue
                            
                        # Use SUMO's native routing engine to safely calculate the route
                        stage = traci.simulation.findRoute(curr_edge, dest_edge, vType=traci.vehicle.getTypeID(v), routingMode=1)
                        candidate_route = stage.edges
                        print(f"Candidate reroute: {candidate_route}")
                        
                        is_valid, bad_transition = validate_route(net, candidate_route)
                        print(f"Whether candidate route is valid: {is_valid}")
                        
                        if is_valid and close_edge not in candidate_route:
                            traci.vehicle.setRoute(v, candidate_route)
                            print(f"Vehicle: {v}")
                            print(f"Reroute: SUCCESS")
                            print(f"Old route length: {len(route)}")
                            print(f"New route length: {len(candidate_route)}")
                            print(f"Current edge: {curr_edge}")
                            print(f"Destination: {dest_edge}")
                            closure_metrics["rerouted"] += 1
                        else:
                            print(f"Vehicle: {v}")
                            print(f"Reroute: FAILED")
                            print(f"Current edge: {curr_edge}")
                            print(f"Destination: {dest_edge}")
                            if not is_valid:
                                print(f"Reason: Invalid transition found {bad_transition}")
                            else:
                                print(f"Reason: Alternative route still uses closed edge")
                            closure_metrics["failed"] += 1
                            
                        closure_metrics["processed_vehicles"].add(v)

        if active_vehs:
            speeds = [traci.vehicle.getSpeed(v) for v in active_vehs]
            waits = [traci.vehicle.getAccumulatedWaitingTime(v) for v in active_vehs]
            avg_s = sum(speeds) / len(speeds)
            avg_w = sum(waits) / len(waits)
            metrics["speeds"].append(avg_s)
            metrics["waits"].extend(waits)

        if is_demo and use_gui and close_edge and time > closure_time:
            # Slow down slightly in demo mode so viewers can watch cars detour
            ptime.sleep(0.05)
            
        metrics["duration"] = time

    if use_gui and is_demo:
        # Keep GUI open for inspection for 10 seconds
        print("Simulation complete. Keeping GUI open for 10 seconds for inspection...")
        for _ in range(100):
            ptime.sleep(0.1)

    traci.close()
    
    for e, v_set in vehicles_on_edges.items():
        metrics["edge_usage"][e] = len(v_set)
        
    metrics["avg_speed"] = sum(metrics["speeds"]) / len(metrics["speeds"]) if metrics["speeds"] else 0.0
    metrics["avg_wait"] = sum(metrics["waits"]) / len(metrics["waits"]) if metrics["waits"] else 0.0
    metrics["max_wait"] = max(metrics["waits"]) if metrics["waits"] else 0.0
    
    metrics["closure_metrics"] = closure_metrics
    
    print(f"{name} simulation complete.")
    return metrics

def compare_metrics(baseline, closure, close_edge):
    print("\n========================================")
    print("TRAFFIC REDISTRIBUTION (TOP 5 AFFECTED)")
    print("========================================")
    
    edges_diff = []
    all_edges = set(baseline["edge_usage"].keys()) | set(closure["edge_usage"].keys())
    
    for e in all_edges:
        if e == close_edge: continue
        b = baseline["edge_usage"].get(e, 0)
        c = closure["edge_usage"].get(e, 0)
        diff = c - b
        edges_diff.append((e, b, c, diff))
        
    edges_diff.sort(key=lambda x: x[3], reverse=True)
    
    for i, (e, b, c, diff) in enumerate(edges_diff[:5]):
        if b == 0:
            change_str = "INF%"
        else:
            change = (diff / b) * 100
            change_str = f"{change:+.1f}%"
        print(f"{i+1}. Edge: {e}")
        print(f"   Before vehicles: {b}")
        print(f"   After vehicles:  {c}")
        print(f"   Change:          {change_str}\n")
        
    return edges_diff

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--gui", action="store_true")
    parser.add_argument("--demo", action="store_true", help="Interactive visual presentation mode")
    args = parser.parse_args()
    
    use_gui = False
    is_demo = False
    
    if args.gui:
        use_gui = True
    if args.demo:
        use_gui = True
        is_demo = True
    if args.headless:
        use_gui = False
        is_demo = False
        
    close_edge = find_closure_candidate()
    
    b_metrics = run_simulation("Baseline", use_gui=use_gui, is_demo=is_demo)
    c_metrics = run_simulation("Closure Scenario", close_edge=close_edge, closure_time=300, use_gui=use_gui, is_demo=is_demo)
    
    cm = c_metrics["closure_metrics"]
    cm["processed_vehicles"] = list(cm["processed_vehicles"])
    b_metrics["closure_metrics"]["processed_vehicles"] = list(b_metrics["closure_metrics"]["processed_vehicles"])
    
    print(f"\nRerouted: {cm['rerouted']}")
    print(f"Unreachable: {cm['failed']}")
    print(f"Teleported: {c_metrics['teleports']}")
    
    compare_metrics(b_metrics, c_metrics, close_edge)
    
    os.makedirs(RESULTS_DIR, exist_ok=True)
    
    with open(os.path.join(RESULTS_DIR, "road_closure_baseline.json"), 'w') as f:
        json.dump(b_metrics, f, indent=4)
        
    with open(os.path.join(RESULTS_DIR, "road_closure_result.json"), 'w') as f:
        json.dump(c_metrics, f, indent=4)
        
    b_spd = b_metrics["avg_speed"]
    c_spd = c_metrics["avg_speed"]
    spd_chg = ((c_spd - b_spd) / b_spd * 100) if b_spd > 0 else 0
    
    b_wt = b_metrics["avg_wait"]
    c_wt = c_metrics["avg_wait"]
    wt_chg = ((c_wt - b_wt) / b_wt * 100) if b_wt > 0 else 0
    
    b_arr = b_metrics["arrived"]
    c_arr = c_metrics["arrived"]
    arr_chg = ((c_arr - b_arr) / b_arr * 100) if b_arr > 0 else 0

    comparison = {
        "scenario": {
            "type": "road_closure",
            "network": "Chennai",
            "closed_edge": close_edge,
            "closure_time": 300
        },
        "baseline": {
            "departed": b_metrics["departed"],
            "arrived": b_metrics["arrived"],
            "average_speed_mps": round(b_metrics["avg_speed"], 2),
            "average_wait_sec": round(b_metrics["avg_wait"], 2),
            "max_wait_sec": round(b_metrics["max_wait"], 2),
            "teleports": b_metrics["teleports"]
        },
        "closure": {
            "departed": c_metrics["departed"],
            "arrived": c_metrics["arrived"],
            "average_speed_mps": round(c_metrics["avg_speed"], 2),
            "average_wait_sec": round(c_metrics["avg_wait"], 2),
            "max_wait_sec": round(c_metrics["max_wait"], 2),
            "teleports": c_metrics["teleports"]
        },
        "impact": {
            "speed_change_percent": round(spd_chg, 2),
            "waiting_time_change_percent": round(wt_chg, 2),
            "arrival_change_percent": round(arr_chg, 2)
        },
        "rerouting": {
            "affected_vehicles": cm["affected"],
            "rerouted_vehicles": cm["rerouted"],
            "failed_reroutes": cm["failed"]
        }
    }
    
    comp_file = os.path.join(RESULTS_DIR, "scenario_comparison.json")
    with open(comp_file, 'w') as f:
        json.dump(comparison, f, indent=4)
        
    print(f"\nSaved comparison to {comp_file}")

if __name__ == "__main__":
    main()
