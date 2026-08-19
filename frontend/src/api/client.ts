import type {
  CopilotResponse,
  NetworkGeoJSON,
  NetworkInfo,
  SimulationRequest,
  SimulationResult,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error ${res.status}`)
  }
  return res.json()
}

export async function getNetwork(): Promise<NetworkGeoJSON> {
  return fetchJson('/api/network')
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  return fetchJson('/api/network/info')
}

export async function runSimulation(
  request: SimulationRequest,
): Promise<SimulationResult> {
  return fetchJson('/api/simulate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function askCopilot(
  message: string,
  context?: Record<string, unknown>,
): Promise<CopilotResponse> {
  return fetchJson('/api/copilot', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  })
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`)
    return res.ok
  } catch {
    return false
  }
}
