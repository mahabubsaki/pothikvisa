import fs from 'node:fs';
import path from 'node:path';
import { localBrowser, Stagehand, type StagehandBrowser, type Page } from '@browserbasehq/stagehand';
import { getConfig } from '../../config';
import { createFallbackClient } from '../../deepseek-client';
import { restoreSessionState } from './httpHelpers';
import { WorkerTarget } from './workerResolver';

export interface MultiWorkerBrowserSession {
  browser: StagehandBrowser;
  stagehand: Stagehand;
  page: Page;
  sessionRestored: boolean;
  close: () => Promise<void>;
}

/**
 * Launches an isolated, HEADED Stagehand browser instance for a specific worker with its assigned proxy and profile directory.
 */
export async function createWorkerBrowser(
  worker: WorkerTarget,
  phone: string,
  skipOtpIfSessionValid = true
): Promise<MultiWorkerBrowserSession> {
  const config = getConfig();

  const downloadsDir = path.resolve(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`🖥️  [${worker.name}] Launching HEADED Browser (Profile: ${path.basename(worker.profileDir)} | Proxy: ${worker.proxyUrl || 'Direct'})...`);

  // Launch Stagehand localBrowser in HEADED mode (headless: false)
  const browser = await localBrowser.launch({
    headless: false,
    userDataDir: worker.profileDir,
    proxy: worker.proxyUrl ? { server: worker.proxyUrl } : undefined,
    acceptDownloads: true,
    downloadsPath: downloadsDir,
  });

  let stagehand: Stagehand;
  try {
    if (config.modelOption.type === 'client') {
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
    console.warn(`[${worker.name}] Stagehand AI warning, using minimal client:`, err instanceof Error ? err.message : err);
    stagehand = await Stagehand.create({
      browser,
      model: createFallbackClient(),
    }).catch(() => ({} as unknown as Stagehand));
  }

  const pages = await browser.context.pages();
  const page = pages[0] || (await browser.context.newPage());

  // Inject popup / alert suppression scripts
  try {
    await page.addInitScript(() => {
      window.confirm = () => true;
      window.alert = () => {};
      window.prompt = (_msg?: string, _defaultVal?: string) => _defaultVal || '';
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
    console.warn(`[${worker.name}] Could not register dialog suppression init script:`, err);
  }

  // Check and restore existing session for Zero-OTP flow
  let sessionRestored = false;
  const sessionPath = path.resolve(process.cwd(), 'sessions', `${phone}.json`);
  const hasSavedSession = fs.existsSync(sessionPath) && skipOtpIfSessionValid;

  if (hasSavedSession) {
    console.log(`🔑 [${worker.name}] Testing saved session for ${phone} (Zero-OTP probe)...`);
    try {
      await page.goto('https://appointment.ivacbd.com/signin');
      await restoreSessionState(page, sessionPath);
      await page.goto('https://appointment.ivacbd.com/appointment/file-upload');
      await page.waitForTimeout(1500);

      const url = await page.url();
      if (!url.includes('/signin')) {
        console.log(`✨ [${worker.name}] Restored session for ${phone} is VALID! Bypassing Step 1 & 2.`);
        sessionRestored = true;
      } else {
        console.warn(`⚠️ [${worker.name}] Restored session for ${phone} expired. Proceeding to fresh Sign-In.`);
      }
    } catch {
      console.warn(`⚠️ [${worker.name}] Session probe error for ${phone}. Falling back to standard Sign-In.`);
    }
  }

  return {
    browser,
    stagehand,
    page,
    sessionRestored,
    close: async () => {
      try {
        await stagehand.close();
      } catch {}
      try {
        await browser.close();
      } catch {}
    },
  };
}
