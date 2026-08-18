from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from backend.app.routers.api import router


app = FastAPI(title="GroundTruth Guard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", response_class=HTMLResponse)
async def root() -> str:
    return """
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>GroundTruth Guard API</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #070a12;
            color: #eef6ff;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          }
          main {
            width: min(720px, calc(100vw - 32px));
            border: 1px solid rgba(65, 229, 255, 0.24);
            border-radius: 10px;
            padding: 28px;
            background: linear-gradient(135deg, rgba(14, 22, 38, 0.96), rgba(17, 24, 39, 0.86));
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
          }
          h1 { margin: 0 0 8px; font-size: 34px; letter-spacing: 0; }
          p { color: #aeb9c8; line-height: 1.6; }
          a {
            display: inline-flex;
            margin: 8px 8px 0 0;
            padding: 10px 13px;
            border-radius: 8px;
            color: #071018;
            background: linear-gradient(135deg, #66f2a5, #41e5ff);
            text-decoration: none;
            font-weight: 800;
          }
          a.secondary {
            color: #eef6ff;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
          }
        </style>
      </head>
      <body>
        <main>
          <h1>GroundTruth Guard API</h1>
          <p>The backend is running. Open the dashboard for the product UI, or inspect the API routes below.</p>
          <a href="http://127.0.0.1:4173/">Open Dashboard</a>
          <a class="secondary" href="/docs">API Docs</a>
          <a class="secondary" href="/health">Health</a>
        </main>
      </body>
    </html>
    """


@app.get("/canary/v1", response_class=HTMLResponse)
async def canary_v1() -> str:
    return """
    <html><body>
      <main class="pricing">
        <h1>Canary Vendor Pricing</h1>
        <table data-testid="pricing-table">
          <tr><th>Model</th><th>Input</th><th>Output</th><th>Effective</th></tr>
          <tr><td>GroundTruth Mini</td><td>$0.25 / 1M tokens</td><td>$1.00 / 1M tokens</td><td>2026-08-17</td></tr>
        </table>
      </main>
    </body></html>
    """


@app.get("/canary/v2", response_class=HTMLResponse)
async def canary_v2() -> str:
    return """
    <html><body>
      <section class="plans-redesigned">
        <h1>Canary Vendor Pricing</h1>
        <article data-plan="mini">
          <h2>GroundTruth Mini</h2>
          <p><span>Prompt tokens</span><strong>$0.29 / 1M tokens</strong></p>
          <p><span>Completion tokens</span><strong>$1.10 / 1M tokens</strong></p>
          <time datetime="2026-08-17">August 17, 2026</time>
        </article>
      </section>
    </body></html>
    """
