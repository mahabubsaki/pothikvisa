import { type Page } from '@browserbasehq/stagehand';
import { Step4VisaReferencesProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow, InPageEvalResult } from './portalBrowserTypes';

export interface Step4Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 4: Visa Details & References on indianvisa-bangladesh.nic.in/visa/VisaDetails
 */
export async function executeStep4(
  page: Page,
  details: Step4VisaReferencesProfile,
  action: 'continue' | 'exit' = 'continue'
): Promise<Step4Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/VisaDetails')) {
    throw new Error(`Expected to be on /visa/VisaDetails, but currently on: ${currentUrl}`);
  }

  // 0. Ensure page DOM and main inputs are fully loaded
  console.log('  [Step 4.0] Waiting for #duration selector...');
  await page.waitForSelector('#duration', { timeout: 15000 });
  await page.waitForTimeout(600);

  // Auto-suppress / auto-accept any modal popups (confirm/alert)
  console.log('  [Step 4.0] Suppressing popups in page context...');
  await page.evaluate(() => {
    window.confirm = () => true;
    window.alert = () => {};
  });

  // 1. Places to visit, duration, entries, arrival & exit ports
  console.log('  [Step 4.1] Filling places to visit, duration, entries & ports...');
  const res1 = await page.evaluate((data: {
    place1: string;
    place2?: string;
    duration: string | number;
    entries: string;
    portArrival: string;
    portExit: string;
  }) => {
    try {
      const win = window as unknown as IndianVisaPortalWindow;

      // Robust selector for Places to be Visited (Line 1 & Line 2)
      // 1. Query by official portal class .service_req_form_val
      const byClass = Array.from(document.querySelectorAll('.service_req_form_val')) as HTMLInputElement[];
      // 2. Query by input name service_req_form_values
      const byName = Array.from(document.querySelectorAll('input[name="service_req_form_values"]')) as HTMLInputElement[];
      // 3. Query by ID prefix visa_serreq_id_
      const byIdPrefix = Array.from(document.querySelectorAll('input[id^="visa_serreq_id_"]')) as HTMLInputElement[];
      // 4. Query by table rows near "Places to be Visited"
      const allRows = Array.from(document.querySelectorAll('tr'));
      const byRow: HTMLInputElement[] = [];
      for (let r = 0; r < allRows.length; r++) {
        const text = allRows[r].innerText || '';
        if (text.includes('Places to be Visited')) {
          byRow.push(...(Array.from(allRows[r].querySelectorAll('input[type="text"]')) as HTMLInputElement[]));
          if (allRows[r + 1]) {
            byRow.push(...(Array.from(allRows[r + 1].querySelectorAll('input[type="text"]')) as HTMLInputElement[]));
          }
          break;
        }
      }

      const placeInputs: HTMLInputElement[] = (byClass.length >= 2 ? byClass
        : byName.length >= 2 ? byName
        : byIdPrefix.length >= 2 ? byIdPrefix
        : byRow.length >= 2 ? byRow
        : [
            document.getElementById('visa_serreq_id_112'),
            document.getElementById('visa_serreq_id_334'),
          ].filter(Boolean)) as HTMLInputElement[];

      const p1 = (document.getElementById('visa_serreq_id_112') as HTMLInputElement | null) ||
                 placeInputs[0] ||
                 (document.querySelector('input[name="service_req_form_values"]') as HTMLInputElement | null);
      const p2 = (document.getElementById('visa_serreq_id_334') as HTMLInputElement | null) ||
                 placeInputs[1] ||
                 (document.querySelectorAll('input[name="service_req_form_values"]')[1] as HTMLInputElement | null);

      const fillTextInput = (el: HTMLInputElement | null, rawVal: string | undefined) => {
        if (!el || rawVal === undefined || rawVal === null) return;
        const val = rawVal.toString().trim().toUpperCase();
        el.focus();
        el.value = val;
        if (typeof win.$ === 'function' && win.$) {
          win.$(el).val(val);
          win.$(el).trigger('input');
          win.$(el).trigger('change');
        } else {
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      if (data.place1) {
        fillTextInput(p1, data.place1);
      }
      if (data.place2) {
        fillTextInput(p2, data.place2);
      } else if (p2 && (!p2.value || p2.value.trim() === '')) {
        fillTextInput(p2, 'NA');
      }

      const dur = document.getElementById('duration') as HTMLInputElement;
      if (dur) {
        dur.focus();
        dur.value = String(data.duration);
        if (typeof win.$ === 'function' && win.$) {
          win.$(dur).val(String(data.duration));
          win.$(dur).trigger('input');
          win.$(dur).trigger('change');
        } else {
          dur.dispatchEvent(new Event('input', { bubbles: true }));
          dur.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const selectTargets = [
        { id: 'visa_entry_id', val: data.entries },
        { id: 'entrypoint', val: data.portArrival },
        { id: 'exitpointprc', val: data.portExit },
      ];

      for (let s = 0; s < selectTargets.length; s++) {
        const item = selectTargets[s];
        const el = document.getElementById(item.id) as HTMLSelectElement | null;
        if (!el || !item.val) continue;
        const normalized = item.val.trim().toUpperCase();

        let matchedVal = item.val;
        let targetKeyword = '';
        if (el.id === 'visa_entry_id') {
          // Indian Visa Portal option values:
          // Value '1' -> text 'SINGLE'
          // Value '2' -> text 'MULTIPLE'
          // Value '3' -> text 'DOUBLE'
          // Value '4' -> text 'TRIPLE'
          if (normalized === '1' || normalized === 'SINGLE' || normalized.includes('SINGLE')) {
            matchedVal = '1';
            targetKeyword = 'SINGLE';
          } else if (normalized === '2' || normalized === 'MULTIPLE' || normalized.includes('MULTIPLE') || normalized.includes('একাধিক')) {
            matchedVal = '2';
            targetKeyword = 'MULTIPLE';
          } else if (normalized === '3' || normalized === 'DOUBLE' || normalized.includes('DOUBLE') || normalized.includes('দুই')) {
            matchedVal = '3';
            targetKeyword = 'DOUBLE';
          } else if (normalized === '4' || normalized === 'TRIPLE' || normalized.includes('TRIPLE') || normalized.includes('তিন')) {
            matchedVal = '4';
            targetKeyword = 'TRIPLE';
          }
        }

        let selected = false;
        // Priority 1: Match by exact option value or option text
        for (let i = 0; i < el.options.length; i++) {
          const opt = el.options[i];
          const optVal = opt.value.trim().toUpperCase();
          const optText = opt.text.trim().toUpperCase();
          if (
            optVal === matchedVal.trim().toUpperCase() ||
            optText === normalized ||
            optVal === normalized
          ) {
            el.selectedIndex = i;
            el.value = opt.value;
            selected = true;
            break;
          }
        }

        // Priority 2: For visa_entry_id, match by target keyword (e.g. MULTIPLE, DOUBLE)
        if (!selected && el.id === 'visa_entry_id' && targetKeyword) {
          for (let i = 0; i < el.options.length; i++) {
            const optText = el.options[i].text.trim().toUpperCase();
            if (optText.includes(targetKeyword)) {
              el.selectedIndex = i;
              el.value = el.options[i].value;
              selected = true;
              break;
            }
          }
        }

        if (typeof win.$ === 'function') {
          win.$(el).trigger('change');
        } else {
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return { success: true };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { __error: err.message, __stack: err.stack };
    }
  }, safeArg({
    place1: (details.placesToBeVisited1 || 'KOLKATA').toUpperCase().trim(),
    place2: (details.placesToBeVisited2 || '').toUpperCase().trim(),
    duration: details.durationMonths,
    entries: details.numberOfEntries,
    portArrival: details.portOfArrival,
    portExit: details.portOfExit,
  }));

  const typedRes1 = res1 as InPageEvalResult | undefined;
  if (typedRes1?.__error) {
    throw new Error(`In-page error in Step 4.1: ${typedRes1.__error}\n${typedRes1.__stack}`);
  }

  // 2. Previous visit, Refusal flags & SAARC Visits
  console.log('  [Step 4.2] Filling previous visit, refusal flags & SAARC visits...');
  const res2 = await page.evaluate((data: {
    visitedBefore: boolean;
    prevVisitAdd1?: string;
    prevVisitAdd2?: string;
    prevVisitAdd3?: string;
    prevVisitCity?: string;
    prevVisaNo?: string;
    prevVisaType?: string;
    prevVisaPlace?: string;
    prevVisaDate?: string;
    refused: boolean;
    refuseDetails?: string;
    countries10Y: string;
    saarc: boolean;
    saarcVisits?: Array<{ country: string; year: string; visitCount: string }>;
  }) => {
    try {
      const win = window as unknown as IndianVisaPortalWindow;
      const anyWin = win as any;

      if (data.visitedBefore) {
        const v1 = document.getElementById('old_visa_flag1') as HTMLInputElement;
        if (v1) {
          v1.click();
          v1.checked = true;
          if (typeof win.$ === 'function') win.$(v1).trigger('change');
        }
        const add1 = document.getElementById('prv_visit_add1') as HTMLInputElement;
        if (add1 && data.prevVisitAdd1) add1.value = data.prevVisitAdd1.slice(0, 35);

        const add2 = document.getElementById('prv_visit_add2') as HTMLInputElement;
        if (add2 && data.prevVisitAdd2) add2.value = data.prevVisitAdd2.slice(0, 35);

        const add3 = document.getElementById('prv_visit_add3') as HTMLInputElement;
        if (add3 && data.prevVisitAdd3) add3.value = data.prevVisitAdd3.slice(0, 35);

        const city = document.getElementById('visited_city') as HTMLTextAreaElement;
        if (city && data.prevVisitCity) city.value = data.prevVisitCity;

        const vNo = document.getElementById('old_visa_no') as HTMLInputElement;
        if (vNo && data.prevVisaNo) vNo.value = data.prevVisaNo;

        const vType = document.getElementById('old_visa_type_id') as HTMLSelectElement;
        if (vType && data.prevVisaType) {
          let matched = data.prevVisaType;
          for (let i = 0; i < vType.options.length; i++) {
            const opt = vType.options[i];
            if (
              opt.value === data.prevVisaType ||
              opt.text.toUpperCase() === data.prevVisaType.toUpperCase() ||
              opt.text.toUpperCase().includes(data.prevVisaType.toUpperCase())
            ) {
              matched = opt.value;
              break;
            }
          }
          vType.value = matched;
          if (typeof win.$ === 'function') win.$(vType).trigger('change');
          else vType.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const vPlace = document.getElementById('oldvisaissueplace') as HTMLInputElement;
        if (vPlace && data.prevVisaPlace) vPlace.value = data.prevVisaPlace;

        const vDate = document.getElementById('oldvisaissuedate') as HTMLInputElement;
        if (vDate && data.prevVisaDate) {
          vDate.value = data.prevVisaDate;
          if (typeof win.$ === 'function') win.$(vDate).trigger('change');
          else vDate.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        const v2 = document.getElementById('old_visa_flag2') as HTMLInputElement;
        if (v2) {
          v2.click();
          v2.checked = true;
          if (typeof win.$ === 'function') win.$(v2).trigger('change');
        }
      }

      if (data.refused) {
        const r1 = document.getElementById('refuse_flag1') as HTMLInputElement;
        if (r1) {
          r1.click();
          r1.checked = true;
          if (typeof win.$ === 'function') win.$(r1).trigger('change');
        }
        const rDet = document.getElementById('refuse_details') as HTMLInputElement;
        if (rDet && data.refuseDetails) rDet.value = data.refuseDetails;
      } else {
        const r2 = document.getElementById('refuse_flag2') as HTMLInputElement;
        if (r2) {
          r2.click();
          r2.checked = true;
          if (typeof win.$ === 'function') win.$(r2).trigger('change');
        }
      }

      const c10 = document.getElementById('country_visited') as HTMLTextAreaElement;
      if (c10) c10.value = data.countries10Y || 'NONE';

      if (data.saarc && data.saarcVisits && data.saarcVisits.length > 0) {
        const s1 = document.getElementById('saarc_flag1') as HTMLInputElement;
        if (s1) {
          s1.click();
          s1.checked = true;
          if (typeof win.$ === 'function') win.$(s1).trigger('change');
        }
        if (typeof anyWin.add_saarc_row_first === 'function') {
          anyWin.add_saarc_row_first();
        }

        const visitCount = Math.min(data.saarcVisits.length, 8);
        for (let idx = 0; idx < visitCount; idx++) {
          const rowNum = idx + 1;
          const visit = data.saarcVisits[idx];
          const rowEl = document.getElementById('saarc_row' + rowNum);
          if (rowEl) {
            rowEl.style.display = 'block';
          }

          const cEl = document.getElementById('saarcCountry' + rowNum) as HTMLSelectElement | null;
          if (cEl && visit.country) {
            cEl.value = visit.country.toUpperCase();
            if (typeof win.$ === 'function') win.$(cEl).trigger('change');
            else cEl.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const yEl = document.getElementById('saarcYear' + rowNum) as HTMLSelectElement | null;
          if (yEl && visit.year) {
            yEl.value = String(visit.year);
            if (typeof win.$ === 'function') win.$(yEl).trigger('change');
            else yEl.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const vEl = document.getElementById('saarcVisitNo' + rowNum) as HTMLInputElement | null;
          if (vEl && visit.visitCount) {
            vEl.value = String(visit.visitCount);
            if (typeof win.$ === 'function') win.$(vEl).trigger('input');
            else vEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        const filledHidden = document.getElementById('saarcFieldsFilled') as HTMLInputElement | null;
        if (filledHidden) {
          filledHidden.value = String(visitCount);
        }
      } else {
        const s2 = document.getElementById('saarc_flag2') as HTMLInputElement;
        if (s2) {
          s2.click();
          s2.checked = true;
          if (typeof win.$ === 'function') win.$(s2).trigger('change');
        }
      }
      return { success: true };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { __error: err.message, __stack: err.stack };
    }
  }, safeArg({
    visitedBefore: details.everVisitedIndiaBefore,
    prevVisitAdd1: details.previousAddressLine1 || details.previousVisitAddress1 || '',
    prevVisitAdd2: details.previousAddressLine2 || '',
    prevVisitAdd3: details.previousAddressLine3 || '',
    prevVisitCity: details.previousVisitCity,
    prevVisaNo: details.previousVisaNumber,
    prevVisaType: details.previousVisaType,
    prevVisaPlace: details.previousVisaIssuePlace,
    prevVisaDate: details.previousVisaIssueDate,
    refused: Boolean(details.permissionRefused),
    refuseDetails: details.permissionRefusedDetails,
    countries10Y: details.countriesVisitedLast10Years || 'NONE',
    saarc: details.visitedSaarcCountriesLast3Years,
    saarcVisits: details.saarcCountryVisits,
  }));

  const typedRes2 = res2 as InPageEvalResult | undefined;
  if (typedRes2?.__error) {
    throw new Error(`In-page error in Step 4.2: ${typedRes2.__error}\n${typedRes2.__stack}`);
  }

  // 3. Reference in India
  console.log('  [Step 4.3] Filling Reference in India...');
  const res3 = await page.evaluate((data: { name: string; address1: string; address2: string; state: string; district: string; phone: string }) => {
    try {
      const win = window as unknown as IndianVisaPortalWindow;
      const nameEl = document.getElementById('nameofsponsor_ind') as HTMLInputElement;
      if (nameEl) nameEl.value = data.name;

      const add1 = document.getElementById('add1ofsponsor_ind') as HTMLInputElement;
      if (add1 && data.address1) add1.value = data.address1.slice(0, 200);

      const add2 = document.getElementById('add2ofsponsor_ind') as HTMLInputElement;
      if (add2 && data.address2) add2.value = data.address2.slice(0, 200);

      const stateEl = document.getElementById('stateofsponsor_ind') as HTMLSelectElement;
      if (stateEl) {
        let matchedState = data.state;
        for (let i = 0; i < stateEl.options.length; i++) {
          const opt = stateEl.options[i];
          if (
            opt.value.toUpperCase() === data.state.toUpperCase() ||
            opt.text.toUpperCase() === data.state.toUpperCase()
          ) {
            matchedState = opt.value;
            break;
          }
        }
        stateEl.value = matchedState;
        if (typeof win.$ === 'function') win.$(stateEl).trigger('change');
        else stateEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const phoneEl = document.getElementById('phoneofsponsor_ind') as HTMLInputElement;
      if (phoneEl) phoneEl.value = data.phone;
      return { success: true };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { __error: err.message, __stack: err.stack };
    }
  }, safeArg({
    name: details.referenceNameIndia,
    address1: details.referenceAddressIndiaLine1 || details.referenceAddressIndia || '',
    address2: details.referenceAddressIndiaLine2 || '',
    state: details.referenceStateIndia,
    district: details.referenceDistrictIndia,
    phone: details.referencePhoneIndia,
  }));

  const typedRes3 = res3 as InPageEvalResult | undefined;
  if (typedRes3?.__error) {
    throw new Error(`In-page error in Step 4.3: ${typedRes3.__error}\n${typedRes3.__stack}`);
  }

  console.log('  [Step 4.3] Waiting for District AJAX options...');
  await page.waitForTimeout(1200);

  // Set District after dynamic AJAX population
  const res3b = await page.evaluate((distName: string) => {
    try {
      const win = window as unknown as IndianVisaPortalWindow;
      const distEl = document.getElementById('districtofsponsor_ind') as HTMLSelectElement;
      if (distEl && distName) {
        let matchedValue = distName;
        for (let i = 0; i < distEl.options.length; i++) {
          const opt = distEl.options[i];
          if (
            opt.value.toUpperCase() === distName.toUpperCase() ||
            opt.text.toUpperCase() === distName.toUpperCase() ||
            opt.text.toUpperCase().includes(distName.toUpperCase()) ||
            opt.value.toUpperCase().includes(distName.toUpperCase())
          ) {
            matchedValue = opt.value;
            break;
          }
        }
        distEl.value = matchedValue;
        if (typeof win.$ === 'function') win.$(distEl).trigger('change');
        else distEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return { success: true };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { __error: err.message, __stack: err.stack };
    }
  }, safeArg(details.referenceDistrictIndia || ''));

  const typedRes3b = res3b as InPageEvalResult | undefined;
  if (typedRes3b?.__error) {
    throw new Error(`In-page error in Step 4.3 District: ${typedRes3b.__error}\n${typedRes3b.__stack}`);
  }

  // 4. Reference in Bangladesh
  console.log('  [Step 4.4] Filling Reference in Bangladesh...');
  const res4 = await page.evaluate((data: { name: string; address1: string; address2: string; phone: string }) => {
    try {
      const nameEl = document.getElementById('nameofsponsor_msn') as HTMLInputElement;
      if (nameEl) nameEl.value = data.name;

      const add1 = document.getElementById('add1ofsponsor_msn') as HTMLInputElement;
      if (add1 && data.address1) add1.value = data.address1.slice(0, 35);

      const add2 = document.getElementById('add2ofsponsor_msn') as HTMLInputElement;
      if (add2 && data.address2) add2.value = data.address2.slice(0, 35);

      const phoneEl = document.getElementById('phoneofsponsor_msn') as HTMLInputElement;
      if (phoneEl) phoneEl.value = data.phone;
      return { success: true };
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      return { __error: err.message, __stack: err.stack };
    }
  }, safeArg({
    name: details.referenceNameBangladesh,
    address1: details.referenceAddressBangladeshLine1 || details.referenceAddressBangladesh || '',
    address2: details.referenceAddressBangladeshLine2 || '',
    phone: details.referencePhoneBangladesh,
  }));

  const typedRes4 = res4 as InPageEvalResult | undefined;
  if (typedRes4?.__error) {
    throw new Error(`In-page error in Step 4.4: ${typedRes4.__error}\n${typedRes4.__stack}`);
  }

  // 5. Submit or Exit
  const buttonSelector = action === 'continue' ? '#continue' : '#exit';
  console.log(`  [Step 4.5] Submitting Step 4 with ${buttonSelector}...`);

  await page.evaluate((btnId: string) => {
    const win = window as unknown as IndianVisaPortalWindow;
    if (typeof win.$ === 'function') {
      win.$('input[type=submit]').removeAttr('clicked');
      win.$(btnId).attr('clicked', 'true');
    }
  }, buttonSelector);

  await page.locator(buttonSelector).click();
  await page.waitForTimeout(3000);

  const finalUrl = await page.url();
  return {
    success: !finalUrl.includes('/visa/VisaDetails') || action === 'exit',
    currentUrl: finalUrl,
  };
}
