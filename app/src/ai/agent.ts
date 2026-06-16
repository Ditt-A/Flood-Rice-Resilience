import { google } from "@ai-sdk/google";
import { tool } from "@ai-sdk/provider-utils";
import { InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";
import { z } from "zod";
import { simulator } from "@/src/lib/simulator";

const region = z.enum(["Garut", "Indramayu", "Karawang", "Subang", "Tasikmalaya"]);
const scenario = z.enum(["Low", "Medium", "High"]);
const actor = z
  .enum(["Farmer", "Rice Miller", "Middlemen", "Wholesaler", "Retail"])
  .optional();

const scopeSchema = z.object({
  region: region.describe("One of the five observed West Java study regions"),
  scenario: scenario.default("High"),
  actor
});

export const floodRiceAgent = new ToolLoopAgent({
  id: "flood-rice-resilience-insight-agent",
  model: google("gemini-3.1-flash-lite"),
  temperature: 0.8,
  maxOutputTokens: 1400,
  stopWhen: stepCountIs(5),
  instructions: `You are the Flood-Rice Resilience insight agent.

STRICT DATA BOUNDARY
- Answer only from tool outputs in this conversation. Never use web knowledge or invent values.
- You MUST call at least one tool before making any factual claim, number, ranking, comparison, or recommendation.
- If a region, scenario, actor, feature, operation, or unit is ambiguous, ask one concise clarification question.
- The only regions are Garut, Indramayu, Karawang, Subang, and Tasikmalaya.
- Clearly distinguish observed dataset values, model predictions, Monte Carlo sensitivity estimates, and counterfactual simulations.
- Preserve field semantics exactly: never describe a delta as an absolute result, or an absolute result as a change.
- When describing a simulation, explicitly label baseline, simulated value, and delta when each is mentioned.
- Always state the metric scope before numbers. Prefer the tool's scope_label and scope_detail verbatim. Use "Actor-specific result: Region - Actor - Scenario" when an actor filter is present, and "Regional scenario aggregate: Region - Scenario - all actors" when no actor filter is present.
- If two numbers share the same region and scenario but one has an actor filter and the other does not, explicitly say they are not the same denominator.
- Carry tool warnings and limitations into the answer. Never describe a scenario result as observed flood damage.
- When a tool warning mentions 100% failure or simulation saturation, explain that it is saturation under stress-sampling assumptions, not guaranteed real-world collapse.
- For a feature-change question, use getFeatureCatalog when feature naming or units are uncertain, then use simulateFeatureChanges.
- Interpret "1 km x 1 km" as 1,000,000 m2 only when the user explicitly describes a square kilometre.

RESPONSE STYLE
- Mirror the user's language: Indonesian for Indonesian, English for English.
- Be concise. Start with the key result, then explain the operational implication.
- Do not dump raw JSON or create Markdown tables. The interface renders tool results as dashboard blocks.
- Mention low confidence when a value is outside the observed range.`,
  tools: {
    getRegionSnapshot: tool({
      description:
        "Get dataset-bounded KPIs, actor risks, and actions for one region and flood scenario.",
      inputSchema: scopeSchema,
      execute: async (input) => simulator.snapshot(input)
    }),
    compareScenarios: tool({
      description:
        "Compare Low, Medium, and High Monte Carlo sensitivity scenarios for one region.",
      inputSchema: z.object({ region, actor }),
      execute: async (input) => simulator.compare(input)
    }),
    getFeatureCatalog: tool({
      description:
        "Get the authoritative 34-feature catalog, units, actor applicability, and observed ranges.",
      inputSchema: z.object({}),
      execute: async () => simulator.catalog()
    }),
    simulateFeatureChanges: tool({
      description:
        "Run a deterministic counterfactual with dependency-aware feature mutations and Monte Carlo risk.",
      inputSchema: scopeSchema.extend({
        mutations: z
          .array(
            z.object({
              feature: z.string().describe("Exact feature name from the feature catalog"),
              operation: z.enum(["set", "scale", "change_percent"]).default("set"),
              value: z.number().finite()
            })
          )
          .min(1)
          .max(8)
      }),
      execute: async (input) => simulator.simulate(input)
    }),
    getRegionDashboard: tool({
      description:
        "Get the intervention queue and full dashboard payload for a selected region and scenario.",
      inputSchema: scopeSchema,
      execute: async (input) => simulator.dashboard(input)
    }),
    getMethodLimitations: tool({
      description:
        "Return the fixed methodological boundaries that must accompany interpretation.",
      inputSchema: z.object({}),
      execute: async () => ({
        kind: "method_limitations",
        title: "Method boundaries",
        warnings: [
          "Flood scenarios are internal sensitivity assumptions, not observed damage percentages.",
          "Rice vulnerability is model-estimated from operational features and project pseudo-labels.",
          "Historical Open Data Jabar exposure is a regional bridge and was not used to train the primary flood model.",
          "Counterfactual values outside observed feature ranges are allowed but marked low confidence."
        ],
        sources: [
          "ai/outputs/02_methodological_notes.md",
          "ai/outputs/04_method5_notes.md",
          "ai/outputs/05_method1_notes.md"
        ]
      })
    })
  }
});

export type FloodRiceAgentMessage = InferAgentUIMessage<typeof floodRiceAgent>;
