const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export interface Health {
  status: string
  service: string
}

export async function getHealth(): Promise<Health> {
  const response = await fetch(`${API_BASE_URL}/health`, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`)
  }
  return response.json()
}
