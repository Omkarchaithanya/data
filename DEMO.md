# GroundTruth Guard Demo

## 60-second opening

AI copilots cite the web, but the web changes. A price moves, a model is deprecated, a policy is edited, or a page dies, and the scraper feeding the AI can silently return partial data. GroundTruth Guard monitors those public sources, detects structural and semantic drift, generates a Bright Data Self-Healing repair prompt, validates the preview, and restores the data pipeline with a health score that judges can see.

## Live Flow

1. Show `sources.yml` with the canary vendor and public AI sources.
2. Show the dashboard: source cards, health index, drift feed, and timeline.
3. Run the canary collector in healthy mode.
4. Switch to the broken canary output and run drift detection.
5. Show missing fields and health drop.
6. Trigger heal and show the generated prompt.
7. Show preview validation passing.
8. Approve the heal and show health recovery.

## Bright Data Accuracy Note

Bright Data Self-Healing is review/approval gated. This project does not claim unsafe blind promotion. It automates detection and validation, then approves only when the preview satisfies the expected schema.

