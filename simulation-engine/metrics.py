import json
import os

class SimulationMetrics:
    def __init__(self):
        self.departed = 0
        self.arrived = 0
        self.teleports = 0
        self.sim_duration = 0.0
        
        self.vehicle_speeds = []
        self.waiting_times = []
        self.active_vehicle_counts = []
        
        self.tls_ids = set()

    def update(self, step, active_count, speed_avg, wait_avg):
        self.active_vehicle_counts.append(active_count)
        if active_count > 0:
            self.vehicle_speeds.append(speed_avg)
            self.waiting_times.append(wait_avg)

    def record_tls(self, tls_list):
        for tls in tls_list:
            self.tls_ids.add(tls)

    def finalize(self):
        avg_speed = sum(self.vehicle_speeds) / len(self.vehicle_speeds) if self.vehicle_speeds else 0.0
        avg_wait = sum(self.waiting_times) / len(self.waiting_times) if self.waiting_times else 0.0
        max_wait = max(self.waiting_times) if self.waiting_times else 0.0
        
        return {
            "duration": self.sim_duration,
            "departed": self.departed,
            "arrived": self.arrived,
            "teleports": self.teleports,
            "avg_speed_mps": round(avg_speed, 2),
            "avg_wait_sec": round(avg_wait, 2),
            "max_wait_sec": round(max_wait, 2),
            "traffic_lights": list(self.tls_ids)
        }

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(self.finalize(), f, indent=4)
