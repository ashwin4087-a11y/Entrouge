export type ScreenId =
  | 'digital-twin'
  | 'corridor-detail'
  | 'intervention'
  | 'simulation-running'
  | 'simulation-results'
  | 'scenario-library'
  | 'scenario-comparison'
  | 'reports'

export const SCREEN_LABELS: Record<ScreenId, string> = {
  'digital-twin': '1 · Digital Twin',
  'corridor-detail': '2 · Corridor Detail',
  'intervention': '3 · Intervention Configurator',
  'simulation-running': '4 · Simulation Running',
  'simulation-results': '5 · Simulation Results',
  'scenario-library': '6 · Scenario Library',
  'scenario-comparison': '7 · Scenario Comparison',
  'reports': '8 · Reports',
}
