import { Link, useNavigate, useParams } from 'react-router-dom'
import { DigitalTwinMap } from '@/components/Map/DigitalTwinMap'
import { Icon } from '@/components/Icon'
import { ScreenShell } from '@/components/layout/ScreenShell'
import { useSimulation } from '@/context/SimulationContext'
import { downloadReportHtml } from '@/services/reportDownload'
import { timeProfileLabel } from '@/types/simulation'

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getReport, network, applyRecommendation } = useSimulation()
  const report = id ? getReport(id) : undefined

  if (!report) {
    return (
      <ScreenShell activeNav="REPORTS">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <p className="text-lg font-medium text-deep-navy">Report not found.</p>
            <Link to="/reports" className="mt-4 text-brand-accent hover:underline">Back to Reports</Link>
          </div>
        </div>
      </ScreenShell>
    )
  }

  const diversionIds = report.divertedTraffic.filter((d) => d.changePct > 0).map((d) => d.edgeId)

  return (
    <ScreenShell activeNav="REPORTS">
      <div className="flex-1 overflow-y-auto bg-canvas">
        <div className="border-b border-outline-variant bg-shell-surface px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 font-label-md text-brand-accent">
                <Icon name="description" className="text-[16px]" />
                IMPACT REPORT
              </div>
              <h1 className="text-2xl font-semibold text-deep-navy">{report.corridor.name}</h1>
              <p className="text-lg text-deep-navy">{report.interventionLabel}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Simulation Complete · Generated {new Date(report.createdAt).toLocaleDateString()}
                · {report.mode === 'api' ? 'Live Model' : 'Virtual Model'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadReportHtml(report)}
                className="rounded bg-brand-accent px-4 py-2 font-label-md text-white hover:bg-brand-accent-hover"
              >
                DOWNLOAD REPORT
              </button>
              <Link
                to="/digital-twin"
                className="rounded border border-outline-variant bg-white px-4 py-2 font-label-md text-deep-navy hover:border-brand-accent"
              >
                OPEN DIGITAL TWIN
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
          <section className="rounded-lg border border-outline-variant bg-shell-surface p-6">
            <h2 className="mb-3 font-label-md uppercase text-brand-accent">Executive Summary</h2>
            <p className="leading-relaxed text-deep-navy">{report.executiveSummary}</p>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Congestion" baseline={`${report.baseline.congestionPct}%`} simulated={`${report.simulated.congestionPct}%`} delta={`${report.delta.congestionPct}%`} />
            <MetricCard title="Travel Time" baseline={`${report.baseline.travelTimeMin} min`} simulated={`${report.simulated.travelTimeMin} min`} delta={`${report.delta.travelTimeMin} min`} />
            <MetricCard title="CO₂" baseline={`${report.baseline.co2Kg} kg`} simulated={`${report.simulated.co2Kg} kg`} delta={`${report.delta.co2Kg} kg`} />
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-outline-variant bg-white p-6">
              <h2 className="mb-4 font-label-md uppercase text-deep-navy">Intervention & Conditions</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Intervention" value={report.interventionLabel} />
                <Row label="Location" value={report.corridor.name} />
                <Row label="Segment Length" value={`${report.corridor.length_km} km`} />
                <Row label="Traffic Period" value={timeProfileLabel(report.timeProfile)} />
                <Row label="Duration" value={`${report.durationMinutes} minutes`} />
              </dl>
            </div>
            <div className="rounded-lg border border-outline-variant bg-white p-6">
              <h2 className="mb-4 font-label-md uppercase text-deep-navy">Civic Impact</h2>
              <Row label="Emergency Access Score" value={`${report.emergencyAccessScore}/100 — ${report.emergencyAccessStatus}`} />
              <p className="mt-2 text-sm text-on-surface-variant">
                Emergency access may be delayed on alternate corridors experiencing increased congestion.
              </p>
              <div className="mt-4">
                <Row label="Equity Impact Score" value={`${report.equityScore}/100 — ${report.equityStatus}`} />
                <p className="mt-2 text-sm text-on-surface-variant">
                  Measures distribution of mobility impact across affected areas and populations.
                </p>
              </div>
              <div className="mt-4 font-mono text-2xl font-bold text-deep-navy">
                {report.affectedPopulation} commuters affected
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-6">
            <h2 className="mb-4 font-label-md uppercase text-deep-navy">Traffic Diversion</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left font-label-md uppercase text-on-surface-variant">
                  <th className="pb-2">Corridor</th>
                  <th className="pb-2">Baseline Load</th>
                  <th className="pb-2">Simulated Load</th>
                  <th className="pb-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {report.divertedTraffic.map((d) => (
                  <tr key={d.edgeId} className="border-b border-outline-variant/40">
                    <td className="py-2 font-medium">{d.name}</td>
                    <td className="py-2 font-mono">{d.baselineLoadPct}%</td>
                    <td className="py-2 font-mono">{d.simulatedLoadPct}%</td>
                    <td className="py-2 font-mono text-brand-accent">+{d.changePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <InsightSection title="What Happened?" text={report.whatHappened} />
            <InsightSection title="Why Did It Happen?" text={report.whyItHappened} />
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-6">
            <h2 className="mb-4 font-label-md uppercase text-deep-navy">Network Impact</h2>
            <DigitalTwinMap
              network={network}
              selectedRoad={report.corridor}
              edgeMetrics={report.edgeMetrics}
              diversionEdgeIds={diversionIds}
              className="h-[360px] w-full overflow-hidden rounded-lg"
              showLegend
            />
          </section>

          <section className="rounded-lg border-2 border-brand-accent/30 bg-brand-accent/5 p-6">
            <h2 className="mb-2 font-label-md uppercase text-brand-accent">Recommended Action</h2>
            <p className="text-deep-navy">{report.recommendedAction}</p>
            <button
              type="button"
              onClick={() => {
                const rec = report.recommendations[0]
                if (rec) applyRecommendation(rec.patch)
                navigate('/digital-twin')
              }}
              className="mt-4 rounded bg-brand-accent px-4 py-2 font-label-md text-white hover:bg-brand-accent-hover"
            >
              TEST RECOMMENDED OPTION
            </button>
          </section>

          {report.recommendations.length > 0 && (
            <section>
              <h2 className="mb-4 font-label-md uppercase text-on-surface-variant">What Should We Test Next?</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {report.recommendations.map((rec) => (
                  <div key={rec.id} className="rounded-lg border border-outline-variant bg-white p-4">
                    <p className="font-medium text-deep-navy">{rec.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{rec.reason}</p>
                    <button
                      type="button"
                      onClick={() => {
                        applyRecommendation(rec.patch)
                        navigate('/digital-twin')
                      }}
                      className="mt-3 rounded border border-brand-accent px-3 py-1 font-label-md text-brand-accent hover:bg-brand-accent/10"
                    >
                      TEST THIS
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </ScreenShell>
  )
}

function MetricCard({ title, baseline, simulated, delta }: { title: string; baseline: string; simulated: string; delta: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-white p-4">
      <h3 className="mb-3 font-label-md uppercase text-on-surface-variant">{title}</h3>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><div className="text-xs">Baseline</div><div className="font-mono font-semibold">{baseline}</div></div>
        <div><div className="text-xs">Simulated</div><div className="font-mono font-semibold">{simulated}</div></div>
        <div><div className="text-xs">Delta</div><div className="font-mono font-bold text-brand-accent">{delta}</div></div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-outline-variant/40 py-2">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-deep-navy">{value}</span>
    </div>
  )
}

function InsightSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-shell-surface p-5">
      <h2 className="mb-2 font-label-md uppercase text-brand-accent">{title}</h2>
      <p className="text-sm leading-relaxed text-deep-navy">{text}</p>
    </div>
  )
}
