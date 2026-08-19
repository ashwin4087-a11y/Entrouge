"""
Run the TrafficVerse SUMO simulation.

Launches SUMO-GUI with the generated Chennai network and routes.
Supports both GUI and headless modes.

Usage:
  python run_basic_simulation.py          # GUI mode (default)
  python run_basic_simulation.py --no-gui # Headless mode
"""

import os
import sys
import subprocess
import argparse


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SUMOCFG_PATH = os.path.join(SCRIPT_DIR, "sumo", "configs", "chennai_test.sumocfg")

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


def main():
    parser = argparse.ArgumentParser(description="Run TrafficVerse SUMO simulation")
    parser.add_argument(
        "--no-gui", action="store_true",
        help="Run in headless mode (no SUMO-GUI)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("TrafficVerse - SUMO Simulation Runner")
    print("=" * 60)
    print()

    # ----- Check config -----
    if not os.path.isfile(SUMOCFG_PATH):
        print(f"ERROR: SUMO config not found at {SUMOCFG_PATH}")
        print("       Run the full pipeline first:")
        print("         1. python simulation-engine/osm/download_network.py")
        print("         2. python simulation-engine/osm/prepare_network.py")
        print("         3. python simulation-engine/scripts/generate_routes.py")
        sys.exit(1)

    # ----- Find SUMO -----
    if args.no_gui:
        binary_name = "sumo"
        sumo_binary = find_sumo_binary("sumo")
    else:
        binary_name = "sumo-gui"
        sumo_binary = find_sumo_binary("sumo-gui")

    if not sumo_binary:
        print(f"ERROR: Cannot find {binary_name}.")
        print("       Set SUMO_HOME or install SUMO.")
        sys.exit(1)

    print(f"Binary:  {sumo_binary}")
    print(f"Config:  {SUMOCFG_PATH}")
    print(f"Mode:    {'Headless' if args.no_gui else 'GUI'}")
    print()

    # ----- Launch -----
    cmd = [
        sumo_binary,
        "-c", SUMOCFG_PATH,
        "--start",   # Auto-start simulation in GUI
        "--quit-on-end",
    ]

    print(f"Launching SUMO {'(headless)' if args.no_gui else '(GUI)'}...")
    print(f"Command: {' '.join(cmd[:3])} ...")
    print()

    if args.no_gui:
        # Headless: capture output
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            # SUMO prints info/warnings to stderr
            for line in result.stderr.strip().split("\n"):
                print(f"  {line}")
        print()
        if result.returncode == 0:
            print("Simulation completed successfully!")
        else:
            print(f"Simulation exited with code {result.returncode}")
            sys.exit(result.returncode)
    else:
        # GUI: run interactively (blocks until user closes)
        print("SUMO-GUI is opening. The simulation will auto-start.")
        print("Close the SUMO-GUI window when done.")
        print()
        result = subprocess.run(cmd)
        if result.returncode == 0:
            print("SUMO-GUI closed. Simulation session ended.")
        else:
            print(f"SUMO-GUI exited with code {result.returncode}")

    print()


if __name__ == "__main__":
    main()
