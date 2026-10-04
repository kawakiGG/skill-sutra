const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface MetaData {
  updated_at: string;
  source: string;
  version: string;
  is_synthetic: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta: MetaData;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch failed for ${endpoint}:`, err);
    throw err;
  }
}

export async function getDashboardSummary(params?: { state_id?: number; district_id?: number; sector_id?: number }) {
  const query = new URLSearchParams();
  if (params?.state_id) query.append("state_id", params.state_id.toString());
  if (params?.district_id) query.append("district_id", params.district_id.toString());
  if (params?.sector_id) query.append("sector_id", params.sector_id.toString());
  return fetchAPI<any>(`/dashboard/summary?${query.toString()}`);
}

export async function getDemandTrends(params?: { state_id?: number; district_id?: number; occupation_id?: number }) {
  const query = new URLSearchParams();
  if (params?.state_id) query.append("state_id", params.state_id.toString());
  if (params?.district_id) query.append("district_id", params.district_id.toString());
  if (params?.occupation_id) query.append("occupation_id", params.occupation_id.toString());
  return fetchAPI<any[]>(`/dashboard/trends?${query.toString()}`);
}

export async function getStates() {
  return fetchAPI<any[]>("/geo/states");
}

export async function getDistricts(stateId?: number) {
  const q = stateId ? `?state_id=${stateId}` : "";
  return fetchAPI<any[]>(`/geo/districts${q}`);
}

export async function getSectors() {
  return fetchAPI<any[]>("/geo/sectors");
}

export async function getOccupations(sectorId?: number) {
  const q = sectorId ? `?sector_id=${sectorId}` : "";
  return fetchAPI<any[]>(`/geo/occupations${q}`);
}

export async function getGaps(params?: { state_id?: number; district_id?: number; sector_id?: number; occupation_id?: number }) {
  const query = new URLSearchParams();
  if (params?.state_id) query.append("state_id", params.state_id.toString());
  if (params?.district_id) query.append("district_id", params.district_id.toString());
  if (params?.sector_id) query.append("sector_id", params.sector_id.toString());
  if (params?.occupation_id) query.append("occupation_id", params.occupation_id.toString());
  return fetchAPI<any[]>(`/gaps?${query.toString()}`);
}

export async function getTopShortages(limit = 10) {
  return fetchAPI<any[]>(`/gaps/top-shortages?limit=${limit}`);
}

export async function getTopSaturation(limit = 10) {
  return fetchAPI<any[]>(`/gaps/top-saturation?limit=${limit}`);
}

export async function getOccupationForecast(occupationId: number, districtId: number, horizon = 6) {
  return fetchAPI<any>(`/forecast/${occupationId}?district_id=${districtId}&horizon=${horizon}`);
}

export async function getMapMetrics(level = "state", metric = "gap", stateId?: number) {
  const query = new URLSearchParams({ level, metric });
  if (stateId) query.append("state_id", stateId.toString());
  return fetchAPI<any[]>(`/map/metrics?${query.toString()}`);
}

export async function getAlerts(params?: { severity?: string; state_id?: number; district_id?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.severity) query.append("severity", params.severity);
  if (params?.state_id) query.append("state_id", params.state_id.toString());
  if (params?.district_id) query.append("district_id", params.district_id.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  return fetchAPI<any[]>(`/alerts?${query.toString()}`);
}

export async function getRecommendations(params?: { state_id?: number; district_id?: number; sector_id?: number }) {
  const query = new URLSearchParams();
  if (params?.state_id) query.append("state_id", params.state_id.toString());
  if (params?.district_id) query.append("district_id", params.district_id.toString());
  if (params?.sector_id) query.append("sector_id", params.sector_id.toString());
  return fetchAPI<any[]>(`/recommendations?${query.toString()}`);
}

export async function simulateScenario(payload: {
  district_id: number;
  occupation_id: number;
  seat_change_pct: number;
  added_centres: number;
  removed_centres: number;
  completion_rate_delta: number;
}) {
  return fetchAPI<any>("/scenarios/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadDataset(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return await res.json();
}

export async function normalizeTitle(title: string) {
  return fetchAPI<any>("/normalize/title", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function getExportCSVUrl(stateId?: number, districtId?: number) {
  const query = new URLSearchParams();
  if (stateId) query.append("state_id", stateId.toString());
  if (districtId) query.append("district_id", districtId.toString());
  return `${API_BASE}/exports/csv?${query.toString()}`;
}
