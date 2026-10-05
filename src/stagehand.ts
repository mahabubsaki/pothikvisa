import fs from "node:fs";
import path from "node:path";
import { localBrowser, browserbase, Stagehand, type StagehandBrowser, type Page } from "@browserbasehq/stagehand";
import { getConfig } from "./config";
import { createFallbackClient } from "./deepseek-client";

export interface StagehandSession {
  browser: StagehandBrowser;
  stagehand: Stagehand;
  page: Page;
  close: () => Promise<void>;
}

/**
 * Initializes and returns a Stagehand browser session based on active configuration (.env).
 */
export async function initStagehand(): Promise<StagehandSession> {
  const config = getConfig();

  console.log(`🤖 Initializing Stagehand Browser Automation...`);
  console.log(`   Provider: ${config.summary.provider}`);
  console.log(`   Model:    ${config.summary.model}`);
  console.log(`   Headless: ${config.headless}`);

  let browser: StagehandBrowser;

  const downloadsDir = path.resolve(process.cwd(), "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  if (config.browserbaseApiKey) {
    console.log(`☁️  Connecting to Browserbase Cloud...`);
    browser = await browserbase.launch({
      apiKey: config.browserbaseApiKey,
    });
  } else {
    browser = await localBrowser.launch({
      headless: config.headless,
      userDataDir: config.userDataDir,
      acceptDownloads: true,
      downloadsPath: downloadsDir,
    });
  }

  let stagehand: Stagehand;

  try {
    if (config.modelOption.type === "client") {
      stagehand = await Stagehand.create({
        browser,
        model: config.modelOption.client,
      });
    } else {
      stagehand = await Stagehand.create({
        browser,
        model: {
          modelName: config.modelOption.modelName,
          apiKey: config.modelOption.apiKey,
        },
      });
    }
  } catch (err) {
    console.warn(`⚠️ Stagehand AI initialization warning, falling back to minimal client:`, err instanceof Error ? err.message : err);
    stagehand = await Stagehand.create({
      browser,
      model: createFallbackClient(),
    }).catch(() => ({} as unknown as Stagehand));
  }

  const pages = await browser.context.pages();
  const page = pages[0] || (await browser.context.newPage());

  // Automatically accept all browser dialogs (alerts, confirms, prompts) via underlying Playwright page
  const pwPage = (page as any).page;
  if (pwPage && typeof pwPage.on === 'function') {
    try {
      pwPage.on('dialog', async (dialog: any) => {
        console.log(`[Auto-handled dialog]: ${dialog.type ? dialog.type() : ''} - "${dialog.message ? dialog.message() : ''}"`);
        try {
          await dialog.accept();
        } catch {}
      });
    } catch {}
  }

  // Inject suppression of window.confirm, window.alert, and window.prompt so modal dialogs never block execution
  try {
    await page.addInitScript(() => {
      window.confirm = (msg?: string) => {
        console.log('[Auto-accepted confirm popup]:', msg);
        return true;
      };
      window.alert = (msg?: string) => {
        console.log('[Auto-dismissed alert popup]:', msg);
      };
      window.prompt = (_msg?: string, _defaultVal?: string) => {
        return _defaultVal || '';
      };
      (window as unknown as Window & { __name?: <T>(target: T) => T }).__name = <T>(target: T) => target;

      // In-page network interceptor
      const win = window as any;
      if (!win.__networkInterceptorInstalled) {
        win.__networkInterceptorInstalled = true;
        win.__networkResponses = win.__networkResponses || [];

        const origFetch = win.fetch;
        win.fetch = async function (...args: any[]) {
          const startTime = Date.now();
          const rawUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
          try {
            const response = await origFetch.apply(this, args);
            const clone = response.clone();
            let body: any = null;
            try { body = await clone.json(); } catch { try { body = await clone.text(); } catch {} }
            win.__networkResponses.push({
              url: rawUrl,
              status: response.status,
              body,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            });
            return response;
          } catch (err) {
            win.__networkResponses.push({
              url: rawUrl,
              status: 0,
              error: String(err),
              timestamp: Date.now(),
            });
            throw err;
          }
        };

        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
          (this as any).__url = typeof url === 'string' ? url : url.toString();
          (this as any).__startTime = Date.now();
          return origOpen.apply(this, [method, url, ...rest] as any);
        };
        XMLHttpRequest.prototype.send = function (...args: any[]) {
          this.addEventListener('load', function () {
            let body: any = null;
            try { body = JSON.parse(this.responseText); } catch { body = this.responseText; }
            win.__networkResponses.push({
              url: (this as any).__url || '',
              status: this.status,
              body,
              duration: Date.now() - ((this as any).__startTime || Date.now()),
              timestamp: Date.now(),
            });
          });
          return origSend.apply(this, args as any);
        };
      }
    });
  } catch (err) {
    console.warn('Could not register init scripts:', err);
  }

  return {
    browser,
    stagehand,
    page,
    close: async () => {
      try {
        await Promise.race([
          stagehand.close().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (err) {
        // ignore on shutdown
      }
      try {
        await Promise.race([
          browser.close().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (err) {
        // ignore on shutdown
      }
    },
  };
}
