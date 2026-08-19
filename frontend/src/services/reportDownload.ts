import type { EnrichedSimulationResult } from '@/types/simulation'

export function downloadReportHtml(report: EnrichedSimulationResult) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${report.title} — ENTROUGE Impact Report</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; color: #112d4e; margin: 40px; line-height: 1.5; }
    h1 { color: #112d4e; border-bottom: 2px solid #3f72af; padding-bottom: 8px; }
    h2 { color: #3f72af; margin-top: 28px; }
    .meta { color: #424750; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #dbe2ef; padding: 8px 12px; text-align: left; }
    th { background: #f9f7f7; }
    .summary { background: #f9f7f7; padding: 16px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>IMPACT REPORT — ENTROUGE</h1>
  <p class="meta">${report.title} · Generated ${new Date(report.createdAt).toLocaleDateString()}</p>
  <div class="summary">
    <h2>Executive Summary</h2>
    <p>${report.executiveSummary}</p>
  </div>
  <h2>Intervention Tested</h2>
  <p>${report.interventionLabel} on ${report.corridor.name}</p>
  <h2>Key Metrics</h2>
  <table>
    <tr><th>Metric</th><th>Baseline</th><th>Simulated</th><th>Delta</th></tr>
    <tr><td>Congestion</td><td>${report.baseline.congestionPct}%</td><td>${report.simulated.congestionPct}%</td><td>${report.delta.congestionPct}%</td></tr>
    <tr><td>Travel Time</td><td>${report.baseline.travelTimeMin} min</td><td>${report.simulated.travelTimeMin} min</td><td>${report.delta.travelTimeMin} min</td></tr>
    <tr><td>CO₂</td><td>${report.baseline.co2Kg} kg</td><td>${report.simulated.co2Kg} kg</td><td>${report.delta.co2Kg} kg</td></tr>
    <tr><td>Avg Speed</td><td>${report.baseline.avgSpeedKmh} km/h</td><td>${report.simulated.avgSpeedKmh} km/h</td><td>${report.delta.avgSpeedKmh} km/h</td></tr>
  </table>
  <h2>Traffic Diversion</h2>
  <table>
    <tr><th>Corridor</th><th>Baseline</th><th>Simulated</th><th>Change</th></tr>
    ${report.divertedTraffic.map((d) => `<tr><td>${d.name}</td><td>${d.baselineLoadPct}%</td><td>${d.simulatedLoadPct}%</td><td>+${d.changePct}%</td></tr>`).join('')}
  </table>
  <h2>What Happened?</h2>
  <p>${report.whatHappened}</p>
  <h2>Why Did It Happen?</h2>
  <p>${report.whyItHappened}</p>
  <h2>Recommended Action</h2>
  <p>${report.recommendedAction}</p>
  <h2>Civic Impact</h2>
  <p>Emergency Access: ${report.emergencyAccessScore}/100 (${report.emergencyAccessStatus})</p>
  <p>Equity Impact: ${report.equityScore}/100 (${report.equityStatus})</p>
  <p>Affected Population: ${report.affectedPopulation} commuters</p>
  <p class="meta">Simulation mode: ${report.mode === 'api' ? 'Live API' : 'Virtual Model'}</p>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.title.replace(/\s+/g, '_')}_report.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function printReport() {
  window.print()
}
