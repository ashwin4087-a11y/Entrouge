import { Activity, Map, Radio } from 'lucide-react';
import DigitalTwinMap from '../components/Map/DigitalTwinMap';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0d1224]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                TrafficVerse
              </h1>
              <p className="text-[11px] font-medium tracking-widest text-cyan-400/70 uppercase">
                Urban Mobility Digital Twin
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">
              System Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Title Section */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Map className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Digital Twin</h2>
            <p className="text-sm text-slate-400">
              Chennai Urban Mobility Network
            </p>
          </div>
        </div>

        {/* Map Card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
          {/* Map Toolbar */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Radio className="h-4 w-4 text-cyan-500" />
              <span>Live Map View</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              MapTiler + MapLibre GL
            </div>
          </div>

          {/* Map Container */}
          <div className="h-[calc(100vh-280px)] min-h-[400px]">
            <DigitalTwinMap />
          </div>
        </div>
      </main>
    </div>
  );
}
