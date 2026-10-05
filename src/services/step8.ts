import { type Page } from '@browserbasehq/stagehand';
import { Step8StayDetailsProfile, Step4VisaReferencesProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step8Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Resolves Stay Details on BangladeshDetails from Step 8 or directly from Step 4 India Reference.
 * - Hotel Name: from India Reference Name (sanitized to alphabets & spaces, max 50 chars)
/**
 * Smartly shortens an Indian address to fit within the strict 50-character limit of the government portal.
 * 1. Removes multiple whitespace.
 * 2. Applies standard postal abbreviations (NEAR -> NR, STREET -> ST, ROAD -> RD, OPPOSITE -> OPP, etc.).
 * 3. If still > 50 characters, truncates cleanly at a comma or word boundary rather than cutting a word in half.
 */
export function smartShortenAddress(addr: string, maxLen = 50): string {
  let clean = (addr || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;

  const abbrevs: Array<[RegExp, string]> = [
    [/\bSTREET\b/gi, 'ST'],
    [/\bROAD\b/gi, 'RD'],
    [/\bNEAR\b/gi, 'NR'],
    [/\bOPPOSITE\b/gi, 'OPP'],
    [/\bAVENUE\b/gi, 'AVE'],
    [/\bBUILDING\b/gi, 'BLDG'],
    [/\bAPARTMENT\b/gi, 'APT'],
    [/\bBEHIND\b/gi, 'BH'],
    [/\bBLOCK\b/gi, 'BLK'],
    [/\bFLOOR\b/gi, 'FLR'],
  ];

  for (const [regex, rep] of abbrevs) {
    clean = clean.replace(regex, rep).replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
  }

  // If still exceeds maxLen, truncate at the last comma or space boundary
  if (clean.length > maxLen) {
    const sub = clean.slice(0, maxLen);
    const lastComma = sub.lastIndexOf(',');
    if (lastComma > 25) {
      clean = sub.slice(0, lastComma).trim();
    } else {
      const lastSpace = sub.lastIndexOf(' ');
      if (lastSpace > 25) {
        clean = sub.slice(0, lastSpace).trim();
      } else {
        clean = sub.trim();
      }
    }
  }

  return clean;
}

/**
 * Resolves Stay Details on BangladeshDetails from Step 8 or directly from Step 4 India Reference.
 * - Hotel Name: from India Reference Name (sanitized to alphabets & spaces, max 50 chars)
 * - Address: from India Reference Address (smartly shortened to max 50 chars without cutting words)
 * - State: from India Reference State
 * - District: from India Reference District
 * - Phone: from India Reference Phone
 * - Email: empty as requested
 */
export function resolveStayDetails(
  stayDetails?: Partial<Step8StayDetailsProfile>,
  step4References?: Step4VisaReferencesProfile
): Step8StayDetailsProfile {
  const rawHotel = stayDetails?.hotelName || step4References?.referenceNameIndia || 'HOTEL';
  const hotelName = rawHotel.replace(/[^A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50) || 'HOTEL';

  const rawAddr = stayDetails?.address || step4References?.referenceAddressIndiaLine1 || step4References?.referenceAddressIndia || '';
  const address = smartShortenAddress(rawAddr, 50);

  const state = (stayDetails?.state || step4References?.referenceStateIndia || 'WEST BENGAL').toUpperCase().trim();
  const district = (stayDetails?.district || step4References?.referenceDistrictIndia || 'KOLKATA').toUpperCase().trim();
  const phone = (stayDetails?.phone || step4References?.referencePhoneIndia || '').replace(/[^0-9+()-\s]/g, '').slice(0, 15).trim();
  const email = stayDetails?.email || '';

  return {
    hotelName,
    address,
    state,
    district,
    phone,
    email,
  };
}

/**
 * Automates Step 8: Visit Details / Hotel Stay on indianvisa-bangladesh.nic.in/visa/BangladeshDetails
 * Handles cascading State -> District AJAX population and fills hotel particulars directly
 * from India Reference without requiring separate manual inputs.
 */
export async function executeStep8(
  page: Page,
  stayDetails?: Partial<Step8StayDetailsProfile>,
  step4References?: Step4VisaReferencesProfile
): Promise<Step8Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/BangladeshDetails')) {
    throw new Error(`Expected to be on /visa/BangladeshDetails, but currently on: ${currentUrl}`);
  }

  const resolved = resolveStayDetails(stayDetails, step4References);
  console.log(`🏨 [Step 8] Filling Stay & Hotel: "${resolved.hotelName}", State: "${resolved.state}", Dist: "${resolved.district}", Phone: "${resolved.phone}"`);

  // Ensure DOM is ready
  await page.waitForSelector('#place_of_stay1', { timeout: 15000 });
  await page.waitForTimeout(400);

  // 1. Fill Hotel Name, Address, Phone, and Email (empty)
  await page.evaluate((data: { hotelName: string; address: string; phone: string; email: string }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const hotel = document.querySelector('#place_of_stay1') as HTMLInputElement | null;
    const addr = document.querySelector('#pos_address1') as HTMLInputElement | null;
    const phone = document.querySelector('#pos_phone1') as HTMLInputElement | null;
    const email = document.querySelector('#pos_email1') as HTMLInputElement | null;

    if (hotel) {
      hotel.value = data.hotelName;
      hotel.dispatchEvent(new Event('input', { bubbles: true }));
      hotel.dispatchEvent(new Event('change', { bubbles: true }));
      win.$?.(hotel).trigger('input').trigger('change');
    }
    if (addr) {
      addr.value = data.address;
      addr.dispatchEvent(new Event('input', { bubbles: true }));
      addr.dispatchEvent(new Event('change', { bubbles: true }));
      win.$?.(addr).trigger('input').trigger('change');
    }
    if (phone) {
      phone.value = data.phone;
      phone.dispatchEvent(new Event('input', { bubbles: true }));
      phone.dispatchEvent(new Event('change', { bubbles: true }));
      win.$?.(phone).trigger('input').trigger('change');
    }
    if (email) {
      email.value = data.email;
      email.dispatchEvent(new Event('input', { bubbles: true }));
      email.dispatchEvent(new Event('change', { bubbles: true }));
      win.$?.(email).trigger('input').trigger('change');
    }
  }, safeArg({
    hotelName: resolved.hotelName,
    address: resolved.address,
    phone: resolved.phone,
    email: resolved.email || '',
  }));

  // 2. Select State (triggers AJAX district population)
  await page.evaluate((stateName: string) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const stateSelect = document.querySelector('#pos_state_id1') as HTMLSelectElement | null;
    if (stateSelect && stateName) {
      let matchedVal = '';
      for (let i = 0; i < stateSelect.options.length; i++) {
        const opt = stateSelect.options[i];
        if (
          opt.value.toUpperCase() === stateName.toUpperCase() ||
          opt.text.toUpperCase() === stateName.toUpperCase() ||
          opt.text.toUpperCase().includes(stateName.toUpperCase()) ||
          opt.value.toUpperCase().includes(stateName.toUpperCase())
        ) {
          matchedVal = opt.value;
          break;
        }
      }
      if (matchedVal) {
        stateSelect.value = matchedVal;
        stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof win.$ === 'function') {
          win.$(stateSelect).trigger('change');
          // Directly call portal fetchDistrict helper if defined
          if (typeof (win as any).fetchDistrict === 'function') {
            (win as any).fetchDistrict(matchedVal, win.$('#pos_dist_id1'));
          }
        }
      }
    }
  }, resolved.state);

  // Wait for District dropdown to populate via AJAX
  await page.waitForTimeout(1500);

  // 3. Select District
  await page.evaluate((distName: string) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const distSelect = document.querySelector('#pos_dist_id1') as HTMLSelectElement | null;
    if (distSelect && distName) {
      let matchedVal = '';
      for (let i = 0; i < distSelect.options.length; i++) {
        const opt = distSelect.options[i];
        if (
          opt.value.toUpperCase() === distName.toUpperCase() ||
          opt.text.toUpperCase() === distName.toUpperCase() ||
          opt.text.toUpperCase().includes(distName.toUpperCase()) ||
          opt.value.toUpperCase().includes(distName.toUpperCase())
        ) {
          matchedVal = opt.value;
          break;
        }
      }
      if (matchedVal) {
        distSelect.value = matchedVal;
        distSelect.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof win.$ === 'function') win.$(distSelect).trigger('change');
      }
    }
  }, resolved.district);

  await page.waitForTimeout(400);

  // 4. Mark submit clicked and Continue
  await page.evaluate(() => {
    const win = window as unknown as IndianVisaPortalWindow;
    win.$?.('input[type=submit]').removeAttr('clicked');
    win.$?.('#continue').attr('clicked', 'true');
  });

  await page.locator('#continue').click();
  await page.waitForTimeout(3000);

  const finalUrl = await page.url();
  return {
    success: finalUrl.includes('/visa/Verification') || !finalUrl.includes('/visa/BangladeshDetails'),
    currentUrl: finalUrl,
  };
}
