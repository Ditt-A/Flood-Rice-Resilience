import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export type Scenario = "Low" | "Medium" | "High";

export type PriorityRow = {
  region: string;
  actor: string;
  scenario: Scenario;
  vulnerabilityLabel: string;
  priorityLabel: string;
  enhancedLabel: string;
  priorityRank: number;
  enhancedRank: number;
  score: number;
  failureProbability: number;
  failShare: number;
  exposure: number;
  stressedMargin: number;
  recommendedAction: string;
  reason: string;
  components: {
    vulnerability: number;
    hazard: number;
    failure: number;
    exposure: number;
  };
};

export type DistributionRow = {
  scenario: Scenario;
  low: number;
  moderate: number;
  high: number;
  critical: number;
};

export type HeatmapRow = {
  actor: string;
  values: Record<string, number | null>;
};

export type ActorFailureRow = {
  scenario: Scenario;
  actor: string;
  meanFailureProbability: number;
  medianFailureProbability: number;
  actorRegions: number;
};

export type StakeholderAction = {
  stakeholder: string;
  actionFocus: string;
  trigger: string;
  use: string;
};

export type RegionExposure = {
  region: string;
  eventsTotal: number;
  recent5y: number;
  score: number;
  level: string;
};

export type DashboardData = {
  generatedFrom: string[];
  regions: string[];
  scenarios: Scenario[];
  priorityRows: PriorityRow[];
  heatmap: HeatmapRow[];
  distribution: DistributionRow[];
  actorFailures: ActorFailureRow[];
  stakeholders: StakeholderAction[];
  exposures: RegionExposure[];
  modelSummary: {
    floodModel: string;
    floodR2: number;
    riceModel: string;
    riceBalancedAccuracy: number;
    riceF1Macro: number;
    riceFeatures: number;
  };
  figures: {
    title: string;
    src: string;
    note: string;
  }[];
};

const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(process.cwd(), "..");
const OUTPUTS_DIR = path.join(PROJECT_ROOT, "ai", "outputs");

function readOutput(fileName: string) {
  return fs.readFileSync(path.join(OUTPUTS_DIR, fileName), "utf8");
}

function readCsv(fileName: string): Record<string, string>[] {
  return parse(readOutput(fileName), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

function readJson<T>(fileName: string): T {
  return JSON.parse(readOutput(fileName)) as T;
}

function n(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scenario(value: string): Scenario {
  if (value === "Low" || value === "Medium" || value === "High") return value;
  return "High";
}

type ModelSummaryFile = {
  best_flood_regression_model: string;
  best_rice_operational_model: string;
  flood_holdout: {
    r2: number;
  };
  rice_operational_holdout: {
    balanced_accuracy: number;
    f1_macro: number;
    n_features: number;
  };
};

export function getDashboardData(): DashboardData {
  const priorityRows = readCsv("05_monte_carlo_enhanced_priority.csv")
    .map((row): PriorityRow => ({
      region: row.region,
      actor: row.actor,
      scenario: scenario(row.flood_scenario),
      vulnerabilityLabel: row.vulnerability_label,
      priorityLabel: row.priority_label,
      enhancedLabel: row.monte_carlo_enhanced_priority_label,
      priorityRank: n(row.priority_rank),
      enhancedRank: n(row.monte_carlo_priority_rank),
      score: n(row.monte_carlo_enhanced_priority_score),
      failureProbability: n(row.mean_failure_probability),
      failShare: n(row.fail_share),
      exposure: n(row.historical_flood_exposure_score),
      stressedMargin: n(row.expected_stressed_margin || row.median_stressed_margin),
      recommendedAction: row.recommended_action,
      reason: row.monte_carlo_priority_reason || row.priority_reason,
      components: {
        vulnerability: n(row.vulnerability_component),
        hazard: n(row.hazard_component),
        failure: n(row.monte_carlo_failure_component),
        exposure: n(row.external_exposure_component)
      }
    }))
    .sort((a, b) => a.enhancedRank - b.enhancedRank || b.score - a.score);

  const regions = Array.from(new Set(priorityRows.map((row) => row.region))).sort();
  const heatmap = readCsv("05_monte_carlo_high_priority_heatmap_values.csv").map(
    (row): HeatmapRow => ({
      actor: row.actor,
      values: Object.fromEntries(
        regions.map((region) => [region, nullableNumber(row[region])])
      )
    })
  );

  const distribution = readCsv("05_monte_carlo_priority_distribution_share.csv").map(
    (row): DistributionRow => ({
      scenario: scenario(row.flood_scenario),
      low: n(row.Low),
      moderate: n(row.Moderate),
      high: n(row.High),
      critical: n(row.Critical)
    })
  );

  const actorFailures = readCsv("04_monte_carlo_failure_probability_by_actor.csv").map(
    (row): ActorFailureRow => ({
      scenario: scenario(row.flood_scenario),
      actor: row.actor,
      meanFailureProbability: n(row.mean_failure_probability),
      medianFailureProbability: n(row.median_failure_probability),
      actorRegions: n(row.n_actor_regions)
    })
  );

  const stakeholders = readCsv("05_stakeholder_action_summary.csv").map(
    (row): StakeholderAction => ({
      stakeholder: row.stakeholder,
      actionFocus: row.action_focus,
      trigger: row.trigger,
      use: row.specific_use
    })
  );

  const exposures = readCsv("01b_jabar_flood_exposure_by_region.csv").map(
    (row): RegionExposure => ({
      region: row.region,
      eventsTotal: n(row.flood_events_total),
      recent5y: n(row.flood_events_recent_5y),
      score: n(row.historical_flood_exposure_score),
      level: row.historical_flood_exposure_level
    })
  );

  const modelSummary = readJson<ModelSummaryFile>("03_final_model_summary.json");

  return {
    generatedFrom: [
      "05_monte_carlo_enhanced_priority.csv",
      "04_monte_carlo_failure_probability_by_actor.csv",
      "03_final_model_summary.json"
    ],
    regions,
    scenarios: ["High", "Medium", "Low"],
    priorityRows,
    heatmap,
    distribution,
    actorFailures,
    stakeholders,
    exposures,
    modelSummary: {
      floodModel: modelSummary.best_flood_regression_model,
      floodR2: n(modelSummary.flood_holdout.r2),
      riceModel: modelSummary.best_rice_operational_model,
      riceBalancedAccuracy: n(modelSummary.rice_operational_holdout.balanced_accuracy),
      riceF1Macro: n(modelSummary.rice_operational_holdout.f1_macro),
      riceFeatures: n(modelSummary.rice_operational_holdout.n_features)
    },
    figures: [
      {
        title: "LHS high-priority heatmap",
        src: "/figures/05_lhs_high_priority_heatmap.png",
        note: "Actor-region priority intensity under high flood scenario"
      },
      {
        title: "Top LHS priorities",
        src: "/figures/05_top10_lhs_priority.png",
        note: "Final ranked intervention queue with uncertainty"
      },
      {
        title: "LHS stress response curve",
        src: "/figures/04_lhs_stress_response_curve_by_actor.png",
        note: "Failure probability sensitivity by actor"
      },
      {
        title: "Rice vulnerability drivers",
        src: "/figures/03_rice_feature_importance.png",
        note: "Operational model feature importance"
      },
      {
        title: "Historical flood exposure",
        src: "/figures/01b_jabar_flood_exposure_by_region.png",
        note: "Open Data Jabar regional exposure bridge"
      }
    ]
  };
}
