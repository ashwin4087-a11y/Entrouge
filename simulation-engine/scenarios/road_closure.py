import os
import sys
import json
import argparse
import time as ptime
import xml.etree.ElementTree as ET

# Fix Windows console emoji printing
sys.stdout.reconfigure(encoding='utf-8')

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
from validate_runtime_route import validate_route, path_exists, build_path_excluding_edge

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIM_ROOT = os.path.dirname(SCRIPT_DIR)
if SIM_ROOT not in sys.path:
    sys.path.insert(0, SIM_ROOT)

import visualization
NET_XML = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")
ROU_XML = os.path.join(SIM_ROOT, "sumo", "routes", "chennai_test.rou.xml")
SUMOCFG = os.path.join(SIM_ROOT, "sumo", "configs", "chennai_test.sumocfg")
RESULTS_DIR = os.path.join(SIM_ROOT, "results")

# Visualization override colors
AFFECTED_COLOR = (255, 255, 0, 255)  # Bright yellow for affected vehicles
REROUTED_COLOR = (0, 220, 220, 255)  # Cyan for rerouted vehicles
FAILED_COLOR = (255, 0, 0, 255)      # Red for failed reroutes

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

def run_simulation(name, close_edge=None, closure_time=300, use_gui=False, is_demo=False, baseline_metrics=None):
    binary = "sumo-gui" if use_gui else "sumo"
    binary_path = os.path.join(sumo_home, "bin", binary)

    sumo_cmd = [binary_path, "-c", SUMOCFG]
    if use_gui and not is_demo:
        sumo_cmd.extend(["--start", "--quit-on-end"])
    elif is_demo:
        sumo_cmd.extend(["--start"]) # Keep open and start automatically

    mode_str = "Demo" if is_demo else ("GUI" if use_gui else "Headless")
    print(f"\n[SUMO START]")
    print(f"Mode: {mode_str}")
    
    try:
        traci.start(sumo_cmd, label=name)
        conn = traci.getConnection(name)
        port = conn.getVersion()[1] if hasattr(conn, 'getVersion') else "Unknown"
        print(f"Port: {port}")
        print("PID: N/A")
    except Exception as e:
        print(f"ERROR: Failed to start TraCI for {name}: {e}")
        return None

    # Safe TraCI wrapper to centralize lifecycle and vehicle commands
    try:
        from traci_safe import SafeTraCI
    except Exception:
        from simulation_engine.traci_safe import SafeTraCI
    safe = SafeTraCI(conn)

    print(f"[TRACI CONNECTED]")
    if use_gui:
        visualization.print_color_legend()
        visualization.reset_vehicle_colors()
        visualization.initialize_camera(use_gui, safe)
    
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
    # Vehicle lifecycle states
    WAITING_TO_DEPART = "WAITING_TO_DEPART"
    ACTIVE = "ACTIVE"
    AFFECTED = "AFFECTED"
    APPROACHING = "APPROACHING"
    REROUTING = "REROUTING"
    REROUTED = "REROUTED"
    ARRIVED = "ARRIVED"
    TELEPORTED = "TELEPORTED"
    FAILED = "FAILED"

    vehicle_states = {}  # vehicle_id -> state
    reroute_queue = []   # vehicles scheduled (ids) for progressive rerouting
    
    print(f"[SIMULATION START]")
    print(f"Name: {name}")
    
    if is_demo and close_edge:
        print("\n========================================")
        print("TRAFFICVERSE DIGITAL TWIN")
        print("========================================")
        print("\nLIVE URBAN TRAFFIC\n")
        print("Vehicles: 42")
        print("Traffic Lights: 11")
        print("Simulation: NORMAL\n")
        print("Status: CITY FLOWING")
        print("\nVISUAL LEGEND:")
        print("🟢 NORMAL TRAFFIC")
        print("🔴 CLOSED ROAD")
        print("🟠 AFFECTED VEHICLE")
        print("🔵 REROUTED VEHICLE")
        print("========================================\n")
    
    time = 0
    try:
        while conn.simulation.getMinExpectedNumber() > 0:
            try:
                conn.simulationStep()
            except traci.exceptions.FatalTraCIError:
                print("\n========================================")
                print("SUMO PROCESS TERMINATED UNEXPECTEDLY")
                print("========================================")
                print(f"Simulation name: {name}")
                print(f"Simulation time: {time}")
                print(f"Last known step: {time}")
                break
                
            # Immediately refresh lifecycle information (active/departed/arrived)
            safe.update_lifecycle()
            time = conn.simulation.getTime()

            # Ensure vehicles get their deterministic base colors when they depart
            visualization.apply_vehicle_colors(use_gui, safe)

            # Restore colors for vehicles that arrived this step and mark lifecycle
            try:
                arrived_ids = safe.get_arrived_ids()
                for a in arrived_ids:
                    vehicle_states[a] = ARRIVED
                    visualization.restore_vehicle_color(a, safe)
            except Exception:
                pass

            # Track newly departed vehicles as ACTIVE
            try:
                departed_ids = safe.get_departed_ids()
                for d in departed_ids:
                    vehicle_states[d] = ACTIVE
            except Exception:
                pass
        
            if is_demo and close_edge and time == 250:
                print("\n========================================")
                print("⚠ UPCOMING INFRASTRUCTURE EVENT")
                print("========================================")
                print("\nRoad closure scheduled\n")
                print(f"Time: {closure_time} seconds")
                print(f"Target road: {close_edge}\n")
                print("Preparing impact simulation...")
                print("========================================\n")
            
            # ACTIVATE CLOSURE
            if close_edge and time == closure_time:
                edge_obj = net.getEdge(close_edge)
                length = edge_obj.getLength()
            
                print("\n========================================")
                print("🚨 ROAD CLOSURE ACTIVATED")
                print("========================================")
                print(f"\nTime: {time}s\n")
                print(f"Closed Road: {close_edge}\n")
                print("Status: CLOSED\n")
                print("Affected vehicles detected.")
                print("========================================\n")
            
                # Discourage usage by making traveltime extremely large.
                # Avoid setting lanes disallowed to prevent immediate teleports; rely on drivers rerouting.
                conn.edge.adaptTraveltime(close_edge, 1e6)
                edge_lane_count = conn.edge.getLaneNumber(close_edge)

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
                        conn.gui.setOffset("View #0", mid_pt[0], mid_pt[1])
                        conn.gui.setZoom("View #0", 2500)
                    
                        # 2. Add POI markers
                        conn.poi.add(
                            poiID=f"marker_{close_edge}_center",
                            x=mid_pt[0], y=mid_pt[1],
                            color=(255, 0, 0, 255),
                            poiType="CLOSED",
                            layer=200
                        )
                        conn.poi.add(
                            poiID=f"marker_{close_edge}_start",
                            x=shape[0][0], y=shape[0][1],
                            color=(255, 0, 0, 255),
                            poiType="NO ENTRY",
                            layer=200
                        )
                        conn.poi.add(
                            poiID=f"marker_{close_edge}_end",
                            x=shape[-1][0], y=shape[-1][1],
                            color=(255, 0, 0, 255),
                            poiType="NO ENTRY",
                            layer=200
                        )
                    
                        # 3. Draw red polygon over the road to highlight it
                        # Widen the shape a bit to cover the lanes nicely
                        poly_shape = []
                        for pt in shape:
                            poly_shape.append((pt[0]-5, pt[1]-5))
                        for pt in reversed(shape):
                            poly_shape.append((pt[0]+5, pt[1]+5))
                        
                        conn.polygon.add(
                            polygonID=f"poly_{close_edge}",
                            shape=poly_shape,
                            color=(255, 50, 50, 200),
                            fill=True,
                            layer=100
                        )
                    
                        # 4. Also toggle selection for native SUMO lane highlighting
                        for i in range(edge_lane_count):
                            conn.gui.toggleSelection(f"{close_edge}_{i}", "lane")
                        
                if is_demo:
                    # Cinematic Pause
                    ptime.sleep(3)

                # Safely build active vehicle list and detect those whose remaining route contains the closed edge
                active_ids = safe.get_active_ids()

                affected_now = []
                for v in list(active_ids):
                    route = safe.get_route(v)
                    if not route:
                        continue
                    idx = safe.get_route_index(v) or 0
                    remaining = route[idx:]
                    if close_edge in remaining:
                        affected_now.append(v)
            
                if is_demo:
                    print("\n========================================")
                    print("🚗 IMPACTED VEHICLES")
                    print("========================================")
                    print(f"\nAffected vehicles: {len(affected_now)}\n")
                    print("Analyzing alternative routes...\n")
                    print("========================================\n")

                # Color affected vehicles only in GUI mode
                if use_gui:
                    for v in affected_now:
                        if v in active_ids:
                            visualization.set_temp_color(v, AFFECTED_COLOR, safe)

                # Always mark affected and schedule them for staged rerouting (headless + GUI)
                for v in affected_now:
                    vehicle_states[v] = AFFECTED
                    if v not in reroute_queue and v not in closure_metrics['processed_vehicles']:
                        reroute_queue.append(v)
        
            metrics["departed"] += conn.simulation.getDepartedNumber()
            metrics["arrived"] += conn.simulation.getArrivedNumber()
            # Use SafeTraCI teleport sets if available
            try:
                metrics["teleports"] += len(safe.teleport_start_ids)
            except Exception:
                try:
                    metrics["teleports"] += conn.simulation.getStartingTeleportNumber()
                except Exception:
                    pass

            active_ids = safe.get_active_ids()

            # Track edge usage
            for v in list(active_ids):
                edge = safe.get_road_id(v)
                if not edge:
                    continue
                if not edge.startswith(":"):
                    if edge not in vehicles_on_edges:
                        vehicles_on_edges[edge] = set()
                    vehicles_on_edges[edge].add(v)
            # REROUTING: staged, safe reroute processing using the scheduled reroute_queue
            active_ids = safe.get_active_ids()

            # Track edge usage
            for v in list(active_ids):
                edge = safe.get_road_id(v)
                if not edge:
                    continue
                if not edge.startswith(":"):
                    if edge not in vehicles_on_edges:
                        vehicles_on_edges[edge] = set()
                    vehicles_on_edges[edge].add(v)

            # Begin staged rerouting after a short delay so vehicles visibly slow
            if close_edge and time >= closure_time + 15 and reroute_queue:
                window_steps = 15
                batch = max(1, int((len(reroute_queue) + window_steps - 1) // window_steps))
                to_process = []
                for _ in range(batch):
                    if not reroute_queue:
                        break
                    to_process.append(reroute_queue.pop(0))

                for v in to_process:
                    # Re-validate vehicle active status
                    if v not in active_ids:
                        closure_metrics["processed_vehicles"].add(v)
                        continue

                    route = safe.get_route(v)
                    if not route:
                        closure_metrics["processed_vehicles"].add(v)
                        continue
                    curr_idx = safe.get_route_index(v) or 0

                    remaining = route[curr_idx:]
                    if close_edge not in remaining:
                        closure_metrics["processed_vehicles"].add(v)
                        continue

                    closure_metrics["affected"] += 1
                    curr_edge = safe.get_road_id(v)
                    if not curr_edge:
                        closure_metrics["processed_vehicles"].add(v)
                        continue
                    curr_lane = safe.get_lane_id(v) or ""
                    dest_edge = route[-1]

                    print(f"\n[REROUTE ATTEMPT] Vehicle: {v}")
                    print(f"Current edge: {curr_edge}")
                    print(f"Current lane: {curr_lane}")
                    print(f"Original route: {route}")
                    print(f"Current route index: {curr_idx}")
                    print(f"Destination edge: {dest_edge}")

                    has_path = path_exists(net, curr_edge, dest_edge, close_edge)
                    if not has_path:
                        print(f"Candidate reroute: NONE")
                        print(f"Vehicle: {v} Reroute: FAILED - no valid path")
                        closure_metrics["failed"] += 1
                        closure_metrics["processed_vehicles"].add(v)
                        vehicle_states[v] = FAILED
                        if use_gui and is_demo and v in active_ids:
                            visualization.set_temp_color(v, FAILED_COLOR, safe)
                        continue

                    try:
                        candidate_route = build_path_excluding_edge(net, curr_edge, dest_edge, close_edge)
                    except Exception as e:
                        print(f"Candidate reroute: ERROR computing route for {v}: {e}")
                        closure_metrics["failed"] += 1
                        closure_metrics["processed_vehicles"].add(v)
                        vehicle_states[v] = FAILED
                        if use_gui and is_demo and v in active_ids:
                            visualization.set_temp_color(v, FAILED_COLOR, safe)
                        continue

                    if not candidate_route:
                        print(f"Candidate reroute: NONE")
                        print(f"Vehicle: {v} Reroute: FAILED - no valid path")
                        closure_metrics["failed"] += 1
                        closure_metrics["processed_vehicles"].add(v)
                        vehicle_states[v] = FAILED
                        if use_gui and is_demo and v in active_ids:
                            visualization.set_temp_color(v, FAILED_COLOR, safe)
                        continue

                    print(f"Candidate reroute: {candidate_route}")
                    is_valid, bad_transition = validate_route(net, candidate_route)
                    print(f"Whether candidate route is valid: {is_valid}")

                    if is_valid and close_edge not in candidate_route:
                        ok = safe.safe_set_route(v, candidate_route)
                        if not ok:
                            closure_metrics["processed_vehicles"].add(v)
                            continue
                        closure_metrics["rerouted"] += 1
                        closure_metrics["processed_vehicles"].add(v)
                        vehicle_states[v] = REROUTED
                        if use_gui and is_demo and v in active_ids:
                            visualization.set_temp_color(v, REROUTED_COLOR, safe)
                            try:
                                poly_shape = []
                                for e in candidate_route:
                                    try:
                                        lane_shape = conn.lane.getShape(f"{e}_0")
                                    except Exception:
                                        lane_shape = None
                                    if lane_shape:
                                        for pt in lane_shape:
                                            poly_shape.append((pt[0], pt[1]))
                                if poly_shape:
                                    out_shape = []
                                    for pt in poly_shape:
                                        out_shape.append((pt[0]-2, pt[1]-2))
                                    for pt in reversed(poly_shape):
                                        out_shape.append((pt[0]+2, pt[1]+2))
                                    conn.polygon.add(
                                        polygonID=f"poly_alt_{v}",
                                        shape=out_shape,
                                        color=(0, 150, 255, 120),
                                        fill=True,
                                        layer=95
                                    )
                            except Exception:
                                pass
                        print(f"Vehicle: {v} Reroute: SUCCESS")
                    else:
                        if use_gui and is_demo and v in active_ids:
                            visualization.set_temp_color(v, FAILED_COLOR, safe)
                        print(f"Vehicle: {v} Reroute: FAILED")
                        if not is_valid:
                            print(f"Reason: Invalid transition found {bad_transition}")
                        else:
                            print(f"Reason: Alternative route still uses closed edge")
                        closure_metrics["failed"] += 1
                        closure_metrics["processed_vehicles"].add(v)
                        vehicle_states[v] = FAILED

            if active_ids:
                speeds = []
                waits = []
                for v in list(active_ids):
                    s = safe.get_speed(v)
                    w = safe.get_wait(v)
                    if s is not None:
                        speeds.append(s)
                    if w is not None:
                        waits.append(w)
                    
                if speeds:
                    avg_s = sum(speeds) / len(speeds)
                    metrics["speeds"].append(avg_s)
                if waits:
                    metrics["waits"].extend(waits)

            if is_demo and use_gui and close_edge and time > closure_time:
                # Slow down slightly in demo mode so viewers can watch cars detour
                ptime.sleep(0.05)
            
            metrics["duration"] = time
        
    except traci.exceptions.FatalTraCIError:
        print("\n========================================")
        print("SUMO PROCESS TERMINATED UNEXPECTEDLY")
        print("========================================")
        print(f"Simulation name: {name}")
        print(f"Simulation time: {time}")
        print(f"Last known step: {time}")

    print("\n[SIMULATION END]")
    print(f"Time: {time}")
    print("[METRICS COLLECTED]")
    
    for e, v_set in vehicles_on_edges.items():
        metrics["edge_usage"][e] = len(v_set)
        
    metrics["avg_speed"] = sum(metrics["speeds"]) / len(metrics["speeds"]) if metrics["speeds"] else 0.0
    metrics["avg_wait"] = sum(metrics["waits"]) / len(metrics["waits"]) if metrics["waits"] else 0.0
    metrics["max_wait"] = max(metrics["waits"]) if metrics["waits"] else 0.0
    metrics["closure_metrics"] = closure_metrics
    
    if is_demo and use_gui and close_edge and baseline_metrics:
        edges_diff = []
        for e in metrics["edge_usage"]:
            if e == close_edge: continue
            b = baseline_metrics["edge_usage"].get(e, 0)
            c = metrics["edge_usage"].get(e, 0)
            diff = c - b
            edges_diff.append((e, b, c, diff))
        edges_diff.sort(key=lambda x: x[3], reverse=True)
        top_affected = edges_diff[:3]
        
        print("\n========================================")
        print("📊 TRAFFIC REDISTRIBUTION")
        print("========================================")
        print("\nTraffic is shifting to alternative corridors.\n")
        print("Top affected roads:\n")
        
        for e, b, c, diff in top_affected:
            change = (diff / b * 100) if b > 0 else float('inf')
            change_str = f"+{change:.1f}%" if change > 0 else f"{change:.1f}%"
            print(f"Edge: {e}")
            print(f"Change: {change_str}\n")
            
            try:
                edge_lane_count = conn.edge.getLaneNumber(e)
                for i in range(edge_lane_count):
                    shape = conn.lane.getShape(f"{e}_{i}")
                    poly_shape = []
                    for pt in shape:
                        poly_shape.append((pt[0]-3, pt[1]-3))
                    for pt in reversed(shape):
                        poly_shape.append((pt[0]+3, pt[1]+3))
                    conn.polygon.add(
                        polygonID=f"poly_redist_{e}_{i}",
                        shape=poly_shape,
                        color=(255, 165, 0, 150),
                        fill=True,
                        layer=90
                    )
            except Exception:
                pass
                
        print("========================================\n")
        
        try:
            edge_obj = net.getEdge(close_edge)
            shape = edge_obj.getShape()
            mid_pt = shape[len(shape) // 2]
            conn.gui.setOffset("View #0", mid_pt[0], mid_pt[1])
            conn.gui.setZoom("View #0", 1200)
        except Exception:
            pass
            
        print("\n============================================================")
        print("TRAFFICVERSE — SCENARIO IMPACT")
        print("============================================================")
        print(f"\nROAD CLOSURE")
        print(f"Road: {close_edge}")
        print(f"Closure Time: {closure_time}s\n")
        
        print(f"TRAFFIC IMPACT")
        print(f"Affected Vehicles: {closure_metrics['affected']}")
        print(f"Rerouted Vehicles: {closure_metrics['rerouted']}")
        print(f"Failed Reroutes: {closure_metrics['failed']}\n")
        
        b_spd = baseline_metrics["avg_speed"]
        c_spd = metrics["avg_speed"]
        print(f"PERFORMANCE")
        print(f"Baseline Avg Speed: {b_spd:.2f} m/s")
        print(f"Scenario Avg Speed: {c_spd:.2f} m/s\n")
        
        b_wt = baseline_metrics["avg_wait"]
        c_wt = metrics["avg_wait"]
        print(f"Baseline Avg Wait: {b_wt:.2f} s")
        print(f"Scenario Avg Wait: {c_wt:.2f} s\n")
        
        print(f"TRAFFIC REDISTRIBUTION")
        top_e = top_affected[0] if top_affected else ("None", 0, 0, 0)
        change_str = f"+{(top_e[3]/top_e[1]*100):.1f}%" if top_e[1] > 0 else "N/A"
        print(f"Top affected corridor: {top_e[0]}")
        print(f"Traffic change: {change_str}\n")
        
        print(f"TELEPORTS")
        print(f"Baseline: {baseline_metrics['teleports']}")
        print(f"Scenario: {metrics['teleports']}\n")
        print("============================================================\n")
        print("SCENARIO COMPLETE\n")
        print("TrafficVerse successfully simulated")
        print("the infrastructure change before")
        print("real-world implementation.\n")
        print("============================================================\n")

    if is_demo and use_gui:
        # Keep GUI open for inspection for 10 seconds
        print(f"\nSimulation {name} complete. Keeping GUI open for 10 seconds for inspection...")
        for _ in range(100):
            try:
                # We do NOT advance simulation time here, just sleep. 
                # This keeps the GUI on screen at the final state.
                ptime.sleep(0.1)
            except Exception:
                break

    try:
        conn.close()
        print("[TRACI CLOSED]")
    except Exception as e:
        print(f"Warning: Error closing TraCI: {e}")
        
    print("[SUMO PROCESS EXITED]\n")
    
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
    c_metrics = run_simulation("Closure Scenario", close_edge=close_edge, closure_time=300, use_gui=use_gui, is_demo=is_demo, baseline_metrics=b_metrics)
    
    if not b_metrics or not c_metrics:
        print("ERROR: One or both simulations failed to complete.")
        return
        
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
