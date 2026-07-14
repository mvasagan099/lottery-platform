import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:5173/admin/support');
    
    // Login if redirected
    if (page.url().includes('login')) {
      console.log("Logging in...");
      await page.type('input[type="email"]', 'admin@vestauth.com');
      await page.type('input[type="password"]', 'Admin@123!');
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
      ]);
    }

    console.log("Navigating to support...");
    await page.goto('http://localhost:5173/admin/support', { waitUntil: 'networkidle0' });
    
    console.log("Clicking Tickets tab...");
    const tabs = await page.$$('button.admin-tab');
    if (tabs.length > 1) {
      await tabs[1].click();
    }
    
    console.log("Waiting for tickets to load...");
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    console.log('Clicking the first ticket...');
    const rows = await page.$$('tbody tr');
    if (rows.length > 0) {
      await rows[0].click();
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('No rows found');
    }

  } catch (err) {
    console.log("Error during script:", err.message);
  } finally {
    await page.screenshot({ path: 'crash_screenshot.png' });
    fs.writeFileSync('crash_html.html', await page.content());
    await browser.close();
  }
})();
