import { type Page } from '@browserbasehq/stagehand';
import { Step3FamilyAddressProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step3Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 3: Family Details & Address on indianvisa-bangladesh.nic.in/visa/FamilyDetails
 */
export async function executeStep3(
  page: Page,
  details: Step3FamilyAddressProfile,
  action: 'continue' | 'exit' = 'continue'
): Promise<Step3Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/FamilyDetails')) {
    throw new Error(`Expected to be on /visa/FamilyDetails, but currently on: ${currentUrl}`);
  }

  // Auto-suppress / auto-accept any modal popups (e.g. Grandparent Pakistan prompt)
  await page.evaluate(() => {
    window.confirm = (msg?: string) => {
      console.log('[Step 3 Auto-confirmed]:', msg);
      return true;
    };
    window.alert = (msg?: string) => {
      console.log('[Step 3 Auto-dismissed]:', msg);
    };
  });

  // 1. Present Address & Permanent Address
  await page.waitForSelector('#pres_add1', { timeout: 15000 });
  await page.evaluate((data: {
    add1: string;
    add2: string;
    country: string;
    district: string;
    pincode: string;
    phone: string;
    isd: string;
    mobile: string;
    sameAddress: boolean;
    permAdd1?: string;
    permAdd2?: string;
    permDistrict?: string;
  }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const add1El = document.getElementById('pres_add1') as HTMLInputElement;
    if (add1El) add1El.value = data.add1.substring(0, 35);

    const add2El = document.getElementById('pres_add2') as HTMLInputElement;
    if (add2El) add2El.value = data.add2;

    const countryEl = document.getElementById('pres_country') as HTMLSelectElement;
    if (countryEl) {
      countryEl.value = data.country;
      win.$?.(countryEl).trigger('change');
    }

    const distEl = document.getElementById('pres_add3') as HTMLInputElement;
    if (distEl) distEl.value = data.district;

    const pinEl = document.getElementById('pincode') as HTMLInputElement;
    if (pinEl) pinEl.value = data.pincode;

    const phoneEl = document.getElementById('pres_phone') as HTMLInputElement;
    if (phoneEl) phoneEl.value = data.phone;

    const isdEl = document.getElementById('isd_code1') as HTMLSelectElement;
    if (isdEl) {
      const targetIsd = data.isd || '880';
      isdEl.value = targetIsd;
      for (let i = 0; i < isdEl.options.length; i++) {
        if (isdEl.options[i].value === targetIsd || isdEl.options[i].text.includes(targetIsd)) {
          isdEl.selectedIndex = i;
          break;
        }
      }
      win.$?.(isdEl).trigger('change');
    }

    const mobEl = document.getElementById('mobile') as HTMLInputElement;
    if (mobEl) {
      const rawMobile = data.mobile || data.phone || '';
      mobEl.value = rawMobile.replace(/^0+/, '');
    }

    const sameEl = document.getElementById('sameAddress_id') as HTMLInputElement;
    if (sameEl) {
      sameEl.checked = data.sameAddress;
      if (data.sameAddress && typeof win.copyAddress === 'function') {
        win.copyAddress();
      }
    }

    if (!data.sameAddress && data.permAdd1) {
      const p1 = document.getElementById('perm_address1') as HTMLInputElement;
      if (p1) p1.value = data.permAdd1;
      const p2 = document.getElementById('perm_address2') as HTMLInputElement;
      if (p2 && data.permAdd2) p2.value = data.permAdd2;
      const p3 = document.getElementById('perm_address3') as HTMLInputElement;
      if (p3 && data.permDistrict) p3.value = data.permDistrict;
    }
  }, safeArg({
    add1: details.presentAddressLine1,
    add2: details.presentCity,
    country: details.presentCountry,
    district: details.presentStateDistrict,
    pincode: details.postalCode,
    phone: details.phone,
    isd: details.mobileIsdCode || '880',
    mobile: details.mobile,
    sameAddress: details.sameAddress,
    permAdd1: details.permanentAddressLine1,
    permAdd2: details.permanentCity,
    permDistrict: details.permanentStateDistrict,
  }));

  // 2. Father's Details
  await page.evaluate((data: { name: string; nat: string; prevNat?: string; place: string; country: string }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const fName = document.getElementById('fthrname') as HTMLInputElement;
    if (fName) fName.value = data.name;

    const fNat = document.getElementById('father_nationality') as HTMLSelectElement;
    if (fNat) {
      fNat.value = data.nat;
      win.$?.(fNat).trigger('change');
    }

    const fPrevNat = document.getElementById('father_previous_nationality') as HTMLSelectElement;
    if (fPrevNat) {
      fPrevNat.value = data.prevNat || data.nat;
      win.$?.(fPrevNat).trigger('change');
    }

    const fPlace = document.getElementById('father_place_of_birth') as HTMLInputElement;
    if (fPlace) fPlace.value = data.place;

    const fCountry = document.getElementById('father_country_of_birth') as HTMLSelectElement;
    if (fCountry) {
      fCountry.value = data.country;
      win.$?.(fCountry).trigger('change');
    }
  }, safeArg({
    name: details.fatherName,
    nat: details.fatherNationality,
    prevNat: details.fatherPreviousNationality,
    place: details.fatherBirthPlace,
    country: details.fatherCountryOfBirth,
  }));

  // 3. Mother's Details
  await page.evaluate((data: { name: string; nat: string; prevNat?: string; place: string; country: string }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const mName = document.getElementById('mother_name') as HTMLInputElement;
    if (mName) mName.value = data.name;

    const mNat = document.getElementById('mother_nationality') as HTMLSelectElement;
    if (mNat) {
      mNat.value = data.nat;
      win.$?.(mNat).trigger('change');
    }

    const mPrevNat = document.getElementById('mother_previous_nationality') as HTMLSelectElement;
    if (mPrevNat) {
      mPrevNat.value = data.prevNat || data.nat;
      win.$?.(mPrevNat).trigger('change');
    }

    const mPlace = document.getElementById('mother_place_of_birth') as HTMLInputElement;
    if (mPlace) mPlace.value = data.place;

    const mCountry = document.getElementById('mother_country_of_birth') as HTMLSelectElement;
    if (mCountry) {
      mCountry.value = data.country;
      win.$?.(mCountry).trigger('change');
    }
  }, safeArg({
    name: details.motherName,
    nat: details.motherNationality,
    prevNat: details.motherPreviousNationality,
    place: details.motherBirthPlace,
    country: details.motherCountryOfBirth,
  }));

  // 4. Marital Status & Grandparents
  await page.evaluate((data: { marital: string; grandPakistan: boolean; grandDetails?: string }) => {
    window.confirm = () => true;
    window.alert = () => {};

    const win = window as unknown as IndianVisaPortalWindow;
    const maritalEl = document.getElementById('marital_status') as HTMLSelectElement;
    if (maritalEl) {
      maritalEl.value = data.marital === 'MARRIED' ? '0' : '1';
      win.$?.(maritalEl).trigger('change');
    }

    if (data.grandPakistan) {
      const g1 = document.getElementById('grandparent_flag1') as HTMLInputElement;
      if (g1) {
        g1.checked = true;
        win.$?.(g1).trigger('change');
      }
      const gDet = document.getElementById('grandparent_details') as HTMLInputElement;
      if (gDet && data.grandDetails) gDet.value = data.grandDetails;
    } else {
      const g2 = document.getElementById('grandparent_flag2') as HTMLInputElement;
      if (g2) {
        g2.checked = true;
        win.$?.(g2).trigger('change');
      }
    }
  }, safeArg({
    marital: details.maritalStatus,
    grandPakistan: details.grandparentsPakistanOrigin,
    grandDetails: details.grandparentsPakistanDetails,
  }));

  // 5. Profession / Occupation Details
  await page.evaluate((data: {
    occ: string;
    pastOcc?: string | null;
    empName: string;
    desig: string;
    empAdd: string;
    phone: string;
    military: boolean;
    prevOrgName?: string;
    prevDesig?: string;
    prevRank?: string;
    prevPosting?: string;
  }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const occEl = document.getElementById('occupation') as HTMLSelectElement;
    if (occEl) {
      occEl.value = data.occ;
      win.$?.(occEl).trigger('change');
    }

    // Past Occupation, if any: if null or empty, don't change. If provided, select it!
    if (data.pastOcc && typeof data.pastOcc === 'string' && data.pastOcc.trim() !== '') {
      const prevOccEl = document.getElementById('previous_occupation') as HTMLSelectElement;
      if (prevOccEl) {
        const targetOcc = data.pastOcc.trim().toUpperCase();
        for (let i = 0; i < prevOccEl.options.length; i++) {
          const opt = prevOccEl.options[i];
          if (
            opt.value.trim().toUpperCase() === targetOcc ||
            opt.text.trim().toUpperCase() === targetOcc
          ) {
            prevOccEl.selectedIndex = i;
            prevOccEl.value = opt.value;
            win.$?.(prevOccEl).trigger('change');
            break;
          }
        }
      }
    }

    const empNameEl = document.getElementById('empname') as HTMLInputElement;
    if (empNameEl && data.empName) {
      // Portal requires letters and spaces only, max 50 chars
      empNameEl.value = data.empName.replace(/[^A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);
      win.$?.(empNameEl).trigger('input').trigger('change');
    }

    const desigEl = (
      document.getElementById('empdesignation') ||
      document.getElementById('designation') ||
      document.getElementById('emp_designation') ||
      document.querySelector('input[name="empdesignation"]') ||
      document.querySelector('input[name="designation"]') ||
      document.querySelector('input[name="emp_designation"]')
    ) as HTMLInputElement;

    const finalDesig = (data.desig || '').trim();
    if (desigEl && finalDesig) {
      // Portal requires letters and spaces only, max 50 chars
      desigEl.value = finalDesig.replace(/[^A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);
      win.$?.(desigEl).trigger('input').trigger('change');
      try {
        desigEl.dispatchEvent(new Event('input', { bubbles: true }));
        desigEl.dispatchEvent(new Event('change', { bubbles: true }));
      } catch {}
    }

    const empAddEl = document.getElementById('empaddress') as HTMLInputElement;
    if (empAddEl && data.empAdd) {
      // Portal strictly requires: /^[0-9a-zA-Z-\s/,#]+$/ (max 50 chars, NO DOTS ALLOWED)
      const cleanAddr = data.empAdd
        .replace(/\./g, ' ') // replace dots with space (.DOHS -> DOHS)
        .replace(/[^0-9a-zA-Z\s/,\-#]/g, ' ') // remove other disallowed symbols
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50);
      empAddEl.value = cleanAddr;
      win.$?.(empAddEl).trigger('input').trigger('change');
    }

    const phoneEl = document.getElementById('empphone') as HTMLInputElement;
    if (phoneEl) {
      phoneEl.value = (data.phone || '').replace(/[^0-9+()-\s]/g, '').slice(0, 15).trim();
      win.$?.(phoneEl).trigger('input').trigger('change');
    }

    if (data.military) {
      const org1 = document.getElementById('prev_org1') as HTMLInputElement;
      if (org1) {
        org1.checked = true;
        win.$?.(org1).trigger('change');
      }
      const orgName = document.getElementById('previous_organization') as HTMLInputElement;
      if (orgName && data.prevOrgName) orgName.value = data.prevOrgName;

      const des = document.getElementById('previous_designation') as HTMLInputElement;
      if (des && data.prevDesig) des.value = data.prevDesig;

      const rnk = document.getElementById('previous_rank') as HTMLInputElement;
      if (rnk && data.prevRank) rnk.value = data.prevRank;

      const pst = document.getElementById('previous_posting') as HTMLInputElement;
      if (pst && data.prevPosting) pst.value = data.prevPosting;
    } else {
      const org2 = document.getElementById('prev_org2') as HTMLInputElement;
      if (org2) {
        org2.checked = true;
        win.$?.(org2).trigger('change');
      }
    }
  }, safeArg({
    occ: details.occupation,
    pastOcc: details.pastOccupation,
    empName: details.employerName,
    desig: details.designation,
    empAdd: details.employerAddress,
    phone: details.employerPhone || details.phone || '',
    military: details.previousOrganizationMilitary,
    prevOrgName: details.previousOrganizationName,
    prevDesig: details.previousDesignation,
    prevRank: details.previousRank,
    prevPosting: details.previousPosting,
  }));

  // 6. Submit or Exit
  const buttonSelector = action === 'continue' ? '#continue' : '#exit';

  await page.evaluate((btnId: string) => {
    const win = window as unknown as IndianVisaPortalWindow;
    win.$?.('input[type=submit]').removeAttr('clicked');
    win.$?.(btnId).attr('clicked', 'true');
  }, buttonSelector);

  await page.locator(buttonSelector).click();
  await page.waitForTimeout(3000);

  const finalUrl = await page.url();
  return {
    success: !finalUrl.includes('/visa/FamilyDetails') || action === 'exit',
    currentUrl: finalUrl,
  };
}
