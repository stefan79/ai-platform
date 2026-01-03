import type { HealthResponse } from '@ai-platform/protocol-rest';
import { parseHealthResponse } from '@ai-platform/protocol-rest';

export async function fetchHealth(baseUrl = ''): Promise<HealthResponse> {
  const response = await fetch(`${baseUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`Unable to fetch health: ${response.status}`);
  }

  const payload = await response.json();
  return parseHealthResponse(payload);
}
