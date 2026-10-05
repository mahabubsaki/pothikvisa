import fs from 'fs';
import path from 'path';
import { initStagehand } from './stagehand';
import { executeStep1 } from './services/step1';
import { executeStep2 } from './services/step2';
import { executeStep3 } from './services/step3';
import { executeStep4 } from './services/step4';
import { executeStep5 } from './services/step5';
import { executeStep6 } from './services/step6';
import { executeStep7 } from './services/step7';
import { executeStep8 } from './services/step8';
import { executeStep9 } from './services/step9';
import { VisaApplicantProfile } from './types/profile';

async function run() {
  console.log('====================================================');
  console.log('🚀 Indian Visa End-to-End Auto Form Fillup System');
  console.log('====================================================');

  const profilePath = path.resolve(process.cwd(), 'applicant.json');
  if (!fs.existsSync(profilePath)) {
    console.error(`❌ Profile not found at ${profilePath}`);
    process.exit(1);
  }

  const profile: VisaApplicantProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

  console.log(`📋 Applicant Details:`);
  console.log(`   Email:        ${profile.step1_registration?.email}`);
  console.log(`   DOB:          ${profile.step1_registration?.dateOfBirth}`);
  console.log(`   Mission:      ${profile.step1_registration?.indianMission}`);
  if (profile.temporaryApplicationId) {
    console.log(`   Saved App ID: ${profile.temporaryApplicationId}`);
  }
  console.log('----------------------------------------------------');

  const session = await initStagehand();
  const { page } = session;

  try {
    // ----------------------------------------------------
    // STEP 1: Registration
    // ----------------------------------------------------
    console.log('\n⚡ [Step 1] Running Registration & Local Captcha OCR...');
    const step1Result = await executeStep1(page, profile.step1_registration);

    if (!step1Result.success) {
      throw new Error(`Step 1 failed: ${step1Result.error}`);
    }

    if (step1Result.temporaryApplicationId) {
      profile.temporaryApplicationId = step1Result.temporaryApplicationId;
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf8');
      console.log(`💾 Saved Temporary Application ID: ${step1Result.temporaryApplicationId}`);
    }
    console.log('✅ [Step 1] Done! URL:', step1Result.currentUrl);

    // ----------------------------------------------------
    // STEP 2: Applicant & Passport Details
    // ----------------------------------------------------
    if (profile.step2_applicant_details) {
      console.log('\n⚡ [Step 2] Filling Applicant & Passport Details...');
      const step2Result = await executeStep2(page, profile.step2_applicant_details, 'continue');
      if (!step2Result.success) {
        throw new Error(`Step 2 failed: ${step2Result.error}`);
      }
      console.log('✅ [Step 2] Done! URL:', step2Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 3: Family Details & Address
    // ----------------------------------------------------
    if (profile.step3_family_address) {
      console.log('\n⚡ [Step 3] Filling Family Details, Address & Occupation...');
      const step3Result = await executeStep3(page, profile.step3_family_address, 'continue');
      if (!step3Result.success) {
        throw new Error(`Step 3 failed: ${step3Result.error}`);
      }
      console.log('✅ [Step 3] Done! URL:', step3Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 4: Visa Details & References
    // ----------------------------------------------------
    if (profile.step4_visa_references) {
      console.log('\n⚡ [Step 4] Filling Visa Details & References...');
      const step4Result = await executeStep4(page, profile.step4_visa_references, 'continue');
      if (!step4Result.success) {
        throw new Error(`Step 4 failed: ${step4Result.error}`);
      }
      console.log('✅ [Step 4] Done! URL:', step4Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 5: Additional Questions & Declaration
    // ----------------------------------------------------
    if (profile.step5_additional_questions) {
      console.log('\n⚡ [Step 5] Answering Security Questions & Verifying Declaration...');
      const step5Result = await executeStep5(page, profile.step5_additional_questions, 'continue');
      if (!step5Result.success) {
        throw new Error(`Step 5 failed: ${step5Result.error}`);
      }
      console.log('✅ [Step 5] Done! URL:', step5Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 6: Photo Upload
    // ----------------------------------------------------
    if (profile.photoFilePath) {
      console.log('\n⚡ [Step 6] Uploading Photograph with auto-JFIF and full-frame crop...');
      const step6Result = await executeStep6(page, profile.photoFilePath, 'upload');
      if (!step6Result.success) {
        throw new Error(`Step 6 failed: ${step6Result.error}`);
      }
      console.log('✅ [Step 6] Done! URL:', step6Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 7: Document Upload (Passport PDF)
    // ----------------------------------------------------
    if (profile.passportPdfPath) {
      console.log('\n⚡ [Step 7] Uploading Passport Document PDF...');
      const step7Result = await executeStep7(page, profile.passportPdfPath);
      if (!step7Result.success) {
        throw new Error(`Step 7 failed: ${step7Result.error}`);
      }
      console.log('✅ [Step 7] Done! URL:', step7Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 8: Visit Details / Hotel Stay
    // ----------------------------------------------------
    const urlBeforeStep8 = await page.url();
    if (urlBeforeStep8.includes('/visa/BangladeshDetails') || profile.step8_stay_details) {
      console.log('\n⚡ [Step 8] Filling Visit Details & Hotel Stay...');
      const step8Result = await executeStep8(page, profile.step8_stay_details, profile.step4_visa_references);
      if (!step8Result.success) {
        throw new Error(`Step 8 failed: ${step8Result.error}`);
      }
      console.log('✅ [Step 8] Done! URL:', step8Result.currentUrl);
    }

    // ----------------------------------------------------
    // STEP 9: Final Verification & Review
    // ----------------------------------------------------
    console.log('\n⚡ [Step 9] Reached Final Verification Page...');
    const step9Result = await executeStep9(page, profile.submitFinalApplication ?? false);
    if (!step9Result.success) {
      throw new Error(`Step 9 failed: ${step9Result.error}`);
    }
    console.log(`✅ [Step 9] Processed Application ID: ${step9Result.temporaryApplicationId}`);

    if (step9Result.submittedFinal) {
      console.log('\n🎉 ALL FORM STEPS COMPLETED & FINAL APPLICATION SUBMITTED!');
      console.log(`🆔 Permanent Application ID (Web File Number): ${step9Result.finalApplicationId || 'N/A'}`);
      if (step9Result.applicantName) {
        console.log(`👤 Applicant Name: ${step9Result.applicantName}`);
      }
      if (step9Result.downloadedPdfPath) {
        console.log(`📄 Official Application PDF: ${step9Result.downloadedPdfPath}`);
      }
      console.log(`🌐 Final Confirmation URL: ${step9Result.currentUrl}`);
    } else {
      console.log('\n🛡️ FORM COMPLETED IN SAFE REVIEW MODE!');
      console.log(`🆔 Temporary Application ID: ${profile.temporaryApplicationId || step9Result.temporaryApplicationId}`);
      console.log(`🌐 Review Page URL: ${step9Result.currentUrl}`);
      console.log('💡 Note: Set "submitFinalApplication": true in applicant.json to automatically submit and download the final PDF.');
    }
  } catch (error) {
    console.error('\n❌ Automation Pipeline Error:', error);
  } finally {
    console.log('\n🛑 Browser session holding for inspection (10 seconds)...');
    await page.waitForTimeout(10000);
    await session.close();
  }
}

run();
