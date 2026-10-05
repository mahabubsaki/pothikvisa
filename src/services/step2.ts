import { type Page } from '@browserbasehq/stagehand';
import { Step2ApplicantDetailsProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step2Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 2: Applicant Details Form on indianvisa-bangladesh.nic.in/visa/BasicDetails
 */
export async function executeStep2(
  page: Page,
  details: Step2ApplicantDetailsProfile,
  action: 'continue' | 'exit' = 'continue'
): Promise<Step2Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/BasicDetails')) {
    throw new Error(`Expected to be on /visa/BasicDetails, but currently on: ${currentUrl}`);
  }

  // Ensure DOM is ready
  await page.waitForSelector('#surname', { timeout: 15000 });
  await page.waitForTimeout(400);

  // 1. Fill Names & Surname
  await page.evaluate((data: { surname: string; givenName: string; hasChangedName?: boolean; previousSurname?: string; previousGivenName?: string }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const surnameEl = document.getElementById('surname') as HTMLInputElement;
    const givenNameEl = document.getElementById('givenName') as HTMLInputElement;
    if (surnameEl) surnameEl.value = data.surname;
    if (givenNameEl) givenNameEl.value = data.givenName;

    const changedCheck = document.getElementById('changedSurnameCheck') as HTMLInputElement;
    if (changedCheck) {
      changedCheck.checked = Boolean(data.hasChangedName);
      win.$?.(changedCheck).trigger('change');
      if (data.hasChangedName) {
        const prevSurname = document.getElementById('prev_surname') as HTMLInputElement;
        const prevGiven = document.getElementById('prev_given_name') as HTMLInputElement;
        if (prevSurname && data.previousSurname) prevSurname.value = data.previousSurname;
        if (prevGiven && data.previousGivenName) prevGiven.value = data.previousGivenName;
      }
    }
  }, safeArg({
    surname: details.surname,
    givenName: details.givenName,
    hasChangedName: details.hasChangedName,
    previousSurname: details.previousSurname,
    previousGivenName: details.previousGivenName,
  }));

  // 2. Fill Personal Details (Gender, Birth City, Country of Birth, NID, Religion, Identification Mark, Education, Nationality by Birth)
  await page.evaluate((data: {
    gender: string;
    birthCity: string;
    birthCountry: string;
    nic_number: string;
    religion: string;
    religionOther?: string;
    visibleMark: string;
    education: string;
    nationalityBy: string;
  }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const genderEl = document.getElementById('gender') as HTMLSelectElement;
    if (genderEl) {
      genderEl.value = data.gender;
      win.$?.(genderEl).trigger('change');
    }

    const birthPlaceEl = document.getElementById('birth_place') as HTMLInputElement;
    if (birthPlaceEl) birthPlaceEl.value = data.birthCity;

    const birthCountryEl = document.getElementById('country_birth') as HTMLSelectElement;
    if (birthCountryEl) {
      birthCountryEl.value = data.birthCountry;
      win.$?.(birthCountryEl).trigger('change');
    }

    const nicEl = document.getElementById('nic_number') as HTMLInputElement;
    if (nicEl) nicEl.value = data.nic_number || 'NA';

    const religionEl = document.getElementById('religion') as HTMLSelectElement;
    if (religionEl) {
      religionEl.value = data.religion;
      win.$?.(religionEl).trigger('change');
      if (data.religion === 'OTHERS' && data.religionOther) {
        const otherEl = document.getElementById('religion_other') as HTMLInputElement;
        if (otherEl) otherEl.value = data.religionOther;
      }
    }

    const markEl = document.getElementById('identity_marks') as HTMLInputElement;
    if (markEl) markEl.value = data.visibleMark || 'NA';

    const eduEl = document.getElementById('education') as HTMLSelectElement;
    if (eduEl) {
      eduEl.value = data.education;
      win.$?.(eduEl).trigger('change');
    }

    const natByEl = document.getElementById('nationality_by') as HTMLSelectElement;
    if (natByEl) {
      natByEl.value = data.nationalityBy;
      win.$?.(natByEl).trigger('change');
    }
  }, safeArg({
    gender: details.gender,
    birthCity: details.birthCity,
    birthCountry: details.birthCountry,
    nic_number: details.nationalIdNumber,
    religion: details.religion,
    religionOther: details.religionOther,
    visibleMark: details.visibleIdentificationMarks,
    education: details.educationalQualification,
    nationalityBy: details.nationalityAcquiredBy,
  }));

  // 3. Fill Passport Details
  await page.evaluate((data: {
    passportNo: string;
    issuePlace: string;
    issueDate: string;
    expiryDate: string;
    hasOtherPassport?: boolean;
    otherPassportCountry?: string;
    otherPassportNumber?: string;
    otherPassportDateOfIssue?: string;
    otherPassportPlaceOfIssue?: string;
    otherPassportNationality?: string;
  }) => {
    const pptNoEl = document.getElementById('passport_no') as HTMLInputElement;
    if (pptNoEl) pptNoEl.value = data.passportNo;

    const issuePlaceEl = document.getElementById('passport_issue_place') as HTMLInputElement;
    if (issuePlaceEl) issuePlaceEl.value = data.issuePlace;

    const issueDateEl = document.getElementById('passport_issue_date') as HTMLInputElement;
    if (issueDateEl) issueDateEl.value = data.issueDate;

    const expiryDateEl = document.getElementById('passport_expiry_date') as HTMLInputElement;
    if (expiryDateEl) expiryDateEl.value = data.expiryDate;

    const win = window as unknown as IndianVisaPortalWindow;
    if (data.hasOtherPassport) {
      const r1 = document.getElementById('other_ppt_1') as HTMLInputElement;
      if (r1) {
        r1.click();
        r1.checked = true;
        win.$?.(r1).trigger('change');
      }

      // Populate 5 conditional fields revealed on selecting 'Yes'
      const countryEl = document.getElementById('other_ppt_country_issue') as HTMLSelectElement;
      if (countryEl && data.otherPassportCountry) {
        countryEl.value = data.otherPassportCountry;
        win.$?.(countryEl).trigger('change');
      }

      const otherPptNoEl = document.getElementById('other_ppt_no') as HTMLInputElement;
      if (otherPptNoEl && data.otherPassportNumber) {
        otherPptNoEl.value = data.otherPassportNumber;
      }

      const otherDateEl = document.getElementById('other_ppt_issue_date') as HTMLInputElement;
      if (otherDateEl && data.otherPassportDateOfIssue) {
        otherDateEl.value = data.otherPassportDateOfIssue;
      }

      const otherPlaceEl = document.getElementById('other_ppt_issue_place') as HTMLInputElement;
      if (otherPlaceEl && data.otherPassportPlaceOfIssue) {
        otherPlaceEl.value = data.otherPassportPlaceOfIssue;
      }

      const otherNatEl = document.getElementById('other_ppt_nat') as HTMLSelectElement;
      if (otherNatEl && data.otherPassportNationality) {
        otherNatEl.value = data.otherPassportNationality;
        win.$?.(otherNatEl).trigger('change');
      }
    } else {
      const r2 = document.getElementById('other_ppt_2') as HTMLInputElement;
      if (r2) {
        r2.click();
        r2.checked = true;
        win.$?.(r2).trigger('change');
      }
    }
  }, safeArg({
    passportNo: details.passportNumber,
    issuePlace: details.passportPlaceOfIssue,
    issueDate: details.passportDateOfIssue,
    expiryDate: details.passportDateOfExpiry,
    hasOtherPassport: details.hasOtherPassport,
    otherPassportCountry: details.otherPassportCountry,
    otherPassportNumber: details.otherPassportNumber,
    otherPassportDateOfIssue: details.otherPassportDateOfIssue,
    otherPassportPlaceOfIssue: details.otherPassportPlaceOfIssue,
    otherPassportNationality: details.otherPassportNationality,
  }));

  // 4. Validate and Click Submit (Save and Continue OR Save and Temporarily Exit)
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
    success: !finalUrl.includes('/visa/BasicDetails') || action === 'exit',
    currentUrl: finalUrl,
  };
}
