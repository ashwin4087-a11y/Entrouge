"""
TrafficVerse - TraCI Baseline Controller
Connects to SUMO via TraCI, reads real-time telemetry, and outputs metrics.
"""

import os
import sys
import argparse

# Discover SUMO_HOME and add sumolib/traci to path
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
    print("ERROR: Could not find SUMO_HOME or tools directory.")
    sys.exit(1)

os.environ["SUMO_HOME"] = sumo_home
import traci

from metrics import SimulationMetrics

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SUMOCFG = os.path.join(SCRIPT_DIR, "sumo", "configs", "chennai_test.sumocfg")
RESULTS_DIR = os.path.join(SCRIPT_DIR, "results")
RESULTS_FILE = os.path.join(RESULTS_DIR, "baseline_result.json")

def main():
    parser = argparse.ArgumentParser(description="TrafficVerse TraCI Baseline Controller")
    parser.add_argument("--headless", action="store_true", help="Run without GUI")
    parser.add_argument("--gui", action="store_true", help="Run with GUI")
    args = parser.parse_args()

    # Determine mode based on arguments. Default to headless if nothing provided,
    # but honor explicit flags.
    use_gui = False
    if args.gui:
        use_gui = True
    if args.headless:
        use_gui = False

    binary = "sumo-gui" if use_gui else "sumo"
    binary_path = os.path.join(sumo_home, "bin", binary)

    sumo_cmd = [binary_path, "-c", SUMOCFG]
    
    if use_gui:
        # Start automatically, quit automatically on end.
        sumo_cmd.extend(["--start", "--quit-on-end"])

    print(f"Starting SUMO with TraCI ({'GUI' if use_gui else 'Headless'})...")
    traci.start(sumo_cmd)

    metrics = SimulationMetrics()

    print("Simulation running...")
    sample_printed = False
    
    # Loop while there are vehicles expected or active
    while traci.simulation.getMinExpectedNumber() > 0:
        traci.simulationStep()
        
        time = traci.simulation.getTime()
        
        # Aggregate logic
        metrics.departed += traci.simulation.getDepartedNumber()
        metrics.arrived += traci.simulation.getArrivedNumber()
        metrics.teleports += traci.simulation.getStartingTeleportNumber()
        
        # Vehicle telemetry
        veh_ids = traci.vehicle.getIDList()
        active_count = len(veh_ids)
        
        speeds = []
        waits = []
        for v in veh_ids:
            speeds.append(traci.vehicle.getSpeed(v))
            waits.append(traci.vehicle.getAccumulatedWaitingTime(v))
        
        avg_s = sum(speeds) / len(speeds) if speeds else 0
        avg_w = sum(waits) / len(waits) if waits else 0
        
        metrics.update(time, active_count, avg_s, avg_w)
        
        # Traffic light telemetry
        tls_ids = traci.trafficlight.getIDList()
        metrics.record_tls(tls_ids)
        
        # Print a sample at time = 60s
        if time == 60.0 and not sample_printed:
            print("\n--- SAMPLE TELEMETRY AT TIME 60s ---")
            print(f"Active vehicles: {active_count}")
            if veh_ids:
                sample_v = veh_ids[0]
                print(f"Sample Vehicle ({sample_v}):")
                print(f"  Speed:    {traci.vehicle.getSpeed(sample_v):.2f} m/s")
                print(f"  Edge:     {traci.vehicle.getRoadID(sample_v)}")
                print(f"  Lane:     {traci.vehicle.getLaneID(sample_v)}")
                print(f"  Position: {traci.vehicle.getPosition(sample_v)}")
                print(f"  Waiting:  {traci.vehicle.getAccumulatedWaitingTime(sample_v)} s")
            if tls_ids:
                sample_t = tls_ids[0]
                print(f"Sample Traffic Light ({sample_t}):")
                print(f"  State:    {traci.trafficlight.getRedYellowGreenState(sample_t)}")
            print("------------------------------------\n")
            sample_printed = True
            
        metrics.sim_duration = time

    traci.close()
    print("Simulation complete.")
    
    # Save results
    metrics.save(RESULTS_FILE)
    print(f"Metrics saved to {RESULTS_FILE}")

if __name__ == "__main__":
    main()
