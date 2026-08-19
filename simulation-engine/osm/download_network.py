"""
Download a small Chennai road network from OpenStreetMap using OSMnx.

Target area: Chennai Central / Egmore / Anna Salai corridor
Uses a center point + radius to get a manageable urban area with:
  - Multiple intersections
  - Multiple connected roads
  - Alternative routes for future rerouting demos

Outputs:
  - GraphML file for reuse
  - GeoJSON files (nodes + edges) for debugging / visual inspection
"""

import os
import sys

import osmnx as ox


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Center point: Chennai Central railway station area
CENTER_LAT = 13.0827
CENTER_LON = 80.2707
DIST_METERS = 1500  # 1.5 km radius -- gives ~3 km diameter urban area

NETWORK_TYPE = "drive"  # Motorised roads only

# Output directory (relative to this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = SCRIPT_DIR  # Save outputs alongside the script


def main():
    print("=" * 60)
    print("TrafficVerse - Chennai OSM Road Network Downloader")
    print("=" * 60)
    print()
    print(f"Area: Chennai Central / Egmore / Anna Salai corridor")
    print(f"Center: ({CENTER_LAT}, {CENTER_LON})")
    print(f"Radius: {DIST_METERS} m")
    print(f"Network type: {NETWORK_TYPE}")
    print()

    # ----- Download -----
    print("[1/4] Downloading road network from OpenStreetMap...")
    G = ox.graph_from_point(
        center_point=(CENTER_LAT, CENTER_LON),
        dist=DIST_METERS,
        network_type=NETWORK_TYPE,
    )
    print(f"      Raw graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    print()

    # ----- Stats -----
    print("[2/4] Computing network statistics...")
    nodes_count = G.number_of_nodes()
    edges_count = G.number_of_edges()

    # Geographic bounds from node coordinates
    node_data = ox.graph_to_gdfs(G, edges=False)
    min_lat = node_data["y"].min()
    max_lat = node_data["y"].max()
    min_lon = node_data["x"].min()
    max_lon = node_data["x"].max()

    print(f"      Nodes: {nodes_count}")
    print(f"      Edges: {edges_count}")
    print(f"      Lat range: {min_lat:.6f} - {max_lat:.6f}")
    print(f"      Lon range: {min_lon:.6f} - {max_lon:.6f}")
    print()

    # ----- Save GraphML -----
    graphml_path = os.path.join(OUTPUT_DIR, "chennai_central.graphml")
    print(f"[3/4] Saving GraphML -> {graphml_path}")
    ox.save_graphml(G, graphml_path)
    print(f"      Saved.")
    print()

    # ----- Save GeoJSON (optional, for debugging) -----
    print("[4/4] Exporting GeoJSON for visual inspection...")
    nodes_gdf, edges_gdf = ox.graph_to_gdfs(G)

    nodes_geojson_path = os.path.join(OUTPUT_DIR, "chennai_central_nodes.geojson")
    edges_geojson_path = os.path.join(OUTPUT_DIR, "chennai_central_edges.geojson")

    nodes_gdf.to_file(nodes_geojson_path, driver="GeoJSON")
    edges_gdf.to_file(edges_geojson_path, driver="GeoJSON")

    print(f"      Nodes GeoJSON -> {nodes_geojson_path}")
    print(f"      Edges GeoJSON -> {edges_geojson_path}")
    print()

    # ----- Summary -----
    print("=" * 60)
    print("DOWNLOAD COMPLETE")
    print("=" * 60)
    print(f"  Nodes:         {nodes_count}")
    print(f"  Edges:         {edges_count}")
    print(f"  Lat range:     {min_lat:.6f} - {max_lat:.6f}")
    print(f"  Lon range:     {min_lon:.6f} - {max_lon:.6f}")
    print(f"  GraphML:       {graphml_path}")
    print(f"  Nodes GeoJSON: {nodes_geojson_path}")
    print(f"  Edges GeoJSON: {edges_geojson_path}")
    print()


if __name__ == "__main__":
    main()
