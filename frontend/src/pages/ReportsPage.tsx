import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { ScreenShell } from '@/components/layout/ScreenShell'
import { useSimulation } from '@/context/SimulationContext'
import { compareMetrics } from '@/components/SimulationResultsSidebar'

export function ReportsPage() {
  const { reports } = useSimulation()
  const completed = reports

  const comparison = completed.length >= 2
    ? compareMetrics(
        completed.slice(0, 3).map((r) => ({
          title: r.title,
          delta: r.delta,
          interventionLabel: r.interventionLabel,
        })),
      )
    : null

  return (
    <ScreenShell activeNav="REPORTS">
      <div className="flex-1 overflow-y-auto bg-canvas p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-wide text-deep-navy">REPORTS</h1>
          <p className="mt-1 text-lg text-deep-navy">Simulation Impact Reports</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Review the impact of simulated mobility interventions.
          </p>
        </header>

        {completed.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-shell-surface p-12 text-center">
            <Icon name="description" className="mx-auto text-[48px] text-on-surface-variant" />
            <p className="mt-4 text-lg font-medium text-deep-navy">No completed simulations available.</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Run a simulation from Digital Twin to generate an impact report.
            </p>
            <Link
              to="/digital-twin"
              className="mt-6 inline-block rounded bg-brand-accent px-6 py-2.5 font-label-md font-bold text-white hover:bg-brand-accent-hover"
            >
              GO TO DIGITAL TWIN
            </Link>
          </div>
        ) : (
          <>
            {comparison && (
              <div className="mb-8 rounded-lg border-2 border-brand-accent/30 bg-shell-surface p-6">
                <h2 className="font-label-md uppercase text-brand-accent">Recommended Option</h2>
                <p className="mt-2 text-xl font-semibold text-deep-navy">{comparison.interventionLabel}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Lowest congestion impact among recent simulations ({comparison.title})
                </p>
              </div>
            )}

            {completed.length >= 2 && (
              <div className="mb-8 overflow-x-auto rounded-lg border border-outline-variant bg-white">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-shell-bg">
                      <th className="p-3 text-left font-label-md uppercase text-on-surface-variant">Scenario</th>
                      <th className="p-3 text-left">Congestion</th>
                      <th className="p-3 text-left">Travel Time</th>
                      <th className="p-3 text-left">CO₂</th>
                      <th className="p-3 text-left">Affected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-b border-outline-variant/50">
                        <td className="p-3 font-medium">{r.interventionLabel}</td>
                        <td className="p-3 font-mono">{r.delta.congestionPct}%</td>
                        <td className="p-3 font-mono">{r.delta.travelTimeMin} min</td>
                        <td className="p-3 font-mono">{r.delta.co2Kg} kg</td>
                        <td className="p-3 font-mono">{r.affectedPopulation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="mb-4 font-label-md uppercase text-on-surface-variant">Generated Reports</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {completed.map((r) => (
                <article
                  key={r.id}
                  className="rounded-lg border border-outline-variant bg-shell-surface p-5 shadow-sm transition-colors hover:border-brand-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-deep-navy">{r.title}</h3>
                    <span className="rounded bg-brand-accent/10 px-2 py-0.5 font-label-sm text-brand-accent">
                      Complete
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-on-surface-variant">Congestion</div>
                      <div className="font-mono font-semibold">{r.delta.congestionPct}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-on-surface-variant">Travel Time</div>
                      <div className="font-mono font-semibold">{r.delta.travelTimeMin} min</div>
                    </div>
                    <div>
                      <div className="text-xs text-on-surface-variant">CO₂</div>
                      <div className="font-mono font-semibold">{r.delta.co2Kg} kg</div>
                    </div>
                  </div>
                  <Link
                    to={`/reports/${r.id}`}
                    className="mt-4 inline-block rounded border border-brand-accent px-4 py-2 font-label-md text-brand-accent hover:bg-brand-accent/10"
                  >
                    VIEW REPORT
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </ScreenShell>
  )
}
