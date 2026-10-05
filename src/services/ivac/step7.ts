import { type Page, type Response } from '@browserbasehq/stagehand';
import { IvacAvailableDate, Step7Result } from './types';
import { waitForResponse, waitForUrlCondition } from './httpHelpers';
import { clickButtonSafe, handleCloudflareTurnstile, waitForEnabled } from './domHelpers';

export interface Step7Options {
  targetDates?: string[];
  preferredDate?: string;
  dateOrder?: 'latest' | 'earliest';
  avoidDates?: string[];
  maxAttempts?: number;
}

const MONTH_NAME_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const SELECTORS = {
  prevMonth:
    'button[aria-label="Previous month"], button[aria-label*="prev" i], button[name="previous-month"], button.rdp-nav_button_previous',
  nextMonth:
    'button[aria-label="Next month"], button[aria-label*="next" i], button[name="next-month"], button.rdp-nav_button_next',
  monthTitle:
    '#calendar-month-title, div.flex.items-center.gap-3 span, .rdp-caption_label, div[class*="month-title"]',
  calendarGrid: '.grid, .rdp-month, table.rdp-table',
  continueBookingBtn:
    'button',
};

/**
 * Parses Month and Year from IVAC calendar header text (e.g. "October 2026").
 */
export function parseIvacMonthYear(title: string): { year: number; month: number } {
  const clean = (title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const parts = clean.split(/\s+/);
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  for (const p of parts) {
    if (/^\d{4}$/.test(p)) {
      year = parseInt(p, 10);
    } else if (MONTH_NAME_MAP[p]) {
      month = MONTH_NAME_MAP[p];
    }
  }
  return { year, month };
}

/**
 * Evaluates whether a candidate date matches any criteria in the avoid list.
 * Supports ISO dates ("2026-10-15"), day numbers ("15" or "05"), and month-day formats ("10-15").
 */
export function isIvacDateAvoided(date: IvacAvailableDate, avoidList?: string[]): boolean {
  if (!avoidList || avoidList.length === 0) return false;
  return avoidList.some((raw) => {
    if (!raw) return false;
    const clean = String(raw).trim().toLowerCase();
    if (!clean) return false;

    // 1. Exact match with ISO date (e.g. "2026-10-15")
    if (clean === date.isoDate.toLowerCase()) return true;

    // 2. Day number match (e.g. "15" or "05")
    const cleanDay = clean.replace(/^0+/, '');
    if (/^\d{1,2}$/.test(clean) && cleanDay === String(date.dayNumber)) return true;

    // 3. Month-day match (e.g. "10-15", "10/15", "15.10")
    const mStr = String(date.month).padStart(2, '0');
    const dStr = String(date.dayNumber).padStart(2, '0');
    if (
      clean === `${mStr}-${dStr}` ||
      clean === `${mStr}/${dStr}` ||
      clean === `${dStr}.${mStr}` ||
      clean === `${dStr}-${mStr}` ||
      date.isoDate.endsWith(`-${clean}`)
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Step 7: High-Speed Slot Sniping Loop on /appointment/time-slot
 * Features:
 *  - 1-Month Advance Scanning (inspects current month + advances 1 month ahead)
 *  - Priority Sorting: 'latest' (default, newest dates first) or 'earliest' (oldest dates first)
 *  - Preferred Date Prioritization: e.g. "2026-10-28", "28", or "10-28" tried first
 *  - Date Avoid List: skips user-configured blackout dates
 *  - ~140ms HTTP Decision Interception on POST /slots/{slotId}/reserve-slot
 */
export async function executeStep7(
  page: Page,
  options?: Step7Options
): Promise<Step7Result> {
  const currentUrl = await page.url();

  // 1. If already on payment page, slot is already secured!
  if (currentUrl.includes('/appointment/continue-payment')) {
    console.log('⚡ [Step 7] Already on continue-payment, slot is secured!');
    return {
      success: true,
      slotBooked: true,
      attemptsCount: 0,
      currentUrl: await page.url(),
    };
  }

  // 2. Ensure on /appointment/time-slot
  if (!currentUrl.includes('/appointment/time-slot')) {
    console.log('🌐 [Step 7] Navigating to https://appointment.ivacbd.com/appointment/time-slot...');
    await page.goto('https://appointment.ivacbd.com/appointment/time-slot');
    await page.waitForTimeout(1000);
  }

  console.log('📅 [Step 7] Initializing Calendar Scanner on /appointment/time-slot...');
  await page.waitForSelector(SELECTORS.calendarGrid, { timeout: 30000 });

  // Month navigation helpers
  const readCurrentMonthTitle = async (): Promise<string> => {
    const text = await page.locator(SELECTORS.monthTitle).first().innerText().catch(() => '');
    return (text || 'Current Month').trim();
  };

  let currentMonthOffset: 0 | 1 = 0;

  const navigateToMonthOffset = async (targetOffset: 0 | 1): Promise<boolean> => {
    if (currentMonthOffset === targetOffset) return true;

    if (targetOffset === 1) {
      const nextBtn = page.locator(SELECTORS.nextMonth).first();
      if ((await nextBtn.count()) > 0 && (await nextBtn.isVisible())) {
        console.log('📅 [Step 7] Advancing calendar 1 month ahead to inspect future dates...');
        await nextBtn.click().catch(() => {});
        await page.waitForTimeout(600);
        currentMonthOffset = 1;
        const newTitle = await readCurrentMonthTitle();
        console.log(`📅 [Step 7] Now viewing advance month: [${newTitle}]`);
        return true;
      }
    } else {
      const prevBtn = page.locator(SELECTORS.prevMonth).first();
      if ((await prevBtn.count()) > 0 && (await prevBtn.isVisible())) {
        console.log('📅 [Step 7] Returning calendar to base month view...');
        await prevBtn.click().catch(() => {});
        await page.waitForTimeout(600);
        currentMonthOffset = 0;
        const newTitle = await readCurrentMonthTitle();
        console.log(`📅 [Step 7] Now viewing base month: [${newTitle}]`);
        return true;
      }
    }
    return false;
  };

  const scanAvailableDateNumbers = async (): Promise<string[]> => {
    return await page.evaluate(() => {
      const grid = document.querySelector('.grid.grid-cols-7.gap-y-1') ||
        document.querySelector('.grid') ||
        document.querySelector('table.rdp-table');
      if (!grid) return [];
      const buttons = Array.from(grid.querySelectorAll('button:not([disabled])'));
      const list: string[] = [];
      for (const b of buttons) {
        const t = (b.textContent || '').trim();
        if (/^\d{1,2}$/.test(t) && !list.includes(t)) {
          list.push(t);
        }
      }
      return list;
    });
  };

  // Prepare avoid list and priority settings
  const rawPreferred = options?.preferredDate?.trim();
  const isSpecialKeyword = rawPreferred && (rawPreferred.toLowerCase() === 'earliest' || rawPreferred.toLowerCase() === 'latest');
  const cleanPreferredDate = rawPreferred && !isSpecialKeyword
    ? (rawPreferred.match(/\b(\d{1,2})\b/)?.[1] || rawPreferred).replace(/^0+/, '')
    : undefined;

  const dateOrder = options?.dateOrder || (isSpecialKeyword ? (rawPreferred!.toLowerCase() as 'latest' | 'earliest') : 'latest');
  const avoidList = (options?.avoidDates || [])
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  if (avoidList.length > 0) {
    console.log(`🚫 [Step 7] Avoid dates active: [${avoidList.join(', ')}]`);
  }
  if (cleanPreferredDate) {
    console.log(`🎯 [Step 7] Preferred date target configured: "${cleanPreferredDate}"`);
  }
  console.log(`🧭 [Step 7] Date ordering strategy: ${dateOrder.toUpperCase()}`);

  let attemptsCount = 0;
  let cycle = 1;
  const maxCycles = 15;
  const allDiscoveredIsoDates: string[] = [];

  while (cycle <= maxCycles) {
    console.log(`\n🔍 [Step 7] [Cycle ${cycle}/${maxCycles}] Scanning calendar dates across months...`);

    // ── Step A: Scan Month 0 (Current / Base Month) ──
    await navigateToMonthOffset(0);
    const title0 = await readCurrentMonthTitle();
    const days0 = await scanAvailableDateNumbers();
    const { year: y0, month: m0 } = parseIvacMonthYear(title0);
    const dates0: IvacAvailableDate[] = days0.map((d) => {
      const dayNum = parseInt(d, 10);
      return {
        dayNumber: dayNum,
        monthTitle: title0,
        year: y0,
        month: m0,
        isoDate: `${y0}-${String(m0).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        monthOffset: 0,
        timestamp: Date.UTC(y0, m0 - 1, dayNum),
        rawText: d,
      };
    });

    // ── Step B: Scan Month 1 (1 Month Advance) ──
    let dates1: IvacAvailableDate[] = [];
    const hasNextMonth = await navigateToMonthOffset(1);
    if (hasNextMonth) {
      const title1 = await readCurrentMonthTitle();
      const days1 = await scanAvailableDateNumbers();
      const { year: y1, month: m1 } = parseIvacMonthYear(title1);
      dates1 = days1.map((d) => {
        const dayNum = parseInt(d, 10);
        return {
          dayNumber: dayNum,
          monthTitle: title1,
          year: y1,
          month: m1,
          isoDate: `${y1}-${String(m1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
          monthOffset: 1,
          timestamp: Date.UTC(y1, m1 - 1, dayNum),
          rawText: d,
        };
      });
    }

    const allAvailableDates = [...dates0, ...dates1];
    allAvailableDates.forEach((d) => {
      if (!allDiscoveredIsoDates.includes(d.isoDate)) {
        allDiscoveredIsoDates.push(d.isoDate);
      }
    });

    if (allAvailableDates.length === 0) {
      console.warn(`⚠️ [Step 7] No open dates currently found in [${title0}] or advance month. Refreshing /time-slot page to reload backend slots...`);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      currentMonthOffset = 0;
      await page.waitForTimeout(5000);
      await page.waitForSelector(SELECTORS.calendarGrid, { timeout: 15000 }).catch(() => {});
      cycle++;
      continue;
    }

    // ── Step C: Filter out Avoided Dates & Specific Target Dates ──
    let eligibleDates = allAvailableDates.filter((d) => !isIvacDateAvoided(d, avoidList));

    if (options?.targetDates && options.targetDates.length > 0) {
      eligibleDates = eligibleDates.filter((d) =>
        options.targetDates!.some((t) => d.isoDate === t || String(d.dayNumber) === t.replace(/^0+/, ''))
      );
    }

    if (eligibleDates.length === 0) {
      console.warn(`⚠️ [Step 7] All ${allAvailableDates.length} open date(s) matched the avoid list: [${avoidList.join(', ')}]. Waiting 10s...`);
      await navigateToMonthOffset(0);
      await page.waitForTimeout(10000);
      cycle++;
      continue;
    }

    // ── Step D: Sort according to strategy (Default: Latest ➔ Earliest) ──
    if (dateOrder === 'latest') {
      eligibleDates.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      eligibleDates.sort((a, b) => a.timestamp - b.timestamp);
    }

    // ── Step E: Prioritize Exact Preferred Date if configured ──
    if (cleanPreferredDate) {
      const matchIdx = eligibleDates.findIndex(
        (d) =>
          d.isoDate === cleanPreferredDate ||
          String(d.dayNumber) === cleanPreferredDate.replace(/^0+/, '') ||
          d.isoDate.endsWith(`-${cleanPreferredDate}`)
      );
      if (matchIdx > -1) {
        const [preferredMatch] = eligibleDates.splice(matchIdx, 1);
        eligibleDates.unshift(preferredMatch);
        console.log(`🎯 [Step 7] Preferred date [${preferredMatch.isoDate}] prioritized to FIRST attempt position!`);
      }
    }

    console.log(`\n📋 [Step 7] Eligible dates sorted for sniping (${dateOrder.toUpperCase()}):`);
    eligibleDates.forEach((d, i) => console.log(`   ${i + 1}. ${d.isoDate} (${d.monthTitle})`));

    // ── Step F: High-Speed Sniping Loop with 140ms Interception ──
    for (let i = 0; i < eligibleDates.length; i++) {
      const targetDate = eligibleDates[i];
      attemptsCount++;
      console.log(`\n⚡ [Step 7] [Attempt #${attemptsCount}] Targeting: ${targetDate.isoDate} (Month Offset: ${targetDate.monthOffset})...`);

      // 1. Navigate to month offset if required
      if (currentMonthOffset !== targetDate.monthOffset) {
        await navigateToMonthOffset(targetDate.monthOffset);
        await page.waitForTimeout(400);
      }

      // 2. Click the date button in DOM
      const dateClicked = await page.evaluate((dayNumber: number) => {
        const grid = document.querySelector('.grid.grid-cols-7.gap-y-1') ||
          document.querySelector('.grid') ||
          document.querySelector('table.rdp-table');
        if (!grid) return false;
        const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
        const match = buttons.find((b) => (b.textContent || '').trim().replace(/^0+/, '') === String(dayNumber));
        if (match) {
          match.click();
          return true;
        }
        return false;
      }, targetDate.dayNumber);

      if (!dateClicked) {
        await clickButtonSafe(page, {
          selector: '.grid button:not([disabled])',
          textPattern: new RegExp(`^0*${targetDate.dayNumber}$`),
          timeoutMs: 2000,
        });
      }

      await page.waitForTimeout(300);

      // Solve Turnstile if interactive challenge is active for slot confirmation
      console.log('⏳ [Step 7] Checking Turnstile resolution before slot reservation...');
      await handleCloudflareTurnstile(page, 10000);
      await waitForEnabled(page, 'button', 8000);

      // 3. Prepare response interception BEFORE clicking submit
      const reservePromise = waitForResponse(
        page,
        (res: Response) => res.url().includes('/reserve-slot') && res.status() !== 0,
        10000
      ).catch(() => null);

      // 4. Click "Continue Booking"
      const clickedContinue = await clickButtonSafe(page, {
        selector: 'button',
        textPattern: /continue booking|confirm booking/i,
        timeoutMs: 8000,
        waitForEnabled: true,
      });

      if (!clickedContinue) {
        console.warn('⚠️ [Step 7] Continue Booking button not visible/clickable, checking next date...');
        continue;
      }

      // 5. Intercept raw HTTP response in ~140ms
      const startRes = Date.now();
      const response = await reservePromise;
      const duration = Date.now() - startRes;

      if (!response) {
        // Fallback: check if page already navigated to continue-payment
        const u = await page.url();
        if (u.includes('/continue-payment') || u.includes('/invoice') || u.includes('/payment')) {
          console.log(`\n🎉 [Step 7] SLOT SECURED! Navigated directly to payment page: ${u}`);
          return {
            success: true,
            slotBooked: true,
            bookedDate: targetDate.isoDate,
            reservationId: 'Direct-Navigation',
            reserveTtlSeconds: 660,
            availableDatesFound: allDiscoveredIsoDates,
            attemptsCount,
            currentUrl: u,
          };
        }
        console.warn(`⏱️ [Step 7] Timed out waiting for /reserve-slot response for ${targetDate.isoDate}`);
        console.log('⏳ [Step 7] Rate-limit protection: Sleeping 15s to safeguard session & prevent OTP loss...');
        await page.waitForTimeout(15000);
        continue;
      }

      let resJson: any = {};
      try {
        resJson = await response.json();
      } catch {
        // Non-JSON
      }

      console.log(`📡 [Step 7] /reserve-slot returned in ${duration}ms with status: "${resJson.status || response.status()}"`);

      // 6. Decision logic:
      if (resJson.status === 'SUCCESS' || resJson.reservationId) {
        const reservationId = resJson.reservationId || resJson.data?.reservationId || 'Reserved';
        const ttl = resJson.reserveTtlSeconds || 660;
        console.log(`\n🎉 [Step 7] SLOT SECURED SUCCESSFULLY!`);
        console.log(`   Reservation ID:   ${reservationId}`);
        console.log(`   Appointment Date: ${targetDate.isoDate}`);
        console.log(`   Holding TTL:      ${ttl} seconds (~11 minutes)`);

        // Wait for page to navigate to continue-payment
        const finalUrl = await waitForUrlCondition(page, (u) => u.includes('/appointment/continue-payment'), 10000);

        return {
          success: true,
          slotBooked: true,
          bookedDate: targetDate.isoDate,
          reservationId,
          reserveTtlSeconds: ttl,
          availableDatesFound: allDiscoveredIsoDates,
          attemptsCount,
          currentUrl: finalUrl,
        };
      }

      // Slot is FULL / Unavailable -> Pause 15 seconds to prevent rate-limiting, session termination, & OTP burnout
      console.log(`❌ [Step 7] Slot ${targetDate.isoDate} is not available (FULL).`);

      // Check if session got logged out
      const postAttemptUrl = await page.url();
      if (
        postAttemptUrl.includes('/signin') ||
        postAttemptUrl.includes('/login') ||
        postAttemptUrl.includes('/verify-login-phone-otp')
      ) {
        console.error(`💥 [Step 7] Session expired / logged out! Portal redirected to: ${postAttemptUrl}`);
        return {
          success: false,
          slotBooked: false,
          availableDatesFound: allDiscoveredIsoDates,
          attemptsCount,
          currentUrl: postAttemptUrl,
          error: 'Session logged out during slot reservation.',
        };
      }

      console.log(`⏳ [Step 7] Rate-limit cooldown: Sleeping 15s before attempting next slot to prevent logout & protect daily OTP quota...`);
      await page.waitForTimeout(15000);
    }

    // Cooling delay between full cycles
    console.log(`⏳ [Step 7] Completed cycle ${cycle}. Pausing 15s before starting next scan cycle...`);
    await page.waitForTimeout(15000);
    cycle++;
  }

  return {
    success: false,
    slotBooked: false,
    availableDatesFound: allDiscoveredIsoDates,
    attemptsCount,
    currentUrl: await page.url(),
    error: `Exhausted ${attemptsCount} attempts across ${allDiscoveredIsoDates.length} discovered dates. All tested slots returned FULL.`,
  };
}
