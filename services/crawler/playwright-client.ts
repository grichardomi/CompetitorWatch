import { chromium, Browser, Page } from 'playwright';

interface CrawlOptions {
  timeoutMs?: number;
  waitForNetworkIdle?: boolean;
  includeImages?: boolean;
  userAgent?: string;
}

const DEFAULT_TIMEOUT = parseInt(process.env.CRAWLER_TIMEOUT_MS || '30000', 10);
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let browser: Browser | null = null;

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }

  try {
    // Try to use system chromium first (for Railway)
    const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
    browser = await chromium.launch({
      ...(executablePath && { executablePath }),
      headless: true,
    });
    console.log('Chromium browser launched');
    return browser;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw new Error(`Failed to launch Chromium: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Crawl a URL and extract HTML content
 */
export async function crawlUrl(url: string, options: CrawlOptions = {}): Promise<string> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    waitForNetworkIdle = true,
    includeImages = false,
    userAgent = DEFAULT_USER_AGENT,
  } = options;

  let page: Page | null = null;

  try {
    // Get browser instance
    const browser = await getBrowser();

    // Create new page with custom settings
    page = await browser.newPage({
      userAgent,
      viewport: { width: 1280, height: 800 },
    });

    // Block unnecessary resources for faster loading
    if (!includeImages) {
      await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', (route) => route.abort());
    }

    // Block stylesheets if not needed for text content
    await page.route('**/*.css', (route) => route.abort());

    // Navigate to URL
    console.log(`Crawling: ${url}`);
    const response = await page.goto(url, {
      waitUntil: waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
      timeout: timeoutMs,
    });

    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response?.status() || 'unknown'} for ${url}`);
    }

    // Wait a bit more for dynamic content
    if (waitForNetworkIdle) {
      await page.waitForTimeout(1000);
    }

    // Extract full page HTML
    const html = await page.content();

    console.log(`Successfully crawled ${url} (${html.length} bytes)`);
    return html;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to crawl ${url}:`, errorMessage);
    throw new Error(`Crawl failed for ${url}: ${errorMessage}`);
  } finally {
    // Close the page
    if (page) {
      await page.close().catch((err) => console.error('Error closing page:', err));
    }
  }
}

/**
 * Extract text content from HTML
 */
export function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Close the browser
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch((err) => console.error('Error closing browser:', err));
    browser = null;
  }
}
