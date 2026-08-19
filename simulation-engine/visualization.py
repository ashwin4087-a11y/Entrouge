import traci

VEHICLE_COLORS = [
    (255, 0, 0, 255),       # Red
    (0, 100, 255, 255),     # Blue
    (0, 200, 80, 255),      # Green
    (255, 220, 0, 255),     # Yellow
    (255, 140, 0, 255),     # Orange
    (150, 80, 220, 255),    # Purple
    (0, 220, 220, 255),     # Cyan
    (255, 100, 180, 255)    # Pink
]

colored_vehicles = set()
original_colors = {}
temp_overrides = {}

def get_vehicle_color(vehicle_id):
    # Deterministic assignment
    try:
        if vehicle_id.startswith("veh_"):
            num = int(vehicle_id.split("_")[1])
            return VEHICLE_COLORS[num % len(VEHICLE_COLORS)]
    except:
        pass
    num = sum(ord(c) for c in vehicle_id)
    return VEHICLE_COLORS[num % len(VEHICLE_COLORS)]

def apply_vehicle_colors(use_gui=True, conn=None):
    """Apply deterministic colors to vehicles that have just departed.

    If `conn` is provided, use that TraCI connection object; otherwise
    fall back to the global `traci` module. The function is cheap to call
    every step because it only colors vehicles that haven't been colored yet.
    """
    if not use_gui:
        return

    api = conn if conn is not None else traci
    try:
        # Support SafeTraCI wrapper: prefer its active list and safe setColor
        if hasattr(api, 'get_active_ids') and hasattr(api, 'safe_set_color'):
            active_vehicles = api.get_active_ids()
            for v_id in active_vehicles:
                if v_id not in colored_vehicles:
                    color = get_vehicle_color(v_id)
                    if api.safe_set_color(v_id, color):
                        colored_vehicles.add(v_id)
                        original_colors[v_id] = color
        else:
            active_vehicles = api.vehicle.getIDList()
            for v_id in active_vehicles:
                if v_id not in colored_vehicles:
                    color = get_vehicle_color(v_id)
                    try:
                        api.vehicle.setColor(v_id, color)
                    except Exception:
                        # Ignore transient failures for very-new vehicles
                        continue
                    colored_vehicles.add(v_id)
                    # Record the assigned original color so callers can temporarily
                    # override and later restore if needed.
                    original_colors[v_id] = color
    except Exception:
        # Keep visualization best-effort; do not crash simulation
        pass

def reset_vehicle_colors():
    colored_vehicles.clear()
    original_colors.clear()
    temp_overrides.clear()

def set_temp_color(vehicle_id, color, conn=None):
    """Temporarily override a vehicle's color, preserving the assigned original."""
    api = conn if conn is not None else traci
    try:
        # If provided a SafeTraCI wrapper, use it to avoid stale-ID commands
        if hasattr(api, 'safe_set_color') and hasattr(api, 'get_active_ids'):
            if vehicle_id in temp_overrides:
                api.safe_set_color(vehicle_id, color)
                return
            orig = original_colors.get(vehicle_id)
            if orig is None:
                # best-effort: read current color if active
                if vehicle_id in api.get_active_ids():
                    try:
                        orig = tuple(api.conn.vehicle.getColor(vehicle_id))
                    except Exception:
                        orig = get_vehicle_color(vehicle_id)
                else:
                    orig = get_vehicle_color(vehicle_id)
            temp_overrides[vehicle_id] = orig
            api.safe_set_color(vehicle_id, color)
            return

        # Fallback to raw traci
        if vehicle_id in temp_overrides:
            # already overridden
            api.vehicle.setColor(vehicle_id, color)
            return
        # Ensure we have a recorded original color; if not, compute and record it
        orig = original_colors.get(vehicle_id)
        if orig is None:
            try:
                # best-effort: read current color
                orig = tuple(api.vehicle.getColor(vehicle_id))
            except Exception:
                orig = get_vehicle_color(vehicle_id)
        temp_overrides[vehicle_id] = orig
        api.vehicle.setColor(vehicle_id, color)
    except Exception:
        pass

def restore_vehicle_color(vehicle_id, conn=None):
    """Restore a vehicle's color from temp override or original assignment."""
    api = conn if conn is not None else traci
    try:
        if hasattr(api, 'safe_set_color') and hasattr(api, 'get_active_ids'):
            if vehicle_id in temp_overrides:
                orig = temp_overrides.pop(vehicle_id)
                if vehicle_id in api.get_active_ids():
                    api.safe_set_color(vehicle_id, orig)
                return
            # Fallback to original_colors
            if vehicle_id in original_colors and vehicle_id in api.get_active_ids():
                api.safe_set_color(vehicle_id, original_colors[vehicle_id])
            return

        if vehicle_id in temp_overrides:
            orig = temp_overrides.pop(vehicle_id)
            try:
                api.vehicle.setColor(vehicle_id, orig)
            except Exception:
                pass
            return
        # Fallback to original_colors
        if vehicle_id in original_colors:
            try:
                api.vehicle.setColor(vehicle_id, original_colors[vehicle_id])
            except Exception:
                pass
    except Exception:
        pass

def restore_all_overrides(conn=None):
    api = conn if conn is not None else traci
    try:
        if hasattr(api, 'safe_set_color') and hasattr(api, 'get_active_ids'):
            active = api.get_active_ids()
            for v_id, orig in list(temp_overrides.items()):
                if v_id in active:
                    api.safe_set_color(v_id, orig)
            temp_overrides.clear()
            return

        for v_id, orig in list(temp_overrides.items()):
            try:
                api.vehicle.setColor(v_id, orig)
            except Exception:
                pass
        temp_overrides.clear()
    except Exception:
        pass

def print_color_legend():
    print("========================================")
    print("TRAFFICVERSE VEHICLE COLORS")
    print("========================================")
    print("RED     -> Group 1")
    print("BLUE    -> Group 2")
    print("GREEN   -> Group 3")
    print("YELLOW  -> Group 4")
    print("ORANGE  -> Group 5")
    print("PURPLE  -> Group 6")
    print("CYAN    -> Group 7")
    print("PINK    -> Group 8")
    print("========================================\n")

def initialize_camera(use_gui=True, conn=None):
    if not use_gui:
        return
    api = conn if conn is not None else traci
    try:
        net_bounds = api.simulation.getNetBoundary()
        center_x = (net_bounds[0][0] + net_bounds[1][0]) / 2
        center_y = (net_bounds[0][1] + net_bounds[1][1]) / 2
        api.gui.setOffset("View #0", center_x, center_y)
        api.gui.setZoom("View #0", 1500)
    except Exception:
        pass
