from playwright.sync_api import sync_playwright
import time

def capture_docs():
    print("Starting Playwright to capture screenshots...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        
        print("Navigating to http://127.0.0.1:5173/")
        page.goto("http://127.0.0.1:5173/")
        
        # Wait for the network to settle and UI to render
        page.wait_for_timeout(3000)
        
        # 1. Capture Dashboard Overview (Mesh)
        # Assuming the first tab is "Orchestration Mesh" by default
        print("Capturing Orchestration Mesh...")
        page.screenshot(path="docs/e2e_mesh.png")
        
        # 2. Capture Drift Detection
        # Click on Anthropic Pricing row in the mesh to open the inspector
        # Wait for it to be visible
        try:
            print("Capturing Drift Detection (Pricing)...")
            page.locator("text=Anthropic API Pricing").first.click(timeout=2000)
            page.wait_for_timeout(1000)
            page.screenshot(path="docs/e2e_pricing.png")
            
            # Click close or back to mesh
            page.locator("button:has-text('Close')").first.click(timeout=2000)
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"Could not click pricing row: {e}")
            
        # 3. Capture AI Self-Healing
        try:
            print("Capturing AI Self-Healing (News)...")
            page.locator("text=Anthropic News").first.click(timeout=2000)
            page.wait_for_timeout(1000)
            page.screenshot(path="docs/e2e_news.png")
            
            page.locator("button:has-text('Close')").first.click(timeout=2000)
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"Could not click news row: {e}")
            
        # 4. Capture Trust Ledger (Top & Bottom)
        print("Capturing Trust Ledger...")
        page.locator("button:has-text('Trust Ledger')").click(timeout=2000)
        page.wait_for_timeout(1500)
        
        # Top half
        page.screenshot(path="docs/trust_ledger_top.png")
        
        # Bottom half (scroll down)
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(500)
        page.screenshot(path="docs/trust_ledger_bottom.png")
        
        browser.close()
        print("Done capturing docs!")

if __name__ == "__main__":
    capture_docs()
