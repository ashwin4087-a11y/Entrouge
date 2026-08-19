import os
import threading
import time

import traci


class SafeTraCI:
    """A thin safety wrapper around a TraCI connection that keeps
    per-step lifecycle sets (active, departed, arrived) and exposes
    safe vehicle operations that skip commands for inactive vehicles
    and log diagnostic information.

    Usage:
        safe = SafeTraCI(conn)
        safe.update_lifecycle()
        safe.safe_set_color('veh_1', (255,0,0,255))
    """

    def __init__(self, conn, log_path=None):
        self.conn = conn
        self.active_ids = set()
        self.departed_ids = set()
        self.arrived_ids = set()
        self.teleport_start_ids = set()
        self.teleport_end_ids = set()
        self.lifecycle_skip = 0
        self.lock = threading.Lock()
        self.log_path = os.path.abspath(log_path or os.path.join(os.path.dirname(__file__), '..', 'results', 'traci_cmds.log'))
        try:
            os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        except Exception:
            pass
        # initial marker
        try:
            with open(self.log_path, 'a') as f:
                f.write(f"=== SafeTraCI log started: {time.time():.3f} ===\n")
        except Exception:
            pass

    def _log(self, line):
        ts = time.time()
        try:
            with open(self.log_path, 'a') as f:
                f.write(f"{ts:.3f} {line}\n")
        except Exception:
            pass

    def update_lifecycle(self):
        """Refresh lifecycle sets from TraCI. Should be called immediately after simulationStep()."""
        with self.lock:
            try:
                ids = list(self.conn.vehicle.getIDList())
                self.active_ids = set(ids)
            except Exception:
                self.active_ids = set()
            try:
                d = list(self.conn.simulation.getDepartedIDList())
                self.departed_ids = set(d)
            except Exception:
                self.departed_ids = set()
            try:
                a = list(self.conn.simulation.getArrivedIDList())
                self.arrived_ids = set(a)
            except Exception:
                self.arrived_ids = set()
            # Teleport lists - optional
            try:
                s = list(self.conn.simulation.getStartingTeleportIDList())
                self.teleport_start_ids = set(s)
            except Exception:
                self.teleport_start_ids = set()
            try:
                e = list(self.conn.simulation.getEndingTeleportIDList())
                self.teleport_end_ids = set(e)
            except Exception:
                self.teleport_end_ids = set()

    def _vehicle_active(self, vid):
        return vid in self.active_ids

    def safe_set_color(self, vehicle_id, color):
        cmd = 'SET_COLOR'
        if not self._vehicle_active(vehicle_id):
            self.lifecycle_skip += 1
            self._log(f"[VEHICLE COMMAND] skip {cmd} vehicle={vehicle_id} active=FALSE")
            return False
        try:
            self.conn.vehicle.setColor(vehicle_id, color)
            self._log(f"[VEHICLE COMMAND] ok   {cmd} vehicle={vehicle_id} active=TRUE")
            return True
        except Exception as e:
            self._log(f"[VEHICLE COMMAND] err  {cmd} vehicle={vehicle_id} active=TRUE exc={e}")
            # If an error indicates vehicle no longer exists, mark it arrived
            try:
                self.arrived_ids.add(vehicle_id)
            except Exception:
                pass
            return False

    def safe_set_route(self, vehicle_id, route):
        cmd = 'SET_ROUTE'
        if not self._vehicle_active(vehicle_id):
            self.lifecycle_skip += 1
            self._log(f"[VEHICLE COMMAND] skip {cmd} vehicle={vehicle_id} active=FALSE")
            return False
        try:
            self.conn.vehicle.setRoute(vehicle_id, route)
            self._log(f"[VEHICLE COMMAND] ok   {cmd} vehicle={vehicle_id} active=TRUE route_len={len(route)}")
            return True
        except Exception as e:
            self._log(f"[VEHICLE COMMAND] err  {cmd} vehicle={vehicle_id} active=TRUE exc={e}")
            try:
                self.arrived_ids.add(vehicle_id)
            except Exception:
                pass
            return False

    # Safe getters that return None if vehicle inactive
    def get_route(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return tuple(self.conn.vehicle.getRoute(vehicle_id))
        except Exception:
            return None

    def get_route_index(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return int(self.conn.vehicle.getRouteIndex(vehicle_id))
        except Exception:
            return None

    def get_road_id(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return self.conn.vehicle.getRoadID(vehicle_id)
        except Exception:
            return None

    def get_lane_id(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return self.conn.vehicle.getLaneID(vehicle_id)
        except Exception:
            return None

    def get_type_id(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return self.conn.vehicle.getTypeID(vehicle_id)
        except Exception:
            return None

    def get_speed(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return float(self.conn.vehicle.getSpeed(vehicle_id))
        except Exception:
            return None

    def get_wait(self, vehicle_id):
        if not self._vehicle_active(vehicle_id):
            return None
        try:
            return float(self.conn.vehicle.getAccumulatedWaitingTime(vehicle_id))
        except Exception:
            return None

    def get_active_ids(self):
        return set(self.active_ids)

    def get_departed_ids(self):
        return set(self.departed_ids)

    def get_arrived_ids(self):
        return set(self.arrived_ids)
