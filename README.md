<div align="center">
  <h1>🛡️ GroundTruth Guard</h1>
  <p><b>The Self-Healing Data Pipeline for Enterprise Web Scraping</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/python-3.13+-blue.svg" alt="Python 3.13+" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
    <img src="https://img.shields.io/badge/Powered%20by-Bright%20Data-yellow.svg" alt="Powered by Bright Data" />
    <img src="https://img.shields.io/badge/Status-Production%20Ready-success.svg" alt="Status Production Ready" />
  </p>

  <p>
    <a href="#the-problem">The Problem</a> •
    <a href="#the-solution">The Solution</a> •
    <a href="#quickstart">Quickstart</a> •
    <a href="architecture.md">Architecture</a> •
    <a href="DEMO.md">Demo Runbook</a>
  </p>
</div>

<br/>

![Dashboard Overview](docs/e2e_mesh.png)

---

## The Problem
**Web scrapers break silently, and your data teams pay the price.** 

When a target website deploys a minor DOM update, traditional scrapers don't throw errors—they silently extract `null` values or scrape the wrong fields. Downstream databases become polluted with bad data, Machine Learning models are trained on garbage, and engineering teams spend 40% of their time playing whack-a-mole with broken parser scripts.

## The Solution
**GroundTruth Guard** is an automated data fidelity platform that prevents silent website changes from ever reaching your production database. 

It turns fragile, hard-coded scrapers into **resilient, self-healing workflows**. By orchestrating extractions through Bright Data Scraper Studio, GroundTruth Guard detects structural drift in real-time, quarantines anomalous data, and uses AI to automatically reverse-engineer and generate repaired scraper code for 1-click human approval.

Never publish a claim without proof. Never let bad data poison your systems.

---

## ⚡ Core Capabilities

### 📉 Real-Time Drift Detection
Automated evaluation compares live extractions against strict YAML schemas and historical snapshots. We catch **structural drift** (missing fields) and **semantic drift** (e.g., a `$10` price suddenly parsing as `$100`) before they enter your database.

### 🤖 AI-Powered Self-Healing
When a scraper breaks, the system doesn't just alert you—it fixes it. GroundTruth Guard automatically analyzes the failure context, queries the target's new DOM structure, and leverages Anthropic LLMs to generate a fully repaired extraction schema. 

### 👨‍💻 Human-in-the-Loop Security
AI is powerful, but production data requires certainty. Repaired scrapers are executed in a sandbox, and the resulting data is presented in a "Heal Preview." **Nothing is deployed to production until a human clicks "Approve."**

### 🛡️ Immutable Trust Ledger
Every single field extracted carries a cryptographic lineage: a source URL, an exact timestamp, and an automated health score. 

---

## 🛠️ Quickstart

### Prerequisites
- Python 3.13+
- Node.js v24+
- Bright Data Account & API Key
- Anthropic API Key

### 1. Clone & Configure
```bash
git clone https://github.com/Omkarchaithanya/data.git groundtruth-guard
cd groundtruth-guard

# Configure environment variables
echo "BRIGHTDATA_API_KEY=your_bright_data_api_key_here" > .env
echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" >> .env
echo "DEMO_MODE=false" >> .env
```

### 2. Launch Backend (FastAPI)
```bash
# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 3. Launch Frontend (React/Vite)
```bash
# Open a new terminal tab
cd frontend
npm install
npm run dev
```
Navigate to **`http://localhost:5173`** in your browser to access the command center.

---

## 🏗️ Design Philosophy: Flattened over Nested

Enterprise data systems require granular verifiable claims. Deeply nested JSON structures make it nearly impossible to track the health of individual data points over time. 

GroundTruth Guard enforces a **flat, entity-focused data structure**. This allows the Trust Ledger to hash, track, and score individual claims independently.

<details>
<summary><b>View Data Structure Comparison (Click to expand)</b></summary>
<br/>

**❌ Bad (Nested approach - hard to track granular claims):**
```json
{
  "models": [
    {
      "name": "Fable 5",
      "pricing": { "input": "$10", "output": "$50" }
    }
  ]
}
```

**✅ Good (Flattened approach - utilized by GroundTruth Guard):**
```json
{
  "product_page_url": "https://claude.com/pricing",
  "model_name": "Fable 5",
  "input_price": "$10",
  "output_price": "$50"
}
```
*This flattened structure enables the system to construct cryptographically verifiable claims like `"Fable 5 input price: $10"`.*
</details>

---

## 📊 E2E Dashboards 

Explore the capabilities of the GroundTruth Guard command center:

| Mesh Overview | Drift Detection | AI Self-Healing |
|:---:|:---:|:---:|
| <img src="docs/e2e_mesh.png" width="250"/> | <img src="docs/e2e_pricing.png" width="250"/> | <img src="docs/e2e_news.png" width="250"/> |

| Trust Ledger (Top) | Trust Ledger (Bottom) |
|:---:|:---:|
| <img src="docs/trust_ledger_top.png" width="400"/> | <img src="docs/trust_ledger_bottom.png" width="400"/> |

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Pydantic |
| **Extraction Engine** | Bright Data Scraper Studio API/CLI |
| **Data Storage** | SQLite (Event Sourced Architecture) |

---

### AI Assistance Disclosure
*This project was developed with the assistance of Claude Code acting as a coding agent. All AI-generated code, architectural decisions, and integrations were directed, extensively reviewed, and rigorously tested by the participating developer to meet the requirements of the **Into the Scrape-Verse** hackathon (Rule 11 compliance).*

### Demo Video
[🔗 Watch the 3-minute GroundTruth Guard Demo](https://youtube.com/placeholder-link)
