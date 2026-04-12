// Playwright script for testing the GAS web app
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const APP_URL = 'https://script.google.com/macros/s/AKfycbwUm1j9dqJpDy-1eJ62gP8IRJ-81BG6Cn2M59M3ptCO2V_6P3ObOBx6XsJLeHY-hgWy/exec';
  
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
  
  const title = await page.title();
  console.log('Page title:', title);
  
  await page.screenshot({ path: '/tmp/gas_app_screenshot.png' });
  console.log('Screenshot saved to /tmp/gas_app_screenshot.png');
  
  await browser.close();
})();
