# Zeal Demo Runbook

This guide outlines the exact, step-by-step flow to demonstrate the value of Zeal. 

## 1. The Global Overview
- **Action**: Navigate to the **Mesh Overview** tab.
- **Expectation**: Show the aggregate health score, SLA staleness indicators (FRESH/STALE badges), and the real-time budget widget.
- **Pitch Point**: This is the command center. Unlike traditional dashboards that only show if a scraper *ran*, Zeal shows if the data is *trustworthy*.

## 2. Proving Live Extraction
- **Action**: Navigate to **Anthropic Pricing**. Click **Run Healthy**.
- **Expectation**: A brief loading spinner, followed by 11 real rows of pricing models fetched directly from the live web.
- **Pitch Point**: We are executing real synchronous extractions against Bright Data Scraper Studio, mapping complex web structures into flat, verifiable claims.

## 3. Simulating Structural Drift (The Break)
- **Action**: Navigate to **Canary Vendor**. Click **Simulate Drift**.
- **Expectation**: The health score plummets, the status turns RED, and the records show missing required fields.
- **Pitch Point**: A classic silent failure—the website updated its layout, and traditional scrapers would blindly push nulls to the database. We catch it instantly.

## 4. The Self-Healing Loop (Deterministic Demo)
- **Action**: On **Canary Vendor**, click **Generate Heal**. 
- **Expectation**: The system swaps the broken fixture for a *preview* of the fixed data. The status changes to "Awaiting Approval" in YELLOW.
- **Pitch Point**: We automatically repair the broken scraper logic. However, we intentionally pause for a human-in-the-loop. We never deploy AI-generated logic straight to production without oversight. Canary Vendor demonstrates this approval gate reliably and deterministically without risking live network latency or rate limits during a demo.

## 4b. Proving Real AI Healing (Optional, if time allows)
- **Action**: On **Anthropic Pricing**, click **Generate Heal**.
- **Expectation**: The backend generates a dynamic repair prompt and calls Bright Data's real scraper heal endpoint with a live LLM to generate the repair. (Note: Subject to Bright Data concurrent-job rate limits and API latency).
- **Pitch Point**: This proves the underlying engine uses real AI to dynamically repair live scrapers, not just static fixtures.

## 5. Human Approval
- **Action**: On **Canary Vendor**, review the previewed data, then click **Approve**.
- **Expectation**: The source returns to GREEN (Healthy).
- **Pitch Point**: One click restores the pipeline. The updated scraper schema is permanently pushed to Bright Data.

## 6. The Trust Ledger
- **Action**: Navigate to the **Trust Ledger** tab.
- **Expectation**: A granular, flat list of individual claims (e.g., "Fable 5 input price: $10") with confidence scores and timestamps.
- **Pitch Point**: Data provenance. We don't just dump nested JSON. We flatten data into independent claims so downstream LLMs or analysts can verify exactly when and where a specific datapoint was sourced.
