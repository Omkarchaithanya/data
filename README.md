# GroundTruth Guard: Self-Healing Pipeline for Unbreakable Scrapers

**Never let a silent website update pollute your production database.** 

Content specialists and data teams spend hours manually verifying scraped product, pricing, and documentation data to catch silent layout changes. GroundTruth Guard fully automates this pipeline. It turns fragile scrapers into self-healing, human-in-the-loop workflows that detect structural drift, quarantine bad data, and automatically generate repaired scraper code for 1-click approval.

![Python 3.13+](https://img.shields.io/badge/python-3.13+-blue.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-green.svg) ![Built with Bright Data](https://img.shields.io/badge/Built_with-Bright_Data_Scraper_Studio-yellow.svg)

### Documentation
- [Architecture & Trade-offs](architecture.md)
- [Live Demo Runbook](DEMO.md)

![Dashboard Overview](docs/e2e_mesh.png)

### What it does

* **Never publishes a claim without proof:** Every field extracted carries a source URL, timestamp, and an automated health score to ensure data fidelity.
* **Catches silent failures before they corrupt your DB:** Automated drift detection compares live extractions against strict YAML schemas and prior snapshots to catch semantic drift (e.g., $10 becoming $100) and structural drift (missing fields).
* **Self-heals with a human in the loop:** When drift is detected, it automatically reverse-engineers the failure, feeds it to an LLM, and previews a fully healed scraper execution for single-click approval.



### Quickstart

Clone the repo and navigate to the project directory:
```bash
git clone https://github.com/Omkarchaithanya/data.git groundtruth-guard
cd groundtruth-guard
```

**1. Backend Setup**
```bash
# Install dependencies
pip install -r requirements.txt

# Set up your environment variables
echo "BRIGHTDATA_API_KEY=your_bright_data_api_key_here" > .env
echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" >> .env
echo "DEMO_MODE=false" >> .env

# Run the backend
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Flattened vs Nested Data Extraction
GroundTruth Guard relies on flat, entity-focused data structures rather than deeply nested JSON. This flat structure is what allows the Trust Ledger to track, hash, and score individual claims independently.

**Bad (Nested approach - hard to verify granular claims):**
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

**Good (Flattened approach - used by GroundTruth Guard):**
```json
{
  "product_page_url": "https://claude.com/pricing",
  "model_name": "Fable 5",
  "input_price": "$10",
  "output_price": "$50"
}
```
This flattened structure is what enables the system to construct granular, verifiable claims like `"Fable 5 input price: $10"`.

### Example Structured Output
*This is real output, not a mock. Fetched dynamically via Bright Data Scraper Studio from `https://claude.com/pricing` using GroundTruth Guard.*

```json
[
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Fable 5",
    "input_price": "$10",
    "output_price": "$50"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 5",
    "input_price": "$5",
    "output_price": "$25"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Sonnet 5",
    "input_price": "$2",
    "output_price": "$10"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Haiku 4.5",
    "input_price": "$1",
    "output_price": "$5"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 4.8",
    "input_price": "$5",
    "output_price": "$25"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Sonnet 4.6",
    "input_price": "$3",
    "output_price": "$15"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 4.7",
    "input_price": "$5",
    "output_price": "$25"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 4.6",
    "input_price": "$5",
    "output_price": "$25"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Sonnet 4.5",
    "input_price": "$3",
    "output_price": "$15"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 4.5",
    "input_price": "$5",
    "output_price": "$25"
  },
  {
    "product_page_url": "https://claude.com/pricing",
    "input": "https://claude.com/pricing",
    "model_name": "Opus 4.1",
    "input_price": "$15",
    "output_price": "$75"
  }
]
```

### E2E Dashboards 
You can view E2E workflow capabilities below:
- ![Mesh Overview](docs/e2e_mesh.png)
- ![Pricing Drift](docs/e2e_pricing.png)
- ![News Healing](docs/e2e_news.png)
- ![Trust Ledger Top](docs/trust_ledger_top.png)
- ![Trust Ledger Bottom](docs/trust_ledger_bottom.png)

### AI Assistance Disclosure
This project was developed with the assistance of Claude Code acting as a coding agent. All AI-generated code, architectural decisions, and integrations were directed, extensively reviewed, and rigorously tested by the participating developer to meet the requirements of the *Into the Scrape-Verse* hackathon (Rule 11 compliance). 

### Demo Video
[🔗 Watch the 3-minute GroundTruth Guard Demo](https://youtube.com/placeholder-link)

### Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Pydantic |
| **Extraction** | Bright Data Scraper Studio API/CLI |
| **Storage** | SQLite (Event Sourced) |

### License
MIT License
