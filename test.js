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
      if (text.includes('Table')) {
        await button.click();
        console.log('Clicked Table');
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find Table option');
    }

    // Wait for the table to render
    await page.waitForSelector('.lexical-table', { timeout: 4000 });
    console.log('Table rendered');



    // Click the first table cell
    await page.click('.lexical-table-cell');
    console.log('Clicked table cell');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hover or trigger row handle
    // In our code, we can click the row handle directly since it should be rendered when active cell is set.
    await page.waitForSelector('.table-row-handle', { timeout: 4000 });
    console.log('Row handle visible');
    await page.click('.table-row-handle');
    console.log('Clicked row handle');

    // Wait for context menu
    await page.waitForSelector('.table-control-menu', { timeout: 4000 });
    console.log('Context menu visible');

    // Find and click "Background Color" item
    const menuItems = await page.$$('.table-control-menu-item');
    let clickedBgColor = false;
    for (const item of menuItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Background Color')) {
        await item.click();
        console.log('Clicked Background Color option');
        clickedBgColor = true;
        break;
      }
    }

    if (!clickedBgColor) {
      throw new Error('Could not find Background Color option');
    }

    // Wait for color submenu
    await page.waitForSelector('.table-control-submenu', { timeout: 4000 });
    console.log('Color submenu visible');

    // Click "Pink Orchid" color option
    const colorItems = await page.$$('.table-control-submenu .table-control-menu-item');
    let clickedColor = false;
    for (const item of colorItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text.includes('Pink Orchid')) {
        await item.click();
        console.log('Clicked Pink Orchid color');
        clickedColor = true;
        break;
      }
    }

    if (!clickedColor) {
      throw new Error('Could not find Pink Orchid color option');
    }

    // Click outside the table to deselect the cell
    await page.click('.editor-click-target');
    console.log('Clicked outside to deselect cell');

    // Wait 5 seconds to check if background color persists
    console.log('Waiting 5 seconds to observe background color...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Inspect first cell's DOM attributes and computed style
    const cellData = await page.evaluate(() => {
      const cell = document.querySelector('.lexical-table-cell');
      const table = document.querySelector('.lexical-table');
      if (!cell) return 'No cell found';
      return {
        styleAttr: cell.getAttribute('style'),
        computedBgColor: window.getComputedStyle(cell).backgroundColor,
        tableHtml: table ? table.outerHTML : 'no table'
      };
    });
    console.log('Cell DOM inspection:', cellData);
  } catch (e) {
    console.error('Failed test:', e);
  }
  
  await browser.close();
})();
