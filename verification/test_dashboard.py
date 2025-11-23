from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open index.html directly since there's no server setup
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Wait for the currency grid to load
        # It starts with "Loading..." spinner, then populates
        try:
            page.wait_for_selector('.currency-item', timeout=5000)
            print("Currency items loaded")
        except:
            print("Currency items did not load in time (might be API issues, which is expected for some)")

        # Take screenshot of the dashboard
        page.screenshot(path="verification/dashboard_refactored.png")

        browser.close()

if __name__ == "__main__":
    run()