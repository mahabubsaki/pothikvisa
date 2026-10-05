import fs from 'node:fs';
import { type Page, type Response } from '@browserbasehq/stagehand';

/**
 * Installs in-browser network interceptor to record all window.fetch and XMLHttpRequest responses.
 * Avoids calling Stagehand's page.on('response') which fails Stagehand's RPC Zod schema.
 */
export async function installNetworkInterceptor(page: Page): Promise<void> {
  await page.evaluate(() => {
    const win = window as any;
    if (win.__networkInterceptorInstalled) return;
    win.__networkInterceptorInstalled = true;
    win.__networkResponses = win.__networkResponses || [];

    // Intercept window.fetch
    const origFetch = win.fetch;
    win.fetch = async function (...args: any[]) {
      const startTime = Date.now();
      const rawUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
      try {
        const response = await origFetch.apply(this, args);
        const clone = response.clone();
        let body: any = null;
        try {
          body = await clone.json();
        } catch {
          try {
            body = await clone.text();
          } catch {}
        }
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

    // Intercept XMLHttpRequest
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
        try {
          body = JSON.parse(this.responseText);
        } catch {
          body = this.responseText;
        }
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
  }).catch(() => {});
}

/**
 * Robust response waiter using in-browser recorded network responses.
 * 100% compatible with Stagehand and Playwright without triggering RPC event schema errors.
 */
export async function waitForResponse(
  page: Page,
  predicate: (res: Response) => boolean,
  timeoutMs = 30000
): Promise<Response> {
  const startTime = Date.now();
  await installNetworkInterceptor(page);

  while (Date.now() - startTime < timeoutMs) {
    const list = await page.evaluate((sinceTime: number) => {
      const win = window as any;
      const responses = win.__networkResponses || [];
      return responses.filter((r: any) => r.timestamp >= sinceTime);
    }, startTime - 1000).catch(() => []);

    for (const item of list) {
      const fakeRes = {
        url: () => item.url || '',
        status: () => item.status || 0,
        json: async () => item.body,
        text: async () => (typeof item.body === 'string' ? item.body : JSON.stringify(item.body)),
        ok: () => item.status >= 200 && item.status < 300,
      };

      try {
        if (predicate(fakeRes as unknown as Response)) {
          return fakeRes as unknown as Response;
        }
      } catch {
        // Continue checking next
      }
    }

    await page.waitForTimeout(100);
  }

  throw new Error(`Timed out waiting for response after ${timeoutMs}ms`);
}

/**
 * Polls until the page URL satisfies the given condition.
 */
export async function waitForUrlCondition(
  page: Page,
  condition: (url: string) => boolean,
  timeoutMs = 15000,
  intervalMs = 300
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await page.url();
    if (condition(current)) return current;
    await page.waitForTimeout(intervalMs);
  }
  return await page.url();
}

/**
 * Saves cookies and LocalStorage to a persistent JSON session file.
 */
export async function saveSessionState(page: Page, sessionFilePath: string): Promise<void> {
  try {
    let contextCookies: any[] = [];
    try {
      if (typeof (page as any).context === 'function') {
        contextCookies = await (page as any).context().cookies();
      }
    } catch {}

    const storageData = await page.evaluate(() => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) storage[k] = localStorage.getItem(k) || '';
      }
      return storage;
    });

    const sessionPayload = {
      cookies: contextCookies,
      localStorage: storageData,
      timestamp: Date.now(),
    };

    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionPayload, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`⚠️ Could not save session state: ${err}`);
  }
}

/**
 * Restores context cookies and LocalStorage from saved session file into active page.
 */
export async function restoreSessionState(page: Page, sessionFilePath: string): Promise<boolean> {
  if (!fs.existsSync(sessionFilePath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));

    // 1. Restore cookies into browser network context (including HttpOnly & Cloudflare tokens)
    if (Array.isArray(data.cookies) && data.cookies.length > 0) {
      try {
        if (typeof (page as any).context === 'function') {
          await (page as any).context().addCookies(data.cookies);
        }
      } catch {}
    }

    // 2. Restore LocalStorage items
    if (data.localStorage && typeof data.localStorage === 'object') {
      await page.evaluate((storage) => {
        for (const [k, v] of Object.entries(storage)) {
          localStorage.setItem(k, v as string);
        }
      }, data.localStorage);
    }

    return true;
  } catch (err) {
    console.warn(`⚠️ Could not restore session state: ${err}`);
  }
  return false;
}
