"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  ChevronDown,
  Database,
  Factory,
  MapPinned,
  Route,
  ShieldCheck,
  Waves,
  Wheat
} from "lucide-react";
import type { DashboardData, PriorityRow, Scenario } from "@/src/lib/data";

type Props = {
  data: DashboardData;
};

const scenarioTone: Record<Scenario, string> = {
  High: "danger",
  Medium: "warning",
  Low: "stable"
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function decimal(value: number, digits = 3) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function money(value: number) {
  const abs = Math.abs(value);
  const compact =
    abs >= 1_000_000_000
      ? `${decimal(value / 1_000_000_000, 1)}B`
      : abs >= 1_000_000
        ? `${decimal(value / 1_000_000, 1)}M`
        : `${Math.round(value).toLocaleString("en-US")}`;
  return `IDR ${compact}`;
}

function topRegion(rows: PriorityRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.region, (totals.get(row.region) ?? 0) + row.score);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n/a";
}

function labelClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("critical")) return "pill critical";
  if (normalized.includes("high")) return "pill high";
  if (normalized.includes("moderate")) return "pill moderate";
  return "pill low";
}

function HeatCell({ value }: { value: number | null }) {
  if (value === null) return <td className="heat empty">-</td>;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <td
      className="heat"
      style={{
        background: `color-mix(in srgb, #b42318 ${Math.round(clamped * 82)}%, #fff7ed)`,
        color: clamped > 0.62 ? "#ffffff" : "#2f1b12"
      }}
    >
      {percent(value)}
    </td>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <div className="metricIcon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export function DashboardClient({ data }: Props) {
  const [scenario, setScenario] = useState<Scenario>("High");
  const [region, setRegion] = useState("All");
  const [figureIndex, setFigureIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRegion = params.get("region");
    const requestedScenario = params.get("scenario");
    if (requestedRegion && data.regions.includes(requestedRegion)) setRegion(requestedRegion);
    if (
      requestedScenario === "Low" ||
      requestedScenario === "Medium" ||
      requestedScenario === "High"
    ) {
      setScenario(requestedScenario);
    }
  }, [data.regions]);

  const filteredRows = useMemo(() => {
    return data.priorityRows
      .filter((row) => row.scenario === scenario)
      .filter((row) => region === "All" || row.region === region)
      .sort((a, b) => a.enhancedRank - b.enhancedRank || b.score - a.score);
  }, [data.priorityRows, scenario, region]);

  const topRows = filteredRows.slice(0, 10);
  const criticalCount = filteredRows.filter((row) =>
    row.enhancedLabel.toLowerCase().includes("critical")
  ).length;
  const highestFailure = Math.max(...filteredRows.map((row) => row.failureProbability), 0);
  const meanPriority =
    filteredRows.reduce((total, row) => total + row.score, 0) / Math.max(filteredRows.length, 1);
  const activeDistribution = data.distribution.find((row) => row.scenario === scenario);
  const activeActorFailures = data.actorFailures
    .filter((row) => row.scenario === scenario)
    .sort((a, b) => b.meanFailureProbability - a.meanFailureProbability);
  const activeFigure = data.figures[figureIndex];

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">
            <Waves size={16} />
            West Java flood logistics
          </div>
          <h1>Flood-Rice Resilience</h1>
          <p>
            Scenario-based priority cockpit for protecting rice supply-chain nodes before flood
            disruption turns into food availability risk.
          </p>
        </div>
        <div className="topActions">
          <div className="modelStrip" aria-label="Model evidence">
            <div>
              <span>Flood</span>
              <strong>
                {data.modelSummary.floodModel} R2 {decimal(data.modelSummary.floodR2, 3)}
              </strong>
            </div>
            <div>
              <span>Rice</span>
              <strong>
                {data.modelSummary.riceModel} BA{" "}
                {decimal(data.modelSummary.riceBalancedAccuracy, 3)}
              </strong>
            </div>
            <div>
              <span>Policy</span>
              <strong>{data.modelSummary.riceFeatures} ops features</strong>
            </div>
          </div>
          <a className="aiLaunch" href="/ai">
            <Bot size={18} />
            Ask AI insight
          </a>
        </div>
      </header>

      <section className="controls" aria-label="Dashboard filters">
        <div className="segmented">
          {data.scenarios.map((item) => (
            <button
              key={item}
              className={item === scenario ? "active" : ""}
              onClick={() => setScenario(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <label className="selectWrap">
          <MapPinned size={17} />
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="All">All regions</option>
            {data.regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
        <div className="sourceLine">
          <Database size={16} />
          {data.generatedFrom.join(" / ")}
        </div>
      </section>

      <section className="metricsGrid" aria-label="Current scenario metrics">
        <Metric
          icon={<AlertTriangle size={22} />}
          label="Critical nodes"
          value={`${criticalCount}`}
          detail={`${filteredRows.length} actor-region-scenario rows`}
          tone={scenarioTone[scenario]}
        />
        <Metric
          icon={<ShieldCheck size={22} />}
          label="Peak MC failure"
          value={percent(highestFailure)}
          detail="mean failure probability"
          tone="danger"
        />
        <Metric
          icon={<BarChart3 size={22} />}
          label="Mean priority"
          value={decimal(meanPriority, 3)}
          detail="weighted decision score"
        />
        <Metric
          icon={<Route size={22} />}
          label="Highest pressure"
          value={topRegion(filteredRows)}
          detail="region by summed score"
        />
      </section>

      <section className="mainGrid">
        <div className="panel queuePanel">
          <div className="panelHead">
            <div>
              <h2>Intervention Queue</h2>
              <p>Ranked actor-region priorities for the active scenario.</p>
            </div>
            <Boxes size={22} />
          </div>
          <div className="tableScroll">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Node</th>
                  <th>Priority</th>
                  <th>MC fail</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row) => (
                  <tr key={`${row.scenario}-${row.region}-${row.actor}-${row.enhancedRank}`}>
                    <td>{row.enhancedRank}</td>
                    <td>
                      <strong>{row.region}</strong>
                      <span>{row.actor}</span>
                    </td>
                    <td>
                      <span className={labelClass(row.enhancedLabel)}>{row.enhancedLabel}</span>
                    </td>
                    <td>{percent(row.failureProbability)}</td>
                    <td>{decimal(row.score, 3)}</td>
                    <td>{row.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel sidePanel">
          <div className="panelHead">
            <div>
              <h2>Priority Mix</h2>
              <p>Scenario share by operational label.</p>
            </div>
            <Wheat size={22} />
          </div>
          {activeDistribution ? (
            <div className="stackBars">
              {[
                ["Low", activeDistribution.low, "low"],
                ["Moderate", activeDistribution.moderate, "moderate"],
                ["High", activeDistribution.high, "high"],
                ["Critical", activeDistribution.critical, "critical"]
              ].map(([label, value, tone]) => (
                <div className="barRow" key={label}>
                  <span>{label}</span>
                  <div className="barTrack">
                    <i className={`${tone}`} style={{ width: percent(value as number) }} />
                  </div>
                  <strong>{percent(value as number)}</strong>
                </div>
              ))}
            </div>
          ) : null}
          <div className="ruleBox">
            <strong>Decision policy</strong>
            <p>0.35 vulnerability + 0.30 flood hazard + 0.25 MC failure + 0.10 exposure.</p>
          </div>
        </aside>
      </section>

      <section className="analysisGrid">
        <div className="panel heatmapPanel">
          <div className="panelHead">
            <div>
              <h2>High-Flood Actor-Region Heatmap</h2>
              <p>Monte Carlo enhanced priority score by actor and region.</p>
            </div>
            <MapPinned size={22} />
          </div>
          <div className="tableScroll compact">
            <table>
              <thead>
                <tr>
                  <th>Actor</th>
                  {data.regions.map((item) => (
                    <th key={item}>{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.heatmap.map((row) => (
                  <tr key={row.actor}>
                    <td>{row.actor}</td>
                    {data.regions.map((item) => (
                      <HeatCell key={`${row.actor}-${item}`} value={row.values[item]} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel failurePanel">
          <div className="panelHead">
            <div>
              <h2>Failure Probability By Actor</h2>
              <p>Monte Carlo mean across actor-region units.</p>
            </div>
            <Factory size={22} />
          </div>
          <div className="actorBars">
            {activeActorFailures.map((row) => (
              <div className="actorBar" key={`${row.scenario}-${row.actor}`}>
                <div>
                  <span>{row.actor}</span>
                  <strong>{percent(row.meanFailureProbability)}</strong>
                </div>
                <div className="barTrack">
                  <i
                    className={row.meanFailureProbability > 0.9 ? "critical" : "high"}
                    style={{ width: percent(row.meanFailureProbability) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="evidenceGrid">
        <div className="panel figurePanel">
          <div className="panelHead">
            <div>
              <h2>Evidence Figures</h2>
              <p>{activeFigure.note}</p>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="figureTabs">
            {data.figures.map((figure, index) => (
              <button
                type="button"
                className={index === figureIndex ? "active" : ""}
                key={figure.src}
                onClick={() => setFigureIndex(index)}
              >
                {figure.title}
              </button>
            ))}
          </div>
          <div className="figureFrame">
            <img src={activeFigure.src} alt={activeFigure.title} />
          </div>
        </div>

        <div className="panel actionsPanel">
          <div className="panelHead">
            <div>
              <h2>Stakeholder Actions</h2>
              <p>Operational translation from priority outputs.</p>
            </div>
            <Route size={22} />
          </div>
          <div className="actionList">
            {data.stakeholders.map((item) => (
              <article key={item.stakeholder}>
                <strong>{item.stakeholder}</strong>
                <p>{item.actionFocus}</p>
                <span>{item.trigger}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="methodBand">
        <div>
          <Database size={20} />
          <strong>Primary evidence</strong>
          <span>Flood Prediction + Rice Supply Chain competition datasets</span>
        </div>
        <div>
          <Waves size={20} />
          <strong>Bridge</strong>
          <span>Open Data Jabar exposure only, not rice label training</span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <strong>Boundary</strong>
          <span>Scenario decision support, not observed flood-impact attribution</span>
        </div>
      </section>
    </main>
  );
}
