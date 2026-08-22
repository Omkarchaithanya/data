import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  VscBell,
  VscChevronRight,
  VscChromeClose,
  VscCloudDownload,
  VscCopy,
  VscDashboard,
  VscDatabase,
  VscLayout,
  VscLock,
  VscMenu,
  VscPass,
  VscPlay,
  VscPulse,
  VscQuestion,
  VscRadioTower,
  VscRefresh,
  VscRepoForked,
  VscSearch,
  VscServer,
  VscServerProcess,
  VscSettingsGear,
  VscShield,
  VscTable,
  VscTools,
  VscWand,
  VscWarning
} from "react-icons/vsc";
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
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (healCooldown <= 0) return;
    const interval = window.setInterval(() => setHealCooldown((prev) => prev - 1), 1000);
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
        fetch(`${API_BASE}/export/trust-ledger`),
      ]);

      const loadedSources = (await sourceRes.json()) as Source[];
      const health = (await healthRes.json()) as Health;
      const ledger = (await ledgerRes.json()) as { trust_ledger: TrustLedgerClaim[] };

      setSources(loadedSources);
      setEvents(await eventRes.json());
      setDemoMode(health.demo_mode);
      setTrustLedger(ledger.trust_ledger);
      setError("");
    } catch {
      setError("Failed to connect to API. Check that the Zeal backend is running.");
    }
  }

  async function checkBudget() {
    try {
      const res = await fetch(`${API_BASE}/budget`);
      const data = await res.json();
      setBudget({ ...budget, global: res.ok ? data.balance : "Unavailable" });
    } catch {
      setBudget({ ...budget, global: "Unavailable" });
    }
  }

  async function call<T>(path: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${path}`, { method: "POST" });
      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          const json = JSON.parse(text);
          if (json.detail) detail = json.detail;
        } catch {
          // plain text
        }
        throw new Error(detail || "Request failed");
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

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selected),
    [selected, sources]
  );

  const realReady =
    demoMode || selectedSource?.id === "canary_vendor" || Boolean(selectedSource?.collector_id);

  const latestHealthScores = useMemo(() => {
    const scores: Record<string, number> = {};
    events.forEach((ev) => {
      if (ev.kind === "run" && ev.payload.health_score !== undefined && scores[ev.source_id] === undefined) {
        scores[ev.source_id] = ev.payload.health_score as number;
      }
    });
    return scores;
  }, [events]);

  const health = run?.health_score ?? 100;
  const riskLabel = health < 60 ? "Critical" : health < 90 ? "Watch" : "Healthy";

  const staleSources = useMemo(
    () =>
      sources.filter((source) => {
        const latestRun = events.find((e) => e.source_id === source.id && e.kind === "run");
        if (!latestRun) return false;
        const hoursSinceCheck =
          (Date.now() - new Date(latestRun.timestamp).getTime()) / (1000 * 60 * 60);
        return hoursSinceCheck > source.sla_hours;
      }),
    [sources, events]
  );

  const atRiskSources = sources.filter((source) => {
    const score = latestHealthScores[source.id];
    return score !== undefined && score < 100;
  });

  const healthyCount = sources.filter((s) => (latestHealthScores[s.id] ?? 100) >= 90).length;
  const warningCount = sources.filter((s) => {
    const score = latestHealthScores[s.id];
    return score !== undefined && score < 90;
  }).length;
  const avgHealth = Math.round(
    sources.reduce((acc, source) => acc + (latestHealthScores[source.id] ?? 100), 0) /
      (sources.length || 1)
  );

  const filteredSources = sources.filter((s) =>
    `${s.name} ${s.type}`.toLowerCase().includes(search.toLowerCase())
  );

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

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
    } catch {
      setError("Failed to export data.");
    }
  }

  const pageTitle =
    selected === "overview"
      ? "Monitoring Overview"
      : selected === "trust-ledger"
      ? "Trust Ledger"
      : selectedSource?.name ?? "Source Monitor";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand-mark" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/zeal_icon.png" alt="Zeal Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1>Zeal</h1>
            <p>Live evidence integrity</p>
          </div>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close">
            <VscChromeClose size={18} />
          </button>
        </div>

        <div className="mesh-summary">
          <div className="summary-top">
            <span><i className="status-dot live" /> {demoMode ? "Demo environment" : "Live environment"}</span>
            <VscPulse size={16} />
          </div>
          <strong>{sources.length}</strong>
          <span>sources monitored</span>
          <div className="summary-row">
            <span>{healthyCount} healthy</span>
            <span>{warningCount} attention</span>
          </div>
          <div className="progress-track"><span style={{ width: `${avgHealth}%` }} /></div>
          <div className="summary-footer">
            <span>Avg health</span>
            <strong>{avgHealth}%</strong>
          </div>
        </div>

        <div className="sidebar-search">
          <VscSearch size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter sources"
          />
        </div>

        <nav className="sidebar-nav">
          <button
            className={selected === "overview" ? "active" : ""}
            onClick={() => { setSelected("overview"); setMobileNavOpen(false); }}
          >
            <VscLayout size={17} />
            <span><strong>Overview</strong><small>Platform health</small></span>
          </button>

          <button
            className={selected === "trust-ledger" ? "active" : ""}
            onClick={() => { setSelected("trust-ledger"); setMobileNavOpen(false); }}
          >
            <VscShield size={17} />
            <span><strong>Trust Ledger</strong><small>Verified evidence</small></span>
          </button>

          <div className="nav-section-title">MONITORED SOURCES</div>

          {filteredSources.map((source) => {
            const latestRun = events.find((e) => e.source_id === source.id && e.kind === "run");
            const isStale = staleSources.some((s) => s.id === source.id);
            const score = latestHealthScores[source.id] ?? 100;

            return (
              <button
                className={source.id === selected ? "active" : ""}
                key={source.id}
                onClick={() => { setSelected(source.id); setMobileNavOpen(false); }}
              >
                <VscRadioTower size={17} />
                <span className="nav-source-copy">
                  <strong>{source.name}</strong>
                  <small>{source.type} · {source.expected_fields.length} fields</small>
                  <span className="nav-badges">
                    <span className={`status-chip ${source.collector_id || demoMode ? "success" : "neutral"}`}>
                      {demoMode ? "DEMO" : source.collector_id ? "LIVE" : "SETUP"}
                    </span>
                    {latestRun && (
                      <span className={`status-chip ${isStale ? "warning" : score < 90 ? "danger" : "success"}`}>
                        {isStale ? "STALE" : score < 90 ? "WATCH" : "FRESH"}
                      </span>
                    )}
                  </span>
                </span>
                <VscChevronRight size={15} className="nav-chevron" />
              </button>
            );
          })}
        </nav>

      </aside>

      {mobileNavOpen && <button className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Menu">
            <VscMenu size={20} />
          </button>
          <div className="breadcrumbs">
            <VscRepoForked size={17} />
            <span>Zeal Command Center</span>
            <span className="crumb-separator">/</span>
            <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-right">
            <div className="system-status"><i className="status-dot live" /> API ONLINE</div>
            <button className="icon-button" onClick={() => void refresh()} aria-label="Refresh">
              <VscRefresh size={17} className={loading ? "spin" : ""} />
            </button>
            <button className="icon-button" onClick={() => void handleExport()} aria-label="Export">
              <VscCloudDownload size={17} />
            </button>
          </div>
        </header>

        {error && <div className="alert error"><VscWarning size={17} />{error}</div>}

        {selected === "trust-ledger" ? (
          <TrustLedgerPage claims={trustLedger} onExport={() => void handleExport()} />
        ) : selected === "overview" ? (
          <OverviewPage
            sources={sources}
            events={events}
            avgHealth={avgHealth}
            healthyCount={healthyCount}
            warningCount={warningCount}
            staleSources={staleSources}
            atRiskSources={atRiskSources}
            recentEvents={recentEvents}
            latestHealthScores={latestHealthScores}
            onSelect={setSelected}
            onExport={() => void handleExport()}
          />
        ) : (
          <SourcePage
            source={selectedSource}
            run={run}
            heal={heal}
            health={health}
            riskLabel={riskLabel}
            realReady={realReady}
            demoMode={demoMode}
            forceRefresh={forceRefresh}
            setForceRefresh={setForceRefresh}
            loading={loading}
            healCooldown={healCooldown}
            onRun={async () => setRun(await call<RunResult>(`/sources/${selected}/run?mode=healthy`))}
            onDrift={async () =>
              setRun(
                await call<RunResult>(
                  `/sources/${selected}/detect-drift?mode=broken${forceRefresh ? "&max_retries=0" : ""}`
                )
              )
            }
            onHeal={async () => {
              setHealCooldown(60);
              setHeal(
                await call<HealResult>(
                  `/sources/${selected}/heal${forceRefresh ? "?max_retries=0" : ""}`
                )
              );
            }}
            onApprove={async () => {
              await call(`/sources/${selected}/approve-heal`);
              setHeal(null);
            }}
            onReject={async () => {
              await call(`/sources/${selected}/reject-heal`);
              setHeal(null);
            }}
          />
        )}
      </section>
    </main>
  );
}

function OverviewPage({
  sources,
  events,
  avgHealth,
  healthyCount,
  warningCount,
  staleSources,
  atRiskSources,
  recentEvents,
  latestHealthScores,
  onSelect,
  onExport,
}: {
  sources: Source[];
  events: EventItem[];
  avgHealth: number;
  healthyCount: number;
  warningCount: number;
  staleSources: Source[];
  atRiskSources: Source[];
  recentEvents: EventItem[];
  latestHealthScores: Record<string, number>;
  onSelect: (id: string) => void;
  onExport: () => void;
}) {
  const runCount = events.filter((e) => e.kind === "run").length;
  const driftCount = events.filter((e) => e.kind === "drift" || e.payload.drifted === true).length;
  const healCount = events.filter((e) => e.kind === "heal").length;

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">WEB DATA RELIABILITY</span>
          <h2>Monitoring Overview</h2>
          <p>One place to see source health, freshness, drift and self-healing activity.</p>
        </div>
        <div className="hero-actions">
          <span className="healthy-pill"><VscPass size={15} /> {avgHealth}% platform health</span>
          <button className="secondary-btn" onClick={onExport}><VscCloudDownload size={16} /> Export evidence</button>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard icon={<VscDatabase size={18} />} label="Sources monitored" value={sources.length} hint={`${healthyCount} healthy`} tone="blue" />
        <KpiCard icon={<VscPass size={18} />} label="Healthy sources" value={healthyCount} hint="Above 90 health" tone="green" />
        <KpiCard icon={<VscWarning size={18} />} label="Need attention" value={warningCount} hint={`${staleSources.length} stale`} tone="amber" />
        <KpiCard icon={<VscRepoForked size={18} />} label="Runs processed" value={runCount} hint={`${driftCount} drift events`} tone="violet" />
      </section>

      <section className="content-grid overview-grid">
        <article className="card source-health-card">
          <div className="card-head">
            <div><span className="eyebrow">SOURCE HEALTH</span><h3>Monitored sources</h3></div>
            <span className="muted">{sources.length} total</span>
          </div>
          <div className="source-table">
            {sources.map((source) => {
              const score = latestHealthScores[source.id] ?? 100;
              const isStale = staleSources.some((s) => s.id === source.id);
              return (
                <button key={source.id} className="source-row" onClick={() => onSelect(source.id)}>
                  <div className="source-name">
                    <span className={`source-status-dot ${score < 90 || isStale ? "warning" : "healthy"}`} />
                    <div><strong>{source.name}</strong><small>{source.type}</small></div>
                  </div>
                  <div className="source-meta">
                    <span>{isStale ? "Stale" : score < 90 ? "Watch" : "Healthy"}</span>
                    <div className="mini-progress"><i style={{ width: `${score}%` }} /></div>
                    <strong>{score}</strong>
                  </div>
                  <VscChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </article>

        <article className="card live-card">
          <div className="card-head">
            <div><span className="eyebrow">LIVE SIGNAL</span><h3>Platform health</h3></div>
            <span className="live-label"><i className="status-dot live" /> Live</span>
          </div>
          <div className="health-orbit">
            <div className="orbit-ring"><span>{avgHealth}</span><small>HEALTH</small></div>
          </div>
          <div className="trend-bars">
            {[42, 55, 48, 66, 61, 78, 74, 84, 82, 94, avgHealth].map((n, i) => (
              <i key={i} style={{ height: `${Math.max(12, n / 1.2)}%` }} />
            ))}
          </div>
          <div className="health-foot">
            <span><b>{staleSources.length}</b> stale sources</span>
            <span><b>{atRiskSources.length}</b> at risk</span>
            <span><b>{healCount}</b> heals</span>
          </div>
        </article>

        <article className="card alert-card">
          <div className="card-head">
            <div><span className="eyebrow">ATTENTION QUEUE</span><h3>Needs attention</h3></div>
            <span className="count-pill">{atRiskSources.length + staleSources.length}</span>
          </div>
          {atRiskSources.length === 0 && staleSources.length === 0 ? (
            <EmptyState text="No active source incidents." />
          ) : (
            <div className="incident-list">
              {atRiskSources.slice(0, 4).map((source) => (
                <button key={`risk-${source.id}`} onClick={() => onSelect(source.id)}>
                  <span className="incident-icon amber"><VscWarning size={15} /></span>
                  <span><strong>{source.name}</strong><small>Health score below baseline</small></span>
                  <VscChevronRight size={15} />
                </button>
              ))}
              {staleSources.slice(0, 4).map((source) => (
                <button key={`stale-${source.id}`} onClick={() => onSelect(source.id)}>
                  <span className="incident-icon blue"><VscRefresh size={15} /></span>
                  <span><strong>{source.name}</strong><small>SLA freshness threshold exceeded</small></span>
                  <VscChevronRight size={15} />
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card activity-card">
          <div className="card-head">
            <div><span className="eyebrow">ACTIVITY STREAM</span><h3>Recent events</h3></div>
            <span className="muted">{events.length} logged</span>
          </div>
          <div className="activity-list">
            {recentEvents.length === 0 ? (
              <EmptyState text="No monitoring events yet." />
            ) : (
              recentEvents.map((event) => (
                <div className="activity-item" key={event.id}>
                  <div className={`activity-icon ${event.kind}`}>
                    {event.kind === "heal" ? <VscWand size={14} /> : event.kind === "run" ? <VscPlay size={14} /> : <VscPulse size={14} />}
                  </div>
                  <div>
                    <strong>{event.source_id}</strong>
                    <small>{event.kind} · {new Date(event.timestamp).toLocaleTimeString()}</small>
                  </div>
                  <span className="event-state">logged</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function SourcePage({
  source,
  run,
  heal,
  health,
  riskLabel,
  realReady,
  demoMode,
  forceRefresh,
  setForceRefresh,
  loading,
  healCooldown,
  onRun,
  onDrift,
  onHeal,
  onApprove,
  onReject,
}: {
  source?: Source;
  run: RunResult | null;
  heal: HealResult | null;
  health: number;
  riskLabel: string;
  realReady: boolean;
  demoMode: boolean;
  forceRefresh: boolean;
  setForceRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  healCooldown: number;
  onRun: () => Promise<void>;
  onDrift: () => Promise<void>;
  onHeal: () => Promise<void>;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  if (!source) return <EmptyState text="Select a monitored source." />;

  return (
    <div className="page">
      <section className="page-hero source-hero">
        <div>
          <span className="eyebrow">SOURCE MONITOR</span>
          <div className="title-line"><h2>{source.name}</h2><span className="live-pill"><i className="status-dot live" /> {demoMode ? "Demo" : "Live"}</span></div>
          <a className="source-url" href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
          <div className="tag-row">
            <span><VscServer size={14} /> {source.expected_fields.length} watched fields</span>
            <span><VscServerProcess size={14} /> {demoMode ? "Demo mode" : "Real mode"}</span>
            <span><VscRadioTower size={14} /> Semantic drift scan</span>
          </div>
        </div>

        <div className={`health-score ${health < 60 ? "danger" : health < 90 ? "warning" : "good"}`}>
          <div className="score-ring"><span>{health}</span></div>
          <div><strong>{riskLabel}</strong><small>Last source check</small><b>{run ? new Date(run.timestamp).toLocaleTimeString() : "Not run yet"}</b></div>
        </div>
      </section>

      {!realReady && (
        <div className="alert warning">
          <VscWarning size={17} />
          This source needs a configured collector ID before a real run can start.
        </div>
      )}

      {heal?.next_step && (
        <div className="alert info">
          <VscWand size={17} />
          <span><strong>Next step:</strong> {heal.next_step}</span>
        </div>
      )}

      <section className="toolbar">
        <button className="primary-btn" onClick={onRun} disabled={loading || !realReady}><VscPlay size={16} /> Run healthy</button>
        <button className="warning-btn" onClick={onDrift} disabled={loading || !realReady}><VscWarning size={16} /> Simulate drift</button>
        <button className="violet-btn" onClick={onHeal} disabled={loading || !realReady || healCooldown > 0}><VscWand size={16} /> {healCooldown > 0 ? `Heal in ${healCooldown}s` : "Generate heal"}</button>
        <button className="success-btn" onClick={onApprove} disabled={loading || heal?.approval_status !== "ready"}><VscPass size={16} /> Approve</button>
        <button className="danger-btn" onClick={onReject} disabled={loading || heal?.approval_status !== "ready"}><VscChromeClose size={16} /> Reject</button>
        <label className="toggle-control"><input type="checkbox" checked={forceRefresh} onChange={(e) => setForceRefresh(e.target.checked)} /> Force refresh</label>
      </section>

      <section className="kpi-grid four">
        <KpiCard icon={<VscPass size={18} />} label="Validation" value={run ? (run.validation.valid ? "Passed" : "Blocked") : "Ready"} hint={run ? "Schema checked" : "Awaiting run"} tone={run?.validation.valid === false ? "red" : "green"} />
        <KpiCard icon={<VscDatabase size={18} />} label="Rows captured" value={run?.validation.row_count ?? "-"} hint={run ? "Latest extraction" : "No run yet"} tone="blue" />
        <KpiCard icon={<VscPulse size={18} />} label="Similarity" value={run ? `${Math.round(run.drift.similarity * 100)}%` : "-"} hint={run ? "Semantic match" : "Awaiting scan"} tone="violet" />
        <KpiCard icon={<VscLock size={18} />} label="Heal gate" value={heal?.approval_status ?? "Idle"} hint="Approval controls deployment" tone="amber" />
      </section>

      <section className="content-grid source-grid">
        <article className="card chart-card">
          <div className="card-head">
            <div><span className="eyebrow">VALIDATION</span><h3>Source quality</h3></div>
            <span className={`state-pill ${run?.validation.valid === false ? "danger" : "success"}`}>{run?.validation.valid === false ? "Blocked" : "Operational"}</span>
          </div>
          {run ? (
            <>
              <div className="quality-overview">
                <div className="quality-main"><strong>{Math.round((1 - run.validation.null_rate) * 100)}%</strong><small>field quality</small></div>
                <div className="quality-items">
                  <span><b>{run.validation.row_count}</b> rows</span>
                  <span><b>{Math.round(run.validation.null_rate * 100)}%</b> null rate</span>
                  <span><b>{run.validation.valid ? "Valid" : "Invalid"}</b> schema</span>
                </div>
              </div>
              <div className="chart-bars">
                {[58, 66, 64, 71, 76, 72, 82, 79, 88, 91, run.validation.valid ? 96 : 48].map((n, i) => (
                  <i key={i} style={{ height: `${n}%` }} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState text="Run the source to populate validation metrics." />
          )}
        </article>

        <article className="card chart-card">
          <div className="card-head">
            <div><span className="eyebrow">DRIFT DETECTION</span><h3>Change analysis</h3></div>
            <span className={`state-pill ${run?.drift.drifted ? "danger" : "success"}`}>{run?.drift.drifted ? "Drift detected" : "No drift"}</span>
          </div>
          {run?.drift.reasons?.length ? (
            <div className="drift-analysis">
              <div className="drift-score"><strong>{Math.round(run.drift.similarity * 100)}%</strong><small>semantic similarity</small></div>
              <div className="reason-list">{run.drift.reasons.map((reason) => <div key={reason}><VscWarning size={14} />{reason}</div>)}</div>
              {run.drift.changed_fields.length > 0 && (
                <div className="diff-tags">
                  {run.drift.changed_fields.map((f, i) => (
                    <span key={`${f.field}-${i}`}><b>{f.field}</b> {String(f.old)} → {String(f.new)}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="No drift reasons yet. Run a validation or drift simulation." />
          )}
        </article>

        <article className="card">
          <div className="card-head"><div><span className="eyebrow">SELF HEALING</span><h3>Heal preview</h3></div><VscWand size={18} /></div>
          {heal ? (
            <div className="heal-preview">
              <div className="heal-status">
                <span className={`state-pill ${heal.approval_status === "ready" ? "success" : "danger"}`}>{heal.approval_status}</span>
                <span>{heal.status}</span>
              </div>
              <pre>{JSON.stringify(heal.preview_result, null, 2)}</pre>
            </div>
          ) : <EmptyState text="Generate a heal after a failed or drifted run." />}
        </article>

        <article className="card">
          <div className="card-head">
            <div><span className="eyebrow">REPAIR PLAN</span><h3>Generated repair</h3></div>
            {heal ? (
              <button
                className="secondary-btn"
                style={{ padding: '4px 10px', fontSize: '11px', height: 'fit-content' }}
                onClick={(e) => {
                  navigator.clipboard.writeText(heal.prompt);
                  const target = e.currentTarget;
                  const originalHtml = target.innerHTML;
                  target.innerHTML = 'Copied!';
                  setTimeout(() => target.innerHTML = originalHtml, 2000);
                }}
              >
                <VscCopy size={14} /> Copy Prompt
              </button>
            ) : (
              <VscDashboard size={18} />
            )}
          </div>
          {heal ? (
            <pre className="repair-code">{heal.prompt}</pre>
          ) : (
            <div className="repair-placeholder">
              <div className="repair-icon"><VscTools size={22} /></div>
              <strong>AI repair strategy</strong>
              <p>The repair prompt will include broken fields, source URL and schema expectations.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function TrustLedgerPage({ claims, onExport }: { claims: TrustLedgerClaim[]; onExport: () => void }) {
  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <span className="eyebrow">DATA PROVENANCE</span>
          <h2>Trust Ledger</h2>
          <p>Verified claims preserved with source evidence and extraction metadata.</p>
        </div>
        <button className="secondary-btn" onClick={onExport}><VscCloudDownload size={16} /> Export raw evidence</button>
      </section>
      <section className="ledger-stats">
        <KpiCard icon={<VscShield size={18} />} label="Verified claims" value={claims.length} hint="Evidence-backed records" tone="green" />
        <KpiCard icon={<VscLock size={18} />} label="Avg confidence" value={claims.length ? `${Math.round(claims.reduce((a, c) => a + c.confidence_score, 0) / claims.length)}%` : "-"} hint="Across ledger" tone="blue" />
      </section>
      <section className="ledger-list">
        {claims.length === 0 ? (
          <article className="card empty-card"><EmptyState text="No verified claims found. Run a source first." /></article>
        ) : (
          claims.map((claim, idx) => (
            <article className="card ledger-card" key={`${claim.claim}-${idx}`}>
              <div className="ledger-main">
                <div className="ledger-icon"><VscShield size={20} /></div>
                <div>
                  <span className="eyebrow">VERIFIED CLAIM</span>
                  <h3>{claim.claim}</h3>
                  <p>{claim.source_url}</p>
                </div>
              </div>
              <div className="ledger-meta">
                <span><b>Status</b><em className="state-pill success">{claim.status}</em></span>
                <span><b>Confidence</b>{claim.confidence_score}/100</span>
                <span><b>Verified</b>{new Date(claim.verified_at).toLocaleString()}</span>
                <span><b>Extractor</b>{claim.extractor_version}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon, label, value, hint, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint: string;
  tone: "blue" | "green" | "amber" | "violet" | "red";
}) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><VscPulse size={18} /><span>{text}</span></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
