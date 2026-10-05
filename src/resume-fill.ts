import fs from 'fs';
import path from 'path';
import { initStagehand } from './stagehand';
import { executeCompletePartially } from './services/completePartially';
import { executeStep2 } from './services/step2';
import { executeStep3 } from './services/step3';
import { executeStep4 } from './services/step4';
import { executeStep5 } from './services/step5';
import { executeStep6 } from './services/step6';
import { executeStep7 } from './services/step7';
import { executeStep8 } from './services/step8';
import { executeStep9 } from './services/step9';
import { VisaApplicantProfile } from './types/profile';

async function main() {
  console.log('====================================================');
  console.log('🔄 Resume Indian Visa Application Pipeline');
  console.log('====================================================');

  const profilePath = path.resolve(process.cwd(), 'applicant.json');
  if (!fs.existsSync(profilePath)) {
    console.error(`❌ Profile not found at ${profilePath}`);
    process.exit(1);
  }

  const profile: VisaApplicantProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

  if (!profile.temporaryApplicationId) {
    console.error('❌ No temporaryApplicationId found in applicant.json. Run "pnpm run fill" first.');
    process.exit(1);
  }

  console.log(`📋 Resuming Application ID: ${profile.temporaryApplicationId}`);
  console.log('----------------------------------------------------');

  const session = await initStagehand();
  const { page } = session;

  try {
    // 1. Resume from CompletePartially with enhanced OCR
    console.log('\n⚡ Resuming from CompletePartially with enhanced OCR...');
    const resumeResult = await executeCompletePartially(page, profile.temporaryApplicationId);

    if (!resumeResult.success) {
      throw new Error(`Failed to resume application: ${resumeResult.error}`);
    }

    console.log(`✅ Application restored! Current URL: ${resumeResult.currentUrl}`);
    let currentUrl = resumeResult.currentUrl;

    // 2. Cascade through whichever steps remain
    if (currentUrl.includes('/visa/BasicDetails') && profile.step2_applicant_details) {
      console.log('\n⚡ Advancing from BasicDetails...');
      const s2 = await executeStep2(page, profile.step2_applicant_details, 'continue');
      currentUrl = s2.currentUrl;
    }

    if (currentUrl.includes('/visa/FamilyDetails') && profile.step3_family_address) {
      console.log('\n⚡ Advancing from FamilyDetails...');
      const s3 = await executeStep3(page, profile.step3_family_address, 'continue');
      currentUrl = s3.currentUrl;
    }

    if (currentUrl.includes('/visa/VisaDetails') && profile.step4_visa_references) {
      console.log('\n⚡ Advancing from VisaDetails...');
      const s4 = await executeStep4(page, profile.step4_visa_references, 'continue');
      currentUrl = s4.currentUrl;
    }

    if (currentUrl.includes('/visa/AdditionalQuestions') && profile.step5_additional_questions) {
      console.log('\n⚡ Advancing from AdditionalQuestions...');
      const s5 = await executeStep5(page, profile.step5_additional_questions, 'continue');
      currentUrl = s5.currentUrl;
    }

    if (currentUrl.includes('/visa/PhotoUpload') && profile.photoFilePath) {
      console.log('\n⚡ Uploading Photograph (auto-JFIF & full 100% frame crop)...');
      const s6 = await executeStep6(page, profile.photoFilePath, 'upload');
      currentUrl = s6.currentUrl;
      // If photo was confirmed, advance to DocumentUpload
      if (currentUrl.includes('/visa/PhotoUpload')) {
        const confirmed = await page.evaluate(() => {
          const btn = document.querySelector('input[value="Save and Continue"]') as HTMLInputElement;
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (!confirmed) {
          await page.locator('input[value="Save and Continue"]').click();
        }
        await page.waitForTimeout(3000);
        currentUrl = await page.url();
      }
    }

    if (currentUrl.includes('/visa/DocumentUpload') && profile.passportPdfPath) {
      console.log('\n⚡ Uploading Passport PDF...');
      const s7 = await executeStep7(page, profile.passportPdfPath);
      currentUrl = s7.currentUrl;
    }

    if (currentUrl.includes('/visa/BangladeshDetails')) {
      console.log('\n⚡ Filling Hotel & Stay Details...');
      const s8 = await executeStep8(page, profile.step8_stay_details, profile.step4_visa_references);
      currentUrl = s8.currentUrl;
    }

    if (currentUrl.includes('/visa/Verification')) {
      console.log('\n⚡ Reached Final Verification Page...');
      const s9 = await executeStep9(page, profile.submitFinalApplication ?? false);
      if (!s9.success) {
        throw new Error(`Step 9 failed: ${s9.error}`);
      }
      console.log(`✅ [Step 9] Processed Application ID: ${s9.temporaryApplicationId}`);

      if (s9.submittedFinal) {
        console.log('\n🎉 PIPELINE COMPLETED & FINAL APPLICATION SUBMITTED!');
        console.log(`🆔 Permanent Application ID (Web File Number): ${s9.finalApplicationId || 'N/A'}`);
        if (s9.applicantName) {
          console.log(`👤 Applicant Name: ${s9.applicantName}`);
        }
        if (s9.downloadedPdfPath) {
          console.log(`📄 Official Application PDF: ${s9.downloadedPdfPath}`);
        }
        console.log(`🌐 Final Confirmation URL: ${s9.currentUrl}`);
      } else {
        console.log('\n🛡️ PIPELINE COMPLETED IN SAFE REVIEW MODE!');
        console.log(`🆔 Temporary Application ID: ${profile.temporaryApplicationId || s9.temporaryApplicationId}`);
        console.log(`🌐 Review Page URL: ${s9.currentUrl}`);
        console.log('💡 Note: Set "submitFinalApplication": true in applicant.json to automatically submit and download the final PDF.');
      }
    }
  } catch (error) {
    console.error('\n❌ Resume Process Error:', error);
  } finally {
    console.log('\n🛑 Browser session holding for inspection (10 seconds)...');
    await page.waitForTimeout(10000);
    await session.close();
  }
}

main();
