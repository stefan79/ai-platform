import type { HealthResponse } from '@ai-platform/protocol-rest';
import { parseHealthResponse } from '@ai-platform/protocol-rest';
import { fetchJson } from './client';

export async function fetchHealth(baseUrl = ''): Promise<HealthResponse> {
  const payload = await fetchJson(baseUrl, '/api/health');
  return parseHealthResponse(payload);
}
