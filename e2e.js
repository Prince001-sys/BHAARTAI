const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'landing_page.png' });
  console.log('Landing page loaded and screenshot taken.');

  console.log('Logging in using test-login route...');
  await page.goto('http://localhost:3000/api/auth/test-login?email=testuser123@example.com&password=Password123!', { waitUntil: 'networkidle0' });
  
  // After login, we should be redirected to /dashboard
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  await page.screenshot({ path: 'dashboard.png' });
  console.log('Dashboard screenshot taken.');

  console.log('Navigating to /upload...');
  await page.goto('http://localhost:3000/upload', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'upload.png' });
  console.log('Upload page screenshot taken.');

  // Try to find YouTube URL input and type something
  try {
    console.log('Waiting for youtube input...');
    await page.waitForSelector('input[type="url"]', { timeout: 5000 });
    await page.type('input[type="url"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.screenshot({ path: 'upload_with_url.png' });
    console.log('Typed YouTube URL.');
    
    // Find the submit button
    console.log('Clicking generate button...');
    const buttons = await page.$$('button');
    let generateBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.toLowerCase().includes('generate') || text.toLowerCase().includes('process') || text.toLowerCase().includes('submit')) {
        generateBtn = btn;
        break;
      }
    }
    if (generateBtn) {
      await generateBtn.click();
      console.log('Clicked generate. Waiting for navigation or processing...');
      // Wait a bit for navigation to study workspace
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => console.log('No navigation happened or timeout'));
    }
  } catch (err) {
    console.log('Could not automate upload form:', err.message);
  }
  
  console.log('Current URL after upload attempt:', page.url());
  await page.screenshot({ path: 'after_upload.png' });

  console.log('Closing browser...');
  await browser.close();
  console.log('Test finished successfully.');
})();
