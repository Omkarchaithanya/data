# GroundTruth Guard — Winning Solution for the Bright Data "Scrape-Verse" Hackathon

**Hackathon:** Into the Scrape-Verse · WeMakeDevs × Bright Data · Aug 17–23, 2026
**Theme:** Build self-healing web scrapers. Scrape anything. Break nothing.
**Author role:** AI/Agentic Systems Engineer (analyst + architect + builder)
**Status:** Submission-ready concept + execution plan

---

## 1. The one-paragraph pitch

> Enterprise AI copilots and RAG systems are only as trustworthy as the public web sources they cite — docs, pricing pages, changelogs, model cards, status pages, security advisories, and policy pages. Those sources drift silently: a class is renamed, a price changes, a model is deprecated, a policy is quietly edited, a page disappears. When that happens, the AI's answers become stale or unsupported and **nobody notices** — because the scraper that fed the knowledge base broke quietly and returned empty arrays. **GroundTruth Guard** is a self-healing "source trust engine": it continuously collects those sources with Bright Data Scraper Studio, detects structural **and** semantic drift, auto-triggers Scraper Studio's one-click Self-Healing from a plain-language repair prompt, validates the healed output before promoting it, and publishes a citation-level **Grounding Health Index** — telling you exactly which AI-cited facts are still backed by live, unchanged evidence vs. drifted, edited, or dead.

---

## 2. The real-world problem (why this matters now)

This is not a manufactured problem. It is the single biggest reliability gap in enterprise AI today, and it is exactly the gap Bright Data itself says it is racing to close.

