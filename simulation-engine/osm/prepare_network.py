"""
Convert the downloaded OSM road network into a SUMO network (.net.xml).

Workflow:
  1. Re-download an unsimplified graph (required for OSM XML export)
  2. Export as an OSM XML file (the format SUMO's netconvert understands)
  3. Run SUMO's netconvert to produce a .net.xml

Requires:
  - SUMO's netconvert on the system (auto-detected)
  - osmnx
"""

import os
import sys
import subprocess

import osmnx as ox


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))  # TrafficVerse/
SIM_ROOT = os.path.join(PROJECT_ROOT, "simulation-engine")

OSM_XML_PATH = os.path.join(SCRIPT_DIR, "chennai_central.osm")
NET_XML_PATH = os.path.join(SIM_ROOT, "sumo", "networks", "chennai_test.net.xml")

# Same area as download_network.py
CENTER_LAT = 13.0827
CENTER_LON = 80.2707
DIST_METERS = 1500

# ---------------------------------------------------------------------------
# SUMO discovery
# ---------------------------------------------------------------------------

SUMO_SEARCH_PATHS = [
    os.environ.get("SUMO_HOME", ""),
    r"C:\Program Files (x86)\Eclipse\Sumo",
    r"C:\Program Files\Eclipse\Sumo",
    r"C:\sumo",
]


def find_sumo_home():
    """Locate the SUMO installation directory."""
    for p in SUMO_SEARCH_PATHS:
        if p and os.path.isdir(p):
            bin_dir = os.path.join(p, "bin")
            if os.path.isfile(os.path.join(bin_dir, "netconvert.exe")) or \
               os.path.isfile(os.path.join(bin_dir, "netconvert")):
                return p
    return None


def find_netconvert(sumo_home):
    """Return the full path to netconvert."""
    for name in ("netconvert.exe", "netconvert"):
        path = os.path.join(sumo_home, "bin", name)
        if os.path.isfile(path):
            return path
    return None


def main():
    print("=" * 60)
    print("TrafficVerse - OSM -> SUMO Network Converter")
    print("=" * 60)
    print()

    # ----- Find SUMO -----
    sumo_home = find_sumo_home()
    if not sumo_home:
        print("ERROR: Cannot find SUMO installation.")
        print("       Set SUMO_HOME or install SUMO.")
        sys.exit(1)

    netconvert = find_netconvert(sumo_home)
    print(f"SUMO_HOME:   {sumo_home}")
    print(f"netconvert:  {netconvert}")
    print()

    # ----- Download unsimplified graph for OSM XML export -----
    print("[1/3] Downloading unsimplified graph for OSM XML export...")
    ox.settings.all_oneway = True
    G_raw = ox.graph_from_point(
        center_point=(CENTER_LAT, CENTER_LON),
        dist=DIST_METERS,
        network_type="drive",
        simplify=False,
    )
    print(f"      Unsimplified graph: {G_raw.number_of_nodes()} nodes, {G_raw.number_of_edges()} edges")
    print()

    # ----- Export OSM XML -----
    print(f"[2/3] Exporting OSM XML -> {OSM_XML_PATH}")
    ox.save_graph_xml(G_raw, OSM_XML_PATH)
    print(f"      Saved.")
    print()

    # ----- Run netconvert -----
    print(f"[3/3] Running netconvert -> {NET_XML_PATH}")
    os.makedirs(os.path.dirname(NET_XML_PATH), exist_ok=True)

    cmd = [
        netconvert,
        "--osm-files", OSM_XML_PATH,
        "--output-file", NET_XML_PATH,
        "--geometry.remove",
        "--ramps.guess",
        "--junctions.join",
        "--tls.guess-signals",
        "--tls.discard-simple",
        "--tls.join",
        "--tls.default-type", "actuated",
        "--edges.join",
        "--no-turnarounds.except-deadend",
        "--remove-edges.isolated",
        "--keep-edges.by-vclass", "passenger",
    ]

    print(f"      Command: {' '.join(cmd[:3])} ...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"      netconvert FAILED (exit code {result.returncode})")
        if result.stderr:
            print(f"      stderr:\n{result.stderr[:2000]}")
        if result.stdout:
            print(f"      stdout:\n{result.stdout[:2000]}")
        sys.exit(1)

    # Print any warnings (they can be useful)
    if result.stderr:
        warnings = [l for l in result.stderr.strip().split("\n") if "Warning" in l]
        if warnings:
            print(f"      Warnings: {len(warnings)} (normal for OSM data)")

    if not os.path.isfile(NET_XML_PATH):
        print(f"      ERROR: Output file not created at {NET_XML_PATH}")
        sys.exit(1)

    file_size = os.path.getsize(NET_XML_PATH)
    print(f"      Success! Network file: {file_size:,} bytes")
    print()

    # ----- Summary -----
    print("=" * 60)
    print("NETWORK CONVERSION COMPLETE")
    print("=" * 60)
    print(f"  OSM XML:        {OSM_XML_PATH}")
    print(f"  SUMO Network:   {NET_XML_PATH}")
    print(f"  File size:      {file_size:,} bytes")
    print()


if __name__ == "__main__":
    main()
