"use client";

import { FormEvent, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Database,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";

type Summary = {
  units?: number;
  mean_failure_probability?: number;
  mean_priority_score?: number;
  priority_label?: string;
  mean_margin?: number;
  expected_stressed_margin?: number;
  actors?: Array<Record<string, unknown>>;
};

type InsightResult = {
  kind?: string;
  title?: string;
  region?: string;
  scenario?: string;
  actor_filter?: string | null;
  scope_label?: string;
  scope_detail?: string;
  summary?: Summary;
  kpis?: Summary;
  baseline?: Summary;
  simulated?: Summary;
  deltas?: Record<string, number | null>;
  rows?: Array<Record<string, unknown>>;
  queue?: Array<Record<string, unknown>>;
  mutations?: Array<Record<string, unknown>>;
  warnings?: string[];
  sources?: string[];
  dashboard_url?: string;
  confidence?: string;
};

const regions = ["Garut", "Indramayu", "Karawang", "Subang", "Tasikmalaya"];
const suggestions = [
  "Bandingkan risiko Garut pada semua skenario",
  "Apa prioritas utama Karawang saat skenario High?",
  "Simulasikan lahan petani Garut menjadi 1 km x 1 km",
  "Show the actor risks in Subang under Medium flood stress"
];

function number(value: unknown, digits = 2) {
  return typeof value === "number"
    ? value.toLocaleString("en-US", { maximumFractionDigits: digits })
    : "-";
}

function percent(value: unknown) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "-";
}

function money(value: unknown) {
  if (typeof value !== "number") return "-";
  const absolute = Math.abs(value);
  const formatted =
    absolute >= 1_000_000_000
      ? `${number(value / 1_000_000_000, 1)}B`
      : absolute >= 1_000_000
        ? `${number(value / 1_000_000, 1)}M`
        : number(value, 0);
  return `IDR ${formatted}`;
}

function figureFor(result: InsightResult) {
  if (result.kind === "feature_simulation") {
    return {
      src: "/figures/04_before_after_cost_revenue_by_actor.png",
      title: "Before-after cost and revenue evidence"
    };
  }
  if (result.kind === "scenario_comparison") {
    return {
      src: "/figures/04_lhs_stress_response_curve_by_actor.png",
      title: "Stress response curve"
    };
  }
  if (result.kind === "region_dashboard" || result.kind === "region_snapshot") {
    return {
      src: "/figures/05_lhs_high_priority_heatmap.png",
      title: "High-priority actor-region heatmap"
    };
  }
  if (result.kind === "feature_catalog") {
    return {
      src: "/figures/03_rice_feature_importance.png",
      title: "Rice vulnerability feature importance"
    };
  }
  return {
    src: "/figures/05_lhs_priority_component_contribution.png",
    title: "Priority component contribution"
  };
}

function labelForKind(kind: string | undefined) {
  return kind?.replaceAll("_", " ") ?? "insight";
}

function scopeLabel(result: InsightResult) {
  if (result.scope_label) return result.scope_label;
  if (result.actor_filter) return "Actor-specific result";
  if (result.kind === "scenario_comparison") return "Regional scenario aggregate comparison";
  return labelForKind(result.kind);
}

function scopeDetail(result: InsightResult) {
  if (result.scope_detail) return result.scope_detail;
  if (result.region && result.actor_filter && result.scenario) {
    return `${result.region} - ${result.actor_filter} - ${result.scenario}`;
  }
  if (result.region && result.actor_filter) {
    return `${result.region} - ${result.actor_filter} - Low/Medium/High`;
  }
  if (result.region && result.scenario) {
    return `${result.region} - all actors - ${result.scenario}`;
  }
  if (result.region) return `${result.region} - all actors`;
  return result.title ?? "Validated insight";
}