- **Scrapers break quietly.** When a website changes its layout, scrapers "instead of throwing an error when a page structure changes, return empty arrays… return partial data that looks almost right" — silently corrupting downstream AI ([Binary Bits](https://binarybits.co/blog/why-web-scraper-keeps-breaking)). Managing that change is a known hard problem: "HTML layout changes, website structure changes, pagination shifts, JSON fields move, a div gets renamed, a class disappears" ([PromptCloud](https://www.promptcloud.com/blog/managing-change-in-web-scraping-10-challenges/)).
- **The academic frontier agrees it's unsolved.** VLDB 2025 research frames the core tradeoff: "rule-based wrappers are brittle and vulnerable to drift, while end-to-end LLM extraction is accurate but costly" — and proposes LLMs as a **control plane** that repairs wrappers on failure ([VLDB 2025 PhD Workshop](https://www.vldb.org/2025/Workshops/VLDB-Workshops-2025/PhD/PhD25_4.pdf)). The 2026 state of the art explicitly names "self-healing scrapers with LLM repair loops" as the architecture pattern that "finally answers the eternal pain of selector rot" ([Data Research Tools](https://dataresearchtools.com/self-healing-scraper-llm-repair/), [Nimble Way on DOM drift](https://www.nimbleway.com/blog/handling-dom-drift-in-large-scale-scrapers-with-ai-native-parsers)).
- **Bright Data says this is the future of the company.** CEO Or Lenchner announced Bright Data crossed **$300M ARR (50% YoY)** targeting **$400M by 2026**, and explicitly stated "real-time, high-quality web data has become the backbone of AI innovation" and that the industry is converging on "the quality and timeliness of the data used to train and ground AI models" — keeping "AI systems in sync with the ever-changing web" ([CTech / Calcalist](https://www.calcalistech.com/ctechnews/article/sjeyg2ezwe)). Bright Data's own use-case page lists **"AI Grounding"** — "ground LLMs in live information, reduce hallucinations, and continuously hydrate RAG pipelines" ([Bright Data Use Cases](https://brightdata.com/use-cases)).
- **Bright Data's real customers already feel this pain.** Public case studies include AI-agent companies (**Raylu**, building AI agents for private-market investors, where "web data is crucial"), Amazon-brand specialists (**Remazing**), market-space intelligence (**Kingston Brass**), and structured-data providers (**Clootrack**) ([Bright Data Customer Stories](https://brightdata.com/customer-stories)). Notably, Bitget's crawler engineer recommends Bright Data "especially in the finance industry" — exactly the kind of customer that cannot afford silent drift in pricing/regulatory data.

**The corporate pain, in one line:** *Every team deploying AI is flying blind on whether the web evidence behind their AI's answers is still alive and still says what it used to.*

---

## 3. Why this is the winning fit (not just a good idea)

The hackathon's stated scoring model is the key. There are **six equally-weighted criteria, and the demo is scored as hard as the code**. GroundTruth Guard is engineered to max every one of them simultaneously — which most entries won't, because they'll build "a scraper + a dashboard."

| # | Criterion | What most teams do | What GroundTruth Guard does | Score |
|---|---|---|---|---|
| 01 | **Potential impact** | Track prices / docs | Solves the $Bn "AI grounding trust" gap that every enterprise AI team is failing at right now | ★★★★★ |
| 02 | **Creativity & innovation** | A scraper that collects data | A **meta-layer**: doesn't scrape *for* data, it scrapes to **monitor the health of the data feeding AI** — citation-level source trust. Novel category. | ★★★★★ |
| 03 | **Technical excellence** | One scraper, one script | Multi-source registry, schema validation, structural + semantic drift engine, guarded self-heal loop, structured API + dashboard, tests | ★★★★★ |
| 04 | **Use of Scraper Studio** | Scraper Studio used once | **Scraper Studio is the heart**: every collector built via `bdata scraper create`, driven from the coding agent, healed via `bdata scraper heal`, structured JSON powers the product | ★★★★★ |
| 05 | **Reliability & self-healing** | "It has a try/except" | Self-healing is the **entire product**, with validation guardrails before promotion + a deterministic "site changed under it" demo | ★★★★★ |
| 06 | **Presentation** | A README + Loom | A live dashboard showing a real site break → auto repair prompt → healed output → health score 42→96, with a clear problem→workflow→output→product story | ★★★★★ |

### Why it beats the obvious alternatives

- **vs. "AI Vendor Risk Radar"** — vendor risk is just *one demo pack inside GroundTruth*. GroundTruth is the bigger category (source trust for *any* RAG/AI system), so it subsumes and outranks it.
- **vs. "GEO / AI-search visibility monitor"** — trending, but directly collecting ChatGPT/Claude/Gemini *answers* risks the "no login-protected data" rule. GroundTruth only scrapes **public source pages** the AI cites — fully compliant.
- **vs. "supply-chain/tariff radar"** — high impact but hard to demo convincingly in one week with reliable public data.
- **vs. the listed "scraper health monitor"** — that's a *subset* of GroundTruth (collector uptime). Our differentiation is **citation-level AI grounding health**, not just "did the scraper run."

---

## 4. The categories NOT in the hackathon link (the gap you exploit)

The page lists six project ideas: price/inventory intelligence, docs-to-RAG, competitive intelligence, market research, developer trend tracker, scraper health monitor. GroundTruth Guard opens a **seventh, non-existent category** they didn't name:

> **AI Grounding & Source-Trust Intelligence** — continuously verifying that the public web evidence behind an AI system's answers is still live, unchanged, and structurally intact, with self-healing when it isn't.

This is the category Bright Data is betting its next $100M of ARR on ("AI Grounding," "fresh data," "keep AI in sync with the ever-changing web"). No other participant is likely to frame the problem this high — which is precisely why it wins.

---

## 5. Solution architecture

```
                         ┌─────────────────────────────────────────────┐
   sources.yml ───────►  │  1. SOURCE REGISTRY                          │
   (URL, fields, SLA,    │     type: pricing | changelog | docs |      │
    owner, weight)       │     status | policy | security advisory     │
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
   coding agent ──►      │  2. SCRAPER STUDIO COLLECTORS                 │
   bdata scraper create  │     bdata scraper create <url> "<fields>"    │
                         │     → Collector ID (c_*) stored in registry  │
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
   bdata scraper run ──► │  3. AGENT RUNNER (Collection API /dca/*)     │
   (CLI or API, on sched)│     raw snapshots → normalized records       │
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
                         │  4. VALIDATION LAYER (Pydantic / JSON-Schema)│
                         │     required-field null-rate, row-count      │
                         │     anomalies, "field disappeared" detection │
                         └───────────────────┬─────────────────────────┘
                                             │ fail?
                         ┌───────────────────▼─────────────────────────┐
                         │  5. DRIFT ENGINE                              │
                         │   • structural: schema/field failure         │
                         │   • semantic: content hash / text diff /    │
                         │     embedding similarity / entity triples    │
                         │   • business: price changed, model deprecated,│
                         │     terms changed, outage status changed     │
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
   bdata scraper heal ──► │  6. GUARDED SELF-HEAL LOOP                    │
   "<repair prompt>"      │   generate repair prompt → heal → preview →  │
   --url <url>            │   VALIDATE → approve only if schema passes   │
   bdata scraper approve  │   (human-approved self-healing w/ auto-check)│
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
                         │  7. GROUNDING HEALTH INDEX                   │
                         │   reachability · completeness · schema valid │
                         │   · recency · semantic stability · last heal │
                         │   · business criticality  → 0–100 per source │
                         └───────────────────┬─────────────────────────┘
                                             │
                         ┌───────────────────▼─────────────────────────┐
                         │  8. PRODUCT: Dashboard + REST API            │
                         │   at-risk citations, changed claims, healed │
                         │   collectors, RAG-ready evidence export      │
                         └─────────────────────────────────────────────┘
```

### Exact Scraper Studio commands (verified from Bright Data docs)

These are the real, documented commands — not invented. The coding agent runs them via `npx -p @brightdata/cli` so nothing is installed globally ([Build with the CLI](https://docs.brightdata.com/datasets/scraper-studio/build-with-the-cli), [Coding-agent prompts](https://docs.brightdata.com/datasets/scraper-studio/coding-agent-prompts), [GitHub brightdata/cli](https://github.com/brightdata/cli)):

```bash
# 1. Authenticate (browser callback; or set BRIGHTDATA_API_KEY for headless/CI)
bdata login

# 2. Build a scraper from plain language → returns Collector ID c_*
bdata scraper create https://openai.com/api/pricing \
  "Extract model names, input price per 1M tokens, output price per 1M tokens, and effective date"

# 3. Run the collector on a URL
bdata scraper run c_xxxxxxxxxxxxxxxx https://openai.com/api/pricing --pretty

# 4. SELF-HEAL when a field goes null after a site change
bdata scraper heal c_xxxxxxxxxxxxxxxx \
  "The model_name and input_price fields return null since the pricing table was redesigned. Re-capture them from the new table markup, preserving the output schema." \
  --url https://openai.com/api/pricing

# 5. Approve the proposed fix (validation gate runs BEFORE this)
bdata scraper approve c_xxxxxxxxxxxxxxxx --url https://openai.com/api/pricing

# 6. Re-run the healed collector and confirm fields return non-null
bdata scraper run c_xxxxxxxxxxxxxxxx https://openai.com/api/pricing --pretty
```

Supporting Bright Data capabilities you can also use:
- `brightdata scrape <url>` — clean markdown/HTML/JSON/screenshot, anti-bot + JS rendering handled ([CLI overview](https://docs.brightdata.com/cli/overview)).
- `brightdata search "query"` — Google/Bing/Yandex structured results (organic, ads, PAA).
- `brightdata discover "topic" --intent "..."` — AI-powered discovery.
- **Bright Data MCP server** (`bdata add mcp` / remote MCP, 60+ tools) — give the coding agent web search, scraping, and structured extraction directly ([MCP overview](https://docs.brightdata.com/ai/mcp-server/overview), [GitHub brightdata-mcp](https://github.com/brightdata/brightdata-mcp)).
- **Collection API** (`/dca/*`) to run published collectors programmatically; **AI Flow API** to create/self-heal collectors ([Quickstart](https://docs.brightdata.com/datasets/scraper-studio/quickstart)).

> **Important accuracy note on self-heal automation:** the docs confirm `bdata scraper heal` produces a **preview** that must be **approved**. So GroundTruth does **not** blindly auto-promote. It runs the heal, parses the `preview_result`, runs its own schema/validators against it, and only then calls `bdata scraper approve`. If approval is a manual step in the UI, we frame it honestly as **"human-approved self-healing with automated validation guardrails"** — which is a *stronger* story than fully-autonomous healing, because it shows trust/safety thinking (a real enterprise requirement).

---

## 6. The killer demo (the part that wins presentation + reliability)

Judges explicitly score "what it did when the site changed under it." Hoping a real site breaks during your demo is a coin-flip. So we run a **two-layer demo**:

### Layer A — Real public sources (proves it works in the wild)
Collect from AI-vendor public pages: OpenAI / Anthropic / Google AI / Hugging Face / LangChain **pricing, changelogs, model docs, status pages, policy pages**. Show real structured JSON powering the dashboard with live Grounding Health scores.

### Layer B — Controlled "canary" site (proves the self-heal, deterministically)
Host a tiny public page (e.g., a GitHub Pages site) mimicking a vendor pricing/docs page.

1. **First run** → collector works, health = 100.
2. **You push a layout change** (rename classes, move the price table, reorder fields) live.
3. **Collector breaks / returns nulls** → GroundTruth detects structural + semantic drift → health drops to ~42.
4. **Auto-generated repair prompt** is shown on screen (the LLM-written plain-language fix).
5. **`bdata scraper heal` runs** → preview returns all fields non-null.
6. **Validation gate passes** → `bdata scraper approve` → collector re-run.
7. **Health recovers 42 → 96**, the citation is marked "Restored," and a diff of what changed in the underlying source is shown.

This gives judges a **deterministic, replayable "site changed under it → it healed itself" moment** — exactly the hackathon's thesis ("The page shifts → The scraper notices → The logic repairs → The data keeps flowing").

---

## 7. Repository structure (the "stranger could pick it up on Monday" criterion)

The "Spider-Sense / Best Clean Code" track rewards a repo a stranger could pick up on Monday. So:

```text
groundtruth-guard/
  README.md                 # what it is, quickstart, architecture
  DEMO.md                   # the 5-minute demo script + canary-site steps
  architecture.md           # the diagram above
  sources.yml               # source registry (URL, type, fields, SLA, weight)
  collector_registry.json   # Collector IDs + repair prompts
  .env.example               # BRIGHTDATA_API_KEY, BRIGHT_DATA_API_TOKEN, COLLECTOR IDs

  collectors/
    prompts/                 # plain-language field specs per source
      openai_pricing.md
      anthropic_changelog.md
      canary_vendor.md
    examples/
      initial_output.json
      healed_output.json

  src/
    runner/
      brightdata_client.py   # wraps bdata CLI + /dca/* Collection API
      run_collectors.py       # scheduled collection
    validation/
      schemas.py              # Pydantic models per source type
      validators.py           # null-rate, row-count, field-disappeared
    drift/
      structural_drift.py
      semantic_drift.py       # hash/diff/embedding similarity
      scoring.py              # Grounding Health Index 0–100
    healing/
      prompt_builder.py       # LLM-built repair prompts from drift facts
      heal_workflow.py        # heal → validate → approve guardrail
    api/
      main.py                 # FastAPI: /health, /sources, /citations, /events
    ui/
      app.py                  # dashboard (health index, drift feed, heal replays)

  data/
    snapshots/                # raw per-run JSON
    normalized/               # cleaned records
    demo.db                    # SQLite event log

  tests/
    test_schema_validation.py
    test_drift_detection.py
    test_health_score.py
    test_heal_prompt_builder.py

  canary-site/               # the tiny public site you deliberately break
    index.html               # v1 (works) → git branch v2 (broken layout)
```

---

## 8. Week-long execution roadmap (Aug 17–23)

| Day | Milestone | Deliverable |
|---|---|---|
| **Mon 17** | Setup + first collector | Bright Data account + promo `wemakedevs` ($50 credits + 5,000/mo free tier). Build 1 real collector via `bdata scraper create`. Push canary site v1. |
| **Tue 18** | Multi-source registry | `sources.yml` + 6–8 collectors across pricing/changelog/docs/status/policy. `brightdata_client.py` wraps CLI + Collection API. |
| **Wed 19** | Validation + drift engine | Pydantic schemas, null-rate/row-count/field-disappeared checks, structural + semantic drift, Grounding Health Index scoring. |
| **Thu 20** | Guarded self-heal loop | `prompt_builder.py` + `heal_workflow.py`. Wire `bdata scraper heal` → preview parse → validate → `approve`. Break canary site → prove recovery. |
| **Fri 21** | Dashboard + API | FastAPI endpoints + dashboard: health index, at-risk citations, changed-claims diff, heal-replay timeline, RAG-ready evidence export. |
| **Sat 22** | Demo polish + repo | Record the Loom demo (problem → workflow → structured output → product, incl. the live break/heal). Clean repo, README, DEMO.md, tests green. |
| **Sun 23** | Submit | Repo + demo video + project description + "how Scraper Studio was used" write-up. (Submission form opens on the page before the deadline.) |

---

## 9. Differentiators / novelty (what makes it unforgettable)

1. **Citation-level trust, not page monitoring.** It tells you *which AI-cited facts* are still safe, stale, changed, or unsupported — not just "did the scraper run."
2. **Self-healing with guardrails.** It never blindly promotes a repair; it validates the healed preview against schema + business rules before approving. This is the VLDB-2025 "LLM as control plane" pattern, built for real.
3. **Replayable failure demo.** Judges watch a real layout break, a failed extraction, an auto-written repair prompt, healed output, and a health score recovering 42→96 — deterministic, every time.
4. **Bright Data-native end-to-end.** Collector built in Scraper Studio → driven from the coding agent via CLI → Self-Healing is central → structured JSON powers the dashboard + API. This is literally the "Best Use of Bright Data" rubric word-for-word.
5. **Strategic alignment with the sponsor's future.** GroundTruth is a working prototype of Bright Data's stated $400M-ARR thesis ("AI Grounding," "fresh data," "keep AI in sync with the ever-changing web"). Sponsors love a submission that proves their own roadmap.
6. **Futuristic but feasible in a week.** Uses knowledge-graph-style entity/fact triples + embedding similarity for semantic drift (2026 "knowledge graphs as agent memory" trend, [Beam.ai](https://beam.ai/agentic-insights/5-ways-knowledge-graphs-are-quietly-reshaping-ai-workflows-in-2026)) — but scoped so it ships.

---

## 10. How it plays to your strengths (Skanda)

You're an engineer at Oracle moving into AI/ML, with strengths in **agentic AI, reinforcement learning, and system/agent architecture**. GroundTruth lets you flex all of it without scope-creep:

- **Agentic architecture:** the coding agent orchestrates the full heal loop (detect → reason about drift → write a repair prompt → invoke `bdata scraper heal` → validate → approve). You can wire the Bright Data MCP server into the agent for live web reasoning.
- **RL / self-improvement angle (optional, high-novelty):** frame the heal-loop as a lightweight **RL-style policy** — the agent learns which repair-prompt phrasings succeed (schema passes) vs. fail, and keeps a small reward signal (health-delta after heal). This is a genuine, defensible "RL for self-healing scrapers" novelty that almost no other team will have — and it's optional, so it won't block shipping if time runs out.
- **Knowledge representation:** entity/fact triples + embedding similarity for semantic drift — your wheelhouse.
- **Clean systems engineering:** the validated repo, tests, and FastAPI dashboard play directly to the "Best Clean Code" and "Presentation" tracks.

---

## 11. Submission checklist (from the rules)

Per the hackathon page, every submission requires and is auto-considered for all three judged tracks (Web-Slinger grand prize / Suit-Up best UI / Spider-Sense best clean code) plus "Best Use of Bright Data":

- [ ] Repository (clean, README + DEMO.md + architecture.md + tests)
- [ ] Demo video (Loom) — clearly explains problem → scraper workflow → structured output → final product, including the live break/heal
- [ ] Project description
- [ ] Write-up of how Scraper Studio was used (central, not incidental)
- [ ] All data is **publicly available** — no private/login-protected/paywalled/restricted sources (we only scrape public vendor pages + our own canary site)
- [ ] You can explain and verify every technical decision (AI tools allowed; you must understand the code)

**Credits to use:** promo code `wemakedevs` for $50 Bright Data credits + Scraper Studio free tier (5,000 credits/month); email contact@wemakedevs.org for top-ups if you run out.

---

## 12. The 60-second version (for the demo video opening)

> "AI copilots cite the web. But the web changes — a price moves, a model is deprecated, a policy is quietly edited, a page dies — and the scraper that fed the AI breaks silently, returning empty arrays nobody notices. GroundTruth Guard is a self-healing source-trust engine built on Bright Data Scraper Studio. It continuously collects the public sources your AI cites, detects structural and semantic drift, auto-writes a repair prompt, heals the scraper, validates the fix, and publishes a Grounding Health Index — so you know exactly which of your AI's answers are still backed by live evidence. Watch: I'll change this site's layout live… the collector breaks… health drops to 42… GroundTruth writes a repair, heals it, validates, and recovers to 96. The data keeps flowing."

---

### Sources

- [WeMakeDevs — Into the Scrape-Verse hackathon page](https://www.wemakedevs.org/hackathons/scrape-verse)
- [Bright Data Scraper Studio overview](https://docs.brightdata.com/datasets/scraper-studio/overview) · [Self-Healing tool](https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool) · [Build with the CLI](https://docs.brightdata.com/datasets/scraper-studio/build-with-the-cli) · [Coding-agent prompts](https://docs.brightdata.com/datasets/scraper-studio/coding-agent-prompts) · [Quickstart / API](https://docs.brightdata.com/datasets/scraper-studio/quickstart)
- [Bright Data CLI overview](https://docs.brightdata.com/cli/overview) · [GitHub brightdata/cli](https://github.com/brightdata/cli)
- [Bright Data MCP server overview](https://docs.brightdata.com/ai/mcp-server/overview) · [GitHub brightdata-mcp](https://github.com/brightdata/brightdata-mcp)
- [Bright Data crosses $300M ARR, eyes $400M by 2026 — CTech](https://www.calcalistech.com/ctechnews/article/sjeyg2ezwe)
- [Bright Data Use Cases (incl. AI Grounding)](https://brightdata.com/use-cases) · [Customer Stories](https://brightdata.com/customer-stories)
- [VLDB 2025 — LLMs as Control Planes for wrapper drift](https://www.vldb.org/2025/Workshops/VLDB-Workshops-2025/PhD/PhD25_4.pdf) · [Self-healing scrapers with LLM repair loops](https://dataresearchtools.com/self-healing-scraper-llm-repair/) · [DOM drift & AI-native parsers — Nimble Way](https://www.nimbleway.com/blog/handling-dom-drift-in-large-scale-scrapers-with-ai-native-parsers)
- [Why web scrapers break quietly — Binary Bits](https://binarybits.co/blog/why-web-scraper-keeps-breaking) · [Managing change in web scraping — PromptCloud](https://www.promptcloud.com/blog/managing-change-in-web-scraping-10-challenges/) · [State of Web Scraping 2026 — Browserless](https://www.browserless.io/blog/state-of-web-scraping-2026)
- [Knowledge graphs as agent memory in 2026 — Beam.ai](https://beam.ai/agentic-insights/5-ways-knowledge-graphs-are-quietly-reshaping-ai-workflows-in-2026)
