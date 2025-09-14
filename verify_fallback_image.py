from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the menu page
    page.goto("http://localhost:3000/menu")

    # Wait for the page to load
    page.wait_for_selector("text=Our Menu")

    # Take a screenshot
    page.screenshot(path="verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
