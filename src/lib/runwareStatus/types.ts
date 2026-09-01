// Runware's public status page (incident.io), fetched client-side — Access-Control-Allow-Origin: *
// confirmed on both endpoints below.
// Reference: https://status.runware.ai/api/v2/summary.json / incidents.json

export type StatusIndicator = 'none' | 'minor' | 'major' | 'critical'

export interface StatusComponent {
  id: string
  name: string
  status: string
  position: number
}

export interface StatusSummary {
  status: {
    description: string
    indicator: StatusIndicator
  }
  components: StatusComponent[]
}

export interface IncidentUpdate {
  id: string
  body: string
  status: string
  created_at: string
}

export interface Incident {
  id: string
  name: string
  status: string
  impact: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  incident_updates: IncidentUpdate[]
}

export interface IncidentsResponse {
  incidents: Incident[]
}