function MarkdownText({ children }: { children: string }) {
  return (
    <div className="markdownText">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="markdownTable">
              <table>{children}</table>
            </div>
          )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function outputsFromMessage(message: UIMessage) {
  const outputs: InsightResult[] = [];
  for (const part of message.parts) {
    const candidate = part as unknown as {
      type?: string;
      state?: string;
      output?: InsightResult;
    };
    if (
      candidate.type?.startsWith("tool-") &&
      candidate.state === "output-available" &&
      candidate.output
    ) {
      outputs.push(candidate.output);
    }
  }
  return outputs;
}

function ActorBars({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="insightBars">
      {rows.slice(0, 5).map((row) => {
        const value = Number(row.failure_probability ?? 0);
        return (
          <div className="insightBar" key={String(row.actor ?? row.scenario ?? row.label)}>
            <div>
              <span>{String(row.actor ?? row.scenario ?? row.label)}</span>
              <strong>{percent(value)}</strong>
            </div>
            <div className="barTrack">
              <i
                className={value >= 0.75 ? "critical" : value >= 0.4 ? "high" : "low"}
                style={{ width: percent(value) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightKpis({ summary }: { summary: Summary }) {
  return (
    <div className="inlineKpis">
      <div>
        <span>Failure</span>
        <strong>{percent(summary.mean_failure_probability)}</strong>
      </div>
      <div>
        <span>Priority</span>
        <strong>{number(summary.mean_priority_score, 3)}</strong>
      </div>
      <div>
        <span>Label</span>
        <strong>{summary.priority_label ?? "-"}</strong>
      </div>
      <div>
        <span>Margin</span>
        <strong>{money(summary.expected_stressed_margin)}</strong>
      </div>
    </div>
  );
}

function ScenarioRows({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="scenarioRows">
      {rows.map((row) => (
        <div key={String(row.scenario)}>
          <strong>{String(row.scenario)}</strong>
          <span>
            Failure <b>{percent(row.failure_probability)}</b>
          </span>
          <span>
            Priority <b>{number(row.priority_score, 3)}</b>
          </span>
          <span>
            Margin <b>{money(row.expected_stressed_margin)}</b>
          </span>
        </div>
      ))}
    </div>
  );
}

function InlineInsight({ result }: { result: InsightResult }) {
  const summary = result.simulated ?? result.summary ?? result.kpis;
  const figure = figureFor(result);
  const detail = scopeDetail(result);
  const actors =
    summary?.actors ??
    result.rows?.map((row) => ({
      actor: row.scenario,
      failure_probability: row.failure_probability
    })) ??
    [];

  return (
    <section className="inlineInsight">
      <figure className="inlineFigure">
        <img src={figure.src} alt={figure.title} />
        <figcaption>{figure.title}</figcaption>
      </figure>

      <div className="inlineInsightHead">
        <span>{scopeLabel(result)}</span>
        <strong>{detail}</strong>
        {result.title && result.title !== detail ? (
          <small>
            <BarChart3 size={13} />
            {result.title}
          </small>
        ) : null}
      </div>

      {summary ? <InsightKpis summary={summary} /> : null}

      {result.baseline && result.simulated ? (
        <div className="beforeAfter compactBeforeAfter">
          <div>
            <span>Baseline failure</span>
            <strong>{percent(result.baseline.mean_failure_probability)}</strong>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>Simulated failure</span>
            <strong>{percent(result.simulated.mean_failure_probability)}</strong>
          </div>
          <div className="deltaBox">
            <span>Margin change</span>
            <strong>{money(result.deltas?.mean_margin)}</strong>
          </div>
        </div>
      ) : null}

      {result.rows?.length ? <ScenarioRows rows={result.rows} /> : null}

      {actors.length ? (
        <div className="inlineSection">
          <strong>{result.rows ? "Scenario risk" : "Actor risk"}</strong>
          <ActorBars rows={actors} />
        </div>
      ) : null}

      {result.queue?.length ? (
        <div className="miniQueue">
          {result.queue.slice(0, 4).map((row) => (
            <div key={`${row.rank}-${row.actor}`}>
              <span>{String(row.rank)}</span>
              <strong>{String(row.actor)}</strong>
              <em>{String(row.priority_label)}</em>
              <b>{percent(row.failure_probability)}</b>
            </div>
          ))}
        </div>
      ) : null}

      {result.mutations?.length ? (
        <div className="mutationLine inlineMutation">
          <Sparkles size={16} />
          {result.mutations.map((item) => (
            <span key={String(item.feature)}>
              {String(item.feature)}: {String(item.operation)} {number(item.value)}
            </span>
          ))}
          {result.confidence ? <b>{result.confidence}</b> : null}
        </div>
      ) : null}

      {result.warnings?.length ? (
        <div className="insightWarnings inlineWarnings">
          <AlertTriangle size={17} />
          <div>
            {result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="inlineFooter">
        <span>
          <Database size={14} />
          {result.sources?.length ?? 0} sources
        </span>
        {result.region ? (
          <a
            href={
              result.dashboard_url ??
              `/?region=${encodeURIComponent(result.region)}&scenario=${result.scenario ?? "High"}`
            }
          >
            Full dashboard <ExternalLink size={13} />
          </a>
        ) : null}
      </footer>
    </section>
  );
}

export function InsightWorkspace() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" })
  });
  const busy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    void sendMessage({ text });
    setInput("");
  }

  return (
    <main className={`aiShell ${hasMessages ? "activeChat" : "emptyChat"}`}>
      <header className="aiTopbar">
        <a className="brandLink" href="/">
          <ShieldCheck size={22} />
          <span>
            Flood-Rice Resilience
            <small>AI insight workspace</small>
          </span>
        </a>
        <nav>
          <a href="/">Dashboard</a>
          <button
            type="button"
            title="Clear chat"
            onClick={() => {
              if (busy || !hasMessages) return;
              setMessages([]);
            }}
          >
            <RefreshCw size={17} />
          </button>
        </nav>
      </header>

      <section className="aiWorkspace">
        <div className="chatPane">
          {!hasMessages ? (
            <div className="chatStart">
              <div className="botMark">
                <Bot size={28} />
              </div>
              <h1>Flood-Rice Resilience</h1>
              <div className="regionChips">
                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setInput(`Show the High scenario insight for ${region}`)}
                  >
                    <MapPinned size={14} />
                    {region}
                  </button>
                ))}
              </div>
              <div className="promptGrid">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => setInput(suggestion)}>
                    <Sparkles size={16} />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((message) => {
                const toolOutputs = message.role === "assistant" ? outputsFromMessage(message) : [];
                return (
                  <article className={`message ${message.role}`} key={message.id}>
                    <div className="messageAvatar">
                      {message.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="messageBody">
                      <strong className="messageAuthor">
                        {message.role === "user" ? "You" : "Insight agent"}
                      </strong>
                      {toolOutputs.map((result, index) => (
                        <InlineInsight
                          key={`${message.id}-${result.kind ?? "tool"}-${index}`}
                          result={result}
                        />
                      ))}
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MarkdownText key={`${message.id}-text-${index}`}>{part.text}</MarkdownText>
                        ) : null
                      )}
                    </div>
                  </article>
                );
              })}
              {busy ? (
                <div className="agentWorking">
                  <LoaderCircle size={17} />
                  Running validated tools
                </div>
              ) : null}
              {error ? <div className="chatError">{error.message}</div> : null}
            </div>
          )}

          <form className="chatComposer" onSubmit={submit}>
            <textarea
              aria-label="Ask about flood-rice resilience"
              value={input}
              maxLength={1000}
              rows={3}
              placeholder="Ask a region question or describe a feature change..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" disabled={busy || !input.trim()} title="Send">
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
