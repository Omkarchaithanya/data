import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  CheckCircle2,
  Cpu,
  DatabaseZap,
  Gauge,
  Play,
  Radar,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Waves,
  Wrench,
  Info
} from "lucide-react";
import "./styles.css";

type Source = {
  id: string;
  name: string;
  url: string;
  type: string;
  expected_fields: string[];
  weight: number;
  sla_hours: number;
  collector_id?: string | null;
};

type Validation = {
  valid: boolean;
  row_count: number;
  missing_fields: string[];
  null_fields: Record<string, number>;
  null_rate: number;
  errors: string[];
};

type Drift = {
  drifted: boolean;
  structural: boolean;
  semantic: boolean;
  changed_fields: string[];
  similarity: number;
  reasons: string[];
};

type RunResult = {
  source_id: string;
  timestamp: string;
  records: Record<string, unknown>[];
  validation: Validation;
  drift: Drift;
  health_score: number;
};

type HealResult = {
  source_id: string;
  timestamp: string;
  prompt: string;
  status: string;
  preview_result: Record<string, unknown>[];
  validation: Validation;
  approval_status: string;
  next_step?: string;
};

type Budget = {
  balance: string;
};

type EventItem = {
  id: number;
  source_id: string;
  kind: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

type Health = {
  status: string;
  demo_mode: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState("overview");
  const [run, setRun] = useState<RunResult | null>(null);
  const [heal, setHeal] = useState<HealResult | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [demoMode, setDemoMode] = useState(true);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const [sourceRes, eventRes, healthRes, budgetRes] = await Promise.all([
        fetch(`${API_BASE}/sources`),
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/budget`),
      ]);
      const loadedSources = (await sourceRes.json()) as Source[];
      const health = (await healthRes.json()) as Health;
      const budgetData = (await budgetRes.json()) as Budget;
      setSources(loadedSources);
      setEvents(await eventRes.json());
      setDemoMode(health.demo_mode);
      setBudget(budgetData.balance);
    } catch (e) {
      setError("Failed to connect to API.");
    }
  }

  async function call<T>(path: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${path}`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? (await response.text()));
      }
      const data = (await response.json()) as T;
      await refresh();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const selectedSource = useMemo(() => sources.find((source) => source.id === selected), [selected, sources]);
  const realReady = demoMode || Boolean(selectedSource?.collector_id);
  const health = run?.health_score ?? 100;
  const riskLabel = health < 60 ? "Critical drift" : health < 90 ? "Watch closely" : "Grounded";
  const activeEvents = selected === "overview" ? events : events.filter((event) => event.source_id === selected);

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EventItem[]> = {};
    activeEvents.forEach(ev => {
      const day = new Date(ev.timestamp).toLocaleDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(ev);
    });
    return groups;
  }, [activeEvents]);

  const latestHealthScores = useMemo(() => {
    const scores: Record<string, number> = {};
    events.forEach(ev => {
      if (ev.kind === "run" && ev.payload.health_score !== undefined) {
        if (scores[ev.source_id] === undefined) {
          scores[ev.source_id] = ev.payload.health_score as number;
        }
      }
    });
    return scores;
  }, [events]);

  const atRiskSources = sources.filter(s => {
    const score = latestHealthScores[s.id];
    return score !== undefined && score < 100;
  });

  async function handleExport() {
    try {
      const res = await fetch(`${API_BASE}/export`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rag_evidence_export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Failed to export data.");
    }
  }

  return (
    <main>
      <aside>
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h1>GroundTruth Guard</h1>
            <p>Live evidence integrity</p>
          </div>
        </div>

        <div className="pulse-card">
          <span>{demoMode ? "Demo Mesh" : "Live Mesh"}</span>
          <strong>{sources.filter((source) => demoMode || source.collector_id).length || 0} sources ready</strong>
          {budget && <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>Budget: {budget}</div>}
          <div className="pulse-line" />
        </div>

        <nav>
          <button
            className={selected === "overview" ? "active" : ""}
            onClick={() => { setSelected("overview"); setRun(null); setHeal(null); }}
          >
            <Activity size={16} />
            <span>
              <strong>Mesh Overview</strong>
              <small>Aggregate health</small>
            </span>
          </button>
          
          {sources.map((source) => (
            <button
              className={source.id === selected ? "active" : ""}
              key={source.id}
              onClick={() => { setSelected(source.id); setRun(null); setHeal(null); }}
            >
              <Radar size={16} />
              <span>
                <strong>{source.name}</strong>
                <small>
                  {source.type} · {source.expected_fields.length} fields
                </small>
                <div className="badge-row">
                  {demoMode ? <span className="badge demo">DEMO</span> : source.collector_id ? <span className="badge live">LIVE</span> : <span className="badge setup">SETUP</span>}
                </div>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        {selected === "overview" ? (
          <div className="overview">
            <header className="hero">
              <div className="hero-copy">
                <p className="eyebrow">Grounding intelligence console</p>
                <h2>Mesh Overview</h2>
                <p className="url">{sources.length} total sources monitored</p>
                <div style={{ marginTop: "1rem" }}>
                  <button onClick={handleExport} className="export-btn" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", color: "white", cursor: "pointer" }}>
                    Export RAG Evidence
                  </button>
                </div>
              </div>
            </header>

            {atRiskSources.length > 0 && (
              <section className="at-risk-section" style={{ margin: "2rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px" }}>
                <h3 style={{ color: "rgb(252, 165, 165)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TriangleAlert size={18} /> At-Risk Citations
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {atRiskSources.map(s => (
                    <li key={s.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "4px" }}>
                      <strong>{s.name}</strong>
                      <span style={{ color: "rgb(252, 165, 165)" }}>Score: {latestHealthScores[s.id]}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="events">
              <div className="section-heading">
                <h3>System Timeline</h3>
                <span>{events.length} events logged</span>
              </div>
              {events.length === 0 ? (
                <p className="muted">No events logged yet.</p>
              ) : (
                Object.entries(groupedEvents).map(([day, dayEvents]) => (
                  <div key={day} className="timeline-group">
                    <h4 className="timeline-date">{day}</h4>
                    <div className="timeline">
                      {dayEvents.map((event) => {
                        const Icon = event.kind === "run" ? Play : event.kind === "heal" ? Sparkles : CheckCircle2;
                        return (
                          <div className="event" key={event.id}>
                            <div className={`event-icon ${event.kind}`}><Icon size={14} /></div>
                            <div className="event-content">
                              <strong>{event.source_id}</strong>
                              <span>{event.kind}</span>
                              <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        ) : (
          <>
            <header className="hero">
              <div className="hero-copy">
                <p className="eyebrow">Grounding intelligence console</p>
                <h2>{selectedSource?.name ?? "Source Monitor"}</h2>
                <p className="url">{selectedSource?.url}</p>
                <div className="signal-row">
                  <span><DatabaseZap size={14} /> {selectedSource?.expected_fields.length ?? 0} watched fields</span>
                  <span><Cpu size={14} /> {demoMode ? "demo mode" : "real mode"}</span>
                  <span><Waves size={14} /> semantic drift scan</span>
                </div>
              </div>
              <div
                className={`score ${health < 60 ? "danger" : health < 90 ? "warn" : ""}`}
                style={{ "--score": health } as React.CSSProperties}
              >
                <div className="score-orbit">
                  <span>{health}</span>
                </div>
                <div className="score-meta">
                  <small>{riskLabel}</small>
                  {run && (
                    <div className="score-timestamp" style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase" }}>Last check</span>
                      <span>{new Date(run.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {!realReady && (
              <div className="notice">
                This source needs a Bright Data collector ID before real runs can start. Select a configured source or add the matching collector ID in .env.
              </div>
            )}

            {error && <div className="notice danger-notice">{error}</div>}

            <div className="actions">
              <button onClick={async () => setRun(await call<RunResult>(`/sources/${selected}/run?mode=healthy`))} disabled={loading || !realReady}>
                <Play size={16} /> Run Healthy
              </button>
              <button onClick={async () => setRun(await call<RunResult>(`/sources/${selected}/detect-drift?mode=broken`))} disabled={loading || !realReady}>
                <TriangleAlert size={16} /> Simulate Drift
              </button>
              <button onClick={async () => setHeal(await call<HealResult>(`/sources/${selected}/heal`))} disabled={loading || !realReady}>
                <Sparkles size={16} /> Generate Heal
              </button>
              <button onClick={async () => { await call(`/sources/${selected}/approve-heal`); setHeal(null); }} disabled={loading || heal?.approval_status !== "ready"}>
                <CheckCircle2 size={16} /> Approve
              </button>
              <button onClick={async () => { await call(`/sources/${selected}/reject-heal`); setHeal(null); }} disabled={loading || heal?.approval_status !== "ready"} style={{ background: "rgba(239, 68, 68, 0.1)", color: "rgb(252, 165, 165)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                Reject
              </button>
            </div>

            {heal?.next_step && (
              <div className="notice" style={{ background: "rgba(59, 130, 246, 0.1)", color: "rgb(147, 197, 253)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                <strong>Next Step:</strong> {heal.next_step}
              </div>
            )}

            <section className="status-strip">
              <Metric label="Validation" value={run ? (run.validation.valid ? "Passed" : "Blocked") : "Ready"} />
              <Metric label="Rows captured" value={run?.validation.row_count ?? "-"} />
              <Metric label="Similarity" value={run ? `${Math.round(run.drift.similarity * 100)}%` : "-"} />
              <Metric 
                label="Heal gate" 
                value={
                  <span className="heal-gate" title="Heal gate blocks deployment of broken structures. Approval promotes the preview code to production.">
                    {heal?.approval_status ?? "Idle"} <Info size={12} className="info-icon" />
                  </span>
                } 
              />
            </section>

            <section className="grid">
              <Panel title="Validation" icon={<Activity size={18} />}>
                {run ? (
                  <div className="metric-list">
                    <Metric label="Rows" value={run.validation.row_count} />
                    <Metric label="Null rate" value={`${Math.round(run.validation.null_rate * 100)}%`} />
                    <Metric label="Schema" value={run.validation.valid ? "Valid" : "Invalid"} />
                    <Metric label="Drift" value={run.drift.drifted ? "Detected" : "Clear"} />
                  </div>
                ) : (
                  <p className="muted">Run a source to populate validation and health metrics.</p>
                )}
              </Panel>

              <Panel title="Drift Reasons" icon={<TriangleAlert size={18} />}>
                {run?.drift.reasons?.length ? (
                  <div className="drift-view">
                    <ul className="feed">
                      {run.drift.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    {run.drift.changed_fields?.length > 0 && (
                      <div className="diff-fields">
                        <strong>Changed Fields:</strong>
                        <div className="diff-tags">
                          {run.drift.changed_fields.map(f => <span key={f} className="diff-tag">{f}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="muted">No drift reasons yet.</p>
                )}
              </Panel>

              <Panel title="Heal Preview" icon={<Sparkles size={18} />}>
                {heal ? (
                  <>
                    <p className={`badge ${heal.approval_status === "ready" ? "ok" : "bad"}`}>{heal.approval_status}</p>
                    <pre>{JSON.stringify(heal.preview_result, null, 2)}</pre>
                  </>
                ) : (
                  <p className="muted">Generate a heal after a failed or drifted run.</p>
                )}
              </Panel>

              <Panel title="Repair Prompt" icon={<Gauge size={18} />}>
                {heal ? (
                  <div className="repair-prompt-container">
                    <pre className="repair-prompt">{heal.prompt}</pre>
                  </div>
                ) : (
                  <p className="muted">The prompt will include broken fields, URL, and schema expectations.</p>
                )}
              </Panel>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="panel">
      <div className="panel-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
