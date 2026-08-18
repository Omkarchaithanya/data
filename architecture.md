# Architecture

```mermaid
flowchart TD
  A["sources.yml"] --> B["Source Registry"]
  B --> C["Bright Data Client"]
  C --> D["Collector Run Output"]
  D --> E["Validation Layer"]
  E --> F["Drift Engine"]
  F --> G["Grounding Health Index"]
  F --> H["Heal Prompt Builder"]
  H --> I["Bright Data Self-Healing"]
  I --> J["Preview Validation"]
  J --> K["Approval Gate"]
  G --> L["FastAPI"]
  K --> L
  L --> M["React Dashboard"]
```

## Responsibilities

- Source registry defines public URLs and expected fields.
- Bright Data client owns CLI calls and normalizes command envelopes.
- Validation catches empty, partial, and schema-invalid output.
- Drift detection compares current normalized content with prior snapshots.
- Heal workflow builds a prompt, triggers `scraper heal`, validates preview output, and blocks approval on invalid previews.
- API and dashboard expose runs, drift, health, and healing events.

