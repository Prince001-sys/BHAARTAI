const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Create a dummy PDF file for testing
  fs.writeFileSync('dummy.pdf', '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 53 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(This is a test PDF for StudyFlow) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000222 00000 n \n0000000326 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n414\n%%EOF\n');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Add the test login route again temporarily since we deleted it
  console.log('Creating test login route...');
  fs.mkdirSync('src/app/api/auth/test-login', { recursive: true });
  fs.writeFileSync('src/app/api/auth/test-login/route.ts', `
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })
  return NextResponse.redirect(new URL('/upload', request.url))
}
  `);

  console.log('Logging in and navigating to /upload...');
  await page.goto('http://localhost:3000/api/auth/test-login?email=testuser123@example.com&password=Password123!', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'before_upload.png' });

  // Upload file
  console.log('Uploading dummy.pdf...');
  const fileInput = await page.$('input[type=file]');
  await fileInput.uploadFile('dummy.pdf');

  console.log('Waiting for processing to complete (up to 30s)...');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => console.log('Navigation timeout'));

  console.log('Current URL after upload processing:', page.url());
  await page.screenshot({ path: 'after_upload_processing.png' });

  // Wait to see if "Processing Failed" or if notes loaded
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'workspace_final.png' });

  console.log('Cleaning up...');
  fs.unlinkSync('dummy.pdf');
  fs.rmSync('src/app/api/auth/test-login', { recursive: true, force: true });
  await browser.close();
  console.log('Test completed.');
})();
