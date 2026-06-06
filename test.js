import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('Page error:', err.message, err.stack);
  });
  
  page.on('console', msg => {
    console.log(`[Browser Console] [${msg.type()}]:`, msg.text());
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Bypass onboarding via localStorage
    await page.evaluate(() => {
      localStorage.setItem('settings-storage', JSON.stringify({
        state: {
          isOnboardingCompleted: true,
          spaceName: 'Personal Space',
          spaceIcon: 'N',
          userName: 'User',
          timezone: 'UTC',
          timeFormat: '12h'
        }
      }));
    });
    await page.reload({ waitUntil: 'networkidle0' });

    // Wait 2 seconds for IndexedDB stores to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find the "New Note" sidebar item and click it
    const sidebarButtons = await page.$$('[role="button"]');
    let clickedNewNote = false;
    for (const button of sidebarButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('New Note')) {
        await button.click();
        console.log('Clicked New Note');
        clickedNewNote = true;
        break;
      }
    }

    if (!clickedNewNote) {
      throw new Error('Could not find New Note button');
    }

    // Wait for the Lexical root editor element to render
    await page.waitForSelector('.lexical-root', { timeout: 8000 });
    
    // Click on editor and set cursor selection inside the paragraph
    await page.click('.lexical-root');
    await page.evaluate(() => {
      const root = document.querySelector('.lexical-root');
      const p = root ? root.querySelector('p') : null;
      if (p) {
        const range = document.createRange();
        range.selectNodeContents(p);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
    
    // Type '/' to trigger the slash menu
    await page.keyboard.type('/');
    
    // Wait for the slash command menu container to appear
    await page.waitForSelector('[data-testid="slash-menu"]', { timeout: 3000 });
    
    const buttons = await page.$$('[data-testid="slash-menu"] button');
    let clicked = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('2 Columns')) {
        await button.click();
        console.log('Clicked 2 Columns');
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find 2 Columns option');
    }

    // Wait a moment for any errors or DOM updates
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.error('Failed test:', e);
  }
  
  await browser.close();
})();
