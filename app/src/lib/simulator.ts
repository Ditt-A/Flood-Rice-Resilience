const SIMULATOR_URL = process.env.SIMULATOR_URL ?? "http://127.0.0.1:8000";

export type SimulatorResult = Record<string, unknown> & {
  kind: string;
  title: string;
  region?: string;
  scenario?: string;
  warnings?: string[];
  sources?: string[];
  visualizations?: Array<Record<string, unknown>>;
};

async function simulatorRequest(
  path: string,
  body?: Record<string, unknown>
): Promise<SimulatorResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${SIMULATOR_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(error?.detail ?? `Simulator returned HTTP ${response.status}`);
    }

    return (await response.json()) as SimulatorResult;
  } finally {
    clearTimeout(timeout);
  }
}

export const simulator = {
  catalog: () => simulatorRequest("/v1/catalog"),
  snapshot: (input: Record<string, unknown>) =>
    simulatorRequest("/v1/region-snapshot", input),
  compare: (input: Record<string, unknown>) =>
    simulatorRequest("/v1/scenario-comparison", input),
  simulate: (input: Record<string, unknown>) => simulatorRequest("/v1/simulate", input),
  dashboard: (input: Record<string, unknown>) =>
    simulatorRequest("/v1/region-dashboard", input)
};
