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
import "./cyberpunk.css";

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
  changed_fields: { field: string; old: any; new: any }[];
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

type TrustLedgerClaim = {
  claim: string;
  source_url: string;
  verified_at: string;
  extractor_version: string;
  confidence_score: number;
  status: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState("overview");
  const [run, setRun] = useState<RunResult | null>(null);
  const [heal, setHeal] = useState<HealResult | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [demoMode, setDemoMode] = useState(true);
  const [budget, setBudget] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [healCooldown, setHealCooldown] = useState(0);
  const [trustLedger, setTrustLedger] = useState<TrustLedgerClaim[]>([]);

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    let interval: number;
    if (healCooldown > 0) {
      interval = window.setInterval(() => {
        setHealCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [healCooldown]);

  useEffect(() => {
    setRun(null);
    setHeal(null);
  }, [selected]);

  async function refresh() {
    try {
      const [sourceRes, eventRes, healthRes, ledgerRes] = await Promise.all([
        fetch(`${API_BASE}/sources`),
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/export/trust-ledger`)
      ]);
      const loadedSources = (await sourceRes.json()) as Source[];
      const health = (await healthRes.json()) as Health;
      const ledger = (await ledgerRes.json()) as { trust_ledger: TrustLedgerClaim[] };
      
      setSources(loadedSources);
      setEvents(await eventRes.json());
      setDemoMode(health.demo_mode);
      setTrustLedger(ledger.trust_ledger);
    } catch (e) {
      setError("Failed to connect to API.");
    }
  }

  async function checkBudget() {
    try {
      const globalBudgetRes = await fetch(`${API_BASE}/budget`);
      const globalBudgetData = await globalBudgetRes.json();
      
      let newBudget = { ...budget };
      if (globalBudgetRes.ok) {
        newBudget['global'] = globalBudgetData.balance;
      } else {
        newBudget['global'] = "Budget unavailable — CLI error";
      }
      setBudget(newBudget);
    } catch (e) {
      setBudget({ ...budget, global: "Budget unavailable — CLI error" });
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
  const realReady = demoMode || selectedSource?.id === "canary_vendor" || Boolean(selectedSource?.collector_id);
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

  const staleSources = useMemo(() => {
    return sources.filter(s => {
      const sourceEvents = events.filter(e => e.source_id === s.id);
      const latestRun = sourceEvents.find(e => e.kind === "run");
      if (!latestRun) return false;
      const hoursSinceCheck = (Date.now() - new Date(latestRun.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSinceCheck > s.sla_hours;
    });
  }, [sources, events]);

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
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            Total Budget: {budget['global'] || <button onClick={checkBudget} style={{ padding: "2px 4px", fontSize: "10px", cursor: "pointer", background: "none", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "4px" }}>Check</button>}
          </div>
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
          
          <button
            className={selected === "trust-ledger" ? "active" : ""}
            onClick={() => { setSelected("trust-ledger"); setRun(null); setHeal(null); }}
          >
            <ShieldCheck size={16} />
            <span>
              <strong>Trust Ledger</strong>
              <small>Verified claims</small>
            </span>
          </button>
          
          {sources.map((source) => {
            const sourceEvents = events.filter(e => e.source_id === source.id);
            const latestRun = sourceEvents.find(e => e.kind === "run");
            const isStale = staleSources.some(s => s.id === source.id);

            return (
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
                    {latestRun && (
                      <span className={`badge ${isStale ? "setup" : "live"}`}>
                        {isStale ? "STALE" : "FRESH"}
                      </span>
                    )}
                  </div>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        {selected === "trust-ledger" ? (
          <div className="trust-ledger">
            <header className="hero">
              <div className="hero-copy">
                <p className="eyebrow">Data Provenance</p>
                <h2>Trust Ledger</h2>
                <p className="url">Independently verified claims ready for publication</p>
                <div style={{ marginTop: "1rem" }}>
                  <button onClick={handleExport} className="export-btn" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", color: "white", cursor: "pointer" }}>
                    Export Raw Evidence (JSON)
                  </button>
                </div>
              </div>
            </header>
            
            <section className="ledger-cards" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {trustLedger.length === 0 ? (
                <p className="muted">No verified claims found. Run a source first.</p>
              ) : (
                trustLedger.map((claim, idx) => (
                  <div key={idx} style={{ background: "rgba(8,12,22,0.8)", border: "1px solid rgba(132,171,255,0.18)", borderRadius: "8px", padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <strong style={{ fontSize: "1.1rem", color: "#f7fbff" }}>{claim.claim}</strong>
                      <span className={`badge ${claim.status === "grounded" ? "live" : claim.status === "at-risk" ? "demo" : "setup"}`}>
                        {claim.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "#8f9bad" }}>
                      <span><strong>Source:</strong> {claim.source_url}</span>
                      <span><strong>Verified:</strong> {new Date(claim.verified_at).toLocaleString()}</span>
                      <span><strong>Score:</strong> {claim.confidence_score}/100</span>
                      <span><strong>Extractor:</strong> {claim.extractor_version}</span>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        ) : selected === "overview" ? (
          <div className="overview">
            <header className="hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="hero-copy">
                <p className="eyebrow">Grounding intelligence console</p>
                <h2>Mesh Overview</h2>
                <p className="url">{sources.length} total sources monitored</p>
                <div style={{ marginTop: "1rem" }}>
                  <button onClick={handleExport} className="action-btn" style={{ padding: "0.5rem 1rem", background: "rgba(0, 240, 255, 0.1)", border: "1px solid var(--cp-cyan)", color: "var(--cp-cyan)", cursor: "pointer" }}>
                    Export RAG Evidence
                  </button>
                </div>
              </div>
              <div className="gauge-container">
                <div className="gauge-circle">
                  <h2>{Math.round(sources.reduce((acc, s) => acc + (latestHealthScores[s.id] ?? 100), 0) / (sources.length || 1))}</h2>
                </div>
              </div>
            </header>

            {atRiskSources.length > 0 && (
              <Panel className="at-risk-panel" title="At-Risk Citations" icon={<TriangleAlert size={18} />}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {atRiskSources.map(s => (
                    <li key={s.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "4px" }}>
                      <strong>{s.name}</strong>
                      <span style={{ color: "var(--cp-magenta)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Activity size={14} /> Score: {latestHealthScores[s.id]}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {staleSources.length > 0 && (
              <Panel className="stale-panel" title="Stale Citations (SLA Exceeded)" icon={<CheckCircle2 size={18} />}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {staleSources.map(s => {
                    const latestRun = events.find(e => e.source_id === s.id && e.kind === "run");
                    const hours = latestRun ? Math.round((Date.now() - new Date(latestRun.timestamp).getTime()) / 3600000) : 0;
                    return (
                      <li key={s.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "4px" }}>
                        <strong>{s.name}</strong>
                        <span style={{ color: "var(--cp-magenta)", display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircle2 size={14} /> {hours}h since check (SLA: {s.sla_hours}h)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
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
              <button className="primary run-healthy" onClick={async () => setRun(await call<RunResult>(`/sources/${selected}/run?mode=healthy`))} disabled={loading || !realReady}>
                <Play size={16} /> Run Healthy
              </button>
              <button className="primary run-drift" onClick={async () => setRun(await call<RunResult>(`/sources/${selected}/detect-drift?mode=broken${forceRefresh ? '&max_retries=0' : ''}`))} disabled={loading || !realReady}>
                <TriangleAlert size={16} /> Simulate Drift
              </button>
              <button className="primary heal-btn" onClick={async () => {
                setHealCooldown(60);
                setHeal(await call<HealResult>(`/sources/${selected}/heal${forceRefresh ? '?max_retries=0' : ''}`));
              }} disabled={loading || !realReady || healCooldown > 0}>
                <Sparkles size={16} /> {healCooldown > 0 ? `Next heal in ${healCooldown}s` : "Generate Heal"}
              </button>
              <button className="primary approve-btn" onClick={async () => { await call(`/sources/${selected}/approve-heal`); setHeal(null); }} disabled={loading || heal?.approval_status !== "ready"}>
                <CheckCircle2 size={16} /> Approve
              </button>
              <button className="primary reject-btn" onClick={async () => { await call(`/sources/${selected}/reject-heal`); setHeal(null); }} disabled={loading || heal?.approval_status !== "ready"}>
                <TriangleAlert size={16} /> Reject
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--cp-cyan)' }}>
                <input type="checkbox" checked={forceRefresh} onChange={e => setForceRefresh(e.target.checked)} />
                Force Refresh
              </label>
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
                          {run.drift.changed_fields.map((f, idx) => (
                            <span key={`${f.field}-${idx}`} className="diff-tag">
                              {f.field}: {String(f.old)} ➔ {String(f.new)}
                            </span>
                          ))}
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

function Panel({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <article className={`panel ${className}`}>
      <div className="panel-header">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="panel-content">{children}</div>
    </article>
  );
}

function Metric({ label, value, isError = false }: { label: string; value: React.ReactNode; isError?: boolean }) {
  return (
    <div className={`metric ${isError ? 'metric-error' : ''}`}>
      <span>{label}</span>
      <div className="metric-value">{value}</div>
      <div className="sparkline" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
