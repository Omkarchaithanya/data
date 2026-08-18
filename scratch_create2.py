import os
import subprocess
import json
from pathlib import Path

env = os.environ.copy()
env["BRIGHTDATA_API_KEY"] = "103c2c5f-66e6-4fdb-aa47-8691701f2305"

def create_scraper(url, prompt_file):
    prompt = Path(prompt_file).read_text(encoding="utf-8")
    cmd = ["brightdata", "scraper", "create", url, prompt, "--pretty"]
    print(f"Creating scraper for {url}...")
    res = subprocess.run(cmd, capture_output=True, text=True, env=env, shell=True)
    
    if res.returncode != 0:
        print("ERROR:", res.stderr)
        print("STDOUT:", res.stdout)
        return None
    try:
        data = json.loads(res.stdout)
        print(f"Success! Collector ID: {data.get('collector_id')}")
        return data.get("collector_id")
    except Exception as e:
        print("Failed to parse JSON:", e)
        print("Raw output:", res.stdout)
        return None

openai_id = create_scraper("https://openai.com/api/pricing", r"c:\Users\omkar\Brigth data\collectors\prompts\openai_pricing.md")
anthropic_id = create_scraper("https://www.anthropic.com/news", r"c:\Users\omkar\Brigth data\collectors\prompts\anthropic_news.md")

print(f"\nOPENAI_PRICING_COLLECTOR_ID={openai_id}")
print(f"ANTHROPIC_NEWS_COLLECTOR_ID={anthropic_id}")
