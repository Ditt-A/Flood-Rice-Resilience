import { createAgentUIStreamResponse, UIMessage } from "ai";
import { floodRiceAgent } from "@/src/ai/agent";

export const maxDuration = 30;

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 20;
const requestLog = new Map<string, number[]>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter((part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
      part.type === "text"
    )
    .map((part) => part.text)
    .join(" ")
    .trim();
}

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  if (isRateLimited(clientKey(request))) {
    return Response.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > 80_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  let messages: UIMessage[];
  try {
    const body = JSON.parse(raw) as { messages?: UIMessage[] };
    messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const input = lastUser ? textFromMessage(lastUser) : "";
  if (!input || input.length > 1000) {
    return Response.json(
      { error: "The latest user message must contain between 1 and 1000 characters." },
      { status: 400 }
    );
  }

  return createAgentUIStreamResponse({
    agent: floodRiceAgent,
    uiMessages: messages,
    abortSignal: request.signal,
    timeout: { totalMs: 28_000 },
    onError: () => "The insight request failed. Check the model and simulator services."
  });
}
