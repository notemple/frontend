const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:5173');
  
  // Wait for editor to load
  await page.waitForSelector('.lexical-editor-root');
  
  // Type something
  await page.click('.lexical-editor-root');
  await page.keyboard.type('Hello World');
  
  // Move mouse to trigger block handle
  const bounds = await page.evaluate(() => {
    const el = document.querySelector('.lexical-editor-root').firstChild;
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  });
  
  await page.mouse.move(bounds.x + 10, bounds.y + 10);
  
  // Wait for block handle
  await page.waitForSelector('.block-handle-group button', { timeout: 2000 });
  
  // Click drag handle button (it opens the menu)
  const buttons = await page.$$('.block-handle-group button');
  if (buttons.length > 1) {
    await buttons[1].click();
  }
  
  // Wait for menu
  await page.waitForSelector('.block-context-menu');
  
  // Click "Duplicate"
  const menuItems = await page.$$('.block-context-menu-item');
  for (const item of menuItems) {
    const text = await item.textContent();
    if (text.includes('Duplicate')) {
      console.log('Clicking Duplicate...');
      await item.click();
      break;
    }
  }
  
  // Wait a bit
  await page.waitForTimeout(500);
  
  // Click again to test "Turn into" -> "Heading 1"
  await page.mouse.move(bounds.x + 10, bounds.y + 10);
  await page.waitForSelector('.block-handle-group button');
  await buttons[1].click();
  await page.waitForSelector('.block-context-menu');
  
  for (const item of await page.$$('.block-context-menu-item')) {
    const text = await item.textContent();
    if (text.includes('Turn into')) {
      console.log('Clicking Turn into...');
      await item.click();
      break;
    }
  }
  
  await page.waitForSelector('.block-context-submenu');
  for (const item of await page.$$('.block-context-menu-item')) {
    const text = await item.textContent();
    if (text.includes('Heading 1')) {
      console.log('Clicking Heading 1...');
      await item.click();
      break;
    }
  }
  
  await page.waitForTimeout(500);
  
  await browser.close();
})();
